
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';

const testEmailSchema = z.object({
    email: z.string().email(),
    config: z.object({
        host: z.string(),
        port: z.number(),
        user: z.string(),
        password: z.string(),
        secure: z.boolean(),
    }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = testEmailSchema.parse(body);

        const { email, config } = validatedData;
        
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure, 
            auth: {
              user: config.user,
              pass: config.password,
            },
          });

        await transporter.sendMail({
            from: `"Vinha Admin Teste" <${config.user}>`, 
            to: email, 
            subject: "E-mail de Teste - Vinha Admin", 
            text: "Se você recebeu este e-mail, suas configurações de SMTP estão funcionando corretamente!",
            html: "<b>Se você recebeu este e-mail, suas configurações de SMTP estão funcionando corretamente!</b>",
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao enviar e-mail de teste:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
    }
}
