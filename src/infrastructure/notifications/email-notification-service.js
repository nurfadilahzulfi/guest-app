import { Resend } from "resend";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = "Guest App <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

/**
 * Implementasi NotificationService menggunakan Resend.
 * Routing notifikasi mengikuti matriks AGENTS.md Bagian 5.
 * Jika Resend API key tidak tersedia, fallback ke console.log.
 */
export const emailNotificationService = {
  /**
   * Kirim notifikasi ke host (dan CC jika perlu) saat tamu check-in.
   * @param {Object} params
   * @param {Object} params.visit - Visit data termasuk host
   * @param {Object|null} params.actionToken - HostActionToken (null untuk OWNER)
   */
  async notifyHostOfVisit({ visit, actionToken }) {
    const host = visit.host;
    const isOwnerVisit = visit.visitorType === "OWNER";
    const isDeptHead = host.isDepartmentHead;

    // Tentukan penerima CC berdasarkan matriks notifikasi (AGENTS.md Bagian 5)
    let ccRecipients = [];
    if (isDeptHead) {
      const [adminHrds, administrators] = await Promise.all([
        prismaUserRepository.findAllAdminHrd(),
        prismaUserRepository.findAllAdministrators(),
      ]);
      ccRecipients = [...adminHrds, ...administrators]
        .map((u) => u.email)
        .filter((email) => email !== host.email);
    }

    // Tentukan tipe notifikasi
    const isActionable = !isOwnerVisit; // REGULAR = actionable, OWNER = informational
    const notifType = isActionable ? "Perlu Persetujuan" : "Informasi Kunjungan";

    // Buat content email
    const subject = `[${notifType}] Kunjungan dari ${visit.guestName}`;

    let actionLinks = "";
    if (isActionable && actionToken) {
      const respondUrl = `${APP_URL}/respond/${actionToken.token}`;
      actionLinks = `
        <div style="margin: 24px 0;">
          <p><strong>Silakan berikan respons Anda:</strong></p>
          <a href="${respondUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Review & Respond
          </a>
        </div>
      `;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 Guest App</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0 0;">${notifType}</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Kunjungan Baru</h2>
          ${visit.guestPhotoUrl ? `
          <div style="margin: 16px 0 24px 0; text-align: center;">
            <img
              src="${visit.guestPhotoUrl.startsWith("http") ? visit.guestPhotoUrl : APP_URL + visit.guestPhotoUrl}"
              alt="Foto Wajah Tamu"
              style="width: 130px; height: 130px; object-fit: cover; border-radius: 12px; border: 2px solid #3b82f6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
            />
            <p style="color: #6b7280; font-size: 12px; margin: 6px 0 0 0;">Foto Wajah Tamu (Check-in)</p>
          </div>
          ` : ""}
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 140px;">Nama Tamu</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${visit.guestName}</td>
            </tr>
            ${visit.gender ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Jenis Kelamin</td>
              <td style="padding: 8px 0; color: #1f2937;">${visit.gender}</td>
            </tr>
            ` : ""}
            ${visit.organization ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Asal Instansi/Perusahaan</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${visit.organization}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Nomor HP</td>
              <td style="padding: 8px 0; color: #1f2937;">${visit.guestPhone}</td>
            </tr>
            ${visit.guestEmail ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email</td>
              <td style="padding: 8px 0; color: #1f2937;">${visit.guestEmail}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Tujuan</td>
              <td style="padding: 8px 0; color: #1f2937;">${visit.purpose}</td>
            </tr>
            ${visit.duration ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Perkiraan Durasi</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${visit.duration}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Jenis Tamu</td>
              <td style="padding: 8px 0; color: #1f2937;">
                <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 13px; font-weight: 600; ${
                  isOwnerVisit
                    ? "background: #dcfce7; color: #166534;"
                    : "background: #dbeafe; color: #1e40af;"
                }">
                  ${visit.visitorType}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Status</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${visit.status}</td>
            </tr>
          </table>
          ${actionLinks}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Email ini dikirim otomatis oleh Guest App. Jangan balas email ini.
          </p>
        </div>
      </div>
    `;

    // Kirim email
    const to = [host.email];
    await this._sendEmail({ to, cc: ccRecipients, subject, html });
  },

  /**
   * Kirim email undangan ke user baru.
   * @param {Object} params
   * @param {Object} params.user
   * @param {Object} params.inviteToken
   * @param {string} params.inviteUrl
   */
  async sendInviteEmail({ user, inviteToken, inviteUrl }) {
    const subject = "Undangan Bergabung — Guest App";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 Guest App</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0 0;">Undangan Akun Baru</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Halo, ${user.name}!</h2>
          <p style="color: #4b5563;">
            Anda telah diundang untuk bergabung dengan Guest App sebagai <strong>${user.role}</strong>.
            Klik tombol di bawah untuk mengaktifkan akun Anda dan membuat password.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Aktivasi Akun
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">
            Link ini berlaku selama 72 jam. Jika kedaluwarsa, hubungi Administrator untuk mengundang ulang.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Email ini dikirim otomatis oleh Guest App. Jangan balas email ini.
          </p>
        </div>
      </div>
    `;

    await this._sendEmail({ to: [user.email], subject, html });
  },

  /**
   * Fungsi internal untuk mengirim email via Resend atau fallback ke console.
   * @param {Object} params
   * @param {string[]} params.to
   * @param {string[]} [params.cc]
   * @param {string} params.subject
   * @param {string} params.html
   */
  async _sendEmail({ to, cc = [], subject, html }) {
    if (!resend) {
      console.log("=== EMAIL STUB (Resend tidak dikonfigurasi) ===");
      console.log(`To: ${to.join(", ")}`);
      if (cc.length > 0) console.log(`CC: ${cc.join(", ")}`);
      console.log(`Subject: ${subject}`);
      console.log("HTML: [lihat di browser]");
      console.log("=== END EMAIL STUB ===");
      return;
    }

    try {
      const emailData = {
        from: FROM_EMAIL,
        to,
        subject,
        html,
      };
      if (cc.length > 0) {
        emailData.cc = cc;
      }

      const { error } = await resend.emails.send(emailData);
      if (error) {
        console.error("Gagal mengirim email via Resend:", error);
        throw new Error(`Gagal mengirim email: ${error.message}`);
      }
    } catch (err) {
      console.error("Error saat mengirim email:", err);
      // Jangan throw — notifikasi gagal tidak boleh menggagalkan proses utama
      // Tapi tetap log supaya bisa di-debug
    }
  },
};
