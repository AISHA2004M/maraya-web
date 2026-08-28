"""
Vrital Platform — Visual Search Vector Embedding Pre-calculator
==============================================================
Generates and caches image embeddings for all active catalog products.

Usage:
    python scripts/precalc_embeddings.py
"""

import sys
import os
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.services.vector_search import precalculate_product_embeddings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("embeddings")


def main():
    db = SessionLocal()
    try:
        logger.info("Starting pre-calculation of product image embeddings...")
        precalculate_product_embeddings(db)
        logger.info("Pre-calculation complete!")
    except Exception as e:
        logger.error(f"Error during pre-calculation: {e}", exc_info=True)
    finally:
        db.close()


if __name__ == "__main__":
    main()
