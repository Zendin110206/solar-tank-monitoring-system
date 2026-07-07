# Database Backup

Backup database wajib disiapkan sebelum aplikasi dipakai sebagai sistem operasional.

## Prinsip

- Backup dibuat dari MySQL, bukan dari browser.
- Device tidak pernah diberi password database.
- File backup tidak boleh di-commit.
- Restore harus pernah diuji ke database lokal/staging.
- Untuk Google Drive, gunakan folder Google Drive Desktop atau `rclone` di server, bukan OAuth Drive di aplikasi web.

## Environment

Contoh env lokal/server:

```env
SOLAR_TANK_STORAGE_DRIVER="mysql"
MYSQL_DATABASE_URL="mysql://user:password@host:3306/database"
MYSQL_SSL_MODE="required"
MYSQL_BACKUP_OUTPUT_DIR="backups/mysql"
MYSQL_BACKUP_RETENTION_DAYS="90"
```

Jika memakai Google Drive Desktop di Windows server, arahkan `MYSQL_BACKUP_OUTPUT_DIR` ke folder yang tersinkronisasi, misalnya:

```env
MYSQL_BACKUP_OUTPUT_DIR="C:\Users\SolarTank\Google Drive\SolarTank Backups\mysql"
```

## Membuat Backup Manual

Pastikan MySQL client tersedia dan perintah `mysqldump` bisa dipanggil dari terminal.

```powershell
pnpm db:backup:mysql
```

Output berupa file:

```text
solar_tank_mysql_YYYYMMDDTHHMMSSZ.sql
```

## Jadwal Backup

Untuk kebutuhan dua backup per bulan, jadwalkan command ini setiap dua minggu.

Di Windows Server, gunakan Task Scheduler:

```powershell
Program: powershell.exe
Arguments: -NoProfile -ExecutionPolicy Bypass -Command "cd 'D:\path\solar-tank-monitoring-system'; pnpm db:backup:mysql"
```

Di Linux server, gunakan cron:

```cron
0 2 1,15 * * cd /srv/solar-tank-monitoring-system && pnpm db:backup:mysql
```

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

