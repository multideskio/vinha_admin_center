
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gatewayConfigurations, transactions as transactionsTable, users, type TransactionStatus } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";
const MOCK_USER_ID = 'e7bba1dd-71f2-400f-98e1-bde37817843e';

const transactionSchema = z.object({
  amount: z.coerce.number().min(1, 'O valor deve ser maior que zero.'),
  paymentMethod: z.enum(['pix', 'credit_card', 'boleto']),
  contributionType: z.enum(['dizimo', 'oferta'], { required_error: "O tipo de contribuição é obrigatório." }),
  description: z.string().optional(),
  card: z.object({
    number: z.string(),
    holder: z.string(),
    expirationDate: z.string(),
    securityCode: z.string(),
    brand: z.string(),
  }).optional(),
});

async function getCieloCredentials() {
    const [config] = await db.select()
        .from(gatewayConfigurations)
        .where(eq(gatewayConfigurations.gatewayName, 'Cielo'))
        .limit(1);

    if (!config || !config.isActive) throw new Error("Gateway Cielo não está ativo ou configurado.");

    const isProduction = config.environment === 'production';
    return {
        merchantId: isProduction ? config.prodClientId : config.devClientId,
        merchantKey: isProduction ? config.prodClientSecret : config.devClientSecret,
        apiUrl: isProduction ? 'https://api.cieloecommerce.cielo.com.br' : 'https://apisandbox.cieloecommerce.cielo.com.br'
    };
}

function mapCieloStatusToDbStatus(cieloStatus: number): TransactionStatus {
    switch (cieloStatus) {
        case 2: // PaymentConfirmed
            return 'approved';
        case 1: // Authorized
        case 12: // Pending
            return 'pending';
        case 3: // Denied
        case 10: // Voided
        case 11: // Refunded
        case 13: // Aborted
        default:
            return 'refused';
    }
}

export async function POST(request: Request) {
    const user = { id: MOCK_USER_ID, email: 'gerente@vinha.com' }; 

    try {
        const body = await request.json();
        const validatedData = transactionSchema.parse(body);
        const credentials = await getCieloCredentials();
        
        const merchantOrderId = `vinha-${Date.now()}`;

        let cieloPayload: any = {
            MerchantOrderId: merchantOrderId,
            Customer: {
                Name: user.email 
            },
            Payment: {
                Type: '',
                Amount: validatedData.amount * 100, 
            }
        };

        switch(validatedData.paymentMethod) {
            case 'pix':
                cieloPayload.Payment.Type = 'Pix';
                break;
            case 'credit_card':
                if (!validatedData.card) {
                    throw new Error("Dados do cartão de crédito são obrigatórios.");
                }
                cieloPayload.Payment.Type = 'CreditCard';
                cieloPayload.Payment.Capture = true; // Capturar automaticamente
                cieloPayload.Payment.Installments = 1;
                cieloPayload.Payment.CreditCard = {
                    CardNumber: validatedData.card.number.replace(/\s/g, ''), 
                    Holder: validatedData.card.holder,
                    ExpirationDate: validatedData.card.expirationDate, // MM/YYYY
                    SecurityCode: validatedData.card.securityCode,
                    Brand: validatedData.card.brand
                }
                break;
            case 'boleto':
                cieloPayload.Payment.Type = 'Boleto';
                cieloPayload.Payment.Provider = 'Bradesco2';
                cieloPayload.Customer.Identity = '12345678901';
                cieloPayload.Customer.IdentityType = 'CPF';
                cieloPayload.Customer.Address = {
                    "Street": "Rua Teste",
                    "Number": "123",
                    "ZipCode": "12345987",
                    "City": "Cidade Teste",
                    "State": "SP",
                    "Country": "BRA"
                }
                break;
        }

        const response = await fetch(`${credentials.apiUrl}/1/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'MerchantId': credentials.merchantId || '',
                'MerchantKey': credentials.merchantKey || '',
            },
            body: JSON.stringify(cieloPayload)
        });
        
        const cieloData = await response.json();

        if (!response.ok) {
            console.error("Erro da API Cielo:", cieloData);
            throw new Error(cieloData[0]?.Message || 'Falha ao processar pagamento na Cielo.');
        }

        const dbStatus = mapCieloStatusToDbStatus(cieloData.Payment?.Status);

        await db.insert(transactionsTable).values({
            companyId: MOCK_COMPANY_ID,
            contributorId: user.id,
            amount: String(validatedData.amount),
            status: dbStatus,
            paymentMethod: validatedData.paymentMethod,
            gatewayTransactionId: cieloData.Payment?.PaymentId,
        });

        return NextResponse.json({ success: true, data: cieloData.Payment }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao criar transação:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
    }
}


export async function GET(request: Request) {
    // Adicionar lógica para listar transações do banco de dados local
    return NextResponse.json({ message: "Endpoint para listar transações" }, { status: 200 });
}
