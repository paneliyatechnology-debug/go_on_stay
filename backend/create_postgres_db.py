import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

load_dotenv()

db_name = os.getenv('DB_NAME', 'bookmyroom_db')
db_user = os.getenv('DB_USER', 'postgres')
db_password = os.getenv('DB_PASSWORD', 'postgres')
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '5432')

print(f"Connecting to PostgreSQL server at {db_host}:{db_port} as user '{db_user}'...")

try:
    conn = psycopg2.connect(
        dbname='postgres',
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (db_name,))
    exists = cursor.fetchone()
    
    if not exists:
        cursor.execute(f'CREATE DATABASE "{db_name}";')
        print(f"[SUCCESS] Database '{db_name}' created successfully!")
    else:
        print(f"[INFO] Database '{db_name}' already exists.")
        
    cursor.close()
    conn.close()

except Exception as e:
    print(f"\n[ERROR] Connection failed: {e}")
    print("\nPlease ensure:")
    print("1. PostgreSQL is installed on your computer.")
    print("2. PostgreSQL service is started/running on localhost:5432.")
    print("3. DB_PASSWORD in backend/.env matches your PostgreSQL password.")

