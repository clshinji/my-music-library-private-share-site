# My Music Library - Private Share Site

自分の音楽ライブラリをどこからでもブラウザで再生できる、パスワード保護付きのプライベート音楽ストリーミングサイト。

## 特徴

- YouTube Music 風の UI で音楽を再生
- アーティスト / アルバム / トラック単位のブラウジング
- お気に入り（Like）機能
- トラックダウンロード
- レスポンシブデザイン（デスクトップ・モバイル対応）
- パスワード認証 + HMAC 署名 Cookie によるアクセス制御
- サーバーレス構成で低コスト運用（月額 ~$0.02）

## アーキテクチャ

```
Browser → CloudFront (CDN)
            ├── React SPA (S3)
            ├── 音楽ファイル (S3 /music/*)
            └── アートワーク (S3 /artwork/*)

認証フロー:
Browser → Lambda Function URL → パスワード検証 → HMAC 署名 Cookie 発行
CloudFront Function → Cookie 検証 → 音楽ファイル配信
```

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 19, TypeScript, Vite, Tailwind CSS |
| インフラ | AWS S3, CloudFront, Lambda, CloudFront Functions |
| IaC | AWS CDK (Python) |
| パッケージ管理 | npm (Node.js), uv (Python) |

## 前提条件

- Node.js 18+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/)（Python パッケージマネージャ）
- AWS CLI v2
- AWS CDK

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.sample .env
```

`.env` に以下を設定：

| パラメータ | 説明 |
|---|---|
| `aws-profile-name` | AWS SSO プロファイル名 |
| `site-password` | サイトのログインパスワード |
| `hmac-secret` | Cookie 署名用シークレット（`openssl rand -hex 32` で生成） |

### 2. 依存関係のインストール

```bash
npm install
uv sync
```

### 3. 音楽ファイルの配置

`music-library/` ディレクトリに音楽ファイル（M4A/MP3）を配置する。
ディレクトリ構成: `music-library/<アーティスト名>/<アルバム名>/<トラック>.m4a`

### 4. ローカル開発

```bash
uv run scripts/generate_catalog.py   # カタログ生成
uv run scripts/generate_artwork.py   # アートワーク抽出
npm run dev                           # 開発サーバー起動
```

## デプロイ

詳細は [DEPLOY.md](./DEPLOY.md) を参照。

```bash
# クイックデプロイ（フロントエンドのみ変更時）
npm run build
uv run scripts/upload_to_s3.py

# フルデプロイ
aws sso login --profile <aws-profile-name>
uv run scripts/generate_catalog.py
uv run scripts/generate_artwork.py
npm run build
cd infra && uv run --project .. cdk deploy --profile <aws-profile-name> && cd ..
uv run scripts/upload_to_s3.py
```

## プロジェクト構成

```
├── src/                  # React SPA
│   ├── components/       # UI コンポーネント
│   ├── hooks/            # カスタムフック（再生・プレイリスト・認証）
│   ├── data/             # 生成されたカタログ JSON
│   └── assets/artwork/   # アルバムアートワーク
├── infra/                # AWS CDK インフラ定義
├── functions/            # Lambda / CloudFront Functions
├── scripts/              # カタログ生成・デプロイスクリプト
└── music-library/        # 音楽ファイル（gitignore）
```
