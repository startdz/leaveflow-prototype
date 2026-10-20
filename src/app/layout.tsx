import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Leaveflow — Leave management",
  description: "Prototype pengajuan cuti karyawan.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
