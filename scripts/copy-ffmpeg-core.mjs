import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const sourceDirectory = resolve("node_modules/@ffmpeg/core/dist/esm");
const targetDirectory = resolve("web/public/ffmpeg");
const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

await mkdir(targetDirectory, { recursive: true });

for (const file of files) {
  await copyFile(resolve(sourceDirectory, file), resolve(targetDirectory, file));
}
