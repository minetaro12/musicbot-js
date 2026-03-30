import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

const updateDisplay = (data) => {
  const currentDisplay = document.querySelector("#current");
  const queueDisplay = document.querySelector("#queue");
  const remainingDisplay = document.querySelector("#remaining");

  if (data.nowPlaying) {
    currentDisplay.textContent = `${data.nowPlaying.title} (${formatTime(data.nowPlaying.duration)})`;
  } else {
    currentDisplay.textContent = "再生中の曲はありません";
  }

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

const socket = io({
  auth: {
    token: token,
    guildId: id,
  }
});

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

socket.on("stateUpdate", (data) => {
  updateDisplay(data);
});

socket.on("error", (err) => {
  alert(err);
});
