# Frontend Static Assets (`/public/assets`)

Folder ini digunakan untuk menyimpan aset statis front-end yang dapat diakses langsung oleh browser melalui URL `/assets/...` tanpa perlu melalui module bundler.

## Struktur Direktori:

```
public/assets/
├── images/        # Foto, banner, ilustrasi background, dll.
├── icons/         # Icon SVG, favicon kustom, dll.
└── logos/         # Logo perusahaan, logo aplikasi, badge identitas, dll.
```

## Cara Penggunaan di Next.js:

### 1. Menggunakan komponen `next/image`:
```jsx
import Image from "next/image";

export default function MyComponent() {
  return (
    <Image
      src="/assets/logos/logo.png"
      alt="Guest App Logo"
      width={120}
      height={40}
    />
  );
}
```

### 2. Menggunakan tag HTML biasa `<img>`:
```jsx
<img src="/assets/icons/check.svg" alt="Success Icon" className="w-6 h-6" />
```

### 3. Menggunakan CSS background:
```css
background-image: url('/assets/images/bg-pattern.svg');
```
