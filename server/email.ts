import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Aula Viva <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "https://aulaviva-p8o2mkci.manus.space";

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirma o teu email — Aula Viva",
    html: `
      <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9f5ef; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #1a3a4a; border-radius: 12px; padding: 12px 20px;">
            <span style="color: #f9f5ef; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Aula <span style="color: #e8a020;">Viva</span></span>
          </div>
        </div>
        <h2 style="color: #1a3a4a; font-size: 22px; margin-bottom: 8px;">Olá, ${name || "professor(a)"}!</h2>
        <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Obrigado por te registares na plataforma <strong>Aula Viva</strong>. Para ativar a tua conta, clica no botão abaixo:
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${link}" style="background: #2a7a6a; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
            Confirmar Email
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; text-align: center;">
          Este link expira em 24 horas. Se não criaste esta conta, podes ignorar este email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e0d8; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Recuperação de password — Aula Viva",
    html: `
      <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9f5ef; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #1a3a4a; border-radius: 12px; padding: 12px 20px;">
            <span style="color: #f9f5ef; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Aula <span style="color: #e8a020;">Viva</span></span>
          </div>
        </div>
        <h2 style="color: #1a3a4a; font-size: 22px; margin-bottom: 8px;">Recuperar password</h2>
        <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Recebemos um pedido para redefinir a password da conta associada a <strong>${email}</strong>. Clica no botão abaixo para criar uma nova password:
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${link}" style="background: #2a7a6a; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
            Redefinir Password
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px; text-align: center;">
          Este link expira em 1 hora. Se não pediste a recuperação, podes ignorar este email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e0d8; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA
        </p>
      </div>
    `,
  });
}
