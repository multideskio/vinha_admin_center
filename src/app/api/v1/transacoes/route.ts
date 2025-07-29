
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gatewayConfigurations, transactions as transactionsTable, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { validateRequest } from '@/lib/auth';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";

const transactionSchema = z.object({
  amount: z.coerce.number().min(1, 'O valor deve ser maior que zero.'),
  paymentMethod: z.enum(['pix', 'credit_card', 'boleto']),
  contributionType: z.enum(['dizimo', 'oferta']),
  description: z.string().optional(),
  // Adicione outros campos necessários para a Cielo (dados do cliente, etc.)
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


export async function POST(request: Request) {
    const { user } = await validateRequest();
    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validatedData = transactionSchema.parse(body);
        const credentials = await getCieloCredentials();
        
        // Gerar um ID de pedido único para o nosso sistema
        const merchantOrderId = `vinha-${Date.now()}`;

        let cieloPayload: any = {
            MerchantOrderId: merchantOrderId,
            Customer: {
                Name: user.email // Usando e-mail como nome de exemplo
            },
            Payment: {
                Type: '',
                Amount: validatedData.amount * 100, // Cielo usa centavos
            }
        };

        switch(validatedData.paymentMethod) {
            case 'pix':
                cieloPayload.Payment.Type = 'Pix';
                break;
            case 'credit_card':
                // Para cartão de crédito, o frontend precisaria enviar os dados do cartão
                // Aqui estamos apenas montando a estrutura básica
                cieloPayload.Payment.Type = 'CreditCard';
                cieloPayload.Payment.Installments = 1;
                cieloPayload.Payment.CreditCard = {
                    // Dados do cartão viriam do frontend
                    "CardNumber": "1234123412341231", // Cartão de teste
                    "Holder": "Comprador Teste",
                    "ExpirationDate": "12/2030",
                    "SecurityCode": "123",
                    "Brand": "Visa"
                }
                break;
            case 'boleto':
                cieloPayload.Payment.Type = 'Boleto';
                cieloPayload.Payment.Provider = 'Bradesco2';
                // Dados adicionais para boleto
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

        // Salvar a transação no nosso banco
        await db.insert(transactionsTable).values({
            companyId: MOCK_COMPANY_ID,
            contributorId: user.id,
            amount: String(validatedData.amount),
            status: 'pending', // Status inicial
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
    return NextResponse.json({ message: "Endpoint para listar transações" }, { status: 200 });
}

