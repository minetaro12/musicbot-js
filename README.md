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
```
