import { getCookieOption } from "./getCookieOption.ts";

export const getYoutubeOptions = (): string[] => {
  const options: string[] = [
    ...getCookieOption(),
    "--extractor-args",
    `youtube:player_client=${process.env.YOUTUBE_PLAYER_CLIENT || "mweb"}`
  ];

  if (process.env.POT_PROVIDER_BASE_URL) {
    options.push(
      "--extractor-args",
      `youtubepot-bgutilhttp:base_url=${process.env.POT_PROVIDER_BASE_URL}`
    );
  }

  return options;
};
