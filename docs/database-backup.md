# Database Backup

Backup database wajib disiapkan sebelum aplikasi dipakai sebagai sistem operasional.

## Prinsip

- Backup dibuat dari MySQL, bukan dari browser.
- Device tidak pernah diberi password database.
- File backup tidak boleh di-commit.
- Restore harus pernah diuji ke database lokal/staging.
- Untuk Google Drive, gunakan folder Google Drive Desktop atau `rclone` di server, bukan OAuth Drive di aplikasi web.
- Vercel tidak cocok menjadi tempat membuat file backup berkala karena runtime serverless tidak punya storage permanen dan tidak bisa menjaga proses scheduler jangka panjang.
- Otomatisasi backup dikerjakan di laptop/server operasional yang punya `MYSQL_DATABASE_URL`, `mysqldump`, dan akses ke folder Google Drive.

## Environment

Contoh env lokal/server:

```env
SOLAR_TANK_STORAGE_DRIVER="mysql"
MYSQL_DATABASE_URL="mysql://user:password@host:3306/database"
MYSQL_SSL_MODE="required"
MYSQL_BACKUP_OUTPUT_DIR="backups/mysql"
MYSQL_BACKUP_RETENTION_DAYS="90"
```

Untuk dua backup per bulan, retention 90 hari menyimpan kira-kira 6 file backup terakhir. Jika storage Drive kecil, gunakan 45 atau 60 hari.

Jika memakai Google Drive Desktop di Windows server/laptop operasional, arahkan `MYSQL_BACKUP_OUTPUT_DIR` ke folder yang tersinkronisasi, misalnya:

```env
MYSQL_BACKUP_OUTPUT_DIR="C:\Users\SolarTank\Google Drive\SolarTank Backups\mysql"
```

Pastikan folder tersebut tidak berada di dalam repository agar file `.sql` tidak ikut terdeteksi git.

## Membuat Backup Manual

Pastikan MySQL client tersedia dan perintah `mysqldump` bisa dipanggil dari terminal.

```powershell
pnpm db:backup:mysql
```

Output berupa file:

```text
solar_tank_mysql_YYYYMMDDTHHMMSSZ.sql
```

## Backup Otomatis ke Google Drive Desktop

Cara ini paling mudah untuk Windows karena Google Drive Desktop yang mengurus upload otomatis ke Google Drive.

1. Install MySQL client sampai command `mysqldump` bisa dipanggil dari PowerShell.
2. Install Google Drive Desktop dan login memakai akun Google Drive operasional.
3. Buat folder Drive khusus, misalnya `SolarTank Backups\mysql`.
4. Isi `.env.local` lokal/server dengan `MYSQL_BACKUP_OUTPUT_DIR` mengarah ke folder Drive tersebut.
5. Jalankan sekali:

```powershell
pnpm db:backup:mysql
```

6. Pastikan file `solar_tank_mysql_YYYYMMDDTHHMMSSZ.sql` muncul di folder Drive.
7. Tunggu status Google Drive Desktop sampai file selesai tersinkron.
8. Baru jadwalkan otomatis lewat Task Scheduler.

Gunakan script ini untuk Task Scheduler:

```text
scripts/run-mysql-backup-task.ps1
```

Contoh Task Scheduler Windows:

```text
Program/script:
powershell.exe

Arguments:
-NoProfile -ExecutionPolicy Bypass -File "D:\path\solar-tank-monitoring-system\scripts\run-mysql-backup-task.ps1"

Start in:
D:\path\solar-tank-monitoring-system
```

Jadwal yang disarankan:

- tanggal 1 pukul 02.00;
- tanggal 15 pukul 02.00;
- jalankan ulang manual sebelum migration besar, reset massal, atau cleanup data besar.

Log backup otomatis akan dibuat di:

```text
backups/logs/mysql_backup_YYYYMMDDTHHMMSSZ.log
```

## Backup Otomatis ke Google Drive via rclone

Gunakan `rclone` jika backup dijalankan di server/headless tanpa Google Drive Desktop.

1. Install `rclone`.
2. Buat remote Google Drive:

```powershell
rclone config
```

3. Buat folder output lokal, misalnya:

```env
MYSQL_BACKUP_OUTPUT_DIR="backups/mysql"
```

4. Jadwalkan backup, lalu sync hasilnya ke Drive:

```powershell
pnpm db:backup:mysql
rclone copy ".\backups\mysql" "gdrive:SolarTank Backups/mysql" --include "solar_tank_mysql_*.sql" --drive-use-trash=false
```

Jika memakai Linux server, gunakan cron:

```cron
0 2 1,15 * * cd /srv/solar-tank-monitoring-system && pnpm db:backup:mysql && rclone copy ./backups/mysql "gdrive:SolarTank Backups/mysql" --include "solar_tank_mysql_*.sql" --drive-use-trash=false
```

## Cek Backup Berhasil

Backup belum dianggap aman hanya karena file `.sql` ada. Minimal cek:

- file baru muncul sesuai jadwal;
- ukuran file masuk akal dan tidak `0 bytes`;
- Google Drive Desktop/rclone sudah selesai upload;
- file lama terhapus sesuai retention;
- restore drill pernah sukses di database lokal/staging;
- file backup tidak masuk `git status`.

## Restore Drill

Jangan restore langsung ke database production sebelum diuji.

Contoh restore ke database lokal/staging:

```powershell
mysql -h 127.0.0.1 -P 3306 -u solar_tank_app -p solar_tank_restore < .\backups\mysql\solar_tank_mysql_YYYYMMDDTHHMMSSZ.sql
```

Checklist restore:

- aplikasi bisa login;
- `/api/ready` tidak error;
- registry site/tank/device terbaca;
- dashboard tampil;
- riwayat reading sesuai backup;
- tidak ada credential backup yang masuk git.
