import { describe, it, expect, vi, beforeEach } from "vitest";
import { emailNotificationService } from "./email-notification-service";
import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";

describe("Infrastructure: emailNotificationService — Matriks Routing Notifikasi (AGENTS.md Bagian 5)", () => {
  const staffHost = {
    id: "host-staff-1",
    name: "Staff Biasa",
    email: "staff@company.com",
    role: "HOST",
    department: "IT",
    position: "Junior Developer",
    isDepartmentHead: false,
  };

  const deptHeadHost = {
    id: "host-dept-head-1",
    name: "Kepala Departemen",
    email: "depthead@company.com",
    role: "HOST",
    department: "Engineering",
    position: "VP of Engineering",
    isDepartmentHead: true,
  };

  const mockAdminHrds = [
    { id: "hrd-1", email: "hrd1@company.com", name: "HRD Satu" },
    { id: "hrd-2", email: "hrd2@company.com", name: "HRD Dua" },
  ];

  const mockAdmins = [
    { id: "admin-1", email: "admin1@company.com", name: "Admin Utama" },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prismaUserRepository, "findAllAdminHrd").mockResolvedValue(mockAdminHrds);
    vi.spyOn(prismaUserRepository, "findAllAdministrators").mockResolvedValue(mockAdmins);
  });

  it("Skenario 1: OWNER + Staf biasa -> Host saja (Informational, tanpa CC, tanpa tombol respond)", async () => {
    const sendEmailSpy = vi.spyOn(emailNotificationService, "_sendEmail").mockResolvedValue();

    await emailNotificationService.notifyHostOfVisit({
      visit: {
        guestName: "Pak Pemilik",
        guestPhone: "+6281234567890",
        purpose: "Inspeksi",
        visitorType: "OWNER",
        status: "APPROVED",
        host: staffHost,
      },
      actionToken: null,
    });

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    const callArgs = sendEmailSpy.mock.calls[0][0];

    expect(callArgs.to).toEqual([staffHost.email]);
    expect(callArgs.cc).toEqual([]); // Tidak ada CC untuk staf biasa
    expect(callArgs.subject).toContain("Informasi Kunjungan");
    expect(callArgs.html).not.toContain("Review & Respond");
  });

  it("Skenario 2: OWNER + Department Head -> Host + CC semua ADMIN_HRD & ADMINISTRATOR (Informational)", async () => {
    const sendEmailSpy = vi.spyOn(emailNotificationService, "_sendEmail").mockResolvedValue();

    await emailNotificationService.notifyHostOfVisit({
      visit: {
        guestName: "Pak Pemilik",
        guestPhone: "+6281234567890",
        purpose: "Meeting Direksi",
        visitorType: "OWNER",
        status: "APPROVED",
        host: deptHeadHost,
      },
      actionToken: null,
    });

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    const callArgs = sendEmailSpy.mock.calls[0][0];

    expect(callArgs.to).toEqual([deptHeadHost.email]);
    // CC harus mencakup seluruh Admin HRD dan seluruh Administrator
    expect(callArgs.cc).toContain("hrd1@company.com");
    expect(callArgs.cc).toContain("hrd2@company.com");
    expect(callArgs.cc).toContain("admin1@company.com");
    expect(callArgs.cc).not.toContain(deptHeadHost.email); // Host tidak boleh CC ke dirinya sendiri
    expect(callArgs.subject).toContain("Informasi Kunjungan");
    expect(callArgs.html).not.toContain("Review & Respond");
  });

  it("Skenario 3: REGULAR + Staf biasa -> Host saja (Actionable dengan magic link approve/reject, tanpa CC)", async () => {
    const sendEmailSpy = vi.spyOn(emailNotificationService, "_sendEmail").mockResolvedValue();

    await emailNotificationService.notifyHostOfVisit({
      visit: {
        guestName: "Vendor Tamu",
        guestPhone: "+6281234567890",
        purpose: "Pengiriman barang",
        visitorType: "REGULAR",
        status: "PENDING",
        host: staffHost,
      },
      actionToken: { token: "magic-token-xyz" },
    });

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    const callArgs = sendEmailSpy.mock.calls[0][0];

    expect(callArgs.to).toEqual([staffHost.email]);
    expect(callArgs.cc).toEqual([]);
    expect(callArgs.subject).toContain("Perlu Persetujuan");
    expect(callArgs.html).toContain("/respond/magic-token-xyz");
    expect(callArgs.html).toContain("Review & Respond");
  });

  it("Skenario 4: REGULAR + Department Head -> Host + CC semua ADMIN_HRD & ADMINISTRATOR (Actionable)", async () => {
    const sendEmailSpy = vi.spyOn(emailNotificationService, "_sendEmail").mockResolvedValue();

    await emailNotificationService.notifyHostOfVisit({
      visit: {
        guestName: "Vendor Tamu",
        guestPhone: "+6281234567890",
        purpose: "Meeting Vendor",
        visitorType: "REGULAR",
        status: "PENDING",
        host: deptHeadHost,
      },
      actionToken: { token: "magic-token-123" },
    });

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    const callArgs = sendEmailSpy.mock.calls[0][0];

    expect(callArgs.to).toEqual([deptHeadHost.email]);
    expect(callArgs.cc).toEqual(
      expect.arrayContaining(["hrd1@company.com", "hrd2@company.com", "admin1@company.com"])
    );
    expect(callArgs.subject).toContain("Perlu Persetujuan");
    expect(callArgs.html).toContain("/respond/magic-token-123");
  });

  it("harus menyertakan thumbnail foto wajah tamu jika guestPhotoUrl ada pada visit", async () => {
    const sendEmailSpy = vi.spyOn(emailNotificationService, "_sendEmail").mockResolvedValue();

    await emailNotificationService.notifyHostOfVisit({
      visit: {
        guestName: "Tamu Foto",
        guestPhone: "+6281234567890",
        purpose: "Interview",
        visitorType: "REGULAR",
        status: "PENDING",
        guestPhotoUrl: "/uploads/visitors/selfie_123.jpg",
        host: staffHost,
      },
      actionToken: { token: "token-1" },
    });

    const callArgs = sendEmailSpy.mock.calls[0][0];
    expect(callArgs.html).toContain("/uploads/visitors/selfie_123.jpg");
    expect(callArgs.html).toContain("Foto Wajah Tamu (Check-in)");
  });

  it("harus mengubah Base64 photo menjadi inline CID attachment dan menjaga ukuran HTML di bawah batas Gmail (102 KB)", async () => {
    const sendEmailSpy = vi.spyOn(emailNotificationService, "_sendEmail").mockResolvedValue();

    // Simulasi data URL Base64 kamera selfie check-in
    const fakeBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const base64PhotoUrl = `data:image/png;base64,${fakeBase64}`;

    await emailNotificationService.notifyHostOfVisit({
      visit: {
        guestName: "Tamu Selfie",
        guestPhone: "+6281234567890",
        purpose: "Konsultasi",
        visitorType: "REGULAR",
        status: "PENDING",
        guestPhotoUrl: base64PhotoUrl,
        host: staffHost,
      },
      actionToken: { token: "token-selfie" },
    });

    const callArgs = sendEmailSpy.mock.calls[0][0];

    // 1. Attachment harus memiliki inline CID untuk guest photo
    const photoAttachment = callArgs.attachments.find((att) => att.cid === "guest-photo");
    expect(photoAttachment).toBeDefined();
    expect(photoAttachment.contentType).toBe("image/png");
    expect(Buffer.isBuffer(photoAttachment.content)).toBe(true);

    // 2. HTML harus menggunakan src="cid:guest-photo" dan BUKAN base64 mentah
    expect(callArgs.html).toContain('src="cid:guest-photo"');
    expect(callArgs.html).not.toContain(fakeBase64);
    expect(callArgs.html).not.toContain("data-photo=");

    // 3. Ukuran HTML harus sangat ringan (< 15 KB), jauh di bawah batas pemotongan 102 KB Gmail
    const htmlSizeBytes = Buffer.byteLength(callArgs.html, "utf8");
    expect(htmlSizeBytes).toBeLessThan(15000); // 15 KB max, Gmail clips at 102.4 KB

    // 4. Logo harus disertakan
    expect(callArgs.html).toContain("PT. Tanimas Resources Internasional");
    const logoAttachment = callArgs.attachments.find((att) => att.cid === "tanimas-logo");
    expect(logoAttachment).toBeDefined();
  });

  it("sendInviteEmail harus mengirim email undangan berisi link aktivasi akun", async () => {
    const sendEmailSpy = vi.spyOn(emailNotificationService, "_sendEmail").mockResolvedValue();

    await emailNotificationService.sendInviteEmail({
      user: {
        name: "User Baru",
        email: "baru@company.com",
        role: "HOST",
      },
      inviteToken: { token: "invite-token-abc" },
      inviteUrl: "http://localhost:3000/invite/invite-token-abc",
    });

    expect(sendEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["baru@company.com"],
        subject: "Undangan Bergabung — Guest App",
        html: expect.stringContaining("http://localhost:3000/invite/invite-token-abc"),
      })
    );
  });
});
