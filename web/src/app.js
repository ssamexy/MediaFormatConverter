import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const MAX_FILE_SIZE = 250 * 1024 * 1024;
const INPUT_FILE_NAME = "input.mp4";
const OUTPUT_FILE_NAME = "output.mp3";

const ffmpeg = new FFmpeg();
const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const selectedFileLabel = document.querySelector("#selected-file");
const loadButton = document.querySelector("#load-button");
const convertButton = document.querySelector("#convert-button");
const progress = document.querySelector("#progress");
const progressLabel = document.querySelector("#progress-label");
const statusMessage = document.querySelector("#status-message");
const outputPanel = document.querySelector("#output-panel");
const outputSummary = document.querySelector("#output-summary");
const downloadLink = document.querySelector("#download-link");

let selectedFile = null;
let outputUrl = null;
let isLoaded = false;
let isBusy = false;

ffmpeg.on("progress", ({ progress: conversionProgress }) => {
  if (!isBusy || !Number.isFinite(conversionProgress)) {
    return;
  }

  const percentage = Math.round(Math.min(1, Math.max(0, conversionProgress)) * 100);
  progress.hidden = false;
  progress.value = percentage;
  progressLabel.textContent = `${percentage}%`;
});

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`.trim();
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KiB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function setBusy(busy) {
  isBusy = busy;
  fileInput.disabled = busy;
  loadButton.disabled = busy || isLoaded;
  convertButton.disabled = busy || !isLoaded || !selectedFile;
  dropZone.classList.toggle("disabled", busy);
}

function clearOutput() {
  if (outputUrl) {
    URL.revokeObjectURL(outputUrl);
    outputUrl = null;
  }

  outputPanel.hidden = true;
  downloadLink.removeAttribute("download");
  downloadLink.href = "#";
}

function cleanBaseName(fileName) {
  const withoutExtension = fileName.replace(/\.mp4$/i, "");
  const safeName = withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();

  return (safeName || "converted").slice(0, 120);
}

function selectFile(file) {
  clearOutput();

  if (!file) {
    selectedFile = null;
    selectedFileLabel.textContent = "尚未選取檔案";
    convertButton.disabled = true;
    return;
  }

  if (!file.name.toLowerCase().endsWith(".mp4")) {
    selectedFile = null;
    selectedFileLabel.textContent = "尚未選取檔案";
    setStatus("請選取副檔名為 .mp4 的檔案。", "error");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    selectedFile = null;
    selectedFileLabel.textContent = "尚未選取檔案";
    setStatus("檔案超過 250 MiB 上限；大型檔案請改用本機 CLI。", "error");
    return;
  }

  selectedFile = file;
  selectedFileLabel.textContent = `${file.name} · ${formatBytes(file.size)}`;
  setStatus(isLoaded ? "檔案已選取，可以開始轉檔。" : "檔案已選取，請先載入轉檔器。", "success");
  convertButton.disabled = !isLoaded;
}

async function loadConverter() {
  setBusy(true);
  progress.hidden = false;
  progress.value = 0;
  progressLabel.textContent = "載入中";
  setStatus("正在載入轉檔引擎，第一次約需 31 MiB…");

  try {
    const coreURL = new URL("../ffmpeg/ffmpeg-core.js", import.meta.url).href;
    const wasmURL = new URL("../ffmpeg/ffmpeg-core.wasm", import.meta.url).href;

    await ffmpeg.load({
      coreURL: await toBlobURL(coreURL, "text/javascript"),
      wasmURL: await toBlobURL(wasmURL, "application/wasm"),
    });

    isLoaded = true;
    loadButton.textContent = "轉檔器已載入";
    progress.hidden = true;
    progressLabel.textContent = "";
    setStatus(selectedFile ? "檔案已準備好，可以開始轉檔。" : "轉檔器已載入，請選取 MP4 檔案。", "success");
  } catch {
    progress.hidden = true;
    progressLabel.textContent = "";
    setStatus("轉檔器載入失敗，請重新整理頁面後再試。", "error");
    loadButton.disabled = false;
  } finally {
    setBusy(false);
  }
}

async function convertFile() {
  if (!selectedFile || !isLoaded || isBusy) {
    return;
  }

  setBusy(true);
  clearOutput();
  progress.hidden = false;
  progress.value = 0;
  progressLabel.textContent = "準備中";
  setStatus("正在讀取檔案，檔案不會離開瀏覽器…");

  try {
    await ffmpeg.writeFile(INPUT_FILE_NAME, await fetchFile(selectedFile));
    setStatus("正在轉檔，請保持此頁開啟…");

    const exitCode = await ffmpeg.exec([
      "-i",
      INPUT_FILE_NAME,
      "-vn",
      "-map",
      "0:a:0",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "192k",
      "-map_metadata",
      "0",
      OUTPUT_FILE_NAME,
    ]);

    if (exitCode !== 0) {
      throw new Error("conversion-failed");
    }

    const outputData = await ffmpeg.readFile(OUTPUT_FILE_NAME);
    outputUrl = URL.createObjectURL(new Blob([outputData], { type: "audio/mpeg" }));
    const outputFileName = `${cleanBaseName(selectedFile.name)}.mp3`;
    downloadLink.href = outputUrl;
    downloadLink.download = outputFileName;
    outputSummary.textContent = `${outputFileName} · ${formatBytes(outputData.byteLength)}`;
    outputPanel.hidden = false;
    progress.value = 100;
    progressLabel.textContent = "100%";
    setStatus("轉檔完成。", "success");
  } catch {
    setStatus("轉檔失敗，請確認檔案是可播放且含有音訊的 MP4。", "error");
  } finally {
    try {
      await ffmpeg.deleteFile(INPUT_FILE_NAME);
      await ffmpeg.deleteFile(OUTPUT_FILE_NAME);
    } catch {
      // Temporary files are isolated in the in-memory ffmpeg filesystem.
    }

    setBusy(false);
  }
}

fileInput.addEventListener("change", (event) => {
  selectFile(event.target.files[0]);
});

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (!isBusy) {
      dropZone.classList.add("dragging");
    }
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
}

dropZone.addEventListener("drop", (event) => {
  if (!isBusy) {
    selectFile(event.dataTransfer.files[0]);
  }
});

loadButton.addEventListener("click", loadConverter);
convertButton.addEventListener("click", convertFile);
