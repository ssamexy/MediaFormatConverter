const STORAGE_KEY = "media-format-converter-locale";
const DEFAULT_LOCALE = "zh-Hant";
const SUPPORTED_LOCALES = ["zh-Hant", "en"];

const messages = {
  "zh-Hant": {
    "app.title": "Media Format Converter｜Browser Media Converter",
    "meta.description": "在瀏覽器內批次轉換常見影音格式，不上傳檔案。",
    "brand.homeLabel": "Media Format Converter 首頁",
    "privacy.local": "私密處理",
    "theme.switchToLight": "切換至淺色模式",
    "theme.switchToDark": "切換至深色模式",
    "theme.light": "淺色",
    "theme.dark": "深色",
    "language.label": "介面語言",
    "language.zh": "繁體中文",
    "language.en": "English",
    "hero.eyebrow": "LOCAL-FIRST · NO UPLOAD",
    "hero.title.first": "把媒體轉換",
    "hero.title.second": "留在你的裝置。",
    "hero.copy": "一次加入多個影音檔案，轉成 MP3、WAV、FLAC、OGG、Opus 或影片格式。整個流程在你的瀏覽器完成，檔案不會上傳到伺服器。",
    "hero.note.aria": "轉檔特色",
    "hero.note.title": "瀏覽器端 WebAssembly",
    "hero.note.detail": "第一次載入引擎後，就能在同一個佇列中批次處理檔案。",
    "workflow.aria": "使用流程",
    "workflow.select.title": "選取檔案",
    "workflow.select.detail": "拖曳或點擊加入",
    "workflow.convert.title": "開始轉檔",
    "workflow.convert.detail": "瀏覽器依序處理",
    "workflow.download.title": "下載結果",
    "workflow.download.detail": "逐檔或一次下載 ZIP",
    "workspace.aria": "影音格式轉換工作區",
    "workspace.kicker": "CONVERTER WORKSPACE",
    "workspace.title": "加入要轉換的檔案",
    "privacy.title": "檔案只在瀏覽器記憶體中處理",
    "privacy.detail": "不需要登入，也不會把影片送到 API 或雲端儲存服務。",
    "upload.inputLabel": "選取影音檔案",
    "upload.title": "拖曳影音檔案到這裡",
    "upload.detail": "或點擊下方按鈕，一次選取多個檔案",
    "upload.choose": "選取影音檔案",
    "upload.none": "尚未加入檔案",
    "upload.help": "支援 MP4、WebM、MOV、MKV、AVI、MP3、WAV、M4A、FLAC、OGG、Opus · 不設硬性大小上限",
    "settings.aria": "輸出格式設定",
    "settings.kicker": "OUTPUT SETTINGS",
    "settings.choose": "選擇格式",
    "settings.output": "輸出格式",
    "settings.bitrate": "MP3 音質 / 位元率",
    "settings.help": "輸出格式只會套用到下一次轉檔；影片輸出需要影片輸入，已完成的檔案不會改變。",
    "settings.normalization": "音量一致化",
    "settings.normalizationHelp": "使用 loudnorm 將每個檔案調整到接近一致的播放音量；會在下一次轉檔套用。",
    "settings.normalizationNextOnly": "音量一致化只會套用到下一次轉檔；已完成的檔案不會改變。",
    "format.audioGroup": "音訊",
    "format.videoGroup": "影片（僅影片輸入）",
    "format.mp3.label": "MP3 · 相容性最佳",
    "format.m4a.label": "M4A (AAC) · 手機與影音",
    "format.wav.label": "WAV · 未壓縮 PCM",
    "format.flac.label": "FLAC · 無損音訊",
    "format.ogg.label": "OGG (Vorbis) · 開放格式",
    "format.opus.label": "Opus · 高效率",
    "format.mp4.label": "MP4 (H.264) · 影片轉碼",
    "format.webm.label": "WebM (VP8) · 影片轉碼",
    "format.mp3.short": "MP3",
    "format.m4a.short": "M4A",
    "format.wav.short": "WAV",
    "format.flac.short": "FLAC",
    "format.ogg.short": "OGG",
    "format.opus.short": "Opus",
    "format.mp4.short": "MP4",
    "format.webm.short": "WebM",
    "bitrate.128": "128 kbps · 小檔案",
    "bitrate.192": "192 kbps · 建議",
    "bitrate.256": "256 kbps · 高音質",
    "bitrate.320": "320 kbps · 最高",
    "engine.idle.title": "轉檔器尚未載入",
    "engine.idle.detail": "第一次使用會載入約 31 MiB 的本機引擎。",
    "engine.loading.title": "正在載入轉檔器",
    "engine.loading.detail": "第一次使用會下載約 31 MiB，之後可由瀏覽器快取重複使用。",
    "engine.ready.title": "轉檔器已就緒",
    "engine.ready.detail": "所有檔案會在此瀏覽器內依序完成轉換。",
    "engine.error.title": "轉檔器載入失敗",
    "engine.error.detail": "請重新整理頁面後再試，並確認網路可連線到此頁面。",
    "engine.load": "載入轉檔器",
    "engine.loading": "載入中…",
    "engine.loaded": "轉檔器已載入",
    "engine.retry": "重新載入轉檔器",
    "status.initial": "先加入檔案，再載入轉檔器即可開始。",
    "action.convertAll": "開始批次轉檔",
    "queue.kicker": "BATCH QUEUE",
    "queue.title": "目前佇列",
    "queue.downloadAll": "下載全部",
    "queue.clearAll": "清除全部",
    "queue.stats.queued": "待處理",
    "queue.stats.done": "已完成",
    "queue.stats.error": "失敗",
    "queue.stats.aria": "佇列統計",
    "queue.empty.title": "佇列目前為空",
    "queue.empty.detail": "把一個或多個影音檔案拖到左側，就會顯示在這裡。",
    "queue.footnote": "轉檔依序在此瀏覽器執行；無硬性大小上限，但大型檔案可能耗用較多記憶體。影片輸出會更耗時。",
    "help.aria": "使用說明",
    "help.add.title": "加入檔案",
    "help.add.detail": "拖曳或點擊選取多個影音檔案，檔案會先進入佇列，不會立即上傳；也可隨時移除項目。",
    "help.convert.title": "載入並轉換",
    "help.convert.detail": "載入引擎後選擇輸出格式，可按「開始批次轉檔」，或在單一佇列項目按「轉檔」。",
    "help.download.title": "逐檔下載",
    "help.download.detail": "可逐檔下載，也可按「下載全部」一次取得 ZIP；完成項目仍可單獨移除。",
    "footer.built": "Built with ffmpeg.wasm · runs locally in your browser",
    "media.mixed": "影音",
    "media.video": "影片",
    "media.audio": "音訊",
    "status.queued": "待處理",
    "status.converting": "轉檔中",
    "status.done": "已完成",
    "status.error": "失敗",
    "selected.summary": "{count} 個檔案 · {size}",
    "queue.meta": "{size} · {input} → {output}{warning}",
    "queue.largeFile": " · 大型檔案",
    "queue.progressAria": "{name} 轉檔進度",
    "queue.errorDefault": "檔案可能損壞或不含音訊。",
    "action.download": "下載",
    "action.retry": "重試",
    "action.convert": "轉檔",
    "action.remove": "移除",
    "action.downloadAria": "下載 {name}",
    "action.retryAria": "重試 {name}",
    "action.convertAria": "轉檔 {name}",
    "action.removeAria": "移除 {name}",
    "files.invalid": "{count} 個格式不符",
    "files.large": "{count} 個大型檔案，可能耗用較多記憶體",
    "files.duplicate": "{count} 個重複檔案",
    "files.audioOnly": "音訊檔案只能輸出音訊，已切回 MP3",
    "files.nextConvert": "可以開始轉檔。",
    "files.nextLoad": "接著載入轉檔器。",
    "files.added": "已加入 {added} 個檔案，佇列共有 {total} 個。{detail}{next}",
    "files.noneReason": "沒有加入檔案：{reason}。",
    "files.none": "沒有找到可加入的支援影音檔案。",
    "remove.remaining": "已移除 {name}，佇列還有 {count} 個檔案。",
    "remove.empty": "已移除 {name}，佇列目前為空。",
    "queue.cleared": "佇列已清除，可以加入新的影音檔案。",
    "status.loading": "正在載入本機轉檔引擎，請稍候…",
    "status.readyWithQueue": "轉檔器已就緒，可以開始轉檔。",
    "status.readyEmpty": "轉檔器已就緒，請先加入影音檔案。",
    "status.loadFailed": "轉檔器載入失敗，請重新整理頁面後再試。",
    "status.convertingStart": "正在轉檔 {current}/{total}：{name}…",
    "status.converting": "正在轉檔 {current}/{total}，請保持此頁開啟…",
    "status.allDone": "所有檔案都已完成轉檔。",
    "status.batchSuccess": "批次完成：成功轉換 {count} 個檔案。",
    "status.batchFailure": "批次完成：成功 {success} 個，失敗 {failed} 個；失敗項目可以重試。",
    "status.singleSuccess": "已完成轉檔：{name}。",
    "status.singleFailure": "單檔轉檔失敗，可修正後重試。",
    "status.conversionError": "無法以 {format} 產生輸出；檔案可能損壞、缺少所需影音軌，或此裝置記憶體不足。",
    "status.formatFallback": "目前佇列含音訊檔案，影片輸出已切回 MP3。",
    "status.formatNextOnly": "輸出格式只會套用到下一次轉檔；已完成的檔案不會改變。",
    "status.bitrateNextOnly": "音質設定只會套用到下一次 MP3 轉檔；已完成的檔案不會改變。",
    "progress.preparing": "準備中",
    "progress.batchDone": "批次完成",
    "progress.batchEnd": "批次結束",
    "progress.singleDone": "單檔完成",
    "progress.singleFailed": "單檔失敗",
    "status.noDownload": "目前沒有可下載的轉換結果。",
    "status.zipPreparing": "正在準備 {count} 個轉換結果的 ZIP…",
    "status.zipReady": "已準備 {count} 個檔案，開始下載 ZIP。",
    "status.zipFailed": "批次下載失敗，請保留分頁開啟後再試。",
  },
  en: {
    "app.title": "Media Format Converter｜Browser Media Converter",
    "meta.description": "Convert common media formats in your browser without uploading files.",
    "brand.homeLabel": "Media Format Converter home",
    "privacy.local": "Private processing",
    "theme.switchToLight": "Switch to light mode",
    "theme.switchToDark": "Switch to dark mode",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "language.label": "Interface language",
    "language.zh": "Traditional Chinese",
    "language.en": "English",
    "hero.eyebrow": "LOCAL-FIRST · NO UPLOAD",
    "hero.title.first": "Keep media",
    "hero.title.second": "on your device.",
    "hero.copy": "Add multiple media files at once and convert them to MP3, WAV, FLAC, OGG, Opus, or video formats. Everything runs in your browser, and files are never uploaded.",
    "hero.note.aria": "Converter highlights",
    "hero.note.title": "WebAssembly in your browser",
    "hero.note.detail": "Load the engine once, then process files in the same batch queue.",
    "workflow.aria": "Workflow",
    "workflow.select.title": "Select files",
    "workflow.select.detail": "Drag or click to add",
    "workflow.convert.title": "Convert",
    "workflow.convert.detail": "Processed locally in order",
    "workflow.download.title": "Download results",
    "workflow.download.detail": "One file or a ZIP",
    "workspace.aria": "Media format conversion workspace",
    "workspace.kicker": "CONVERTER WORKSPACE",
    "workspace.title": "Add files to convert",
    "privacy.title": "Files stay in browser memory",
    "privacy.detail": "No sign-in is needed, and media is never sent to an API or cloud storage service.",
    "upload.inputLabel": "Select media files",
    "upload.title": "Drag media files here",
    "upload.detail": "Or use the button below to select multiple files",
    "upload.choose": "Select media files",
    "upload.none": "No files added",
    "upload.help": "Supports MP4, WebM, MOV, MKV, AVI, MP3, WAV, M4A, FLAC, OGG, and Opus · No hard size limit",
    "settings.aria": "Output format settings",
    "settings.kicker": "OUTPUT SETTINGS",
    "settings.choose": "Choose format",
    "settings.output": "Output format",
    "settings.bitrate": "MP3 quality / bitrate",
    "settings.help": "Output settings apply to the next conversion only; video output requires video input, and completed files are unchanged.",
    "settings.normalization": "Normalize loudness",
    "settings.normalizationHelp": "Use loudnorm to bring each file toward a consistent playback level; applied to the next conversion.",
    "settings.normalizationNextOnly": "Loudness normalization applies to the next conversion only; completed files are unchanged.",
    "format.audioGroup": "Audio",
    "format.videoGroup": "Video (video input only)",
    "format.mp3.label": "MP3 · Best compatibility",
    "format.m4a.label": "M4A (AAC) · Mobile and media",
    "format.wav.label": "WAV · Uncompressed PCM",
    "format.flac.label": "FLAC · Lossless audio",
    "format.ogg.label": "OGG (Vorbis) · Open format",
    "format.opus.label": "Opus · Efficient audio",
    "format.mp4.label": "MP4 (H.264) · Video transcode",
    "format.webm.label": "WebM (VP8) · Video transcode",
    "format.mp3.short": "MP3",
    "format.m4a.short": "M4A",
    "format.wav.short": "WAV",
    "format.flac.short": "FLAC",
    "format.ogg.short": "OGG",
    "format.opus.short": "Opus",
    "format.mp4.short": "MP4",
    "format.webm.short": "WebM",
    "bitrate.128": "128 kbps · Smaller file",
    "bitrate.192": "192 kbps · Recommended",
    "bitrate.256": "256 kbps · High quality",
    "bitrate.320": "320 kbps · Highest",
    "engine.idle.title": "Converter not loaded",
    "engine.idle.detail": "The local engine downloads about 31 MiB the first time.",
    "engine.loading.title": "Loading converter",
    "engine.loading.detail": "About 31 MiB downloads the first time and can then be reused from browser cache.",
    "engine.ready.title": "Converter ready",
    "engine.ready.detail": "Files are converted one at a time in this browser.",
    "engine.error.title": "Converter failed to load",
    "engine.error.detail": "Refresh the page and try again; make sure this page can reach the network.",
    "engine.load": "Load converter",
    "engine.loading": "Loading…",
    "engine.loaded": "Converter loaded",
    "engine.retry": "Reload converter",
    "status.initial": "Add files, then load the converter to begin.",
    "action.convertAll": "Start batch conversion",
    "queue.kicker": "BATCH QUEUE",
    "queue.title": "Current queue",
    "queue.downloadAll": "Download all",
    "queue.clearAll": "Clear all",
    "queue.stats.queued": "Queued",
    "queue.stats.done": "Completed",
    "queue.stats.error": "Failed",
    "queue.stats.aria": "Queue statistics",
    "queue.empty.title": "Queue is empty",
    "queue.empty.detail": "Drag one or more media files to the left and they will appear here.",
    "queue.footnote": "Conversions run in order in this browser; there is no hard size limit, but large files may use more memory. Video output takes longer.",
    "help.aria": "How it works",
    "help.add.title": "Add files",
    "help.add.detail": "Drag or select multiple media files. They enter the queue without uploading, and can be removed at any time.",
    "help.convert.title": "Load and convert",
    "help.convert.detail": "Load the engine, choose an output format, then start a batch or convert an individual queue item.",
    "help.download.title": "Download individually",
    "help.download.detail": "Download files one by one, or use Download all to get a ZIP; completed items can still be removed individually.",
    "footer.built": "Built with ffmpeg.wasm · runs locally in your browser",
    "media.mixed": "Media",
    "media.video": "Video",
    "media.audio": "Audio",
    "status.queued": "Queued",
    "status.converting": "Converting",
    "status.done": "Completed",
    "status.error": "Failed",
    "selected.summary": "{count} file(s) · {size}",
    "queue.meta": "{size} · {input} → {output}{warning}",
    "queue.largeFile": " · Large file",
    "queue.progressAria": "Conversion progress for {name}",
    "queue.errorDefault": "The file may be damaged or have no audio stream.",
    "action.download": "Download",
    "action.retry": "Retry",
    "action.convert": "Convert",
    "action.remove": "Remove",
    "action.downloadAria": "Download {name}",
    "action.retryAria": "Retry {name}",
    "action.convertAria": "Convert {name}",
    "action.removeAria": "Remove {name}",
    "files.invalid": "{count} unsupported format(s)",
    "files.large": "{count} large file(s) may use more memory",
    "files.duplicate": "{count} duplicate file(s)",
    "files.audioOnly": "Audio files can only use audio output; switched back to MP3",
    "files.nextConvert": "You can start converting.",
    "files.nextLoad": "Load the converter next.",
    "files.added": "Added {added} file(s); {total} in queue. {detail}{next}",
    "files.noneReason": "No files added: {reason}.",
    "files.none": "No supported media files found.",
    "remove.remaining": "Removed {name}; {count} file(s) remain in the queue.",
    "remove.empty": "Removed {name}; the queue is now empty.",
    "queue.cleared": "Queue cleared. You can add new media files.",
    "status.loading": "Loading the local conversion engine…",
    "status.readyWithQueue": "Converter ready. You can start converting.",
    "status.readyEmpty": "Converter ready. Add media files to begin.",
    "status.loadFailed": "Converter failed to load. Refresh the page and try again.",
    "status.convertingStart": "Converting {current}/{total}: {name}…",
    "status.converting": "Converting {current}/{total}; keep this page open…",
    "status.allDone": "All files have already been converted.",
    "status.batchSuccess": "Batch complete: converted {count} file(s) successfully.",
    "status.batchFailure": "Batch complete: {success} succeeded, {failed} failed; failed items can be retried.",
    "status.singleSuccess": "Conversion complete: {name}.",
    "status.singleFailure": "Single-file conversion failed; fix the issue and try again.",
    "status.conversionError": "Could not create {format} output; the file may be damaged, missing a required stream, or too large for this device's memory.",
    "status.formatFallback": "The queue contains audio; video output was switched back to MP3.",
    "status.formatNextOnly": "Output settings apply to the next conversion only; completed files are unchanged.",
    "status.bitrateNextOnly": "Quality settings apply to the next MP3 conversion only; completed files are unchanged.",
    "progress.preparing": "Preparing",
    "progress.batchDone": "Batch complete",
    "progress.batchEnd": "Batch ended",
    "progress.singleDone": "File complete",
    "progress.singleFailed": "File failed",
    "status.noDownload": "There are no converted results to download.",
    "status.zipPreparing": "Preparing a ZIP of {count} converted result(s)…",
    "status.zipReady": "Prepared {count} file(s); starting ZIP download.",
    "status.zipFailed": "Batch download failed. Keep this tab open and try again.",
  },
};

let currentLocale = readStoredLocale();

function readStoredLocale() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LOCALES.includes(stored)) {
      return stored;
    }
  } catch {
    // Browser storage may be unavailable in private or restricted contexts.
  }

  return navigator.language?.toLowerCase().startsWith("zh")
    ? DEFAULT_LOCALE
    : "en";
}

export function getLocale() {
  return currentLocale;
}

export function t(key, values = {}) {
  const template = messages[currentLocale][key] || messages[DEFAULT_LOCALE][key] || key;

  return template.replace(/\{(\w+)\}/g, (_, name) =>
    values[name] === undefined ? "" : String(values[name]),
  );
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  root.querySelectorAll("[data-i18n-content]").forEach((element) => {
    element.setAttribute("content", t(element.dataset.i18nContent));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  root.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });

  document.documentElement.lang = currentLocale;
}

export function setLocale(nextLocale) {
  if (!SUPPORTED_LOCALES.includes(nextLocale) || nextLocale === currentLocale) {
    return;
  }

  currentLocale = nextLocale;

  try {
    window.localStorage.setItem(STORAGE_KEY, currentLocale);
  } catch {
    // The interface still works when preferences cannot be persisted.
  }

  applyTranslations();
  window.dispatchEvent(new CustomEvent("localechange"));
}

export function formatOutputLabel(formatId) {
  return t("format." + formatId + ".label");
}

export function formatOutputShortLabel(formatId) {
  return t("format." + formatId + ".short");
}
