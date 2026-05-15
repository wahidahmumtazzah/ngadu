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
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ngadu_db
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_UPLOADS_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
SUPER_ADMIN_EMAIL=owner@ngadu.local
SUPER_ADMIN_PASSWORD=owner123
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

## Firebase Authentication

- Login, registrasi email/password, verifikasi email, reset password, dan session handling sekarang memakai Firebase Authentication.
- Backend memverifikasi Firebase ID token dengan Firebase Admin SDK.
- Tetap ada database user internal untuk role, organisasi, dan scoping multi-tenant.

## Catatan

- Foto laporan disimpan di folder `uploads/`.
- Jika laporan dikirim sebagai anonim, admin hanya melihat label `Anonim`.
- User bisa login untuk melihat dashboard pribadi setelah email Firebase diverifikasi dan instansinya aktif.
- Verifikasi email organisasi sekarang mengikuti email verification Firebase pada akun admin organisasi.
