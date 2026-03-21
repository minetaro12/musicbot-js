export const getCookieOption = () => {
  if (process.env.COOKIE_FILE) {
    return ["--cookies", process.env.COOKIE_FILE];
  } else {
    return [];
  }
};
