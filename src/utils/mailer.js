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

export async function sendLowStockAlertEmail({ products }) {
  if (!products || products.length === 0) return;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_USER;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const tableRows = products
    .map(
      (p) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111827;">${p.name}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; font-size: 14px; color: #6b7280;">${p.category?.name ?? "-"}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: center;">
            ${
              p.stock === 0
                ? `<span style="display: inline-block; padding: 3px 10px; background: #fee2e2; color: #991b1b; border-radius: 999px; font-size: 12px; font-weight: 700;">Habis</span>`
                : `<span style="display: inline-block; padding: 3px 10px; background: #fef9c3; color: #854d0e; border-radius: 999px; font-size: 12px; font-weight: 700;">${p.stock} unit</span>`
            }
          </td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10);">

      <!-- Header -->
      <div style="background: linear-gradient(160deg, #14532d 0%, #166534 50%, #15803d 100%); padding: 36px 28px 32px; text-align: center;">
        <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 14px; line-height: 56px; text-align: center; font-size: 28px;">⚠️</div>
        <h1 style="margin: 0 0 6px; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.2px;">Peringatan Stok Menipis</h1>
        <p style="margin: 0; color: #86efac; font-size: 13px; letter-spacing: 0.3px;">Go Barokah — Sistem Notifikasi Otomatis</p>
      </div>

      <!-- Alert Banner -->
      <div style="background: #fef9c3; padding: 10px 28px; border-bottom: 1px solid #fde68a; text-align: center;">
        <p style="margin: 0; color: #78350f; font-size: 13px;">
          🔔 Ditemukan <strong>${products.length} produk</strong> dengan stok di bawah batas minimum
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 28px 28px 24px; background: #ffffff;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 20px; line-height: 1.7;">
          Halo <strong>Admin</strong>, berikut adalah daftar produk yang memerlukan perhatian segera:
        </p>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #15803d;">
              <th style="padding: 11px 16px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Nama Produk</th>
              <th style="padding: 11px 16px; text-align: center; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Kategori</th>
              <th style="padding: 11px 16px; text-align: center; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Sisa Stok</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- Callout -->
        <div style="margin-top: 20px; padding: 14px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 6px;">
          <p style="margin: 0; color: #14532d; font-size: 13px; line-height: 1.6;">
            🛒 Segera lakukan <strong>restok</strong> untuk menghindari kehabisan barang dan menjaga kepuasan pelanggan.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 16px 28px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
          Email ini dikirim otomatis oleh sistem <strong style="color: #6b7280;">Go Barokah</strong>. Mohon tidak membalas email ini.
        </p>
      </div>

    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Go Barokah System" <${process.env.MAIL_USER}>`,
      to: adminEmail,
      subject: `⚠️ Peringatan: ${products.length} Produk Stok Menipis — Go Barokah`,
      html,
    });

    console.log(`[LowStock] Email notifikasi terkirim ke ${adminEmail} — messageId: ${info.messageId}`);
  } catch (error) {
    console.error("[LowStock] Gagal mengirim email notifikasi stok:", error.message);
  }
}

