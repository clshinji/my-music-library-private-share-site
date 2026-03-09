"""音楽ファイル・ビルド成果物をS3にアップロード"""

import json
import mimetypes
import os
import subprocess
import sys
from pathlib import Path

import boto3


PROJECT_ROOT = Path(__file__).parent.parent
MUSIC_DIR = PROJECT_ROOT / "music-library"
DIST_DIR = PROJECT_ROOT / "dist"
ARTWORK_DIR = PROJECT_ROOT / "public" / "artwork"

PROFILE = os.environ.get("AWS_PROFILE", "clshinji")


def get_stack_output(key: str) -> str:
    result = subprocess.run(
        ["aws", "cloudformation", "describe-stacks",
         "--stack-name", "MusicSiteStack",
         "--profile", PROFILE,
         "--region", "ap-northeast-1",
         "--query", f"Stacks[0].Outputs[?OutputKey=='{key}'].OutputValue",
         "--output", "text"],
        capture_output=True, text=True
    )
    return result.stdout.strip()


def upload_directory(s3_client, bucket: str, local_dir: Path, s3_prefix: str, skip_existing: bool = True):
    existing_keys = set()
    if skip_existing:
        paginator = s3_client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=bucket, Prefix=s3_prefix):
            for obj in page.get("Contents", []):
                existing_keys.add(obj["Key"])

    count = 0
    for file_path in local_dir.rglob("*"):
        if not file_path.is_file() or file_path.name.startswith("."):
            continue

        relative = file_path.relative_to(local_dir)
        s3_key = f"{s3_prefix}/{relative}" if s3_prefix else str(relative)

        if skip_existing and s3_key in existing_keys:
            continue

        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = "application/octet-stream"

        extra_args = {"ContentType": content_type}

        # 音楽ファイルは長期キャッシュ
        if s3_prefix == "music":
            extra_args["CacheControl"] = "public, max-age=31536000"
        # 静的アセットも長期キャッシュ
        elif s3_prefix == "" and not file_path.name.endswith(".html"):
            extra_args["CacheControl"] = "public, max-age=31536000"
        else:
            extra_args["CacheControl"] = "no-cache"

        print(f"  アップロード: {s3_key}")
        s3_client.upload_file(str(file_path), bucket, s3_key, ExtraArgs=extra_args)
        count += 1

    return count


def invalidate_cloudfront(distribution_id: str):
    cf = boto3.Session(profile_name=PROFILE).client("cloudfront")
    import time
    cf.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            "Paths": {"Quantity": 1, "Items": ["/*"]},
            "CallerReference": str(int(time.time())),
        },
    )
    print("CloudFrontキャッシュ無効化リクエスト送信")


def main():
    bucket_name = get_stack_output("BucketName")
    distribution_id = get_stack_output("DistributionId")

    if not bucket_name:
        print("エラー: BucketNameが取得できません。CDKデプロイが完了しているか確認してください。")
        sys.exit(1)

    print(f"バケット: {bucket_name}")
    print(f"ディストリビューション: {distribution_id}")

    session = boto3.Session(profile_name=PROFILE)
    s3 = session.client("s3")

    # 1. 音楽ファイルのアップロード
    if MUSIC_DIR.exists():
        print("\n音楽ファイルをアップロード中...")
        count = upload_directory(s3, bucket_name, MUSIC_DIR, "music", skip_existing=True)
        print(f"  {count}ファイルアップロード完了")

    # 2. アートワークのアップロード
    if ARTWORK_DIR.exists():
        print("\nアートワークをアップロード中...")
        count = upload_directory(s3, bucket_name, ARTWORK_DIR, "artwork", skip_existing=False)
        print(f"  {count}ファイルアップロード完了")

    # 3. ビルド成果物のアップロード
    if DIST_DIR.exists():
        print("\nビルド成果物をアップロード中...")
        count = upload_directory(s3, bucket_name, DIST_DIR, "", skip_existing=False)
        print(f"  {count}ファイルアップロード完了")
    else:
        print(f"\n警告: {DIST_DIR} が見つかりません。先に `npm run build` を実行してください。")

    # 4. CloudFrontキャッシュ無効化
    if distribution_id:
        invalidate_cloudfront(distribution_id)

    site_url = get_stack_output("SiteUrl")
    print(f"\n完了！サイトURL: {site_url}")


if __name__ == "__main__":
    main()
