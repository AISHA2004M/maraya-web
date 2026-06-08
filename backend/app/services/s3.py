"""
S3 Service — Cloud Image Storage
=================================
Wraps boto3 with presigned URL support, error handling,
and optional custom endpoint for S3-compatible stores (MinIO, Cloudflare R2).
"""

import mimetypes
import logging
from typing import Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from app.core.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    def __init__(self):
        client_kwargs = {
            "region_name": settings.S3_REGION,
            "aws_access_key_id": settings.S3_ACCESS_KEY,
            "aws_secret_access_key": settings.S3_SECRET_KEY,
        }
        # Support S3-compatible endpoints (MinIO, Cloudflare R2, etc.)
        if settings.S3_ENDPOINT_URL:
            client_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

        self.client = boto3.client("s3", **client_kwargs)
        self.bucket = settings.S3_BUCKET

    def upload_file(
        self,
        file_obj,
        key: str,
        public: bool = True,
        content_type: Optional[str] = None,
    ) -> str:
        """
        Upload a file object to S3.
        Returns the public URL.

        Args:
            file_obj: File-like object to upload.
            key: S3 object key (path within bucket).
            public: If True, sets ACL to public-read.
            content_type: MIME type. Auto-detected from key if not provided.
        """
        extra_args = {}

        # Detect content type
        if content_type:
            extra_args["ContentType"] = content_type
        else:
            guessed, _ = mimetypes.guess_type(key)
            if guessed:
                extra_args["ContentType"] = guessed

        if public:
            extra_args["ACL"] = "public-read"

        try:
            self.client.upload_fileobj(file_obj, self.bucket, key, ExtraArgs=extra_args)
            if settings.S3_ENDPOINT_URL:
                return f"{settings.S3_ENDPOINT_URL}/{self.bucket}/{key}"
            return f"https://{self.bucket}.s3.{settings.S3_REGION}.amazonaws.com/{key}"
        except NoCredentialsError:
            logger.error("[S3] No credentials found. Check S3_ACCESS_KEY and S3_SECRET_KEY.")
            raise
        except ClientError as e:
            logger.error(f"[S3] Upload failed for key '{key}': {e}")
            raise

    def delete_file(self, key: str) -> bool:
        """Delete an object from S3."""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            logger.info(f"[S3] Deleted object: {key}")
            return True
        except ClientError as e:
            logger.warning(f"[S3] Delete failed for key '{key}': {e}")
            return False

    def get_presigned_url(self, key: str, expiry: int = 3600) -> str:
        """
        Generate a signed URL for temporary private access.

        Args:
            key: S3 object key.
            expiry: URL expiry in seconds (default 1 hour).
        Returns:
            Pre-signed URL string.
        """
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expiry,
            )
            return url
        except ClientError as e:
            logger.error(f"[S3] Presigned URL generation failed for '{key}': {e}")
            raise

    def file_exists(self, key: str) -> bool:
        """Check if an object exists in S3."""
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False


s3_service = S3Service()
