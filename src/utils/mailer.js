import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendOtpEmail({ to, otp }) {
  const mailOptions = {
    from: `"Go Barokah" <${process.env.MAIL_USER}>`,
    to,
    subject: "Kode OTP Verifikasi Email — Go Barokah",
    html: `
      <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #047857 0%, #059669 100%); padding: 32px 24px; text-align: center;">
          <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; line-height: 48px; text-align: center; font-size: 24px;">🔐</div>
          <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">Verifikasi Email Anda</h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px 28px; background: #ffffff; text-align: center;">
          <p style="color: #475569; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
            Terima kasih telah mendaftar di <strong>Go Barokah</strong>. Silakan gunakan kode OTP berikut untuk menyelesaikan proses verifikasi:
          </p>
          
          <!-- OTP Box -->
          <div style="background: #ecfdf5; border: 1px dashed #34d399; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h1 style="margin: 0; color: #065f46; font-size: 36px; font-weight: 700; letter-spacing: 8px;">${otp}</h1>
          </div>
          
          <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">
            ⏳ Kode ini hanya berlaku selama <b>10 menit</b>.
          </p>
          <p style="color: #ef4444; font-size: 13px; margin: 0; font-weight: 500;">
            Jangan pernah membagikan kode ini kepada siapa pun.
          </p>
        </div>
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

  const tableRows = products
    .map(
      (p) => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: 500;">${p.name}</td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 13px; color: #64748b;">${p.category?.name ?? "-"}</td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9; text-align: right;">
            ${
              p.stock === 0
                ? `<span style="display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border-radius: 999px; font-size: 12px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Habis (0)</span>`
                : `<span style="display: inline-block; padding: 4px 12px; background: #ffedd5; color: #9a3412; border-radius: 999px; font-size: 12px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${p.stock} unit</span>`
            }
          </td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">

      <!-- Header: Urgent Amber/Orange Theme -->
      <div style="background: linear-gradient(135deg, #d97706 0%, #ea580c 100%); padding: 32px 28px; text-align: center;">
        <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; line-height: 56px; text-align: center; font-size: 28px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">⚠️</div>
        <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">Peringatan Stok Menipis</h1>
        <p style="margin: 0; color: #fde68a; font-size: 14px;">Go Barokah — Sistem Notifikasi Otomatis</p>
      </div>

      <!-- Alert Banner -->
      <div style="background: #fffbeb; border-bottom: 1px solid #fef3c7; padding: 12px 28px; text-align: center;">
        <p style="margin: 0; color: #b45309; font-size: 13.5px; font-weight: 500;">
          Ditemukan <strong>${products.length} produk</strong> dengan stok di bawah batas aman.
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 28px 24px; background: #ffffff;">
        <p style="color: #475569; font-size: 14.5px; margin: 0 0 20px; line-height: 1.6;">
          Halo <strong>Admin</strong>,<br>Berikut adalah daftar produk yang memerlukan perhatian dan tindakan restok segera:
        </p>

        <!-- Modern Table -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 12px 16px; text-align: left; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Nama Produk</th>
                <th style="padding: 12px 16px; text-align: center; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Kategori</th>
                <th style="padding: 12px 16px; text-align: right; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Status Stok</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>

        <!-- Info Callout -->
        <div style="padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; border-radius: 6px;">
          <p style="margin: 0; color: #1e3a8a; font-size: 13.5px; line-height: 1.5;">
            <strong>Tindakan diperlukan:</strong> Segera lakukan penambahan stok melalui dashboard admin untuk menghindari penolakan pesanan pelanggan.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
          Email ini dihasilkan secara otomatis oleh <strong>Sistem Go Barokah</strong>.<br>Mohon untuk tidak membalas email ini.
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

    console.log(
      `[LowStock] Email notifikasi terkirim ke ${adminEmail} — messageId: ${info.messageId}`,
    );
  } catch (error) {
    console.error(
      "[LowStock] Gagal mengirim email notifikasi stok:",
      error.message,
    );
  }
}
