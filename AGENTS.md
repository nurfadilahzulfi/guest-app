# AGENTS.md — Guest App

> Catatan: file ini melengkapi panduan framework Next.js yang sudah otomatis digenerate oleh `create-next-app` di bagian atas `AGENTS.md`. Jangan hapus bagian itu — tempelkan konten di bawah ini setelahnya. Bagian di bawah ini adalah **konteks bisnis dan arsitektur wajib** untuk project Guest App, dan mengikat untuk setiap task coding di repo ini.

## 1. Ringkasan Proyek

Guest App adalah sistem manajemen tamu berbasis web: tamu scan QR statis di pos security, isi form check-in lewat browser sendiri (tanpa akun), pilih host tujuan, lalu sistem otomatis mendeteksi jenis tamu (owner/biasa) dan mengarahkan notifikasi ke host yang tepat lewat email. Aplikasi ini berdiri sendiri, tidak terintegrasi ke HRIS internal. Tidak ada peran Security dalam sistem ini.

## 2. Arsitektur: Clean Architecture (WAJIB)

Setiap fitur baru **harus** mengikuti pemisahan layer ini. Jangan menaruh logic bisnis di dalam route handler atau komponen React — route handler hanya boleh jadi "pintu masuk" tipis yang memanggil use case.

```
src/
  domain/
    entities/              # Aturan & bentuk data inti, tidak boleh import Prisma/Next.js apa pun
      visit.js
      user.js
      owner.js
    value-objects/
      phone-number.js       # normalizePhoneNumber() — lihat Bagian 8
    repositories/          # Kontrak/interface saja (dokumentasi bentuk objek via JSDoc), TANPA implementasi
      visit-repository.js
      user-repository.js
      owner-repository.js

  application/
    use-cases/              # Satu file = satu aksi bisnis. Isinya orkestrasi, bukan detail teknis (SQL, HTTP, dll)
      check-in-guest.js
      respond-to-visit.js
      invite-user.js
      manage-host-directory.js
      manage-owner-list.js
    services/                # Kontrak untuk hal lintas-fitur
      notification-service.js
      token-service.js

  infrastructure/            # Implementasi konkret dari kontrak di domain/application
    prisma/
      client.js
    repositories/
      prisma-visit-repository.js
      prisma-user-repository.js
      prisma-owner-repository.js
    notifications/
      email-notification-service.js   # lihat Bagian 13
    tokens/
      crypto-token-service.js
    auth/
      auth-options.js                  # konfigurasi Auth.js — lihat Bagian 7

  app/                        # Next.js App Router (WAJIB tetap di sini karena konvensi Next.js)
    api/
      auth/[...nextauth]/route.js
      visits/route.js
      visits/status/[token]/route.js
      visits/respond/[token]/route.js
      hosts/route.js
      owners/route.js
      users/invite/route.js
    status/[token]/page.js
    respond/[token]/page.js
    login/page.js
    dashboard/...
```

**Aturan Ketergantungan (Dependency Rule):** panah ketergantungan selalu mengarah ke dalam.
`app/` (route handler) → memanggil → `application/use-cases/` → bergantung pada kontrak di → `domain/repositories/` dan `application/services/`. Implementasi konkretnya (`infrastructure/`) di-inject ke use case saat dipanggil dari route handler — use case sendiri **tidak pernah** mengimpor Prisma langsung.

### Contoh pola yang benar

```js
// src/application/use-cases/check-in-guest.js
import { normalizePhoneNumber } from "@/domain/value-objects/phone-number";

/**
 * Memproses check-in tamu: normalisasi nomor HP, deteksi owner, buat visit, kirim notifikasi.
 * @param {Object} params
 * @param {{guestName: string, guestPhone: string, purpose: string, guestEmail?: string, hostId: string}} params.input
 * @param {import('@/domain/repositories/visit-repository').VisitRepository} params.visitRepository
 * @param {import('@/domain/repositories/owner-repository').OwnerRepository} params.ownerRepository
 * @param {import('@/application/services/notification-service').NotificationService} params.notificationService
 * @returns {Promise<Object>} visit yang baru dibuat
 */
export async function checkInGuest({ input, visitRepository, ownerRepository, notificationService }) {
  const guestPhone = normalizePhoneNumber(input.guestPhone);
  const owner = await ownerRepository.findActiveByPhone(guestPhone);
  const visitorType = owner ? "OWNER" : "REGULAR";
  const status = visitorType === "OWNER" ? "APPROVED" : "PENDING";

  const visit = await visitRepository.create({ ...input, guestPhone, visitorType, status });
  await notificationService.notifyHostOfVisit(visit);

  return visit;
}
```

```js
// src/app/api/visits/route.js — route handler cuma "pintu masuk", TIDAK ada logic bisnis di sini
import { checkInGuest } from "@/application/use-cases/check-in-guest";
import { prismaVisitRepository } from "@/infrastructure/repositories/prisma-visit-repository";
import { prismaOwnerRepository } from "@/infrastructure/repositories/prisma-owner-repository";
import { emailNotificationService } from "@/infrastructure/notifications/email-notification-service";

export async function POST(request) {
  const input = await request.json();
  const visit = await checkInGuest({
    input,
    visitRepository: prismaVisitRepository,
    ownerRepository: prismaOwnerRepository,
    notificationService: emailNotificationService,
  });
  return Response.json({ visitToken: visit.visitToken });
}
```

Kenapa dipisah begini: kalau nanti provider email diganti, atau ORM diganti, cukup ubah file di `infrastructure/` — `application/use-cases/` dan `domain/` sama sekali tidak perlu disentuh.

## 3. Tech Stack & Konvensi

- **JavaScript murni** (bukan TypeScript) — semua file `.js`/`.jsx`, tidak ada `.ts`/`.tsx`.
- Gunakan **JSDoc** pada setiap fungsi yang di-export dari `domain/`, `application/`, dan `infrastructure/` — pengganti type-safety karena tidak pakai TypeScript.
- Next.js App Router, kode di dalam `src/`, import alias `@/*`.
- Styling: Tailwind CSS saja — jangan tambahkan CSS module atau styled-components.
- ORM: Prisma + PostgreSQL, schema di `prisma/schema.prisma`.
- Satu file = satu tanggung jawab. Kalau sebuah use-case file lebih dari ~100 baris, kemungkinan besar dia melakukan lebih dari satu hal — pecah jadi beberapa use case atau ekstrak helper ke `domain/`.
- Penamaan: use case pakai kata kerja (`checkInGuest`, `respondToVisit`, bukan `visitService`).
- Komentar/docstring JSDoc ditulis dalam Bahasa Indonesia; nama variabel/fungsi tetap Bahasa Inggris.

## 4. Aktor & Matriks Kapabilitas

| Kapabilitas | Tamu | Host | Admin HRD | Administrator |
|---|:---:|:---:|:---:|:---:|
| Check-in mandiri | ✅ | – | – | – |
| Approve/reject kunjungan tamu biasa | – | ✅ | ❌ | ❌ |
| Melihat riwayat kunjungan miliknya sendiri | – | ✅ | – | – |
| Melihat riwayat SELURUH kunjungan | ❌ | ❌ | ✅ (read-only) | ✅ |
| Menerima CC notifikasi ke Department Head | – | – | ✅ | ✅ |
| Kelola direktori host (CRUD) | ❌ | ❌ | ❌ | ✅ |
| Kelola daftar owner (CRUD) | ❌ | ❌ | ❌ | ✅ |
| Mengundang user baru | ❌ | ❌ | ❌ | ✅ |

Tidak ada peran Security. Tidak ada self-registration dalam bentuk apa pun — user hanya dibuat lewat invite oleh ADMINISTRATOR.

## 5. Matriks Routing Notifikasi (WAJIB diikuti persis)

| Jenis Kunjungan | Level Host | Penerima | Tipe Notifikasi |
|---|---|---|---|
| OWNER | Staf biasa | Host saja | Informational |
| OWNER | Department Head | Host + semua ADMIN_HRD + semua ADMINISTRATOR | Informational |
| REGULAR | Staf biasa | Host saja | Actionable (approve/reject) |
| REGULAR | Department Head | Host + semua ADMIN_HRD + semua ADMINISTRATOR | Actionable (approve/reject) |

## 6. Model Data (Prisma)

```prisma
enum UserRole {
  HOST
  ADMIN_HRD
  ADMINISTRATOR
}

enum VisitorType {
  REGULAR
  OWNER
}

enum VisitStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id               String   @id @default(uuid())
  name             String
  email            String   @unique
  passwordHash     String?  // null sampai user aktivasi lewat invite; selalu di-hash, tidak pernah plain text
  role             UserRole
  department       String?  // wajib diisi (di level aplikasi) jika role = HOST
  position         String?  // wajib diisi (di level aplikasi) jika role = HOST
  photoUrl         String?  // wajib diisi (di level aplikasi) jika role = HOST
  isDepartmentHead Boolean  @default(false)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())

  visitsAsHost     Visit[]        @relation("HostVisits")
  inviteTokens     InviteToken[]
}

model Owner {
  id          String   @id @default(uuid())
  name        String
  phoneNumber String   @unique // WAJIB sudah dalam format ternormalisasi, lihat Bagian 8
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Visit {
  id           String       @id @default(uuid())
  visitToken   String       @unique @default(uuid())
  guestName    String
  guestPhone   String       // WAJIB sudah dalam format ternormalisasi, lihat Bagian 8
  guestEmail   String?
  purpose      String
  visitorType  VisitorType
  hostId       String
  host         User         @relation("HostVisits", fields: [hostId], references: [id])
  status       VisitStatus  @default(PENDING)
  hostReply    String?
  createdAt    DateTime     @default(now())
  respondedAt  DateTime?

  actionTokens HostActionToken[]
}

model HostActionToken {
  id        String    @id @default(uuid())
  token     String    @unique @default(uuid())
  visitId   String
  visit     Visit     @relation(fields: [visitId], references: [id])
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())
}

model InviteToken {
  id        String    @id @default(uuid())
  token     String    @unique @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())
}

// Tambahan model Session/Account/VerificationToken untuk Auth.js Prisma Adapter —
// cek dokumentasi resmi Auth.js untuk skema adapter Prisma versi terbaru sebelum menambahkan,
// karena field-nya bisa berubah antar versi.
```

## 7. Autentikasi & Otorisasi

- Menggunakan **Auth.js (NextAuth v5)** dengan **Credentials Provider** (email + password) — bukan OAuth, karena tidak ada self-registration; hanya user yang sudah diaktivasi lewat invite yang bisa login.
- Session strategy: **database**, menggunakan **Prisma Adapter** dari Auth.js. Alasan: kalau Administrator menonaktifkan user (`isActive = false`), sesi yang tersimpan di database bisa langsung diinvalidasi, sehingga akses hilang seketika — berbeda dari JWT stateless yang tetap valid sampai kedaluwarsa meski user sudah dinonaktifkan.
- Password di-hash dengan `bcrypt` atau `argon2` sebelum disimpan ke `User.passwordHash` — tidak pernah disimpan plain text.
- `src/proxy.js` (konvensi Next.js 16, sebelumnya `src/middleware.js`) memproteksi seluruh route di bawah `/dashboard` — redirect ke `/login` kalau belum ada sesi valid.
- Proxy hanya mengecek "sudah login atau belum" — otorisasi per-role WAJIB tetap divalidasi ulang di setiap route handler (lihat Bagian 9, aturan #6). Jangan andalkan proxy untuk itu.
- Login hanya untuk role HOST, ADMIN_HRD, ADMINISTRATOR. Tamu tidak pernah melalui sistem auth ini — identitasnya cukup lewat `visitToken`.
- Konfigurasi Auth.js ditaruh di `infrastructure/auth/auth-options.js`, bukan langsung di route handler — konsisten dengan pemisahan Clean Architecture di Bagian 2.

## 8. Normalisasi Nomor HP (WAJIB)

Nomor HP tamu maupun owner bisa masuk dalam berbagai format (`08123456789`, `+628123456789`, `628123456789`, dengan spasi/strip). Tanpa normalisasi konsisten, pencocokan owner **bisa gagal total** karena `08123456789` dan `+628123456789` dianggap dua nilai berbeda meski nomornya sama.

```js
// src/domain/value-objects/phone-number.js

/**
 * Menormalisasi nomor HP Indonesia ke format E.164 (+62xxxxxxxxxx).
 * WAJIB dipanggil di titik input mana pun sebelum nomor HP disimpan atau dicocokkan —
 * baik saat Administrator menambah nomor Owner, maupun saat tamu check-in.
 * @param {string} rawPhone
 * @returns {string} nomor HP ternormalisasi
 * @throws {Error} jika format tidak dikenali/tidak valid
 */
export function normalizePhoneNumber(rawPhone) {
  const digitsOnly = rawPhone.replace(/[^\d+]/g, "");
  let normalized = digitsOnly;

  if (normalized.startsWith("0")) {
    normalized = "+62" + normalized.slice(1);
  } else if (normalized.startsWith("62")) {
    normalized = "+" + normalized;
  } else if (!normalized.startsWith("+62")) {
    throw new Error("Format nomor HP tidak dikenali");
  }

  if (!/^\+628\d{8,11}$/.test(normalized)) {
    throw new Error("Nomor HP tidak valid");
  }

  return normalized;
}
```

- Fungsi ini tinggal di `domain/` karena murni logic, tidak bergantung framework apa pun.
- WAJIB dipanggil di use case `checkInGuest` (sebelum mencocokkan ke tabel Owner) dan di use case pembuatan/pengeditan `Owner` — supaya data yang tersimpan di database **selalu** sudah dalam format ternormalisasi, tidak pernah format mentah dari input user.

## 9. Aturan Bisnis Kritis (Jangan Pernah Dilanggar)

1. `visitorType` WAJIB selalu dihitung ulang di server (cocokkan `guestPhone` ke `Owner.phoneNumber`, `isActive: true`). Jangan pernah percaya `visitorType` dari body request klien meskipun dikirim.
2. Semua token (`HostActionToken`, `InviteToken`) sekali pakai. Validasi (`usedAt` null, `expiresAt` belum lewat) dan eksekusi (set `usedAt`) WAJIB dalam satu `prisma.$transaction` untuk mencegah race condition.
3. Membuka halaman magic link lewat GET tidak boleh mengubah data apa pun. Perubahan status hanya terjadi saat submit (POST) eksplisit.
4. Routing notifikasi WAJIB mengikuti matriks di Bagian 5, tanpa pengecualian.
5. Tidak ada endpoint pendaftaran akun publik dalam bentuk apa pun. User baru hanya dibuat lewat endpoint invite oleh role ADMINISTRATOR.
6. Setiap endpoint yang membatasi akses per role WAJIB memvalidasi role di server (session check), bukan hanya menyembunyikan tombol di UI.
7. Tidak ada integrasi WhatsApp. Notifikasi hanya lewat email.
8. Menonaktifkan host/user selalu soft delete (`isActive = false`) — jangan pernah hard delete data yang sudah berelasi dengan `Visit`.
9. Perubahan pada daftar `Owner` tidak berlaku surut — `Visit` yang sudah dibuat sebelumnya tidak boleh berubah `visitorType`-nya meski daftar owner diedit belakangan.
10. Nomor HP WAJIB dinormalisasi lewat `normalizePhoneNumber()` (Bagian 8) sebelum disimpan atau dicocokkan — tidak ada pengecualian.
11. Password user tidak pernah disimpan plain text — selalu di-hash sebelum masuk ke `passwordHash`.

## 10. State Machine

**Visit.status**: `PENDING → APPROVED` atau `PENDING → REJECTED` (hanya untuk `visitorType = REGULAR`, lewat submit token valid). `OWNER` dibuat langsung `APPROVED`, tidak lewat `PENDING`. Tidak ada transisi balik.

**Token** (`HostActionToken` / `InviteToken`): valid jika `usedAt === null && expiresAt > now`. Sekali dipakai atau kedaluwarsa, ditolak permanen.

## 11. API Surface

| Method & Path | Role | Deskripsi |
|---|---|---|
| `* /api/auth/[...nextauth]` | — | Ditangani Auth.js (login, logout, session) |
| `POST /api/visits` | Tamu | Check-in, hitung visitorType, buat notifikasi |
| `GET /api/visits/status/[visitToken]` | Tamu | Polling status |
| `GET/POST /api/visits/respond/[token]` | Host | Validasi token, tampilkan/submit approve-reject |
| `GET /api/visits` | Admin HRD, Administrator | List seluruh riwayat (read-only) |
| `POST/PATCH /api/hosts` | Administrator | CRUD direktori host |
| `POST/PATCH /api/owners` | Administrator | CRUD daftar owner |
| `POST /api/users/invite` | Administrator | Undang user baru |
| `GET/POST /api/invite/[token]` | User diundang | Validasi token, set password |

## 12. Dashboard — Detail Fitur

**Host Dashboard** (opsional, login sendiri):
- List kunjungan yang ditujukan ke dirinya (paginated), filter status & tanggal.
- Detail satu kunjungan: data tamu, status, catatan/alasan yang pernah dia berikan.
- Tidak ada akses lihat kunjungan host lain.

**Admin HRD Dashboard**:
- Tabel seluruh kunjungan (semua host), filter: rentang tanggal, host, departemen, status, jenis kunjungan.
- Read-only — tidak ada tombol aksi apa pun di halaman ini.

**Administrator Dashboard**:
- Semua yang dilihat Admin HRD, ditambah:
  - Manajemen direktori host (list, tambah, edit, nonaktifkan), dengan pencarian/filter departemen.
  - Manajemen daftar owner (list, tambah, nonaktifkan).
  - Manajemen user (list, undang baru, nonaktifkan) — menampilkan role dan status aktif setiap user.

## 13. Email Provider

- Rekomendasi: **Resend** — API modern, deliverability baik untuk email transaksional (magic link, invite), integrasi resmi tersedia untuk Next.js, ada dukungan template lewat React Email.
- Alternatif: **Nodemailer + SMTP** kalau perusahaan sudah punya server email sendiri dan mau memakai domain email korporat langsung tanpa provider pihak ketiga.
- Implementasi diisolasi total di `infrastructure/notifications/email-notification-service.js` — kalau provider ini diganti nanti, tidak ada file di `application/` atau `domain/` yang perlu disentuh.

## 14. Isu Terbuka (JANGAN diasumsikan sepihak oleh agent — tanyakan ke developer)

1. Fallback tamu tanpa smartphone (belum ada jalur alternatif sejak Security dihapus).
2. Kebijakan timeout/eskalasi jika host tidak merespons magic link.
3. Apakah host boleh merevisi keputusan approve/reject setelah submit.
4. Penanganan Visit berstatus PENDING saat host-nya dinonaktifkan di tengah jalan.
5. Kebijakan retensi data pribadi tamu (terkait UU PDP No. 27/2022).
6. Platform deployment final (belum diputuskan).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
