
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gatewayConfigurations, transactions as transactionsTable, users, churchProfiles, type TransactionStatus } from '@/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { format } from 'date-fns';
import { authenticateApiKey } from '@/lib/api-auth';


const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const GERENTE_INIT_ID = process.env.GERENTE_INIT;
if (!GERENTE_INIT_ID) {
    throw new Error("A variável de ambiente GERENTE_INIT não está definida.");
}

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
        case 1: // Authorized (auto-capture)
            return 'approved';
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
    try {
        const [gerenteUser] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, GERENTE_INIT_ID)).limit(1);
        if (!gerenteUser) {
            return NextResponse.json({ error: "Usuário gerente de teste não encontrado." }, { status: 404 });
        }
        
        const body = await request.json();
        const validatedData = transactionSchema.parse(body);
        const credentials = await getCieloCredentials();
        
        const merchantOrderId = `vinha-${Date.now()}`;
        
        const [gerenteProfile] = await db.select().from(managerProfiles).where(eq(managerProfiles.userId, gerenteUser.id));
        if (!gerenteProfile) {
            return NextResponse.json({ error: "Perfil do gerente de teste não encontrado." }, { status: 404 });
        }

        let cieloPayload: any = {
            MerchantOrderId: merchantOrderId,
            Customer: {
                Name: `${gerenteProfile?.firstName || 'Usuário'} ${gerenteProfile?.lastName || 'Teste'}`
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
                cieloPayload.Payment.Capture = true;
                cieloPayload.Payment.Installments = 1;
                cieloPayload.Payment.CreditCard = {
                    CardNumber: validatedData.card.number.replace(/\s/g, ''), 
                    Holder: validatedData.card.holder,
                    ExpirationDate: validatedData.card.expirationDate,
                    SecurityCode: validatedData.card.securityCode,
                    Brand: validatedData.card.brand
                }
                break;
            case 'boleto':
                if (!gerenteProfile.cpf || !gerenteProfile.address || !gerenteProfile.neighborhood || !gerenteProfile.city || !gerenteProfile.state || !gerenteProfile.cep) {
                    return NextResponse.json({ error: "Endereço ou CPF incompletos. Por favor, complete seu perfil antes de gerar um boleto." }, { status: 400 });
                }
                cieloPayload.Payment.Type = 'Boleto';
                cieloPayload.Payment.Provider = 'Bradesco2';
                cieloPayload.Customer.Identity = gerenteProfile.cpf.replace(/\D/g, '');
                cieloPayload.Customer.IdentityType = 'CPF';
                cieloPayload.Customer.Address = {
                    "Street": gerenteProfile.address,
                    "Number": "123",
                    "District": gerenteProfile.neighborhood,
                    "ZipCode": gerenteProfile.cep.replace(/\D/g, ''),
                    "City": gerenteProfile.city,
                    "State": gerenteProfile.state,
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
            companyId: COMPANY_ID,
            contributorId: gerenteUser.id,
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
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        const query = db.select({
            id: transactionsTable.id,
            contributor: users.email,
            church: churchProfiles.nomeFantasia,
            amount: transactionsTable.amount,
            method: transactionsTable.paymentMethod,
            status: transactionsTable.status,
            date: transactionsTable.createdAt,
            refundRequestReason: transactionsTable.refundRequestReason,
        })
        .from(transactionsTable)
        .leftJoin(users, eq(transactionsTable.contributorId, users.id))
        .leftJoin(churchProfiles, eq(transactionsTable.originChurchId, churchProfiles.userId))
        .orderBy(desc(transactionsTable.createdAt));
        
        if (userId) {
            query.where(eq(transactionsTable.contributorId, userId));
        }

        const results = await query;
        
        const formattedTransactions = results.map(t => ({
            ...t,
            amount: Number(t.amount),
            date: format(new Date(t.date), 'dd/MM/yyyy')
        }));

        return NextResponse.json({ transactions: formattedTransactions });
    } catch (error: any) {
        console.error("Erro ao buscar transações:", error);
        return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
    }
}
