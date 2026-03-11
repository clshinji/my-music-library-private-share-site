# My Music Library - Private Share Site

自分の音楽ライブラリをどこからでもブラウザで再生できる、パスワード保護付きのプライベート音楽ストリーミングサイト。

## 特徴

- 某音楽配信サイト風の UI で音楽を再生
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
| `google-studio-api-key` | Google AI Studio API キー（アートワーク AI 生成用、任意） |

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

## アートワーク生成スクリプト

`scripts/generate_artwork.py` はアルバムアートワークの抽出・AI生成を行うスクリプト。

### 基本的な使い方

```bash
# 全アルバムのアートワークを生成（既存はスキップ）
uv run python scripts/generate_artwork.py

# プレースホルダー画像（≤5KB）を削除して再生成
uv run python scripts/generate_artwork.py --regenerate
```

### AIアートワークの再生成（`--regen-ai`）

既にAI生成済みのアートワークを再生成したい場合に使用する。対象アルバムを柔軟に指定可能。

```bash
# 全アルバムを再生成（引数なしは all と同等）
uv run python scripts/generate_artwork.py --regen-ai

# 埋め込みアートワークが無いアルバムのみ再生成
uv run python scripts/generate_artwork.py --regen-ai no-embedded

# アルバムIDを指定して再生成
uv run python scripts/generate_artwork.py --regen-ai id:f7092a3e2a4b

# アルバム名の部分一致で再生成（大文字小文字を区別しない）
uv run python scripts/generate_artwork.py --regen-ai name:Disney

# 複数指定（union で結合、重複は自動排除）
uv run python scripts/generate_artwork.py --regen-ai id:aaa id:bbb name:Jazz
```

| 指定子 | 説明 |
|---|---|
| `all` | カタログ内の全アルバム |
| `no-embedded` | 音楽ファイルに埋め込みアートワークが無いアルバム |
| `id:<ID>` | アルバムIDの完全一致 |
| `name:<文字列>` | アルバム名の部分一致（大文字小文字無視） |

### モデル切り替え

AI生成は2段階パイプラインで動作する。各段階のモデルを個別に変更可能。

1. **音声分析モデル**（`--analysis-model`）: 音声クリップを聴いて画像生成プロンプトを生成
2. **画像生成モデル**（`--image-model`）: 生成されたプロンプトからアートワーク画像を生成

```bash
# デフォルト: analysis=gemini-3.1-flash-lite-preview, image=gemini-3.1-flash-image-preview
uv run python scripts/generate_artwork.py --regen-ai no-embedded --analysis-model gemini-2.5-flash --image-model gemini-3.1-flash-image-preview
```

### 処理フロー

- **通常実行**: 既存アートワークはスキップし、未生成のアルバムのみ処理（埋め込み抽出 → AI生成 → プレースホルダー）
- **`--regen-ai`**: 対象アルバムを1件ずつ「既存アートワーク削除 → 再生成」の順で処理。途中エラーでもアートワーク欠損を最小限にする
- **AI生成パイプライン**: トラックタイトル抽出 → Web検索で背景情報取得 → 音声分析でプロンプト生成 → 画像生成

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
