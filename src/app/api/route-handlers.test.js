import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/infrastructure/auth/auth-options", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/infrastructure/auth/auth-options";
import { GET as getHosts, POST as postHosts, PATCH as patchHosts } from "./hosts/route";
import { GET as getOwners, POST as postOwners, PATCH as patchOwners } from "./owners/route";
import { GET as getUsers, PATCH as patchUsers } from "./users/route";
import { POST as postInvite } from "./users/invite/route";
import { GET as getVisits, POST as postVisits, PATCH as patchVisits } from "./visits/route";
import { GET as getRespond, POST as postRespond } from "./visits/respond/[token]/route";
import { GET as getStatus } from "./visits/status/[token]/route";
import { GET as getInvite, POST as postInviteToken } from "./invite/[token]/route";

import { prismaUserRepository } from "@/infrastructure/repositories/prisma-user-repository";
import { prismaOwnerRepository } from "@/infrastructure/repositories/prisma-owner-repository";
import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";
import { cryptoTokenService } from "@/infrastructure/tokens/crypto-token-service";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";
import { prisma } from "@/infrastructure/prisma/client";

describe("API Route Handlers — Otorisasi Server-Side & Status Code (AGENTS.md Rule #6)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(emailNotificationService, "notifyHostOfVisit").mockResolvedValue();
  });

  describe("/api/hosts", () => {
    it("GET /api/hosts harus publik dan mengembalikan list host aktif", async () => {
      vi.spyOn(prismaUserRepository, "findActiveHosts").mockResolvedValue([
        { id: "h1", name: "Host One" },
      ]);

      const res = await getHosts();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
    });

    it("POST /api/hosts harus menolak 401 jika belum login", async () => {
      auth.mockResolvedValue(null);

      const req = new Request("http://localhost/api/hosts", {
        method: "POST",
        body: JSON.stringify({ name: "New Host" }),
      });
      const res = await postHosts(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/hosts harus menolak 403 jika login sebagai HOST atau ADMIN_HRD (bukan ADMINISTRATOR)", async () => {
      auth.mockResolvedValue({ user: { role: "ADMIN_HRD" } });

      const req = new Request("http://localhost/api/hosts", {
        method: "POST",
        body: JSON.stringify({ name: "New Host" }),
      });
      const res = await postHosts(req);
      expect(res.status).toBe(403);
    });

    it("PATCH /api/hosts harus menolak 400 jika hostId tidak disertakan", async () => {
      auth.mockResolvedValue({ user: { role: "ADMINISTRATOR" } });

      const req = new Request("http://localhost/api/hosts", {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const res = await patchHosts(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("hostId wajib diisi");
    });
  });

  describe("/api/owners", () => {
    it("GET /api/owners harus menolak 401 jika belum login dan 403 jika bukan ADMINISTRATOR", async () => {
      auth.mockResolvedValue(null);
      expect((await getOwners()).status).toBe(401);

      auth.mockResolvedValue({ user: { role: "HOST" } });
      expect((await getOwners()).status).toBe(403);
    });

    it("POST /api/owners harus menolak 403 jika role HOST", async () => {
      auth.mockResolvedValue({ user: { role: "HOST" } });

      const req = new Request("http://localhost/api/owners", {
        method: "POST",
        body: JSON.stringify({ name: "Owner", phoneNumber: "081234567890" }),
      });
      const res = await postOwners(req);
      expect(res.status).toBe(403);
    });

    it("PATCH /api/owners harus menolak 400 jika ownerId tidak ada", async () => {
      auth.mockResolvedValue({ user: { role: "ADMINISTRATOR" } });

      const req = new Request("http://localhost/api/owners", {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const res = await patchOwners(req);
      expect(res.status).toBe(400);
    });
  });

  describe("/api/users & /api/users/invite", () => {
    it("GET /api/users hanya boleh diakses ADMINISTRATOR (401 unauth, 403 non-admin)", async () => {
      auth.mockResolvedValue(null);
      const req = new Request("http://localhost/api/users");
      expect((await getUsers(req)).status).toBe(401);

      auth.mockResolvedValue({ user: { role: "ADMIN_HRD" } });
      expect((await getUsers(req)).status).toBe(403);
    });

    it("PATCH /api/users harus menolak jika admin mencoba menonaktifkan akunnya sendiri", async () => {
      auth.mockResolvedValue({ user: { id: "admin-id-1", role: "ADMINISTRATOR" } });

      const req = new Request("http://localhost/api/users", {
        method: "PATCH",
        body: JSON.stringify({ userId: "admin-id-1", isActive: false }),
      });
      const res = await patchUsers(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Tidak dapat menonaktifkan akun sendiri");
    });

    it("POST /api/users/invite harus menolak 403 jika bukan ADMINISTRATOR", async () => {
      auth.mockResolvedValue({ user: { role: "HOST" } });

      const req = new Request("http://localhost/api/users/invite", {
        method: "POST",
        body: JSON.stringify({ name: "New User", email: "new@company.com", role: "HOST" }),
      });
      const res = await postInvite(req);
      expect(res.status).toBe(403);
    });
  });

  describe("/api/visits", () => {
    it("POST /api/visits harus publik untuk check-in tamu dan mengembalikan 201", async () => {
      vi.spyOn(prismaUserRepository, "findById").mockResolvedValue({
        id: "host-1",
        name: "Host",
        email: "host@company.com",
        role: "HOST",
        isActive: true,
      });
      vi.spyOn(prismaOwnerRepository, "findActiveByPhone").mockResolvedValue(null);
      vi.spyOn(prismaVisitRepository, "create").mockResolvedValue({
        id: "v-1",
        visitToken: "public-visit-token-xyz",
      });
      vi.spyOn(cryptoTokenService, "createHostActionToken").mockResolvedValue({
        id: "tok-1",
        token: "action-tok",
      });

      const req = new Request("http://localhost/api/visits", {
        method: "POST",
        body: JSON.stringify({
          guestName: "Budi Tamu",
          guestPhone: "081234567890",
          purpose: "Meeting",
          hostId: "host-1",
        }),
      });

      const res = await postVisits(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.visitToken).toBe("public-visit-token-xyz");
    });

    it("POST /api/visits harus mengembalikan 400 jika input tidak valid", async () => {
      const req = new Request("http://localhost/api/visits", {
        method: "POST",
        body: JSON.stringify({ guestName: "" }),
      });

      const res = await postVisits(req);
      expect(res.status).toBe(400);
    });

    it("GET /api/visits: Host hanya melihat kunjungan miliknya sendiri (findByHostId)", async () => {
      auth.mockResolvedValue({ user: { id: "host-me-1", role: "HOST" } });
      const findByHostSpy = vi.spyOn(prismaVisitRepository, "findByHostId").mockResolvedValue({
        data: [{ id: "my-visit" }],
        total: 1,
      });

      const req = new Request("http://localhost/api/visits");
      const res = await getVisits(req);

      expect(res.status).toBe(200);
      expect(findByHostSpy).toHaveBeenCalledWith("host-me-1", expect.any(Object));
    });

    it("GET /api/visits: ADMIN_HRD & ADMINISTRATOR melihat seluruh kunjungan (findAll)", async () => {
      auth.mockResolvedValue({ user: { role: "ADMIN_HRD" } });
      const findAllSpy = vi.spyOn(prismaVisitRepository, "findAll").mockResolvedValue({
        data: [{ id: "all-visit-1" }, { id: "all-visit-2" }],
        total: 2,
      });

      const req = new Request("http://localhost/api/visits");
      const res = await getVisits(req);

      expect(res.status).toBe(200);
      expect(findAllSpy).toHaveBeenCalledTimes(1);
    });

    it("PATCH /api/visits harus menolak 401 jika belum login", async () => {
      auth.mockResolvedValue(null);

      const req = new Request("http://localhost/api/visits", {
        method: "PATCH",
        body: JSON.stringify({ visitId: "v-1", action: "APPROVED" }),
      });
      const res = await patchVisits(req);
      expect(res.status).toBe(401);
    });

    it("PATCH /api/visits harus menolak 403 jika login BUKAN sebagai HOST", async () => {
      auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMINISTRATOR" } });

      const req = new Request("http://localhost/api/visits", {
        method: "PATCH",
        body: JSON.stringify({ visitId: "v-1", action: "APPROVED" }),
      });
      const res = await patchVisits(req);
      expect(res.status).toBe(403);
    });

    it("PATCH /api/visits harus mengembalikan 200 jika HOST menyetujui kunjungannya", async () => {
      auth.mockResolvedValue({ user: { id: "host-1", role: "HOST" } });

      vi.spyOn(prismaVisitRepository, "findById").mockResolvedValue({
        id: "v-1",
        hostId: "host-1",
        status: "PENDING",
      });

      vi.spyOn(prismaVisitRepository, "updateStatus").mockResolvedValue({
        id: "v-1",
        status: "APPROVED",
        hostReply: "Silakan masuk",
        respondedAt: new Date(),
      });

      const req = new Request("http://localhost/api/visits", {
        method: "PATCH",
        body: JSON.stringify({
          visitId: "v-1",
          action: "APPROVED",
          hostReply: "Silakan masuk",
        }),
      });

      const res = await patchVisits(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("APPROVED");
      expect(data.hostReply).toBe("Silakan masuk");
    });
  });

  describe("/api/visits/respond/[token] & /api/visits/status/[token]", () => {
    it("GET /api/visits/respond/[token] harus mengembalikan 404 jika token tidak valid", async () => {
      vi.spyOn(cryptoTokenService, "validateHostActionToken").mockResolvedValue(null);

      const res = await getRespond(new Request("http://localhost"), {
        params: Promise.resolve({ token: "invalid-token" }),
      });
      expect(res.status).toBe(404);
    });

    it("GET /api/visits/respond/[token] harus mengembalikan 200 dan guestPhotoUrl jika token valid", async () => {
      vi.spyOn(cryptoTokenService, "validateHostActionToken").mockResolvedValue({ visitId: "v-1" });
      vi.spyOn(prismaVisitRepository, "findById").mockResolvedValue({
        id: "v-1",
        guestName: "Tamu Foto",
        guestPhone: "+6281234567890",
        purpose: "Meeting",
        visitorType: "REGULAR",
        status: "PENDING",
        guestPhotoUrl: "/uploads/visitors/face.jpg",
        host: { name: "Host Budi" },
      });

      const res = await getRespond(new Request("http://localhost"), {
        params: Promise.resolve({ token: "valid-token" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.guestPhotoUrl).toBe("/uploads/visitors/face.jpg");
    });

    it("POST /api/visits/respond/[token] harus menolak 400 jika action bukan APPROVED/REJECTED", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ action: "INVALID" }),
      });

      const res = await postRespond(req, {
        params: Promise.resolve({ token: "token" }),
      });
      expect(res.status).toBe(400);
    });

    it("GET /api/visits/status/[token] polling harus mengembalikan 404 jika token tidak ada dan 200 jika ada", async () => {
      // 404 Not found
      vi.spyOn(prismaVisitRepository, "findByVisitToken").mockResolvedValue(null);
      const res404 = await getStatus(new Request("http://localhost"), {
        params: Promise.resolve({ token: "unknown" }),
      });
      expect(res404.status).toBe(404);

      // 200 Found
      vi.spyOn(prismaVisitRepository, "findByVisitToken").mockResolvedValue({
        guestName: "Tamu",
        guestPhotoUrl: "/uploads/visitors/photo.jpg",
        purpose: "Interview",
        visitorType: "REGULAR",
        status: "APPROVED",
        host: { name: "Host", department: "IT" },
      });
      const res200 = await getStatus(new Request("http://localhost"), {
        params: Promise.resolve({ token: "valid-visit-token" }),
      });
      expect(res200.status).toBe(200);
      const data = await res200.json();
      expect(data.guestPhotoUrl).toBe("/uploads/visitors/photo.jpg");
    });
  });

  describe("/api/invite/[token]", () => {
    it("GET /api/invite/[token] harus mengembalikan 404 jika invite token tidak valid", async () => {
      vi.spyOn(cryptoTokenService, "validateInviteToken").mockResolvedValue(null);

      const res = await getInvite(new Request("http://localhost"), {
        params: Promise.resolve({ token: "invalid-invite" }),
      });
      expect(res.status).toBe(404);
    });

    it("POST /api/invite/[token] harus mengembalikan 400 jika password kosong", async () => {
      const req = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ password: "" }),
      });

      const res = await postInviteToken(req, {
        params: Promise.resolve({ token: "tok" }),
      });
      expect(res.status).toBe(400);
    });
  });
});
