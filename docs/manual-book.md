# Manual Book — Guest App
### Sistem Manajemen Tamu Berbasis Web

**Versi**: 1.0  
**Terakhir diperbarui**: September 2026  
**Dikembangkan oleh**: Tim IT

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Gambaran Umum Sistem](#2-gambaran-umum-sistem)
3. [Panduan Tamu (Pengunjung)](#3-panduan-tamu-pengunjung)
4. [Panduan Host (Karyawan)](#4-panduan-host-karyawan)
5. [Panduan Admin HRD](#5-panduan-admin-hrd)
6. [Panduan Administrator](#6-panduan-administrator)
7. [Fitur Keamanan Akun](#7-fitur-keamanan-akun)
8. [FAQ & Troubleshooting](#8-faq--troubleshooting)

---

## 1. Pendahuluan

**Guest App** adalah sistem manajemen kunjungan tamu berbasis web yang dirancang untuk menggantikan proses pencatatan tamu secara manual. Sistem ini memungkinkan tamu melakukan check-in secara mandiri menggunakan smartphone mereka sendiri, sementara karyawan (host) menerima notifikasi otomatis dan dapat menyetujui atau menolak kunjungan dari mana saja melalui email.

### Tujuan Sistem

- Mempercepat proses check-in tamu tanpa antrian
- Mengurangi penggunaan kertas (paperless)
- Memberikan notifikasi real-time kepada karyawan yang dituju
- Menyimpan riwayat seluruh kunjungan secara terstruktur
- Memberikan perlakuan khusus bagi tamu VIP (Owner)

### Pengguna Sistem

| Peran | Deskripsi |
|---|---|
| **Tamu** | Pengunjung eksternal yang melakukan check-in via QR Code |
| **Host** | Karyawan perusahaan yang menjadi tujuan kunjungan tamu |
| **Admin HRD** | Staf HRD yang memantau seluruh riwayat kunjungan |
| **Administrator** | Pengelola sistem dengan akses penuh |

---

## 2. Gambaran Umum Sistem

### Alur Kunjungan Secara Umum

```
Tamu tiba di kantor
       │
       ▼
Scan QR Code di pos security
       │
       ▼
Isi form check-in di smartphone
(nama, nomor HP, keperluan, pilih host)
       │
       ▼
Sistem mendeteksi jenis tamu:
  ┌────┴────┐
  │         │
Owner     Tamu Biasa
  │         │
  ▼         ▼
Otomatis  Notifikasi email
Disetujui dikirim ke Host
          │
          ▼
        Host Approve / Reject
        lewat link di email
          │
          ▼
       Tamu melihat
       status kunjungan
```

### Dua Jenis Tamu

| Jenis | Keterangan | Status Otomatis |
|---|---|---|
| **Owner / VIP** | Nomor HP terdaftar di daftar Owner | Langsung **Disetujui** |
| **Tamu Biasa** | Nomor HP tidak ada di daftar Owner | Perlu **persetujuan Host** |

---

## 3. Panduan Tamu (Pengunjung)

Tamu **tidak perlu membuat akun** apapun. Seluruh proses dilakukan melalui browser smartphone.

### 3.1 Cara Melakukan Check-In

**Langkah 1: Scan QR Code**

Temukan QR Code yang terpasang di area penerimaan / pos security. Buka aplikasi kamera smartphone dan arahkan ke QR Code tersebut. Browser akan terbuka secara otomatis.

**Langkah 2: Isi Form Check-In**

Isi seluruh informasi yang diminta:

| Field | Keterangan | Wajib? |
|---|---|---|
| Nama Lengkap | Nama tamu sesuai identitas | Ya |
| Nomor HP | Format: 08xx atau +628xx | Ya |
| Email | Untuk keperluan notifikasi | Opsional |
| Keperluan | Tujuan kunjungan singkat | Ya |
| Host yang Dituju | Pilih nama karyawan dari daftar | Ya |

> **Catatan Nomor HP**: Sistem secara otomatis mengenali format `08123456789`, `628123456789`, maupun `+628123456789` — semuanya akan dianggap sama.

**Langkah 3: Submit & Tunggu Konfirmasi**

Setelah form dikirim, tamu akan diarahkan ke **halaman status kunjungan**. Halaman ini menampilkan status terkini secara real-time:

- Menunggu — Host belum merespons
- Disetujui — Tamu dipersilakan masuk
- Ditolak — Kunjungan tidak dapat dilayani

### 3.2 Tamu VIP / Owner

Jika nomor HP tamu sudah terdaftar sebagai Owner, sistem akan **langsung menyetujui** kunjungan tanpa perlu menunggu respons dari Host. Status akan langsung berubah menjadi **Disetujui**.

### 3.3 Halaman Status Kunjungan

Setelah check-in, simpan atau bookmark URL halaman status. URL ini unik untuk setiap kunjungan dan dapat diakses kembali untuk melihat perkembangan status.

---

## 4. Panduan Host (Karyawan)

Host adalah karyawan yang dapat dipilih tamu sebagai tujuan kunjungan. Host memiliki akun login untuk mengakses dashboard pribadi.

### 4.1 Login ke Sistem

1. Buka browser dan akses URL aplikasi
2. Masukkan **Email** dan **Kata Sandi** yang diberikan Administrator
3. Klik **"Masuk"**

> **Pertama kali login**: Akun diaktifkan melalui link undangan yang dikirim ke email. Klik link tersebut dan buat kata sandi baru sebelum bisa login.

### 4.2 Menerima Notifikasi Kunjungan

Ketika ada tamu yang memilih Anda sebagai host, sistem akan mengirim **email notifikasi** ke alamat email akun Anda. Email berisi:

- Nama tamu
- Nomor HP tamu
- Keperluan kunjungan
- Waktu check-in
- Tombol **Setujui** dan **Tolak**

### 4.3 Menyetujui atau Menolak Kunjungan

**Cara 1: Lewat Email (Disarankan)**

1. Buka email notifikasi dari sistem
2. Baca informasi tamu
3. Klik **"Setujui Kunjungan"** atau **"Tolak Kunjungan"**
4. Anda akan diarahkan ke halaman konfirmasi di browser
5. Tambahkan catatan/alasan (opsional), lalu klik **Kirim**

> **Perhatian**: Link approve/reject di email hanya berlaku **satu kali** dan memiliki batas waktu. Jika sudah kedaluwarsa, minta tamu untuk melakukan check-in ulang.

**Cara 2: Lewat Dashboard**

1. Login ke aplikasi
2. Buka menu **Riwayat Kunjungan**
3. Kunjungan dengan status "Menunggu" dapat ditindaklanjuti dari sana

### 4.4 Dashboard Riwayat Kunjungan

Host dapat melihat seluruh riwayat kunjungan yang ditujukan kepada dirinya:

- **Filter** berdasarkan status (Menunggu / Disetujui / Ditolak)
- **Filter** berdasarkan rentang tanggal
- **Detail** setiap kunjungan: data tamu, waktu, keputusan yang pernah diberikan

> Host **tidak dapat** melihat kunjungan yang ditujukan ke host lain.

### 4.5 Lupa Kata Sandi

1. Di halaman login, klik **"Lupa kata sandi?"**
2. Masukkan alamat email akun Anda
3. Cek email — link reset akan dikirim (berlaku **10 menit**)
4. Klik link di email, lalu buat kata sandi baru
5. Login kembali dengan kata sandi yang baru

---

## 5. Panduan Admin HRD

Admin HRD memiliki semua kemampuan Host, ditambah akses untuk memantau seluruh kunjungan di semua host dan departemen.

### 5.1 Login

Sama seperti Host — gunakan email dan kata sandi akun Admin HRD.

### 5.2 Melihat Seluruh Riwayat Kunjungan

1. Login ke aplikasi
2. Buka menu **Riwayat Kunjungan**
3. Seluruh kunjungan dari semua host akan tampil

**Filter yang tersedia:**

| Filter | Keterangan |
|---|---|
| Rentang Tanggal | Pilih periode awal dan akhir |
| Host | Filter berdasarkan nama karyawan |
| Departemen | Filter berdasarkan departemen |
| Status | Menunggu / Disetujui / Ditolak |
| Jenis Tamu | Tamu Biasa / Owner |

> **Catatan**: Halaman ini bersifat **read-only**. Admin HRD tidak dapat mengubah status kunjungan.

### 5.3 Notifikasi CC

Jika host yang dituju adalah seorang **Kepala Departemen (Department Head)**, sistem secara otomatis mengirimkan salinan (CC) email notifikasi ke seluruh akun Admin HRD dan Administrator sebagai informasi.

---

## 6. Panduan Administrator

Administrator memiliki akses penuh terhadap seluruh fitur sistem.

### 6.1 Manajemen Direktori Karyawan

Menu: **Data Karyawan**

#### Menambah Karyawan Baru

1. Klik tombol **"Tambah Karyawan"**
2. Isi form:
   - **Nama Lengkap** — wajib diisi
   - **Email Perusahaan** — wajib, harus unik
   - **Departemen** — pilih dari daftar master
   - **Jabatan** — pilih dari daftar master
   - **Kata Sandi** — opsional, atau klik **"Acak Sandi Otomatis"**
   - **Kepala Departemen** — centang jika karyawan ini adalah Head
3. Klik **"Simpan Karyawan"**
4. Sistem mengirimkan email dengan kredensial login ke karyawan

> Setelah berhasil ditambahkan, sebuah pop-up menampilkan kata sandi yang di-generate. **Catat atau salin** sebelum menutupnya.

#### Mengedit Data Karyawan

1. Temukan karyawan di daftar (gunakan fitur pencarian atau filter departemen)
2. Klik ikon **Edit** pada baris karyawan
3. Ubah data yang diperlukan
4. Klik **"Simpan Perubahan"**

#### Menonaktifkan Karyawan

Karyawan yang tidak lagi aktif sebaiknya **dinonaktifkan** (bukan dihapus) agar riwayat kunjungan tetap terjaga.

1. Klik ikon **Toggle** pada baris karyawan
2. Konfirmasi tindakan

> Karyawan yang dinonaktifkan tidak dapat login dan tidak muncul sebagai pilihan host bagi tamu baru.

#### Kelola Data Master (Departemen & Jabatan)

Klik tombol **"Dept & Jabatan"** untuk mengelola daftar departemen dan jabatan yang tersedia.

### 6.2 Manajemen Daftar Owner / VIP

Menu: **Data Owner**

Owner adalah tamu yang kunjungannya **disetujui otomatis** tanpa perlu respons host.

#### Menambah Owner Baru

1. Klik tombol **"Tambah Owner"**
2. Isi:
   - **Nama Lengkap** — untuk identifikasi
   - **Nomor HP** — format `08xx`, `628xx`, atau `+628xx`
3. Klik **"Simpan Owner"**

#### Menonaktifkan Owner

1. Klik tombol **"Nonaktifkan"** pada baris owner
2. Konfirmasi tindakan

> Menonaktifkan owner tidak mengubah data kunjungan yang sudah ada sebelumnya. Tamu dengan nomor ini selanjutnya akan diperlakukan sebagai tamu biasa (REGULAR).

#### Menghapus Owner (Hapus Permanen)

Fitur ini dapat digunakan untuk membersihkan data testing atau entri yang keliru diinput.

1. Klik ikon **Hapus (Tempat Sampah)** berwarna merah pada baris owner.
2. Konfirmasi pop-up dialog yang muncul.
3. Data owner akan terhapus secara permanen dari database.

> **Catatan**: Berbeda dengan User/Host yang terikat riwayat kunjungan, data Owner aman untuk dihapus permanen (hard delete) karena tidak memiliki dependensi foreign key ke tabel riwayat kunjungan (`Visit`).

### 6.3 Manajemen User Sistem

Menu: **Manajemen User**

#### Mengundang User Baru

1. Klik tombol **"Undang User Baru"**
2. Isi:
   - **Email** — alamat email yang akan diundang
   - **Role** — Host / Admin HRD / Administrator
3. Klik **"Kirim Undangan"**

> Link aktivasi dikirim ke email. Jika kedaluwarsa, gunakan **"Kirim Ulang Undangan"**.

#### Menonaktifkan User

1. Klik ikon **Toggle** pada baris user
2. Konfirmasi tindakan

> Menonaktifkan user akan **langsung menginvalidasi sesi login** yang sedang aktif.

### 6.4 Melihat Seluruh Riwayat Kunjungan

Sama seperti Admin HRD — dapat melihat dan memfilter seluruh riwayat kunjungan dari semua host.

---

## 7. Fitur Keamanan Akun

### 7.1 Reset Kata Sandi

Fitur ini tersedia untuk **semua peran** (Host, Admin HRD, Administrator).

1. Di halaman login, klik **"Lupa kata sandi?"**
2. Masukkan email akun
3. Cek kotak masuk email — link reset dikirimkan
4. Klik link di email **(berlaku 10 menit)**
5. Masukkan kata sandi baru (minimal 8 karakter)
6. Konfirmasi kata sandi baru
7. Klik **"Simpan Kata Sandi Baru"**

> Link reset hanya dapat digunakan **satu kali**. Jika kedaluwarsa atau sudah pernah dipakai, ulangi dari langkah 1.

### 7.2 Aktivasi Akun via Undangan

Akun baru tidak dapat langsung login. Proses aktivasi:

1. Cek email undangan dari sistem
2. Klik link **"Aktifkan Akun Saya"** di email
3. Buat kata sandi baru (minimal 8 karakter)
4. Konfirmasi kata sandi
5. Klik **"Aktifkan Akun"**
6. Login dengan email dan kata sandi yang baru dibuat

### 7.3 Keamanan Sesi

- Sesi login disimpan di server (bukan hanya di browser)
- Jika Administrator menonaktifkan akun, sesi aktif langsung berakhir
- Tidak ada fitur self-registration — akun hanya dibuat melalui undangan dari Administrator

---

## 8. FAQ & Troubleshooting

### Masalah Umum Tamu

**Q: QR Code tidak terbaca oleh kamera saya.**  
A: Pastikan pencahayaan cukup dan kamera tidak terlalu dekat/jauh. Coba gunakan aplikasi kamera bawaan smartphone.

**Q: Saya tidak bisa menemukan nama host yang dituju.**  
A: Mungkin host tersebut belum terdaftar atau sedang nonaktif. Hubungi resepsionis untuk bantuan.

**Q: Status kunjungan saya masih "Menunggu" sudah lama.**  
A: Host mungkin sedang sibuk atau belum membuka email. Refresh halaman atau hubungi resepsionis.

**Q: Nomor HP saya tidak diterima sistem.**  
A: Pastikan format nomor HP adalah `08xxxxxxxxxx`, `628xxxxxxxxxx`, atau `+628xxxxxxxxxx`. Jangan gunakan tanda hubung atau spasi.

---

### Masalah Umum Host

**Q: Saya tidak menerima email notifikasi kunjungan.**  
A: Periksa folder **Spam / Junk** di email Anda. Tandai email dari sistem sebagai "Bukan Spam".

**Q: Link approve/reject di email tidak berfungsi.**  
A: Link mungkin sudah kedaluwarsa atau sudah pernah digunakan. Minta tamu untuk melakukan check-in ulang.

**Q: Saya tidak bisa login.**  
A: Pastikan email dan kata sandi benar. Gunakan fitur **"Lupa kata sandi?"** jika lupa. Jika akun dinonaktifkan, hubungi Administrator.

**Q: Saya ingin mengubah keputusan approve/reject yang sudah dikirim.**  
A: Keputusan yang sudah disubmit tidak dapat diubah melalui sistem. Hubungi Administrator jika terjadi kesalahan.

---

### Masalah Umum Administrator

**Q: Karyawan tidak bisa menerima email undangan.**  
A: Pastikan alamat email yang diinput sudah benar. Gunakan fitur **"Kirim Ulang Undangan"** di halaman manajemen user.

**Q: Bagaimana cara mengganti email karyawan?**  
A: Edit data karyawan melalui menu Data Karyawan, klik Edit, ubah field Email, lalu Simpan Perubahan.

**Q: Apakah owner yang dinonaktifkan bisa diaktifkan kembali?**  
A: Saat ini sistem hanya mendukung penonaktifan owner. Untuk mengaktifkan kembali, hubungi tim IT.

---

## Informasi Kontak & Dukungan

| | |
|---|---|
| **Tim IT** | it@tanimas.co.id |
| **Administrator Sistem** | Lihat daftar Administrator di panel manajemen user |

---

*Manual book ini adalah dokumen internal dan bersifat rahasia.*
