import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const LARGE_FILE_WARNING_SIZE = 250 * 1024 * 1024;
const DEFAULT_BITRATE = "192k";
const INPUT_FILE_NAME = "input.mp4";
const OUTPUT_FILE_NAME = "output.mp3";

const ffmpeg = new FFmpeg();
const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const chooseFilesButton = document.querySelector("#choose-files-button");
const selectedFileLabel = document.querySelector("#selected-file");
const bitrateSelect = document.querySelector("#bitrate-select");
const heroQuality = document.querySelector("#hero-quality");
const loadButton = document.querySelector("#load-button");
const convertButton = document.querySelector("#convert-button");
const convertCount = document.querySelector("#convert-count");
const downloadAllButton = document.querySelector("#download-all-button");
const downloadAllCount = document.querySelector("#download-all-count");
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
let crcTable = null;

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

function formatBitrate(bitrate) {
  return bitrate.replace("k", " kbps");
}

function selectedBitrate() {
  return bitrateSelect.value || DEFAULT_BITRATE;
}

function doneItems() {
  return queue.filter((item) => item.status === "done");
}

function completedDownloadItems() {
  return doneItems().filter((item) => item.outputBlob);
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

function updateBitrateSummary() {
  heroQuality.textContent = formatBitrate(selectedBitrate());
}

function updateControls() {
  const pendingCount = pendingItems().length;
  const completedCount = doneItems().length;

  fileInput.disabled = isBusy;
  chooseFilesButton.disabled = isBusy;
  bitrateSelect.disabled = isBusy;
  loadButton.disabled = isBusy || isLoaded;
  clearButton.disabled = isBusy || queue.length === 0;
  downloadAllButton.disabled = isBusy || completedDownloadItems().length === 0;
  convertButton.disabled = isBusy || !isLoaded || pendingCount === 0;
  convertCount.textContent = String(pendingCount);
  downloadAllCount.textContent = String(completedCount);
  dropZone.classList.toggle("disabled", isBusy);
  queueList.querySelectorAll(".queue-action-convert").forEach((button) => {
    button.disabled = isBusy || !isLoaded;
  });
  queueList.querySelectorAll(".queue-action-remove").forEach((button) => {
    button.disabled = isBusy;
  });
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

  item.outputBlob = null;
  item.outputSize = 0;
}

function uniqueFileName(fileName, usedNames) {
  if (!usedNames.has(fileName)) {
    return fileName;
  }

  const extensionIndex = fileName.lastIndexOf(".");
  const stem = extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : "";
  let suffix = 2;
  let candidate = stem + " (" + suffix + ")" + extension;

  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = stem + " (" + suffix + ")" + extension;
  }

  return candidate;
}

function outputFileNameFor(item) {
  const usedNames = new Set(
    queue
      .filter((candidate) => candidate !== item && candidate.outputFileName)
      .map((candidate) => candidate.outputFileName),
  );

  return uniqueFileName(cleanBaseName(item.file.name) + ".mp3", usedNames);
}

function renderQueue() {
  const queued = queue.filter((item) => item.status === "queued").length;
  const completed = doneItems().length;
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

    if (item.file.size > LARGE_FILE_WARNING_SIZE) {
      row.classList.add("large-file");
    }

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

    const bitrate = item.bitrate || selectedBitrate();
    const fileMeta =
      formatBytes(item.file.size) +
      " · MP3 " +
      formatBitrate(bitrate) +
      (item.file.size > LARGE_FILE_WARNING_SIZE ? " · 大型檔案" : "");
    const metadata = createElement("span", "queue-file-meta", fileMeta);
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

    const actions = createElement("div", "queue-actions");

    if (item.status === "done") {
      const download = createElement("a", "queue-download", "下載");
      download.href = item.outputUrl;
      download.download = item.outputFileName;
      download.setAttribute("aria-label", "下載 " + item.outputFileName);
      actions.append(download);
    }

    if (item.status === "queued" || item.status === "error") {
      const convert = createElement(
        "button",
        "queue-action queue-action-convert",
        item.status === "error" ? "重試" : "轉檔",
      );
      convert.type = "button";
      convert.disabled = isBusy || !isLoaded;
      convert.setAttribute(
        "aria-label",
        (item.status === "error" ? "重試 " : "轉檔 ") + item.file.name,
      );
      convert.addEventListener("click", () => convertSingle(item.id));
      actions.append(convert);
    }

    if (item.status !== "converting") {
      const remove = createElement(
        "button",
        "queue-action queue-action-remove",
        "移除",
      );
      remove.type = "button";
      remove.disabled = isBusy;
      remove.setAttribute("aria-label", "移除 " + item.file.name);
      remove.addEventListener("click", () => removeQueueItem(item.id));
      actions.append(remove);
    }

    if (actions.childElementCount === 0) {
      actions.append(createElement("span", "queue-action-placeholder"));
    }

    row.append(icon, content, actions);
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
  let large = 0;
  let duplicate = 0;

  files.forEach((file) => {
    if (!file.name.toLowerCase().endsWith(".mp4")) {
      invalid += 1;
      return;
    }

    if (file.size > LARGE_FILE_WARNING_SIZE) {
      large += 1;
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
      bitrate: null,
      outputUrl: null,
      outputBlob: null,
      outputFileName: "",
      outputSize: 0,
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
  if (large > 0) {
    notes.push(large + " 個大型檔案，可能耗用較多記憶體");
  }
  if (duplicate > 0) {
    notes.push(duplicate + " 個重複檔案");
  }

  if (added > 0) {
    const nextStep = isLoaded
      ? "可以開始轉檔。"
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

function removeQueueItem(itemId) {
  if (isBusy) {
    return;
  }

  const index = queue.findIndex((item) => item.id === itemId);

  if (index < 0) {
    return;
  }

  const [item] = queue.splice(index, 1);
  revokeOutput(item);
  renderQueue();
  setStatus(
    queue.length > 0
      ? "已移除 " + item.file.name + "，佇列還有 " + queue.length + " 個檔案。"
      : "已移除 " + item.file.name + "，佇列目前為空。",
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
        ? "轉檔器已就緒，可以開始轉檔。"
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
  item.bitrate = selectedBitrate();
  item.error = "";
  revokeOutput(item);
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
      item.bitrate,
      "-map_metadata",
      "0",
      OUTPUT_FILE_NAME,
    ]);

    if (exitCode !== 0) {
      throw new Error("conversion-failed");
    }

    const outputData = await ffmpeg.readFile(OUTPUT_FILE_NAME);
    item.outputBlob = new Blob([outputData], { type: "audio/mpeg" });
    item.outputUrl = URL.createObjectURL(item.outputBlob);
    item.outputFileName = outputFileNameFor(item);
    item.outputSize = outputData.byteLength;
    item.progress = 100;
    item.status = "done";
    return true;
  } catch {
    item.status = "error";
    item.error = "檔案可能損壞或不含音訊；可修正後按轉檔或批次轉檔重試。";
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
    isBusy = false;
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

async function convertSingle(itemId) {
  if (!isLoaded || isBusy) {
    return;
  }

  const item = queue.find((candidate) => candidate.id === itemId);

  if (!item || (item.status !== "queued" && item.status !== "error")) {
    return;
  }

  setBusy(true);
  progress.hidden = false;
  progress.value = 0;
  progressLabel.textContent = "準備中";

  let didSucceed = false;

  try {
    didSucceed = await convertItem(item, 0, 1);
  } finally {
    activeItemId = null;
    activeIndex = -1;
    isBusy = false;
    progress.value = didSucceed ? 100 : 0;
    progressLabel.textContent = didSucceed ? "單檔完成" : "單檔失敗";
    updateControls();
  }

  if (didSucceed) {
    setStatus("已完成轉檔：" + item.outputFileName + "。", "success");
  } else {
    setStatus("單檔轉檔失敗，可修正後重試。", "error");
  }
}

function crc32(data) {
  if (!crcTable) {
    crcTable = Array.from({ length: 256 }, (_, index) => {
      let value = index;

      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }

      return value >>> 0;
    });
  }

  let value = 0xffffffff;

  for (const byte of data) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }

  return (value ^ 0xffffffff) >>> 0;
}

function createZipBlob(entries) {
  if (entries.length > 0xffff) {
    throw new Error("too-many-zip-entries");
  }

  let offset = 0;
  const localParts = [];
  const centralRecords = [];

  entries.forEach((entry) => {
    if (entry.data.length > 0xffffffff || offset > 0xffffffff) {
      throw new Error("zip-size-limit");
    }

    const nameBytes = new TextEncoder().encode(entry.name);
    const checksum = crc32(entry.data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, entry.data.length, true);
    localView.setUint32(22, entry.data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, entry.data);
    centralRecords.push({
      checksum,
      dataLength: entry.data.length,
      nameBytes,
      offset,
    });
    offset += localHeader.length + entry.data.length;
  });

  const centralStart = offset;
  const centralParts = centralRecords.map((record) => {
    const centralHeader = new Uint8Array(46 + record.nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, record.checksum, true);
    centralView.setUint32(20, record.dataLength, true);
    centralView.setUint32(24, record.dataLength, true);
    centralView.setUint16(28, record.nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, record.offset, true);
    centralHeader.set(record.nameBytes, 46);

    return centralHeader;
  });
  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);

  if (centralStart > 0xffffffff || centralSize > 0xffffffff) {
    throw new Error("zip-size-limit");
  }

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralStart, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, endRecord], {
    type: "application/zip",
  });
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = createElement("a");
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  link.setAttribute("aria-label", "下載 " + fileName);
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadAll() {
  if (isBusy) {
    return;
  }

  const items = completedDownloadItems();

  if (items.length === 0) {
    setStatus("目前沒有可下載的 MP3。", "error");
    return;
  }

  setBusy(true);
  progress.hidden = false;
  progress.value = 0;
  progressLabel.textContent = "準備 ZIP";
  setStatus("正在準備 " + items.length + " 個 MP3 的 ZIP…");

  try {
    const entries = [];

    for (let index = 0; index < items.length; index += 1) {
      const data = new Uint8Array(await items[index].outputBlob.arrayBuffer());
      entries.push({ name: items[index].outputFileName, data });
      progress.value = Math.round(((index + 1) / items.length) * 100);
      progressLabel.textContent =
        "ZIP " + (index + 1) + "/" + items.length;
    }

    const zipBlob = createZipBlob(entries);
    triggerDownload(zipBlob, "mp4-to-mp3.zip");
    progress.value = 100;
    progressLabel.textContent = "ZIP 完成";
    setStatus("已準備 " + items.length + " 個 MP3，開始下載 ZIP。", "success");
  } catch {
    setStatus("批次下載失敗，請保留分頁開啟後再試。", "error");
  } finally {
    progress.hidden = true;
    setBusy(false);
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

bitrateSelect.addEventListener("change", () => {
  updateBitrateSummary();
  renderQueue();

  if (doneItems().length > 0) {
    setStatus("音質設定只會套用到下一次轉檔；已完成的 MP3 不會改變。");
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
downloadAllButton.addEventListener("click", downloadAll);
clearButton.addEventListener("click", clearQueue);

window.addEventListener("beforeunload", () => {
  queue.forEach(revokeOutput);
});

setEngineState(
  "idle",
  "轉檔器尚未載入",
  "第一次使用會載入約 31 MiB 的本機引擎。",
);
updateBitrateSummary();
renderQueue();
setBusy(false);
