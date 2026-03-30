import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

let currentState = null;
let updateProgressInterval = null; // interval ID を保存する変数

const updateDisplay = (data) => {
  if (updateProgressInterval) {
    clearInterval(updateProgressInterval); // 既存の進捗更新をクリア
  }

  const currentDisplay = document.querySelector("#current");
  const queueDisplay = document.querySelector("#queue");
  const remainingDisplay = document.querySelector("#remaining");
  const progressBar = document.querySelector("#progress");
  const progressText = document.querySelector("#progress-text");

  if (data.nowPlaying) {
    currentDisplay.textContent = data.nowPlaying.title;

    progressBar.max = data.nowPlaying.duration;
    progressBar.value = Math.ceil((Date.now() - data.nowPlaying.playStartTime) / 1000); // 秒単位に変換
    progressText.textContent = `${formatTime(progressBar.value)}/${formatTime(progressBar.max)}`;

    updateProgressInterval = setInterval(updateProgress, 1000); // 1秒ごとに進捗を更新
  } else {
    currentDisplay.textContent = "再生中の曲はありません";
    progressBar.value = 0;
    progressBar.max = 0;
    progressText.textContent = `0:00/0:00`;
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

const updateProgress = () => {
  const progressBar = document.querySelector("#progress");
  const progressText = document.querySelector("#progress-text");

  if (currentState.nowPlaying && progressBar.value < progressBar.max) {
    progressBar.value += 1;
    progressText.textContent = `${formatTime(progressBar.value)}/${formatTime(progressBar.max)}`;
  } else {
    clearInterval(updateProgressInterval); // 進捗更新を停止
    progressBar.value = 0;
    progressBar.max = 0;
    progressText.textContent = `0:00/0:00`;
  }
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
  console.log("State updated:", data);
  currentState = data;
  updateDisplay(currentState);
});

socket.on("error", (err) => {
  alert(err);
});
