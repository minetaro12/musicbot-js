FROM alpine:3.24.4

WORKDIR /app
COPY . ./
RUN apk update && \
  apk add --no-cache nodejs pnpm python3 ffmpeg && \
  wget https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/download/2026.11.19.232656/yt-dlp -O /usr/local/bin/yt-dlp && \
  chmod +x /usr/local/bin/yt-dlp && \
  mkdir -p /usr/local/bin/yt-dlp-plugins && \
  wget https://github.com/Brainicism/bgutil-ytdlp-pot-provider/releases/download/2.0.2/bgutil-ytdlp-pot-provider.zip -O /usr/local/bin/yt-dlp-plugins/bgutil-ytdlp-pot-provider.zip && \
  pnpm install --only=production

EXPOSE 3000

ENTRYPOINT [ "node", "src/main.ts" ]
