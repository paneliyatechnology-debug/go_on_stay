# PostgreSQL Setup & Migration Guide for Book My Room

This backend is now configured to use **PostgreSQL** by default.

---

## 1. Prerequisites
- **PostgreSQL Installed**: Ensure PostgreSQL service is running on your machine (`localhost:5432`).
- **Database Driver**: `psycopg2` is already installed in the virtual environment.

---

## 2. Create PostgreSQL Database

Open SQL shell (`psql`) or Command Prompt / Terminal and run:

```sql
CREATE DATABASE bookmyroom_db;
```

Or using `createdb` command (if PostgreSQL binaries are in PATH):

```bash
createdb -U postgres bookmyroom_db
```

---

## 3. Configure Environment (`.env`)

Check `backend/.env` to ensure your database credentials match your local PostgreSQL server:

```env
USE_POSTGRES=True
DB_ENGINE=django.db.backends.postgresql
DB_NAME=bookmyroom_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

---

## 4. Run Migrations & Seed Data

In the `backend` directory with virtual environment activated:

```bash
# 1. Run migrations to create tables in PostgreSQL
python manage.py migrate

# 2. Seed initial data (Hotels, Rooms, Admin, Owners, Staff, Customers)
python manage.py seed_data
```

---

## 5. Fallback to SQLite (Optional)

If PostgreSQL is not running or you want to switch back to SQLite for quick testing, set `USE_POSTGRES=False` in `backend/.env`:

```env
USE_POSTGRES=False
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```
