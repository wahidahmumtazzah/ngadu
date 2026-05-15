# NgaduAja

Web app modern untuk sistem pengaduan anonim dengan:

- `Next.js`
- `Tailwind CSS`
- `Node.js + Express`
- `MySQL`

Seluruh UI memakai bahasa Indonesia.

## Struktur Project

```text
ngadu/
├─ app/                # Halaman Next.js
├─ components/         # Komponen UI
├─ lib/                # Helper frontend
├─ public/             # Asset statis
├─ server/             # API Express
├─ uploads/            # File upload foto
├─ database/           # SQL schema
├─ .env.example
├─ package.json
└─ README.md
```

## Fitur

- Landing page modern
- Form pengaduan anonim + upload foto
- Dashboard user
- Dashboard admin
- Statistik dan grafik laporan
- CRUD laporan via API
- Autentikasi JWT sederhana

## Environment

Pakai satu file env di root project.

Salin:

```bash
copy .env.example .env
```

Isi `.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=ganti_dengan_secret_yang_aman
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ngadu_db
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_UPLOADS_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM=no-reply@example.com
```

## Menjalankan

### 1. Database

Buat database MySQL lalu import:

```sql
SOURCE database/schema.sql;
```

### 2. Install dependency

```bash
npm install
```

### 3. Jalankan app

Frontend dan backend sekaligus:

```bash
npm run dev
```

Atau per proses:

```bash
npm run dev:web
npm run dev:api
```

Jika environment Windows Anda bermasalah dengan `cmd.exe`, script `npm run dev`
di project ini sudah memakai launcher Node langsung, jadi tidak bergantung pada
`concurrently`.

## Akun Admin Default

- Email: `admin@ngadu.local`
- Password: `admin123`

## Catatan

- Foto laporan disimpan di folder `uploads/`.
- Jika laporan dikirim sebagai anonim, admin hanya melihat label `Anonim`.
- User bisa login untuk melihat dashboard pribadi.
- Jika `RESEND_API_KEY` dan `EMAIL_FROM` diisi, email verifikasi organisasi akan dikirim sungguhan.
- Jika belum diisi, mode development tetap mengembalikan link verifikasi agar flow bisa dites manual.
