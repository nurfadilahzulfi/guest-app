import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Buku Tamu Digital & Check-In Mandiri Tanimas Resources International",
  description: "Sistem registrasi dan check-in mandiri tamu dengan verifikasi visual dan notifikasi instan ke Host.",
  icons: {
    icon: "/assets/logos/tanimas-logo.png",
    shortcut: "/assets/logos/tanimas-logo.png",
    apple: "/assets/logos/tanimas-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
