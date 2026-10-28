# Database Stark Laundry

Starter database ini memakai MySQL/MariaDB dan PHP PDO. Untuk penggunaan lokal XAMPP:

1. Nyalakan **MySQL** di XAMPP Control Panel.
2. Import `schema.sql`, lalu import `seed-admins.sql` melalui phpMyAdmin.
3. Setelah database dan akun Admin tersedia, import juga `002_rewards_and_catalog.sql` melalui phpMyAdmin. File ini menambahkan katalog layanan awal, hadiah, saldo poin, dan tiket penukaran tanpa menghapus akun atau transaksi yang sudah ada.
4. Dari folder project, jalankan `C:\xampp\php\php.exe database\setup-admins.php` dan buat kata sandi untuk `adm_01` serta `adm_02` saat diminta.
5. Jalankan website melalui server PHP dari folder project: `C:\xampp\php\php.exe -S 127.0.0.1:8000 -t .`.
6. Buka `http://127.0.0.1:8000/login/login.html`. Jangan gunakan Live Server untuk halaman yang memanggil API PHP.

Konfigurasi bawaan API cocok untuk XAMPP lokal (`127.0.0.1`, database `stark_laundry`, user `root`, tanpa kata sandi). Jika konfigurasi database berbeda, atur environment variable `STARK_DB_HOST`, `STARK_DB_NAME`, `STARK_DB_USER`, dan `STARK_DB_PASSWORD`.

`setup-admins.php` hanya dapat dijalankan lewat terminal. Kata sandi Admin dibuat dengan `password_hash()` dan tidak disimpan dalam file SQL.

Poin member diberikan satu poin untuk setiap Rp1.000 pada pesanan yang berubah menjadi selesai. Pesanan yang sudah selesai sebelum pembaruan juga mendapat poin saat file `002_rewards_and_catalog.sql` diimpor. Penukaran hadiah diproses di server dalam satu transaksi dan saldo tidak dapat menjadi negatif.
