export type Queue = {
  title: string;
  url: string;
  duration: number;
  playStartTime: number | null;
  thumbnails: {
    url: string;
  }[];
};
