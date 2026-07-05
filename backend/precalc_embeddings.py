"""
Script to pre-calculate embeddings for all active products.
Run with: python precalc_embeddings.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.vector_search import precalculate_product_embeddings

def main():
    db = SessionLocal()
    try:
        print("Starting pre-calculation of product image embeddings...")
        precalculate_product_embeddings(db)
        print("Pre-calculation complete!")
    except Exception as e:
        print("Error during pre-calculation:", e)
    finally:
        db.close()

if __name__ == "__main__":
    main()
