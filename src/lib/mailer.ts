import nodemailer from "nodemailer";

// Envio de e-mail via Gmail (SMTP) com fallback gracioso.
// - Se GMAIL_USER e GMAIL_APP_PASSWORD estiverem configurados, envia pelo Gmail.
//   (Use uma "Senha de app" do Google, NAO a senha normal da conta.)
// - Caso contrario, apenas registra o conteudo no log do servidor (util em
//   teste e evita quebrar o fluxo enquanto o e-mail nao esta configurado).
// Usamos timeouts curtos para a requisicao NUNCA ficar travada se o SMTP
// demorar ou estiver bloqueado.
type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendArgs): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  // A senha de app vem do Google com espacos (ex.: "abcd efgh ijkl mnop").
  // Removemos os espacos por seguranca.
  const pass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  const from = process.env.EMAIL_FROM || `Palpitando na Copa <${user}>`;

  if (!user || !pass) {
    console.warn(
      "[mailer] GMAIL_USER/GMAIL_APP_PASSWORD nao configurados - e-mail NAO enviado.",
    );
    console.warn(`[mailer] Para: ${to} | Assunto: ${subject}`);
    if (text) console.warn(`[mailer] Conteudo:\n${text}`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // STARTTLS na porta 587 (mais compativel que a 465)
      auth: { user, pass },
      connectionTimeout: 10000, // 10s para abrir a conexao
      greetingTimeout: 10000, // 10s para o servidor responder
      socketTimeout: 15000, // 15s de inatividade
    });
    await transporter.sendMail({ from, to, subject, html, text });
    return true;
  } catch (err) {
    console.error("[mailer] Erro ao enviar e-mail pelo Gmail:", err);
    return false;
  }
}
