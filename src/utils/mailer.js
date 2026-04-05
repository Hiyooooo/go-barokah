import nodemailer from "nodemailer";

export async function sendOtpEmail({ to, otp }) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Go Barokah" <${process.env.MAIL_USER}>`,
    to,
    subject: "Kode OTP Verifikasi Email",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Verifikasi Email</h2>
        <p>Gunakan kode OTP berikut:</p>
        <h1 style="letter-spacing: 6px; color: #333;">${otp}</h1>
        <p>Kode ini berlaku selama <b>10 menit</b>.</p>
        <p>Jangan bagikan kode ini ke siapa pun.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email send error", error);
    throw error;
  }
}
