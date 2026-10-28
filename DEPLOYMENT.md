# Hosting Stark Laundry

GitHub menyimpan source code project. Halaman GitHub Pages tidak dapat menjalankan PHP atau mengakses MySQL, jadi project lengkap harus dijalankan dari web hosting yang mendukung PHP dan MySQL/MariaDB.

## Kebutuhan server

- PHP 8+ dengan ekstensi PDO MySQL dan mbstring.
- MySQL atau MariaDB.
- Web root diarahkan ke folder project ini agar halaman dan folder `api/` berada pada domain yang sama. Aplikasi menggunakan sesi login PHP dan request API relatif, jadi jangan memisahkan UI ke GitHub Pages.

## Konfigurasi database

1. Buat database dan akun MySQL khusus untuk aplikasi di panel hosting.
2. Import `database/schema.sql`, lalu `database/seed-admins.sql` dan `database/002_rewards_and_catalog.sql`.
3. Atur environment variable berikut di panel hosting: `STARK_DB_HOST`, `STARK_DB_NAME`, `STARK_DB_USER`, dan `STARK_DB_PASSWORD`.
4. Atur password Admin melalui `database/setup-admins.php` menggunakan terminal server hosting. Jangan gunakan password database lokal XAMPP di server publik.
5. Buka halaman login lewat domain HTTPS dan pastikan akses kamera diizinkan browser.

Simpan kredensial hanya di konfigurasi rahasia hosting. Jangan masukkan file `.env` atau password ke GitHub.
