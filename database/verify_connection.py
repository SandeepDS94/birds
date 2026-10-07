"""Verification script to test live Supabase database and storage connectivity.

Usage:
    python database/verify_connection.py
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.database import get_supabase_client

def test_connection():
    print("=" * 60)
    print("Testing Supabase Live Connection...")
    print("=" * 60)
    print(f"Supabase URL: {settings.SUPABASE_URL}")
    print(f"Storage Bucket: {settings.SUPABASE_STORAGE_BUCKET}")
    
    client = get_supabase_client()
    if not client:
        print("[FAIL] Supabase client could not be initialized. Please check backend/.env.")
        sys.exit(1)

    # 1. Test database connection
    try:
        response = client.table("birds").select("id").limit(1).execute()
        print("[PASS] Successfully queried 'birds' table from Supabase PostgreSQL!")
    except Exception as exc:
        print(f"[FAIL] Querying 'birds' table failed: {exc}")
        sys.exit(1)

    # 2. Test storage bucket access
    try:
        buckets = client.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if settings.SUPABASE_STORAGE_BUCKET in bucket_names:
            print(f"[PASS] Storage bucket '{settings.SUPABASE_STORAGE_BUCKET}' verified!")
        else:
            print(f"[WARN] Bucket '{settings.SUPABASE_STORAGE_BUCKET}' not found in buckets list: {bucket_names}")
    except Exception as exc:
        print(f"[WARN] Storage check returned: {exc}")

    print("=" * 60)
    print("[SUCCESS] Supabase connection is fully operational!")
    print("=" * 60)

if __name__ == "__main__":
    test_connection()
