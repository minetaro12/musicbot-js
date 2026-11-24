## 必要なもの
- Discordのbotトークン
- YouTubeにログイン状態のcookie（捨てアカウント推奨）

## 以下は直接実行する場合のみ必要（実行できるようにPATHを通しておく）
- NodeJS
- yt-dlp
- ffmpeg

## Dockerでの実行
```bash
$ docker compose build

$ docker compose up -d
```

## NodeJSでそのまま実行
```bash
$ pnpm i

$ pnpm start
or
$ node ./src/main.ts

## YouTubeのPOトークン
YouTubeの再生URL要求（GVS）にはPOトークンが必要です。yt-dlp単体では生成できないため、
`mweb`クライアントとPOトークンプロバイザー（bgutil-ytdlp-pot-provider）を利用します。
トークンは動画ごとに生成されるため、手動で取得したトークンの固定設定は非推奨です。

Docker Composeでは`pot-provider`サービスが自動で起動します。
プロバイザーには認証がないため、ポート4416をホスト側に公開しないでください。

NodeJSで直接実行する場合は、プロバイザーとプラグインを別途用意し、環境変数を設定してください。
（プラグインのインストール方法: https://github.com/Brainicism/bgutil-ytdlp-pot-provider#2-install-the-plugin）

```bash
$ docker run --name bgutil-provider -d --init -p 127.0.0.1:4416:4416 brainicism/bgutil-ytdlp-pot-provider:2.0.2
$ export POT_PROVIDER_BASE_URL=http://127.0.0.1:4416
$ pnpm start
```

`YOUTUBE_PLAYER_CLIENT`でクライアントを変更できます（既定値: `mweb`）。
```
