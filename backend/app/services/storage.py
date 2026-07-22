import boto3
from typing import Optional
from app.config import settings

class StorageService:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            endpoint_url=settings.S3_ENDPOINT_URL or None,
        )
        self.bucket_name = settings.AWS_BUCKET_NAME

    async def upload_file(self, file_content: bytes, file_key: str, content_type: str) -> str:
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=file_key,
            Body=file_content,
            ContentType=content_type,
        )
        return f"s3://{self.bucket_name}/{file_key}"

    async def get_signed_upload_url(self, file_key: str, content_type: str, expires_in: int = 900):
        url = self.client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": file_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
        return url, file_key

    def get_signed_url(self, s3_url: str, expires_in: int = 3600) -> str:
        if s3_url.startswith("s3://"):
            key = s3_url.replace(f"s3://{self.bucket_name}/", "")
        else:
            key = s3_url
        url = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": key},
            ExpiresIn=expires_in,
        )
        return url

    async def get_presigned_url(self, file_key: str, expires_in: int = 3600) -> str:
        url = self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": file_key},
            ExpiresIn=expires_in,
        )
        return url

    async def delete_file(self, file_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except Exception:
            return False

storage_service = StorageService()
