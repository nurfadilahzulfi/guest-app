import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { getBaseAppUrl } from "@/infrastructure/utils/app-url";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.SMTP_FROM || process.env.RESEND_FROM || "PT Tanimas Resources Internasional <sap.system@tanimasresources.com>";

/**
 * Logo attachment tidak tersedia di Vercel (serverless, read-only filesystem).
 * Selalu mengembalikan null — logo ditampilkan via URL publik di template HTML jika diperlukan.
 * @returns {null}
 */
function getLogoAttachment() {
  return null;
}

/**
 * Membuat transporter Nodemailer (SMTP) jika konfigurasi SMTP tersedia.
 * Mendukung Gmail (App Password) maupun server SMTP korporat lainnya.
 */
function getSmtpTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, "");
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    // Khusus jika menggunakan Gmail
    const isGmail = host.toLowerCase().includes("gmail") || process.env.SMTP_USER.toLowerCase().endsWith("@gmail.com");
    if (isGmail && (!process.env.SMTP_HOST || process.env.SMTP_HOST === "smtp.gmail.com")) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: cleanPass,
        },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass,
      },
    });
  }
  return null;
}

/**
 * Implementasi NotificationService mendukung SMTP (Nodemailer) & Resend.
 * Routing notifikasi mengikuti matriks AGENTS.md Bagian 5.
 * Prioritas:
 * 1. SMTP (Nodemailer) jika SMTP_USER & SMTP_PASS terisi di .env
 * 2. Resend jika RESEND_API_KEY terisi di .env
 * 3. Fallback ke console.log jika tidak ada kredensial email yang dikonfigurasi.
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

    const attachments = [];
    const logoAtt = getLogoAttachment();
    if (logoAtt) {
      attachments.push(logoAtt);
    }

    const appUrl = getBaseAppUrl();

    // Foto wajah tamu disimpan sebagai Base64 Data URL di database (kompatibel Vercel)
    let photoSrc = null;
    if (visit.guestPhotoUrl) {
      if (visit.guestPhotoUrl.startsWith("data:image/")) {
        // Base64 Data URL — embed langsung ke src <img> di HTML email
        photoSrc = visit.guestPhotoUrl;
      } else if (visit.guestPhotoUrl.startsWith("http")) {
        // URL absolut eksternal
        photoSrc = visit.guestPhotoUrl;
      } else {
        // URL relatif — build ke URL absolut
        photoSrc = `${appUrl}${visit.guestPhotoUrl}`;
      }
    }

    let actionLinks = "";
    if (isActionable && actionToken) {
      const respondUrl = `${appUrl}/respond/${actionToken.token}`;
      actionLinks = `
        <div style="margin: 28px 0 16px 0; text-align: center;">
          <a href="${respondUrl}" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            Review & Respond
          </a>
        </div>
      `;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #09090b 0%, #27272a 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          ${logoAtt ? `
          <div style="margin-bottom: 12px;">
            <img src="cid:tanimas-logo" alt="PT Tanimas Logo" style="width: 52px; height: 52px; object-fit: contain; display: inline-block; background: #ffffff; padding: 6px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
          </div>
          ` : ""}
          <h1 style="color: #ffffff; margin: 0; font-size: 21px; letter-spacing: -0.5px; font-weight: 700;">PT. Tanimas Resources Internasional</h1>
          <p style="color: #a1a1aa; margin: 6px 0 0 0; font-size: 13px;">
            Pemberitahuan Kunjungan Tamu — <span style="color: #38bdf8; font-weight: 600;">${notifType}</span>
          </p>
        </div>
        <div style="background: #ffffff; padding: 36px 32px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #18181b; margin-top: 0; font-size: 18px;">Permohonan Kunjungan Baru</h2>
          <p style="color: #52525b; font-size: 14px; margin-top: 4px; line-height: 1.5;">
            Tamu telah mendaftarkan diri di pos/lobi dan menunggu konfirmasi dari Anda:
          </p>

          ${visit.guestPhotoUrl ? `
          <div style="margin: 20px 0 24px 0; text-align: center;" data-photo="${visit.guestPhotoUrl}">
            <div style="display: inline-block; padding: 4px; background: #ffffff; border: 2px solid #e4e4e7; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);">
              <img
                src="${photoSrc || (visit.guestPhotoUrl.startsWith("http") ? visit.guestPhotoUrl : APP_URL + visit.guestPhotoUrl)}"
                alt="Foto Wajah Tamu"
                style="width: 140px; height: 140px; object-fit: cover; border-radius: 12px; display: block;"
              />
            </div>
            <p style="color: #71717a; font-size: 12px; font-weight: 500; margin: 8px 0 0 0;">Foto Wajah Tamu (Check-in)</p>
          </div>
          ` : ""}

          <div style="background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #71717a; width: 140px;">Nama Tamu</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 700;">${visit.guestName}</td>
              </tr>
              ${visit.gender ? `
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Jenis Kelamin</td>
                <td style="padding: 6px 0; color: #18181b;">${visit.gender}</td>
              </tr>
              ` : ""}
              ${visit.organization ? `
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Asal Instansi</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 600;">${visit.organization}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Nomor HP</td>
                <td style="padding: 6px 0; color: #18181b; font-family: monospace;">${visit.guestPhone}</td>
              </tr>
              ${visit.guestEmail ? `
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Email Tamu</td>
                <td style="padding: 6px 0; color: #18181b;">${visit.guestEmail}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Keperluan</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 600;">${visit.purpose}</td>
              </tr>
              ${visit.duration ? `
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Perkiraan Durasi</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 600;">${visit.duration}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Jenis Tamu</td>
                <td style="padding: 6px 0; color: #18181b;">
                  <span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; ${
                    isOwnerVisit
                      ? "background: #dcfce7; color: #166534;"
                      : "background: #dbeafe; color: #1e40af;"
                  }">
                    ${visit.visitorType}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Status Saat Ini</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 700;">${visit.status}</td>
              </tr>
            </table>
          </div>

          ${actionLinks}

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 28px 0 20px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
            Email ini dikirim secara otomatis oleh Guest App PT. Tanimas Resources Internasional.<br/>Jangan membalas email ini secara langsung.
          </p>
        </div>
      </div>
    `;

    // Kirim email
    const to = [host.email];
    await this._sendEmail({ to, cc: ccRecipients, subject, html, attachments });
  },

  /**
   * Kirim email informasi akun dan kredensial login ke user baru.
   * @param {Object} params
   * @param {Object} params.user - Objek user (name, email, role, department, position)
   * @param {string} params.password - Plain text password yang dibuatkan untuk user
   * @param {string} [params.loginUrl] - URL login aplikasi
   */
  async sendAccountCredentialsEmail({ user, password, loginUrl }) {
    const appUrl = getBaseAppUrl();
    const finalLoginUrl = loginUrl || `${appUrl}/login?callbackUrl=/dashboard`;
    const roleMap = {
      HOST: "Karyawan (Host)",
      ADMIN_HRD: "Admin HRD",
      ADMINISTRATOR: "Administrator",
    };
    const roleLabel = roleMap[user.role] || user.role;

    const attachments = [];
    const logoAtt = getLogoAttachment();
    if (logoAtt) {
      attachments.push(logoAtt);
    }

    const subject = `[Guest App] Akun Anda Telah Dibuat — Kredensial Login PT Tanimas Resources Internasional`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #09090b 0%, #27272a 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          ${logoAtt ? `
          <div style="margin-bottom: 12px;">
            <img src="cid:tanimas-logo" alt="PT Tanimas Logo" style="width: 52px; height: 52px; object-fit: contain; display: inline-block; background: #ffffff; padding: 6px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
          </div>
          ` : ""}
          <h1 style="color: #ffffff; margin: 0; font-size: 21px; letter-spacing: -0.5px; font-weight: 700;">PT. Tanimas Resources Internasional</h1>
          <p style="color: #a1a1aa; margin: 6px 0 0 0; font-size: 13px;">Sistem Manajemen Tamu (Guest App)</p>
        </div>
        <div style="background: #ffffff; padding: 36px 32px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #18181b; margin-top: 0; font-size: 18px;">Halo, ${user.name}!</h2>
          <p style="color: #52525b; font-size: 14px; line-height: 1.6;">
            Akun Anda untuk portal <strong>Guest App PT. Tanimas Resources Internasional</strong> telah berhasil dibuat oleh Administrator.
            Berikut adalah detail akun dan kredensial login Anda:
          </p>

          <div style="background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #71717a; width: 120px;">Peran / Role</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 600;">${roleLabel}</td>
              </tr>
              ${user.department ? `
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Departemen</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 500;">${user.department}</td>
              </tr>
              ` : ""}
              ${user.position ? `
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Jabatan</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 500;">${user.position}</td>
              </tr>
              ` : ""}
              <tr>
                <td colspan="2" style="padding: 10px 0 6px 0; border-top: 1px dashed #d4d4d8;"></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Email Login</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 700; font-family: monospace; font-size: 15px;">${user.email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Kata Sandi</td>
                <td style="padding: 6px 0;">
                  <span style="color: #09090b; font-weight: 700; font-family: monospace; font-size: 16px; background-color: #fef08a; padding: 4px 10px; border-radius: 6px; display: inline-block;">${password}</span>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin: 28px 0; text-align: center;">
            <a href="${finalLoginUrl}" style="display: inline-block; padding: 14px 36px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.2px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              Masuk ke Dashboard
            </a>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 16px; margin-top: 20px;">
            <p style="color: #1e40af; font-size: 13px; margin: 0; line-height: 1.5;">
              💡 <strong>Tips Keamanan:</strong> Harap jaga kerahasiaan kata sandi Anda. Anda dapat menggunakan email dan kata sandi di atas untuk langsung masuk ke portal.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 28px 0 20px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
            Email ini dikirim secara otomatis oleh Guest App PT. Tanimas Resources Internasional.<br/>Tautan Login: <a href="${finalLoginUrl}" style="color: #71717a;">${finalLoginUrl}</a>
          </p>
        </div>
      </div>
    `;

    await this._sendEmail({ to: [user.email], subject, html, attachments });
  },

  /**
   * Kirim email undangan ke user baru.
   * @param {Object} params
   * @param {Object} params.user
   * @param {Object} params.inviteToken
   * @param {string} params.inviteUrl
   */
  async sendInviteEmail({ user, inviteToken, inviteUrl }) {
    const attachments = [];
    const logoAtt = getLogoAttachment();
    if (logoAtt) {
      attachments.push(logoAtt);
    }

    const subject = "Undangan Bergabung — Guest App";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #09090b 0%, #27272a 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          ${logoAtt ? `
          <div style="margin-bottom: 12px;">
            <img src="cid:tanimas-logo" alt="PT Tanimas Logo" style="width: 52px; height: 52px; object-fit: contain; display: inline-block; background: #ffffff; padding: 6px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
          </div>
          ` : ""}
          <h1 style="color: #ffffff; margin: 0; font-size: 21px; letter-spacing: -0.5px; font-weight: 700;">PT. Tanimas Resources Internasional</h1>
          <p style="color: #a1a1aa; margin: 6px 0 0 0; font-size: 13px;">Undangan Akun Baru</p>
        </div>
        <div style="background: #ffffff; padding: 36px 32px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">Halo, ${user.name}!</h2>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Anda telah diundang untuk bergabung dengan portal Guest App PT. Tanimas Resources Internasional sebagai <strong>${user.role}</strong>.
            Klik tombol di bawah untuk mengaktifkan akun Anda dan membuat password baru:
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${inviteUrl}" style="display: inline-block; padding: 14px 36px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.2px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              Aktivasi Akun
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px; text-align: center;">
            Link ini berlaku selama 72 jam. Jika kedaluwarsa, hubungi Administrator untuk mengundang ulang.
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 28px 0 20px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
            Email ini dikirim secara otomatis oleh Guest App PT. Tanimas Resources Internasional.<br/>Tautan: <a href="${inviteUrl}" style="color: #71717a;">${inviteUrl}</a>
          </p>
        </div>
      </div>
    `;

    await this._sendEmail({ to: [user.email], subject, html, attachments });
  },

  /**
   * Kirim email notifikasi keputusan kunjungan ke tamu (approve/reject).
   * @param {Object} params
   * @param {Object} params.visit - Data kunjungan (guestName, guestEmail, purpose, visitorType, visitToken, etc.)
   * @param {Object} [params.host] - Data host (name, department, position)
   * @param {'APPROVED' | 'REJECTED'} params.action - Status keputusan host
   * @param {string} [params.hostReply] - Pesan / arahan dari host
   * @param {string} [params.statusUrl] - URL live status kunjungan
   */
  async notifyGuestOfVisitDecision({ visit, host, action, hostReply, statusUrl }) {
    if (!visit?.guestEmail) return;

    const appUrl = getBaseAppUrl();
    const finalStatusUrl = statusUrl || `${appUrl}/status/${visit.visitToken}`;
    const isApproved = action === "APPROVED";
    const hostName = host?.name || visit.host?.name || "Staf PT. Tanimas";
    const hostDept = host?.department || visit.host?.department || "";

    const attachments = [];
    const logoAtt = getLogoAttachment();
    if (logoAtt) {
      attachments.push(logoAtt);
    }

    const statusTitle = isApproved ? "Disetujui" : "Belum Dapat Diterima";
    const statusBg = isApproved ? "#dcfce7" : "#fee2e2";
    const statusColor = isApproved ? "#15803d" : "#b91c1c";
    const statusBorder = isApproved ? "#bbf7d0" : "#fecaca";
    const statusIcon = isApproved ? "✅" : "❌";

    const subject = isApproved
      ? `[PT. Tanimas] Kunjungan Anda Telah Disetujui oleh ${hostName}`
      : `[PT. Tanimas] Informasi Kunjungan Anda kepada ${hostName}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background: linear-gradient(135deg, #09090b 0%, #27272a 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          ${logoAtt ? `
          <div style="margin-bottom: 12px;">
            <img src="cid:tanimas-logo" alt="PT Tanimas Logo" style="width: 52px; height: 52px; object-fit: contain; display: inline-block; background: #ffffff; padding: 6px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
          </div>
          ` : ""}
          <h1 style="color: #ffffff; margin: 0; font-size: 21px; letter-spacing: -0.5px; font-weight: 700;">PT. Tanimas Resources Internasional</h1>
          <p style="color: #a1a1aa; margin: 6px 0 0 0; font-size: 13px;">Pemberitahuan Status Kunjungan Tamu</p>
        </div>
        <div style="background: #ffffff; padding: 36px 32px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #18181b; margin-top: 0; font-size: 18px;">Halo, ${visit.guestName}!</h2>
          <p style="color: #52525b; font-size: 14px; line-height: 1.6;">
            Permohonan kunjungan yang Anda ajukan di lobi kami telah ditanggapi oleh staf yang bersangkutan:
          </p>

          <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center;">
            <span style="font-size: 22px; display: block; margin-bottom: 6px;">${statusIcon}</span>
            <span style="color: ${statusColor}; font-weight: 800; font-size: 17px; letter-spacing: 0.3px;">
              STATUS KUNJUNGAN: ${statusTitle.toUpperCase()}
            </span>
          </div>

          <div style="background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #71717a; width: 140px;">Staf Tujuan</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 700;">${hostName}</td>
              </tr>
              ${hostDept ? `
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Departemen</td>
                <td style="padding: 6px 0; color: #18181b; font-weight: 500;">${hostDept}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 6px 0; color: #71717a;">Keperluan</td>
                <td style="padding: 6px 0; color: #18181b;">${visit.purpose}</td>
              </tr>
              ${hostReply ? `
              <tr>
                <td colspan="2" style="padding: 10px 0 6px 0; border-top: 1px dashed #d4d4d8;"></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a; vertical-align: top;">Pesan dari Staf:</td>
                <td style="padding: 6px 0; color: #09090b; font-style: italic; background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e4e4e7;">
                  "${hostReply}"
                </td>
              </tr>
              ` : ""}
            </table>
          </div>

          ${isApproved ? `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 16px; margin: 20px 0;">
            <p style="color: #1e40af; font-size: 13px; margin: 0; line-height: 1.5;">
              🎉 <strong>Instruksi Tamu:</strong> Silakan menuju ke ruangan atau meja resepsionis/lobi sesuai petunjuk di atas. Anda dapat memperlihatkan email ini atau layar status kunjungan kepada staf di tempat.
            </p>
          </div>
          ` : `
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 16px; margin: 20px 0;">
            <p style="color: #9a3412; font-size: 13px; margin: 0; line-height: 1.5;">
              ℹ️ <strong>Informasi:</strong> Staf yang bersangkutan saat ini belum dapat menerima kunjungan. Anda dapat menghubungi kembali di lain waktu atau membuat janji temu terlebih dahulu.
            </p>
          </div>
          `}

          <div style="margin: 28px 0; text-align: center;">
            <a href="${finalStatusUrl}" style="display: inline-block; padding: 14px 36px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.2px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              Lihat Layar Status Real-Time
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 28px 0 20px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
            Email ini dikirim secara otomatis oleh Sistem Manajemen Tamu PT. Tanimas Resources Internasional.<br/>
            Tautan Status: <a href="${finalStatusUrl}" style="color: #71717a;">${finalStatusUrl}</a>
          </p>
        </div>
      </div>
    `;

    await this._sendEmail({ to: [visit.guestEmail], subject, html, attachments });
  },

  /**
   * Fungsi internal untuk mengirim email via SMTP (Nodemailer), Resend, atau fallback ke console.
   * @param {Object} params
   * @param {string[]} params.to
   * @param {string[]} [params.cc]
   * @param {string} params.subject
   * @param {string} params.html
   * @param {Array<Object>} [params.attachments]
   */
  async _sendEmail({ to, cc = [], subject, html, attachments = [] }) {
    // 1. Coba kirim via SMTP (Nodemailer) jika konfigurasi SMTP ada
    const smtpTransporter = getSmtpTransporter();
    if (smtpTransporter) {
      try {
        const fromAddress = process.env.SMTP_FROM || `PT Tanimas Resources Internasional <${process.env.SMTP_USER}>`;
        const mailOptions = {
          from: fromAddress,
          to: to.join(", "),
          subject,
          html,
          attachments,
        };
        if (cc.length > 0) {
          mailOptions.cc = cc.join(", ");
        }

        const info = await smtpTransporter.sendMail(mailOptions);
        console.log(`[SMTP Email Sent] ID: ${info.messageId} | Kepada: ${to.join(", ")}`);
        return info;
      } catch (err) {
        console.error("Gagal mengirim email via SMTP:", err.message);
        // Tetap lanjutkan (jangan throw error fatal agar alur utama tidak terputus)
        return;
      }
    }

    // 2. Fallback ke Resend jika ada RESEND_API_KEY
    if (resend) {
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
        if (attachments.length > 0) {
          emailData.attachments = attachments
            .filter((att) => att.content)
            .map((att) => ({
              filename: att.filename,
              content: att.content,
            }));
        }

        const { data, error } = await resend.emails.send(emailData);
        if (error) {
          console.error("Gagal mengirim email via Resend:", error.message || error);
        } else {
          console.log(`[Resend Email Sent] ID: ${data?.id} | Kepada: ${to.join(", ")}`);
        }
      } catch (err) {
        console.error("Error saat mengirim email via Resend:", err.message || err);
      }
      return;
    }

    // 3. Fallback ke Console Stub jika tidak ada email service yang aktif
    console.log("=== EMAIL STUB (SMTP & Resend tidak dikonfigurasi) ===");
    console.log(`To: ${to.join(", ")}`);
    if (cc.length > 0) console.log(`CC: ${cc.join(", ")}`);
    if (attachments.length > 0) console.log(`Attachments: ${attachments.map((a) => a.filename).join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log("HTML: [lihat di browser]");
    console.log("=== END EMAIL STUB ===");
  },
};
