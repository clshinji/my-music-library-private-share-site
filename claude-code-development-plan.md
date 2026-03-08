# 実装計画: 自分用音楽共有サイト（AWS サーバレス）

## Context

個人用の音楽ストリーミングサイトをサーバレスで構築する。
music-library/に保存された83曲（4アーティスト、10アルバム、593MB）を、
どこからでも再生できるYouTube Music風のWebサイトとして公開する。
維持費は月額~$0.02（ほぼゼロ）を目指す。

## AWS認証

- AWS SSO を使用: `aws sso login --profile clshinji`
- プロファイル名は `.env` の `aws-profile-name` に記載
- CDK・S3アップロード等のAWS操作はすべてこのプロファイルを使用

## 技術スタック

| 項目 | 技術 | 理由 |
|------|------|------|
| フロントエンド | React + Vite + TypeScript | YouTube Music風の複雑なUIに最適 |
| スタイリング | Tailwind CSS | ダークテーマ、レスポンシブ対応が容易 |
| ビルドスクリプト | Python (uv run) | CLAUDE.mdルール準拠。mutagen等でメタデータ抽出 |
| ホスティング | AWS S3 + CloudFront | 低レイテンシー（東京エッジ）、CDN配信1TB/月無料 |
| 認証 | CloudFront Functions + Lambda | サーバーサイド認証。音楽ファイルも保護 |
| インフラ管理 | AWS CDK (Python) | Pythonでインフラをコード管理 |
| AWS認証 | AWS SSO (`--profile clshinji`) | .envのaws-profile-nameで管理 |
| お気に入り | LocalStorage | 個人利用のため十分。バックエンド不要 |

## アーキテクチャ

```
Browser → CloudFront (CDN/東京エッジ)
              │
         CloudFront Functions (認証チェック: cookie検証)
              │
              ├── S3: /index.html, /assets/* (React SPA)
              ├── S3: /music/* (音楽ファイル)
              └── S3: /artwork/* (アルバムアートワーク)

Login: Browser → Lambda Function URL → パスワード検証 → Set-Cookie
```

## プロジェクト構成

```
my-music-library-private-share-site/
├── music-library/                    # 音楽ファイル（gitignore）
├── scripts/                          # Python ビルドスクリプト
│   ├── generate_catalog.py           # カタログJSON生成
│   ├── generate_artwork.py           # アートワーク生成（Nano banana Pro）
│   └── upload_to_s3.py               # S3アップロード
├── infra/                            # AWS CDK（Python）
│   ├── app.py
│   └── stacks/
│       └── music_site_stack.py       # S3 + CloudFront + Lambda
├── src/                              # React SPA
│   ├── components/
│   │   ├── PasswordGate.tsx          # ログイン画面
│   │   ├── Sidebar.tsx               # サイドバー（アーティスト/アルバム/曲）
│   │   ├── Player.tsx                # メインプレイヤー
│   │   ├── PlayerControls.tsx        # 再生コントロール
│   │   ├── ProgressBar.tsx           # シークバー
│   │   ├── NowPlaying.tsx            # 再生中の曲情報+アートワーク
│   │   ├── TrackList.tsx             # トラック一覧
│   │   ├── FavoriteButton.tsx        # いいねボタン
│   │   ├── DownloadButton.tsx        # ダウンロードボタン
│   │   ├── RecommendedPlaylists.tsx  # おすすめプレイリスト
│   │   └── MobileNav.tsx            # モバイルナビゲーション
│   ├── hooks/
│   │   ├── useAudioPlayer.ts         # オーディオ再生ロジック
│   │   ├── usePlaylist.ts            # プレイリスト/キュー管理
│   │   ├── useFavorites.ts           # お気に入り（LocalStorage）
│   │   └── useAuth.ts               # 認証状態管理
│   ├── types/
│   │   └── music.ts                  # 型定義
│   ├── data/
│   │   └── catalog.json              # 生成されたカタログ（gitコミット対象）
│   ├── assets/
│   │   └── artwork/                  # 生成されたアートワーク（gitコミット対象）
│   ├── utils/
│   │   └── naming.ts                 # 命名規則パーサー
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── functions/
│   ├── auth.py                       # Lambda: パスワード検証
│   └── cf-auth-check.js              # CloudFront Function: cookie検証
├── public/
├── .env
├── PLAN.md
├── SPEC.md                           # ← 作成する仕様書
├── pyproject.toml                    # Python依存関係（uv）
├── package.json                      # Node.js依存関係（React/Vite）
├── vite.config.ts
└── tsconfig.json
```

## データモデル

```typescript
interface Track {
  id: string;
  trackNumber: number;
  title: string;           // "01 アナウンス.m4a" → "アナウンス"
  fileName: string;
  format: "m4a" | "mp3";
  s3Key: string;           // S3上のパス
  duration?: number;
  albumId: string;
  artistId: string;
}

interface Album {
  id: string;
  name: string;
  artistId: string;
  artworkPath: string;
  tracks: Track[];          // trackNumber昇順
}

interface Artist {
  id: string;
  sortKey: number;          // NN_ プレフィックスの数値
  name: string;             // "01_名取交響吹奏楽団（n響）" → "名取交響吹奏楽団（n響）"
  albums: Album[];          // 名前昇順
}
```

## タスクリスト

### Phase 1: プロジェクトセットアップ
- [ ] 1.1 Vite + React + TypeScript プロジェクト初期化
- [ ] 1.2 Tailwind CSS 設定
- [ ] 1.3 TypeScript型定義（music.ts）
- [ ] 1.4 Python環境セットアップ（pyproject.toml, uv）
- [ ] 1.5 ディレクトリ構成作成

### Phase 2: カタログ生成（Python）
- [ ] 2.1 generate_catalog.py 作成（music-library/スキャン → catalog.json生成）
- [ ] 2.2 命名規則パース（NN_プレフィックス除去、トラック番号抽出）
- [ ] 2.3 音声ファイルのメタデータ抽出（duration等、mutagen使用）
- [ ] 2.4 catalog.json 生成＆コミット

### Phase 3: アートワーク生成（Python）
- [ ] 3.1 generate_artwork.py 作成
- [ ] 3.2 音楽ファイルからアートワーク抽出（mutagenで埋め込み画像チェック）
- [ ] 3.3 アートワークが無いアルバムはNano banana Pro（Google AI Studio）で生成
- [ ] 3.4 生成画像をsrc/assets/artwork/に保存＆コミット

### Phase 4: UIレイアウト
- [ ] 4.1 App.tsx: 2カラムレイアウト（サイドバー + メインコンテンツ）
- [ ] 4.2 Sidebar.tsx: アーティスト/アルバム/曲の階層表示（折りたたみ式）
- [ ] 4.3 ダークテーマ基本スタイル
- [ ] 4.4 レスポンシブ対応（モバイル: ハンバーガーメニュー）

### Phase 5: オーディオプレイヤー
- [ ] 5.1 useAudioPlayer.ts: HTML5 Audio再生制御
- [ ] 5.2 usePlaylist.ts: キュー管理、次/前の曲、自動連続再生
- [ ] 5.3 Player.tsx: メインプレイヤーUI（アートワーク大表示）
- [ ] 5.4 PlayerControls.tsx: 再生/一時停止、次/前、音量
- [ ] 5.5 ProgressBar.tsx: シークバー（ドラッグ対応）
- [ ] 5.6 NowPlaying.tsx: 再生中情報表示

### Phase 6: 機能実装
- [ ] 6.1 RecommendedPlaylists.tsx: おすすめ4プレイリスト表示
- [ ] 6.2 useFavorites.ts + FavoriteButton.tsx: いいね機能（LocalStorage）
- [ ] 6.3 DownloadButton.tsx: 楽曲ダウンロード
- [ ] 6.4 TrackList.tsx: アルバム内トラック一覧

### Phase 7: 認証
- [ ] 7.1 Lambda関数: パスワード検証 + HMAC署名cookie発行
- [ ] 7.2 CloudFront Function: viewer-requestでcookie検証
- [ ] 7.3 PasswordGate.tsx: ログイン画面UI
- [ ] 7.4 useAuth.ts: 認証状態管理

### Phase 8: AWSインフラ（CDK）
- [ ] 8.1 AWS CDK Python プロジェクト初期化
- [ ] 8.2 S3バケット定義（プライベート）
- [ ] 8.3 CloudFrontディストリビューション定義（OAI経由でS3アクセス）
- [ ] 8.4 Lambda関数デプロイ定義
- [ ] 8.5 CloudFront Function定義

### Phase 9: デプロイ
- [ ] 9.1 AWS SSO ログイン（`aws sso login --profile clshinji`）
- [ ] 9.2 upload_to_s3.py: 音楽ファイルをS3にアップロード（--profile clshinji）
- [ ] 9.3 CDKデプロイ（`cdk deploy --profile clshinji`）
- [ ] 9.4 SPAビルド＆S3アップロード
- [ ] 9.5 環境変数設定（パスワード、HMACシークレット）
- [ ] 9.6 エンドツーエンドテスト

### Phase 10: モバイル最適化
- [ ] 10.1 モバイルサイドバー（ハンバーガーメニュー/ボトムシート）
- [ ] 10.2 モバイルミニプレイヤーバー（画面下部固定）
- [ ] 10.3 フルスクリーンプレイヤービュー
- [ ] 10.4 タッチ操作最適化

## おすすめプレイリスト設定

1. 名取交響吹奏楽団（n響）の全曲を連続再生
2. シエナ・ウィンド・オーケストラ / バーンスタイン・オン・ブラス / track 11「プレリュード、フーガ&リフス プレリュード」から連続再生
3. 東北方面陸上自衛隊 / 第31回青少年コンサート / track 07「クラリネット協奏曲 Carousel」から連続再生
4. 航空自衛隊西部航空音楽隊 / CAFUA Selection 2004 / track 05「スクーティン・オン・ハードロック」から連続再生

## 検証方法

1. `uv run scripts/generate_catalog.py` → catalog.json が正しく生成されること
2. `uv run scripts/generate_artwork.py` → 各アルバムのアートワークが生成されること
3. `npm run dev` → ローカルでSPAが動作すること（音楽再生、サイドバー、お気に入り）
4. `cdk deploy` → AWSリソースが正しくプロビジョニングされること
5. `uv run scripts/upload_to_s3.py` → 音楽ファイルがS3にアップロードされること
6. ブラウザでCloudFront URLにアクセス → パスワード認証 → 音楽再生が動作すること
7. モバイルブラウザでも快適に操作できること
