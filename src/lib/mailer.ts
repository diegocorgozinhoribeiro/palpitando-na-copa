// Envio de e-mail por API HTTP (porta 443) - funciona no Render, que BLOQUEIA
// conexoes SMTP de saida (Gmail/SMTP dao ETIMEDOUT la).
//
// Suporta 3 provedores; usa o primeiro que estiver configurado:
//   1) Brevo     -> BREVO_API_KEY     (gratis 300/dia, sem dominio)
//   2) SendGrid  -> SENDGRID_API_KEY  (gratis 100/dia, sem dominio)
//   3) Resend    -> RESEND_API_KEY
// Em todos, EMAIL_FROM deve ser um remetente VERIFICADO no provedor
// (pode ser seu proprio Gmail apos verificar como "sender").
//
// Sem nenhuma chave configurada, apenas registra o link no log (modo teste).
type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

// EMAIL_FROM pode vir como "Nome <email@dominio.com>" ou so "email@dominio.com".
function parseFrom(raw: string): { name: string; email: string } {
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || "Palpitando na Copa", email: m[2].trim() };
  return { name: "Palpitando na Copa", email: raw.trim() };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendArgs): Promise<boolean> {
  const rawFrom = process.env.EMAIL_FROM || "";
  const { name, email } = parseFrom(rawFrom);

  const brevoKey = process.env.BREVO_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  try {
    // 1) Brevo (https://api.brevo.com)
    if (brevoKey) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name, email },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || "",
        }),
      });
      if (!res.ok) {
        console.error("[mailer] Brevo falhou:", res.status, await res.text());
        return false;
      }
      return true;
    }

    // 2) SendGrid (https://api.sendgrid.com)
    if (sendgridKey) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email, name },
          subject,
          content: [
            { type: "text/plain", value: text || " " },
            { type: "text/html", value: html },
          ],
        }),
      });
      if (!res.ok) {
        console.error(
          "[mailer] SendGrid falhou:",
          res.status,
          await res.text(),
        );
        return false;
      }
      return true;
    }

    // 3) Resend (https://api.resend.com)
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ from: rawFrom, to, subject, html, text }),
      });
      if (!res.ok) {
        console.error("[mailer] Resend falhou:", res.status, await res.text());
        return false;
      }
      return true;
    }
  } catch (err) {
    console.error("[mailer] Erro ao enviar e-mail:", err);
    return false;
  }

  // Fallback: nenhuma chave configurada -> registra no log (modo teste).
  console.warn(
    "[mailer] Nenhum provedor de e-mail configurado - e-mail NAO enviado.",
  );
  console.warn(`[mailer] Para: ${to} | Assunto: ${subject}`);
  if (text) console.warn(`[mailer] Conteudo:\n${text}`);
  return false;
}
