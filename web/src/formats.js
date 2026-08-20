const inputFormatDefinitions = [
  { extension: "mp4", kind: "video", label: "MP4", mime: "video/mp4" },
  { extension: "webm", kind: "video", label: "WebM", mime: "video/webm" },
  { extension: "mov", kind: "video", label: "MOV", mime: "video/quicktime" },
  {
    extension: "mkv",
    kind: "video",
    label: "MKV",
    mime: "video/x-matroska",
  },
  {
    extension: "avi",
    kind: "video",
    label: "AVI",
    mime: "video/x-msvideo",
  },
  { extension: "m4v", kind: "video", label: "M4V", mime: "video/x-m4v" },
  { extension: "ogv", kind: "video", label: "OGV", mime: "video/ogg" },
  { extension: "mpeg", kind: "video", label: "MPEG", mime: "video/mpeg" },
  { extension: "mpg", kind: "video", label: "MPEG", mime: "video/mpeg" },
  { extension: "ts", kind: "video", label: "MPEG-TS", mime: "video/mp2t" },
  { extension: "mp3", kind: "audio", label: "MP3", mime: "audio/mpeg" },
  { extension: "wav", kind: "audio", label: "WAV", mime: "audio/wav" },
  { extension: "m4a", kind: "audio", label: "M4A", mime: "audio/mp4" },
  { extension: "aac", kind: "audio", label: "AAC", mime: "audio/aac" },
  { extension: "flac", kind: "audio", label: "FLAC", mime: "audio/flac" },
  { extension: "ogg", kind: "audio", label: "OGG", mime: "audio/ogg" },
  { extension: "oga", kind: "audio", label: "OGA", mime: "audio/ogg" },
  { extension: "opus", kind: "audio", label: "Opus", mime: "audio/opus" },
];

const inputFormats = new Map(
  inputFormatDefinitions.map((format) => [format.extension, format]),
);

export const SUPPORTED_INPUT_EXTENSIONS = inputFormatDefinitions.map(
  (format) => format.extension,
);

export const INPUT_ACCEPT = [
  ...SUPPORTED_INPUT_EXTENSIONS.map((extension) => "." + extension),
  ...inputFormatDefinitions.map((format) => format.mime),
].join(",");

export const OUTPUT_FORMATS = {
  mp3: {
    id: "mp3",
    kind: "audio",
    label: "MP3",
    extension: "mp3",
    mime: "audio/mpeg",
    detail: "相容性最佳 · 可調整位元率",
  },
  m4a: {
    id: "m4a",
    kind: "audio",
    label: "M4A (AAC)",
    extension: "m4a",
    mime: "audio/mp4",
    detail: "AAC 音訊 · 適合手機與影音播放",
  },
  wav: {
    id: "wav",
    kind: "audio",
    label: "WAV",
    extension: "wav",
    mime: "audio/wav",
    detail: "未壓縮 PCM · 檔案較大",
  },
  flac: {
    id: "flac",
    kind: "audio",
    label: "FLAC",
    extension: "flac",
    mime: "audio/flac",
    detail: "無損音訊 · 檔案較大",
  },
  ogg: {
    id: "ogg",
    kind: "audio",
    label: "OGG (Vorbis)",
    extension: "ogg",
    mime: "audio/ogg",
    detail: "開放格式 · 適合網頁播放",
  },
  opus: {
    id: "opus",
    kind: "audio",
    label: "Opus",
    extension: "opus",
    mime: "audio/ogg",
    detail: "高效率語音與音樂編碼",
  },
  mp4: {
    id: "mp4",
    kind: "video",
    label: "MP4 (H.264)",
    extension: "mp4",
    mime: "video/mp4",
    detail: "影片轉碼 · H.264 + AAC",
  },
  webm: {
    id: "webm",
    kind: "video",
    label: "WebM (VP8)",
    extension: "webm",
    mime: "video/webm",
    detail: "影片轉碼 · VP8 + Opus",
  },
};

export const DEFAULT_OUTPUT_FORMAT = "mp3";

export function getFileExtension(fileName) {
  const match = String(fileName).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

export function getInputFormat(file) {
  return inputFormats.get(getFileExtension(file.name)) || null;
}

export function isSupportedInput(file) {
  return Boolean(getInputFormat(file));
}

export function getOutputFormat(formatId) {
  return OUTPUT_FORMATS[formatId] || OUTPUT_FORMATS[DEFAULT_OUTPUT_FORMAT];
}

export function outputFormatSummary(formatId, bitrate) {
  const format = getOutputFormat(formatId);

  if (format.id === "mp3") {
    return format.label + " · " + bitrate.replace("k", " kbps");
  }

  return format.label;
}

export function outputFormatMeta(formatId, bitrate) {
  const format = getOutputFormat(formatId);
  const bitrateLabel = format.id === "mp3" ? " · " + bitrate.replace("k", " kbps") : "";
  return format.label + bitrateLabel;
}

export function canConvertToOutput(file, formatId) {
  const format = getOutputFormat(formatId);
  const input = getInputFormat(file);
  return Boolean(input && (format.kind === "audio" || input.kind === "video"));
}

export function buildOutputArgs(formatId, inputFileName, outputFileName, bitrate) {
  const format = getOutputFormat(formatId);
  const metadataArgs = ["-map_metadata", "0"];

  if (format.id === "mp3") {
    return [
      "-i",
      inputFileName,
      "-vn",
      "-map",
      "0:a:0?",
      "-c:a",
      "libmp3lame",
      "-b:a",
      bitrate,
      ...metadataArgs,
      outputFileName,
    ];
  }

  if (format.id === "m4a") {
    return [
      "-i",
      inputFileName,
      "-vn",
      "-map",
      "0:a:0?",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      ...metadataArgs,
      outputFileName,
    ];
  }

  if (format.id === "wav") {
    return [
      "-i",
      inputFileName,
      "-vn",
      "-map",
      "0:a:0?",
      "-c:a",
      "pcm_s16le",
      ...metadataArgs,
      outputFileName,
    ];
  }

  if (format.id === "flac") {
    return [
      "-i",
      inputFileName,
      "-vn",
      "-map",
      "0:a:0?",
      "-c:a",
      "flac",
      ...metadataArgs,
      outputFileName,
    ];
  }

  if (format.id === "ogg") {
    return [
      "-i",
      inputFileName,
      "-vn",
      "-map",
      "0:a:0?",
      "-c:a",
      "libvorbis",
      "-q:a",
      "4",
      ...metadataArgs,
      outputFileName,
    ];
  }

  if (format.id === "opus") {
    return [
      "-i",
      inputFileName,
      "-vn",
      "-map",
      "0:a:0?",
      "-c:a",
      "libopus",
      "-b:a",
      "128k",
      "-vbr",
      "on",
      ...metadataArgs,
      outputFileName,
    ];
  }

  if (format.id === "mp4") {
    return [
      "-i",
      inputFileName,
      "-map",
      "0:v:0?",
      "-map",
      "0:a:0?",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      ...metadataArgs,
      outputFileName,
    ];
  }

  return [
    "-i",
    inputFileName,
    "-map",
    "0:v:0?",
    "-map",
    "0:a:0?",
    "-c:v",
    "libvpx",
    "-deadline",
    "good",
    "-cpu-used",
    "4",
    "-crf",
    "32",
    "-b:v",
    "0",
    "-c:a",
    "libopus",
    "-b:a",
    "128k",
    ...metadataArgs,
    outputFileName,
  ];
}
