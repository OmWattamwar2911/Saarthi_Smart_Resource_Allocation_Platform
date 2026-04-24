import nodemailer from "nodemailer";

function parseRecipients(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(input)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getConfiguredRecipients(extraRecipients) {
  const envRecipients = parseRecipients(process.env.REPORT_EMAIL_TO || "");
  const payloadRecipients = parseRecipients(extraRecipients);
  return [...new Set([...envRecipients, ...payloadRecipients])];
}

function isEmailEnabled() {
  return String(process.env.REPORT_EMAIL_ENABLED || "false").toLowerCase() === "true";
}

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function autoEmailGeneratedReport({ report, pdfBuffer, recipients }) {
  if (!isEmailEnabled()) {
    return { attempted: false, sent: false, reason: "disabled" };
  }

  const finalRecipients = getConfiguredRecipients(recipients);
  if (!finalRecipients.length) {
    return { attempted: false, sent: false, reason: "no-recipients" };
  }

  const transporter = buildTransporter();
  if (!transporter) {
    return { attempted: false, sent: false, reason: "smtp-not-configured" };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  const subject = `[Saarthi] ${report.type} Report ${report.reportId}`;
  const textBody = [
    `Report ID: ${report.reportId}`,
    `Title: ${report.title}`,
    `Owner: ${report.owner}`,
    `Type: ${report.type}`,
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    "",
    "This email was automatically sent by Saarthi report automation."
  ].join("\n");

  await transporter.sendMail({
    from: fromAddress,
    to: finalRecipients.join(", "),
    subject,
    text: textBody,
    attachments: [
      {
        filename: `${report.reportId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });

  return {
    attempted: true,
    sent: true,
    recipients: finalRecipients
  };
}
