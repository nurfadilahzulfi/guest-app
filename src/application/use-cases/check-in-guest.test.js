import { describe, it, expect, vi } from "vitest";
import { checkInGuest } from "./check-in-guest";

describe("Use Case: checkInGuest", () => {
  const mockHost = {
    id: "host-1",
    name: "Budi Host",
    email: "budi@company.com",
    role: "HOST",
    department: "IT",
    position: "Staff",
    isDepartmentHead: false,
    isActive: true,
  };

  it("harus berhasil memproses check-in tamu biasa (REGULAR) dengan status PENDING dan membuat action token", async () => {
    const mockVisit = {
      id: "visit-1",
      visitToken: "token-uuid-1",
      guestName: "Agus Tamu",
      guestPhone: "+6281234567890",
      guestEmail: "agus@example.com",
      purpose: "Meeting",
      visitorType: "REGULAR",
      hostId: "host-1",
      status: "PENDING",
    };

    const mockToken = {
      id: "action-tok-1",
      token: "magic-uuid-1",
      visitId: "visit-1",
    };

    const visitRepository = {
      create: vi.fn().mockResolvedValue(mockVisit),
    };
    const ownerRepository = {
      findActiveByPhone: vi.fn().mockResolvedValue(null), // bukan owner
    };
    const userRepository = {
      findById: vi.fn().mockResolvedValue(mockHost),
    };
    const notificationService = {
      notifyHostOfVisit: vi.fn().mockResolvedValue(undefined),
    };
    const tokenService = {
      createHostActionToken: vi.fn().mockResolvedValue(mockToken),
    };

    const result = await checkInGuest({
      input: {
        guestName: "Agus Tamu",
        guestPhone: "081234567890",
        purpose: "Meeting",
        guestEmail: "agus@example.com",
        hostId: "host-1",
      },
      visitRepository,
      ownerRepository,
      userRepository,
      notificationService,
      tokenService,
    });

    // Verifikasi visitorType dihitung di server
    expect(ownerRepository.findActiveByPhone).toHaveBeenCalledWith("+6281234567890");
    expect(visitRepository.create).toHaveBeenCalledWith({
      guestName: "Agus Tamu",
      guestPhone: "+6281234567890",
      guestEmail: "agus@example.com",
      guestPhotoUrl: null,
      purpose: "Meeting",
      visitorType: "REGULAR",
      gender: null,
      organization: null,
      duration: null,
      hostId: "host-1",
      status: "PENDING",
    });

    // Verifikasi action token dibuat untuk regular visit
    expect(tokenService.createHostActionToken).toHaveBeenCalledWith("visit-1");

    // Verifikasi notifikasi dikirim
    expect(notificationService.notifyHostOfVisit).toHaveBeenCalledWith({
      visit: { ...mockVisit, host: mockHost },
      actionToken: mockToken,
    });

    expect(result).toEqual(mockVisit);
  });

  it("harus meneruskan field gender, organization, dan duration jika disediakan", async () => {
    const customVisit = {
      id: "visit-custom-1",
      guestName: "Budi Wijaya",
      guestPhone: "+6281234567899",
      purpose: "Meeting Kemitraan",
      visitorType: "REGULAR",
      gender: "Laki-laki",
      organization: "PT Sukses Bersama",
      duration: "1 Jam",
      hostId: "host-1",
      status: "PENDING",
    };
    const mockToken = {
      id: "action-tok-1",
      token: "magic-uuid-1",
      visitId: "visit-custom-1",
    };
    const visitRepository = {
      create: vi.fn().mockResolvedValue(customVisit),
    };
    const ownerRepository = {
      findActiveByPhone: vi.fn().mockResolvedValue(null),
    };
    const userRepository = {
      findById: vi.fn().mockResolvedValue(mockHost),
    };
    const notificationService = {
      notifyHostOfVisit: vi.fn().mockResolvedValue(undefined),
    };
    const tokenService = {
      createHostActionToken: vi.fn().mockResolvedValue(mockToken),
    };

    await checkInGuest({
      input: {
        guestName: "Budi Wijaya",
        guestPhone: "081234567899",
        purpose: "Meeting Kemitraan",
        gender: "Laki-laki",
        organization: "PT Sukses Bersama",
        duration: "1 Jam",
        hostId: "host-1",
      },
      visitRepository,
      ownerRepository,
      userRepository,
      notificationService,
      tokenService,
    });

    expect(visitRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gender: "Laki-laki",
        organization: "PT Sukses Bersama",
        duration: "1 Jam",
      })
    );
  });

  it("harus memproses dan menyimpan foto selfie tamu jika disertakan saat check-in", async () => {
    const mockVisitWithPhoto = {
      id: "visit-with-photo",
      guestName: "Tamu Foto",
      guestPhotoUrl: "/uploads/visitors/visitor_123.jpg",
    };

    const visitRepository = {
      create: vi.fn().mockResolvedValue(mockVisitWithPhoto),
    };
    const ownerRepository = {
      findActiveByPhone: vi.fn().mockResolvedValue(null),
    };
    const userRepository = {
      findById: vi.fn().mockResolvedValue(mockHost),
    };
    const notificationService = {
      notifyHostOfVisit: vi.fn().mockResolvedValue(undefined),
    };
    const tokenService = {
      createHostActionToken: vi.fn().mockResolvedValue({ id: "tok-1", token: "tok-val" }),
    };
    const storageService = {
      saveVisitorPhoto: vi.fn().mockResolvedValue("/uploads/visitors/visitor_123.jpg"),
    };

    const result = await checkInGuest({
      input: {
        guestName: "Tamu Foto",
        guestPhone: "081234567890",
        purpose: "Interview",
        hostId: "host-1",
        guestPhoto: "data:image/jpeg;base64,samplebase64data",
      },
      visitRepository,
      ownerRepository,
      userRepository,
      notificationService,
      tokenService,
      storageService,
    });

    expect(storageService.saveVisitorPhoto).toHaveBeenCalledWith(
      "data:image/jpeg;base64,samplebase64data",
      "visitor"
    );
    expect(visitRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        guestPhotoUrl: "/uploads/visitors/visitor_123.jpg",
      })
    );
    expect(result).toEqual(mockVisitWithPhoto);
  });

  it("harus mendeteksi OWNER dan langsung memberi status APPROVED tanpa membuat action token", async () => {
    const mockOwner = {
      id: "owner-1",
      name: "Pak Bos",
      phoneNumber: "+6281234567890",
      isActive: true,
    };

    const mockOwnerVisit = {
      id: "visit-2",
      visitToken: "token-uuid-2",
      guestName: "Pak Bos",
      guestPhone: "+6281234567890",
      guestEmail: null,
      purpose: "Kunjungan kerja",
      visitorType: "OWNER",
      hostId: "host-1",
      status: "APPROVED",
    };

    const visitRepository = {
      create: vi.fn().mockResolvedValue(mockOwnerVisit),
    };
    const ownerRepository = {
      findActiveByPhone: vi.fn().mockResolvedValue(mockOwner), // terdeteksi sebagai owner
    };
    const userRepository = {
      findById: vi.fn().mockResolvedValue(mockHost),
    };
    const notificationService = {
      notifyHostOfVisit: vi.fn().mockResolvedValue(undefined),
    };
    const tokenService = {
      createHostActionToken: vi.fn(),
    };

    const result = await checkInGuest({
      input: {
        guestName: "Pak Bos",
        guestPhone: "+6281234567890",
        purpose: "Kunjungan kerja",
        hostId: "host-1",
      },
      visitRepository,
      ownerRepository,
      userRepository,
      notificationService,
      tokenService,
    });

    // Verifikasi status APPROVED dan visitorType OWNER
    expect(visitRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        visitorType: "OWNER",
        status: "APPROVED",
      })
    );

    // Untuk OWNER, TIDAK boleh membuat action token (tidak butuh approval)
    expect(tokenService.createHostActionToken).not.toHaveBeenCalled();

    // Notifikasi tetap dikirim (informational)
    expect(notificationService.notifyHostOfVisit).toHaveBeenCalledWith({
      visit: { ...mockOwnerVisit, host: mockHost },
      actionToken: null,
    });

    expect(result.status).toBe("APPROVED");
  });

  it("harus mengizinkan pengguna ber-role ADMINISTRATOR dengan status aktif sebagai host tujuan kunjungan", async () => {
    const mockAdminHost = {
      id: "admin-1",
      name: "Diah Fika Satrya",
      email: "satrya@tanimasresources.com",
      role: "ADMINISTRATOR",
      department: "Operasional",
      position: "Manajer Operasional",
      isDepartmentHead: true,
      isActive: true,
    };
    const mockVisit = {
      id: "visit-admin",
      visitToken: "token-admin",
      visitorType: "REGULAR",
      status: "PENDING",
    };
    const visitRepository = {
      create: vi.fn().mockResolvedValue(mockVisit),
    };
    const ownerRepository = {
      findActiveByPhone: vi.fn().mockResolvedValue(null),
    };
    const userRepository = {
      findById: vi.fn().mockResolvedValue(mockAdminHost),
    };
    const notificationService = {
      notifyHostOfVisit: vi.fn().mockResolvedValue(undefined),
    };
    const tokenService = {
      createHostActionToken: vi.fn().mockResolvedValue({ id: "tok-admin", token: "magic-admin" }),
    };

    const result = await checkInGuest({
      input: {
        guestName: "Vendor PT ABC",
        guestPhone: "081234567890",
        purpose: "Meeting",
        hostId: "admin-1",
      },
      visitRepository,
      ownerRepository,
      userRepository,
      notificationService,
      tokenService,
    });

    expect(result).toEqual(mockVisit);
    expect(notificationService.notifyHostOfVisit).toHaveBeenCalledWith({
      visit: expect.objectContaining({ host: mockAdminHost }),
      actionToken: expect.objectContaining({ token: "magic-admin" }),
    });
  });

  it("harus melempar error jika host tidak ditemukan atau tidak aktif", async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue({ ...mockHost, isActive: false }),
    };

    await expect(
      checkInGuest({
        input: {
          guestName: "Agus Tamu",
          guestPhone: "081234567890",
          purpose: "Meeting",
          hostId: "host-1",
        },
        visitRepository: {},
        ownerRepository: {},
        userRepository,
        notificationService: {},
        tokenService: {},
      })
    ).rejects.toThrow("Host tidak ditemukan atau tidak aktif");
  });

  it("harus melempar error jika input tidak lengkap sebelum mengakses database", async () => {
    await expect(
      checkInGuest({
        input: {
          guestName: "",
          guestPhone: "",
          purpose: "",
          hostId: "",
        },
        visitRepository: {},
        ownerRepository: {},
        userRepository: {},
        notificationService: {},
        tokenService: {},
      })
    ).rejects.toThrow();
  });

  it("harus memperlakukan mantan owner yang sudah dinonaktifkan (isActive: false) sebagai tamu REGULAR", async () => {
    const mockVisit = {
      id: "visit-regular",
      visitorType: "REGULAR",
      status: "PENDING",
    };

    const visitRepository = {
      create: vi.fn().mockResolvedValue(mockVisit),
    };
    // findActiveByPhone mengembalikan null jika owner isActive: false
    const ownerRepository = {
      findActiveByPhone: vi.fn().mockResolvedValue(null),
    };
    const userRepository = {
      findById: vi.fn().mockResolvedValue(mockHost),
    };
    const notificationService = {
      notifyHostOfVisit: vi.fn().mockResolvedValue(),
    };
    const tokenService = {
      createHostActionToken: vi.fn().mockResolvedValue({ id: "tok-1", token: "magic-1" }),
    };

    const result = await checkInGuest({
      input: {
        guestName: "Mantan Komisaris",
        guestPhone: "081234567890",
        purpose: "Konsultasi",
        hostId: "host-1",
      },
      visitRepository,
      ownerRepository,
      userRepository,
      notificationService,
      tokenService,
    });

    expect(ownerRepository.findActiveByPhone).toHaveBeenCalledWith("+6281234567890");
    // Karena nonaktif, visitorType harus REGULAR, bukan OWNER!
    expect(visitRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        visitorType: "REGULAR",
        status: "PENDING",
      })
    );
    expect(tokenService.createHostActionToken).toHaveBeenCalledWith("visit-regular");
    expect(result.status).toBe("PENDING");
  });

  it("harus menormalisasi format nomor HP dengan spasi dan strip (0812-3456-7890) menjadi E.164 (+6281234567890)", async () => {
    const visitRepository = {
      create: vi.fn().mockResolvedValue({ id: "v-1", status: "PENDING" }),
    };
    const ownerRepository = {
      findActiveByPhone: vi.fn().mockResolvedValue(null),
    };
    const userRepository = {
      findById: vi.fn().mockResolvedValue(mockHost),
    };
    const notificationService = {
      notifyHostOfVisit: vi.fn().mockResolvedValue(),
    };
    const tokenService = {
      createHostActionToken: vi.fn().mockResolvedValue({ token: "tok" }),
    };

    await checkInGuest({
      input: {
        guestName: "Tamu Test",
        guestPhone: "0812-3456-7890", // format dengan strip
        purpose: "Meeting",
        hostId: "host-1",
      },
      visitRepository,
      ownerRepository,
      userRepository,
      notificationService,
      tokenService,
    });

    // Verifikasi pencarian owner dan penyimpanan ke DB sudah dalam format +6281234567890
    expect(ownerRepository.findActiveByPhone).toHaveBeenCalledWith("+6281234567890");
    expect(visitRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        guestPhone: "+6281234567890",
      })
    );
  });
});
