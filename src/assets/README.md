# Frontend Bundled Assets (`/src/assets`)

Folder ini digunakan jika Anda ingin mengimpor aset secara langsung ke dalam komponen React (misalnya file SVG sebagai komponen React atau gambar yang ingin diproses oleh webpack/turbopack bundler).

## Contoh Penggunaan:
```jsx
import appLogo from "@/assets/logo.svg";

export default function Header() {
  return <img src={appLogo.src} alt="App Logo" />;
}
```

> **Catatan:** Untuk gambar dan icon statis umum yang ingin diakses langsung via URL browser (misalnya `/assets/logos/logo.png`), lebih disarankan ditaruh di folder [`public/assets/`](file:///d:/guest-app/public/assets).
