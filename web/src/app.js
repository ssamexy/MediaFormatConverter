import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const MAX_FILE_SIZE = 250 * 1024 * 1024;
const INPUT_FILE_NAME = "input.mp4";
const OUTPUT_FILE_NAME = "output.mp3";

const ffmpeg = new FFmpeg();
const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const chooseFilesButton = document.querySelector("#choose-files-button");
const selectedFileLabel = document.querySelector("#selected-file");
const loadButton = document.querySelector("#load-button");
const convertButton = document.querySelector("#convert-button");
const convertCount = document.querySelector("#convert-count");
const clearButton = document.querySelector("#clear-button");
const progress = document.querySelector("#progress");
const progressLabel = document.querySelector("#progress-label");
const statusMessage = document.querySelector("#status-message");
const engineDot = document.querySelector("#engine-dot");
const engineStatus = document.querySelector("#engine-status");
const engineDetail = document.querySelector("#engine-detail");
const queueCount = document.querySelector("#queue-count");
const queuedCount = document.querySelector("#queued-count");
const completedCount = document.querySelector("#completed-count");
const failedCount = document.querySelector("#failed-count");
const queueEmpty = document.querySelector("#queue-empty");
const queueList = document.querySelector("#queue-list");
const workflowSteps = [...document.querySelectorAll(".workflow-step")];

const queue = [];
const statusLabels = {
  queued: "待處理",
  converting: "轉檔中",
  done: "已完成",
  error: "失敗",
};

let isLoaded = false;
let isBusy = false;
let activeItemId = null;
let activeIndex = -1;
let batchTotal = 0;
let nextQueueId = 1;
let lastQueueRenderAt = 0;

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return Math.max(1, Math.round(bytes / 1024)) + " KiB";
  }

  if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MiB";
  }

  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GiB";
}

function formatQueueSize() {
  const totalBytes = queue.reduce((total, item) => total + item.file.size, 0);
  return formatBytes(totalBytes);
}

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = ("status-message " + type).trim();
}

function setEngineState(state, title, detail) {
  engineDot.className = ("engine-dot " + state).trim();
  engineStatus.textContent = title;
  engineDetail.textContent = detail;
}

function pendingItems() {
  return queue.filter((item) => item.status === "queued" || item.status === "error");
}

function updateWorkflow() {
  const hasQueue = queue.length > 0;
  const hasCompleted = queue.some((item) => item.status === "done");
  const hasPending = pendingItems().length > 0;
  const allComplete = hasQueue && !hasPending && hasCompleted;

  workflowSteps.forEach((step) => {
    const stepNumber = Number(step.dataset.step);
    const isComplete =
      (stepNumber === 1 && hasQueue) ||
      (stepNumber === 2 && allComplete) ||
      (stepNumber === 3 && hasCompleted);

    const isActive =
      (stepNumber === 1 && !hasQueue) ||
      (stepNumber === 2 && hasQueue && hasPending) ||
      (stepNumber === 3 && hasCompleted && !hasPending);

    step.classList.toggle("complete", isComplete);
    step.classList.toggle("active", isActive);
  });
}

function updateSelectedSummary() {
  if (queue.length === 0) {
    selectedFileLabel.textContent = "尚未加入檔案";
    return;
  }

  selectedFileLabel.textContent =
    queue.length + " 個檔案 · " + formatQueueSize();
}

function updateControls() {
  const pendingCount = pendingItems().length;

  fileInput.disabled = isBusy;
  chooseFilesButton.disabled = isBusy;
  loadButton.disabled = isBusy || isLoaded;
  clearButton.disabled = isBusy || queue.length === 0;
  convertButton.disabled = isBusy || !isLoaded || pendingCount === 0;
  convertCount.textContent = String(pendingCount);
  dropZone.classList.toggle("disabled", isBusy);
  updateWorkflow();
}

function setBusy(busy) {
  isBusy = busy;
  updateControls();
}

function revokeOutput(item) {
  if (item.outputUrl) {
    URL.revokeObjectURL(item.outputUrl);
    item.outputUrl = null;
  }
}

function renderQueue() {
  const queued = queue.filter((item) => item.status === "queued").length;
  const completed = queue.filter((item) => item.status === "done").length;
  const failed = queue.filter((item) => item.status === "error").length;

  queueCount.textContent = String(queue.length);
  queuedCount.textContent = String(queued);
  completedCount.textContent = String(completed);
  failedCount.textContent = String(failed);
  queueEmpty.hidden = queue.length > 0;
  queueList.hidden = queue.length === 0;
  queueList.replaceChildren();

  const fragment = document.createDocumentFragment();

  queue.forEach((item) => {
    const row = createElement("article", "queue-item " + item.status);
    row.setAttribute("role", "listitem");

    const icon = createElement(
      "span",
      "queue-file-icon",
      item.status === "done" ? "♫" : "•",
    );
    icon.setAttribute("aria-hidden", "true");

    const content = createElement("div", "queue-file-content");
    const topLine = createElement("div", "queue-file-top");
    const name = createElement("strong", "queue-file-name", item.file.name);
    name.title = item.file.name;
    const pill = createElement(
      "span",
      "status-pill " + item.status,
      statusLabels[item.status],
    );
    topLine.append(name, pill);

    const metadata = createElement(
      "span",
      "queue-file-meta",
      formatBytes(item.file.size) + " · MP3 192 kbps",
    );
    content.append(topLine, metadata);

    if (item.status === "converting") {
      const itemProgress = createElement("div", "item-progress");
      const itemBar = createElement("progress", "item-progress-bar");
      itemBar.max = 100;
      itemBar.value = item.progress;
      itemBar.setAttribute("aria-label", item.file.name + " 轉檔進度");
      const itemPercent = createElement(
        "span",
        "item-progress-label",
        Math.round(item.progress) + "%",
      );
      itemProgress.append(itemBar, itemPercent);
      content.append(itemProgress);
    }

    if (item.status === "error") {
      content.append(
        createElement(
          "span",
          "queue-error",
          item.error || "檔案可能損壞或不含音訊。",
        ),
      );
    }

    const action = item.status === "done"
      ? createElement("a", "queue-download", "下載")
      : createElement("span", "queue-action-placeholder");

    if (item.status === "done") {
      action.href = item.outputUrl;
      action.download = item.outputFileName;
      action.setAttribute("aria-label", "下載 " + item.outputFileName);
    }

    row.append(icon, content, action);
    fragment.append(row);
  });

  queueList.append(fragment);
  updateSelectedSummary();
  updateControls();
}

function cleanBaseName(fileName) {
  const withoutExtension = fileName.replace(/\.mp4$/i, "");
  const safeName = withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();

  return (safeName || "converted").slice(0, 120);
}

function addFiles(fileList) {
  if (isBusy) {
    return;
  }

  const files = Array.from(fileList || []);

  if (files.length === 0) {
    return;
  }

  let added = 0;
  let invalid = 0;
  let oversized = 0;
  let duplicate = 0;

  files.forEach((file) => {
    if (!file.name.toLowerCase().endsWith(".mp4")) {
      invalid += 1;
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      oversized += 1;
      return;
    }

    const alreadyAdded = queue.some(
      (item) =>
        item.file.name === file.name &&
        item.file.size === file.size &&
        item.file.lastModified === file.lastModified,
    );

    if (alreadyAdded) {
      duplicate += 1;
      return;
    }

    queue.push({
      id: String(nextQueueId),
      file,
      status: "queued",
      progress: 0,
      outputUrl: null,
      outputFileName: "",
      error: "",
    });
    nextQueueId += 1;
    added += 1;
  });

  fileInput.value = "";
  renderQueue();

  const notes = [];
  if (invalid > 0) {
    notes.push(invalid + " 個格式不符");
  }
  if (oversized > 0) {
    notes.push(oversized + " 個超過 250 MiB");
  }
  if (duplicate > 0) {
    notes.push(duplicate + " 個重複檔案");
  }

  if (added > 0) {
    const nextStep = isLoaded
      ? "可以開始批次轉檔。"
      : "接著載入轉檔器。";
    const detail = notes.length > 0 ? "（" + notes.join("、") + "）" : "";
    setStatus(
      "已加入 " + added + " 個檔案，佇列共有 " + queue.length + " 個。" + detail + nextStep,
      "success",
    );
    return;
  }

  setStatus(
    notes.length > 0
      ? "沒有加入檔案：" + notes.join("、") + "。"
      : "沒有找到可加入的 MP4 檔案。",
    "error",
  );
}

function clearQueue() {
  if (isBusy) {
    return;
  }

  queue.forEach(revokeOutput);
  queue.length = 0;
  progress.hidden = true;
  progress.value = 0;
  progressLabel.textContent = "";
  renderQueue();
  setStatus("佇列已清除，可以加入新的 MP4 檔案。");
}

async function loadConverter() {
  if (isBusy || isLoaded) {
    return;
  }

  setBusy(true);
  progress.hidden = false;
  progress.value = 0;
  progressLabel.textContent = "載入中";
  loadButton.textContent = "載入中…";
  setEngineState(
    "loading",
    "正在載入轉檔器",
    "第一次使用會下載約 31 MiB，之後可由瀏覽器快取重複使用。",
  );
  setStatus("正在載入本機轉檔引擎，請稍候…");

  try {
    const coreURL = new URL("../ffmpeg/ffmpeg-core.js", import.meta.url).href;
    const wasmURL = new URL("../ffmpeg/ffmpeg-core.wasm", import.meta.url).href;

    await ffmpeg.load({
      coreURL: await toBlobURL(coreURL, "text/javascript"),
      wasmURL: await toBlobURL(wasmURL, "application/wasm"),
    });

    isLoaded = true;
    loadButton.textContent = "轉檔器已載入";
    setEngineState(
      "ready",
      "轉檔器已就緒",
      "所有檔案會在此瀏覽器內依序完成轉換。",
    );
    progress.hidden = true;
    progressLabel.textContent = "";
    setStatus(
      queue.length > 0
        ? "轉檔器已就緒，可以開始批次轉檔。"
        : "轉檔器已就緒，請先加入 MP4 檔案。",
      "success",
    );
  } catch {
    isLoaded = false;
    loadButton.textContent = "重新載入轉檔器";
    setEngineState(
      "error",
      "轉檔器載入失敗",
      "請重新整理頁面後再試，並確認網路可連線到此頁面。",
    );
    progress.hidden = true;
    progressLabel.textContent = "";
    setStatus("轉檔器載入失敗，請重新整理頁面後再試。", "error");
  } finally {
    setBusy(false);
  }
}

async function deleteTemporaryFile(fileName) {
  try {
    await ffmpeg.deleteFile(fileName);
  } catch {
    // The in-memory file may not exist after a failed conversion.
  }
}

async function convertItem(item, index, total) {
  activeItemId = item.id;
  activeIndex = index;
  batchTotal = total;
  item.status = "converting";
  item.progress = 0;
  item.error = "";
  renderQueue();
  progress.hidden = false;
  progress.value = 0;
  progressLabel.textContent = (index + 1) + "/" + total + " · 0%";
  setStatus(
    "正在轉檔 " + (index + 1) + "/" + total + "：" + item.file.name + "…",
  );

  await deleteTemporaryFile(INPUT_FILE_NAME);
  await deleteTemporaryFile(OUTPUT_FILE_NAME);

  try {
    await ffmpeg.writeFile(INPUT_FILE_NAME, await fetchFile(item.file));
    setStatus(
      "正在轉檔 " + (index + 1) + "/" + total + "，請保持此頁開啟…",
    );

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
    item.outputUrl = URL.createObjectURL(
      new Blob([outputData], { type: "audio/mpeg" }),
    );
    item.outputFileName = cleanBaseName(item.file.name) + ".mp3";
    item.outputSize = outputData.byteLength;
    item.progress = 100;
    item.status = "done";
    return true;
  } catch {
    item.status = "error";
    item.error = "檔案可能損壞或不含音訊；可修正後按批次轉檔重試。";
    return false;
  } finally {
    await deleteTemporaryFile(INPUT_FILE_NAME);
    await deleteTemporaryFile(OUTPUT_FILE_NAME);
    activeItemId = null;
    activeIndex = -1;
    renderQueue();
  }
}

async function convertQueue() {
  if (!isLoaded || isBusy) {
    return;
  }

  const items = pendingItems();

  if (items.length === 0) {
    setStatus("所有檔案都已完成轉檔。", "success");
    return;
  }

  isBusy = true;
  updateControls();
  progress.hidden = false;
  progress.value = 0;
  progressLabel.textContent = "準備中";

  let succeeded = 0;
  let failed = 0;

  try {
    for (let index = 0; index < items.length; index += 1) {
      const didSucceed = await convertItem(items[index], index, items.length);

      if (didSucceed) {
        succeeded += 1;
      } else {
        failed += 1;
      }
    }
  } finally {
    activeItemId = null;
    activeIndex = -1;
    progress.value = failed === 0 ? 100 : progress.value;
    progressLabel.textContent = failed === 0 ? "批次完成" : "批次結束";
    updateControls();
  }

  if (failed > 0) {
    setStatus(
      "批次完成：成功 " + succeeded + " 個，失敗 " + failed + " 個；失敗項目可以重試。",
      "error",
    );
  } else {
    setStatus("批次完成：成功轉換 " + succeeded + " 個檔案。", "success");
  }
}

ffmpeg.on("progress", ({ progress: conversionProgress }) => {
  if (!isBusy || !activeItemId || !Number.isFinite(conversionProgress)) {
    return;
  }

  const item = queue.find((candidate) => candidate.id === activeItemId);

  if (!item) {
    return;
  }

  const percentage = Math.round(
    Math.min(1, Math.max(0, conversionProgress)) * 100,
  );
  item.progress = percentage;
  progress.value = percentage;
  progressLabel.textContent =
    (activeIndex + 1) + "/" + batchTotal + " · " + percentage + "%";

  const now = Date.now();
  if (now - lastQueueRenderAt > 120 || percentage === 100) {
    lastQueueRenderAt = now;
    renderQueue();
  }
});

fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files);
});

chooseFilesButton.addEventListener("click", () => {
  if (!isBusy) {
    fileInput.click();
  }
});

dropZone.addEventListener("click", (event) => {
  if (
    isBusy ||
    (event.target instanceof Element && event.target.closest("button"))
  ) {
    return;
  }

  fileInput.click();
});

dropZone.addEventListener("keydown", (event) => {
  if (isBusy || (event.target instanceof Element && event.target.closest("button"))) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();

    if (!isBusy) {
      dropZone.classList.add("dragging");
      event.dataTransfer.dropEffect = "copy";
    }
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();

    if (!event.relatedTarget || !dropZone.contains(event.relatedTarget)) {
      dropZone.classList.remove("dragging");
    }
  });
});

dropZone.addEventListener("drop", (event) => {
  if (!isBusy) {
    addFiles(event.dataTransfer.files);
  }
});

loadButton.addEventListener("click", loadConverter);
convertButton.addEventListener("click", convertQueue);
clearButton.addEventListener("click", clearQueue);

window.addEventListener("beforeunload", () => {
  queue.forEach(revokeOutput);
});

setEngineState(
  "idle",
  "轉檔器尚未載入",
  "第一次使用會載入約 31 MiB 的本機引擎。",
);
renderQueue();
setBusy(false);
