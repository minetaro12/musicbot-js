FROM alpine:3.24.2

WORKDIR /app
COPY . ./
RUN apk update && \
  apk add --no-cache nodejs pnpm python3 ffmpeg && \
  wget https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/download/2026.09.27.232945/yt-dlp -O /usr/local/bin/yt-dlp && \
  chmod +x /usr/local/bin/yt-dlp && \
  pnpm install --only=production

EXPOSE 3000

ENTRYPOINT [ "node", "src/main.ts" ]
