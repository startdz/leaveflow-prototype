# Leaveflow — Prototype pengajuan cuti

Prototype SPA pengajuan cuti karyawan dengan Next.js App Router, TypeScript, Tailwind CSS v4, Base UI, dan penyimpanan JSON lokal.

## Fitur

- 10 user demo: 1 admin, 1 manager/atasan, 8 employee (pilih user melalui dropdown di header; tidak ada login sungguhan).
- Employee: membuat, mengubah, menghapus pengajuan berstatus pending.
- Manager/admin: melihat semua pengajuan, menyetujui atau menolak pengajuan pending, menambahkan catatan peninjauan.
- Peringatan rentang cuti yang tumpang tindih dengan pengajuan karyawan lain saat membuat/mengubah pengajuan. Peringatan tidak memblokir submit.
- Ringkasan jumlah karyawan, pengajuan pending/disetujui, cuti hari ini, dan laporan per karyawan.
- Data awal ada di `data/users.json` dan `data/leaves.json`; mutasi cuti ditulis kembali ke `data/leaves.json`.
- Date picker memakai pola komposisi shadcn/ui Base UI (Popover) + React Day Picker.

## Jalankan

Memerlukan Node.js 20.9+ (disarankan Node.js 22/24).

```bash
pnpm install
pnpm dev
```

Buka http://localhost:3000.

Untuk build production:

```bash
pnpm build
pnpm start
```

## User demo

| Role | User | Email |
|---|---|---|
| Admin | Nadia Putri | nadia.admin@demo.local |
| Manager | Andi Pratama | andi.manager@demo.local |
| Employee | Fuad Dzakwan | fuad.employee@demo.local |
| Employee | Rina Maharani | rina.employee@demo.local |
| Employee | Bima Saputra | bima.employee@demo.local |
| Employee | Siti Aulia | siti.employee@demo.local |
| Employee | Dimas Kurniawan | dimas.employee@demo.local |
| Employee | Nabila Zahra | nabila.employee@demo.local |
| Employee | Rizky Firmansyah | rizky.employee@demo.local |
| Employee | Maya Lestari | maya.employee@demo.local |

## Catatan prototype

- JSON file adalah database demo untuk satu proses/server. Ini bukan pilihan database production: concurrent writes dapat saling menimpa dan file lokal umumnya tidak persisten pada deployment serverless.
- Role switching hanya simulasi UI. Endpoint punya pemeriksaan dasar untuk role/ownership, tetapi actor ID berasal dari client; jangan dipakai sebagai autentikasi/otorisasi production.
- Untuk deploy production, ganti JSON dengan PostgreSQL dan tambahkan session/auth yang tervalidasi di server.
- Hindari menjalankan beberapa instance aplikasi sekaligus saat menulis `data/leaves.json`.

## Stack dan referensi

- Next.js App Router + Route Handlers: https://nextjs.org/docs/app
- SPA guide: https://nextjs.org/docs/app/guides/single-page-applications
- shadcn/ui Base UI Date Picker: https://ui.shadcn.com/docs/components/base/date-picker
- shadcn/ui Base UI Calendar: https://ui.shadcn.com/docs/components/base/calendar
