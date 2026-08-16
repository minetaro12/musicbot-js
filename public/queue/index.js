import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";
import { createPlaybackSnapshot, formatTime, getPlaybackPosition } from "./playback.js";

let currentState = null;
let playbackSnapshot = {
  current: 0,
  total: 0,
  percentage: 0,
  isPlaying: false,
  receivedAt: performance.now()
};

const setPlaybackSnapshot = (playback) => {
  playbackSnapshot = createPlaybackSnapshot(playback, performance.now());
};

const getCurrentPlaybackPosition = () => {
  return getPlaybackPosition(playbackSnapshot, performance.now());
};

const updateDisplay = (data) => {
  const currentDisplay = document.querySelector("#current");
  const queueDisplay = document.querySelector("#queue");
  const remainingDisplay = document.querySelector("#remaining");

  if (data.nowPlaying) {
    currentDisplay.textContent = data.nowPlaying.title;
    setPlaybackSnapshot(data.playback);
  } else {
    currentDisplay.textContent = "再生中の曲はありません";
    setPlaybackSnapshot(null);
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

const renderProgress = () => {
  const progressBar = document.querySelector("#progress");
  const progressText = document.querySelector("#progress-text");
  const current = getCurrentPlaybackPosition();

  progressBar.max = playbackSnapshot.total;
  progressBar.value = current;
  progressText.textContent = `${formatTime(current)}/${formatTime(playbackSnapshot.total)}`;

  requestAnimationFrame(renderProgress);
};

requestAnimationFrame(renderProgress);

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
  setPlaybackSnapshot({
    current: getCurrentPlaybackPosition(),
    total: playbackSnapshot.total,
    isPlaying: false
  });
});

socket.on("stateUpdate", (data) => {
  console.log("State updated:", data);
  currentState = data;
  updateDisplay(currentState);
});

socket.on("playbackProgress", (playback) => {
  if (currentState?.nowPlaying) {
    setPlaybackSnapshot(playback);
  }
});

socket.on("error", (err) => {
  alert(err);
});
