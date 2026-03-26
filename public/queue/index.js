const fetchQueue = async (id, token) => {
  try {
    const url = token ? `/api/${id}?token=${token}` : `/api/${id}`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error("Authentication failed: Invalid or missing token");
      return { error: "認証に失敗しました。トークンが無効です。" };
    }
    console.error("Error fetching queue:", error);
    return null;
  }
};

const updateDisplay = (data) => {
  const currentDisplay = document.querySelector("#current");
  const queueDisplay = document.querySelector("#queue");
  const remainingDisplay = document.querySelector("#remaining");

  currentDisplay.textContent = `${data.nowPlaying.title} (${formatTime(data.nowPlaying.duration)})` || "再生中の曲はありません";
  queueDisplay.innerHTML = "";
  remainingDisplay.textContent = data.queue.length;

  data.queue.forEach((song, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${song.title} (${formatTime(song.duration)})`;
    queueDisplay.appendChild(option);
  });
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// クエリパラメーターからidとtokenを取得
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const token = urlParams.get('token');

const data = await fetchQueue(id, token);

if (!data) {
  alert("キュー情報を取得できませんでした。");
} else if (data.error) {
  alert(data.error);
} else {
  updateDisplay(data);
}
