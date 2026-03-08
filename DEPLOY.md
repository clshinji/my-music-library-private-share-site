# デプロイ手順

## 1. 前提条件

### 必須ツール
- Node.js 18+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/)（Python パッケージマネージャ）
- AWS CLI v2
- AWS CDK（`npm install -g aws-cdk` または devDependencies に含まれる）

### `.env` ファイル

`.env.sample` をコピーして `.env` を作成する：

```bash
cp .env.sample .env
```

以下の3つのパラメータを設定する：

| パラメータ | 説明 |
|---|---|
| `aws-profile-name` | AWS SSO のプロファイル名。`aws sso login --profile <この値>` で認証に使用する |
| `site-password` | サイトのログインパスワード。ブラウザでアクセスした際にユーザが入力する |
| `hmac-secret` | 認証 Cookie の署名用シークレットキー。パスワード認証成功時に Lambda が HMAC-SHA256 で署名した Cookie (`music_auth`) を発行し、CloudFront が Cookie の有効期限を検証してアクセスを制御する。任意のランダム文字列を設定する |

`hmac-secret` の生成例：
```bash
openssl rand -hex 32
```

## 2. 初回セットアップ

```bash
# Node.js 依存関係
npm install

# Python 依存関係
uv sync
```

## 3. AWS 認証

```bash
aws sso login --profile <aws-profile-name>
```

`.env` の `aws-profile-name` に記載されたプロファイル名を使用する。

## 4. コンテンツ準備（音楽ライブラリ変更時）

```bash
# music-library/ に音楽ファイル（M4A/MP3）を配置後：

# カタログJSON生成（src/data/catalog.json）
uv run scripts/generate_catalog.py

# アートワーク抽出（src/assets/artwork/）
uv run scripts/generate_artwork.py
```

## 5. フロントエンドビルド

```bash
npm run build
```

`dist/` にビルド成果物が生成される。

## 6. インフラデプロイ（初回 or インフラ変更時）

```bash
cd infra && uv run --project .. cdk deploy --profile <aws-profile-name>
```

デプロイ完了後、CloudFormation 出力を確認：
- **BucketName** — S3 バケット名
- **DistributionId** — CloudFront ディストリビューション ID
- **SiteUrl** — サイト URL

## 7. コンテンツアップロード

```bash
uv run scripts/upload_to_s3.py
```

このスクリプトは以下を実行する：
1. `music-library/` の音楽ファイルを S3 の `music/` にアップロード（差分のみ）
2. `src/assets/artwork/` のアートワークを S3 の `artwork/` にアップロード
3. `dist/` のビルド成果物を S3 にアップロード
4. CloudFront キャッシュの無効化

> **注意**: `AWS_PROFILE` 環境変数が未設定の場合、デフォルトプロファイル `clshinji` が使用される。別のプロファイルを使う場合は `AWS_PROFILE=<name> uv run scripts/upload_to_s3.py` で実行する。

## 8. 動作確認

1. CloudFormation 出力の **SiteUrl** にブラウザでアクセス
2. パスワード入力画面が表示されることを確認
3. `.env` の `site-password` でログイン
4. 音楽一覧が表示され、再生できることを確認

## 9. よくあるデプロイパターン（クイックリファレンス）

### フロントエンドのみ変更
```bash
npm run build
uv run scripts/upload_to_s3.py
```

### 音楽ファイル追加
```bash
uv run scripts/generate_catalog.py
uv run scripts/generate_artwork.py
npm run build
uv run scripts/upload_to_s3.py
```

### インフラ変更
```bash
cd infra && uv run --project .. cdk deploy --profile <aws-profile-name>
cd ..
uv run scripts/upload_to_s3.py
```

### フルデプロイ（全手順）
```bash
aws sso login --profile <aws-profile-name>
uv run scripts/generate_catalog.py
uv run scripts/generate_artwork.py
npm run build
cd infra && uv run --project .. cdk deploy --profile <aws-profile-name>
cd ..
uv run scripts/upload_to_s3.py
```
