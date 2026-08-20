# Media Format Converter

A simple and efficient tool to convert MP4 video files to MP3 audio format. Works on local machines and Google Colab.

## Features

- **Single File Conversion**: Convert one MP4 file at a time
- **Batch Conversion**: Convert multiple MP4 files in one go
- **Cross-Platform**: Works on Windows, macOS, Linux, and Google Colab
- **High Quality**: Uses 192kbps bitrate for excellent audio quality
- **User-Friendly**: Interactive CLI interface with clear prompts
- **Automatic Setup**: Auto-installs dependencies on Google Colab
- **Browser Converter**: Convert MP4 files to MP3 locally in a web browser with WebAssembly

## Requirements

### Local Installation

- Python 3.7+
- ffmpeg
- ffmpeg-python

### Google Colab

No prerequisites needed - all dependencies are automatically installed!

## Installation

### Local Setup

1. **Clone or download this repository**

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install ffmpeg**

   **Windows - Option 1: Using Chocolatey (Recommended)**
   ```powershell
   # First, install Chocolatey (run as Administrator)
   Set-ExecutionPolicy Bypass -Scope Process -Force; `
   [System.Net.ServicePointManager]::SecurityProtocol = `
       [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
   iex ((New-Object System.Net.WebClient).DownloadString(
       'https://chocolatey.org/install.ps1'))

   # Then install ffmpeg
   choco install ffmpeg
   ```

   **Windows - Option 2: Using winget**
   ```powershell
   winget install ffmpeg
   ```

   **Windows - Option 3: Manual Installation**
   1. Download from: https://www.gyan.dev/ffmpeg/builds/
   2. Extract and add the `bin` folder to your system PATH

   **macOS**
   ```bash
   brew install ffmpeg
   ```

   **Linux (Ubuntu/Debian)**
   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```

   **Linux (CentOS/RHEL)**
   ```bash
   sudo yum install ffmpeg
   ```

4. **Verify installation**
   ```bash
   ffmpeg -version
   ```

## Usage

### Local Usage

1. **Run the converter**
   ```bash
   python converter.py
   ```

2. **Choose conversion mode**
   - Option 1: Single file conversion
   - Option 2: Batch conversion

3. **Single File Mode**
   - Enter the path to your MP4 file
   - Optionally specify an output filename
   - The MP3 file will be saved in the same directory

4. **Batch Mode**
   - Enter a directory path or file pattern (e.g., `*.mp4` or `/path/to/videos/`)
   - Optionally specify an output directory
   - All MP4 files will be converted to MP3

### Google Colab Usage

#### Option 1: One-Click Version (Recommended)

The easiest way to use this tool - everything runs in a single cell!

1. **Open the one-click notebook:**

   [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ssamexy/MediaFormatConverter/blob/main/MediaFormatConverter_Colab_OneClick.ipynb)

2. **Run the single cell** (click the play button or press Shift+Enter)

3. **That's it!** The notebook will:
   - Install all dependencies automatically
   - Prompt you to upload MP4 files
   - Convert all files to MP3
   - Download the MP3 files automatically
   - Clean up temporary files

**No need to run multiple cells - everything happens automatically!**

#### Option 2: Step-by-Step Version

For more control over the conversion process:

1. **Open the step-by-step notebook:**

   [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ssamexy/MediaFormatConverter/blob/main/MediaFormatConverter_Colab.ipynb)

2. **Run the cells in order:**
   - **Cell 1: Setup** - Installs ffmpeg and dependencies
   - **Cell 2: Load Functions** - Loads converter functions
   - **Cell 3: Upload Files** - Upload your MP4 files
   - **Cell 4: Single File Conversion** (Optional)
   - **Cell 5: Batch Conversion** (Optional)
   - **Cell 6: Download** - Download converted MP3 files
   - **Cell 7: Cleanup** (Optional) - Remove files from Colab

3. **Tips for Colab:**
   - You can upload multiple files at once
   - Remember to download your MP3 files before closing the notebook
   - Colab has file size limits (typically 100MB per file for free tier)

## Browser Usage

The browser converter lives in `web/` and uses pinned `ffmpeg.wasm` packages with a Vite build. The conversion runs in a Web Worker in the browser; selected MP4 files are not sent to a backend or cloud storage service.

In the browser UI:

1. Select or drag one or more `.mp4` files into the queue.
2. Load the local WebAssembly converter the first time you use the page.
3. Start the batch conversion; files are processed sequentially in the browser.
4. Download each completed MP3 from its queue item.

### Local Development

```bash
npm install
npm run dev
```

The production build is generated with:

```bash
npm run build
```

The Pages workflow builds the site and deploys the generated `docs/` directory when changes reach `main`.

## Examples

### Local Example 1: Convert a single file

```bash
$ python converter.py

==================================================
多媒體格式轉換器 - MP4 to MP3
==================================================

請選擇模式：
1. 單一檔案轉換
2. 批次檔案轉換
請輸入選項 (1 或 2): 1

請輸入 MP4 檔案路徑: video.mp4
請輸入輸出 MP3 檔案名稱 (留空則使用預設名稱):

開始轉換: video.mp4 -> video.mp3
✓ 轉換完成: video.mp3

轉換成功！
```

### Local Example 2: Batch convert all files in a directory

```bash
$ python converter.py

請選擇模式：
1. 單一檔案轉換
2. 批次檔案轉換
請輸入選項 (1 或 2): 2

批次轉換模式
提示：可以輸入資料夾路徑或檔案模式 (例如: *.mp4 或 /path/to/videos/)
請輸入檔案路徑或模式: /path/to/videos/
請輸入輸出目錄 (留空則輸出到原檔案位置):

找到 5 個檔案
是否跳過已存在的檔案？ (y/n, 預設為 y): y

[1/5] 處理: video1.mp4
開始轉換: video1.mp4 -> video1.mp3
✓ 轉換完成: video1.mp3

[2/5] 處理: video2.mp4
開始轉換: video2.mp4 -> video2.mp3
✓ 轉換完成: video2.mp3

...

==================================================
批次轉換完成！
成功: 5 個檔案
失敗: 0 個檔案
跳過: 0 個檔案
==================================================
```

### Colab Example

```python
# After running setup cells and uploading files:

# Convert all uploaded files
success, fail, skip = batch_convert("*.mp4")
# Output:
# Found 3 file(s)
# [1/3] Processing: vacation.mp4
# Converting: vacation.mp4 -> vacation.mp3
# ✓ Conversion completed: vacation.mp3
# ...
```

## Troubleshooting

### Issue: "找不到 ffmpeg" / "ffmpeg not found"

**Solution**: Install ffmpeg following the installation instructions above. Make sure to restart your terminal/PowerShell after installation.

### Issue: Conversion fails with encoding errors

**Solution**: Ensure your MP4 file is not corrupted. Try playing it in a video player first.

### Issue: Python package import errors

**Solution**: Reinstall the required packages:
```bash
pip install --upgrade ffmpeg-python
```

### Issue: Permission denied errors on Windows

**Solution**: Run PowerShell as Administrator when setting environment variables.

### Colab Issue: Upload fails or times out

**Solution**:
- Check your file size (Google Colab has limits)
- Try uploading fewer files at once
- Check your internet connection

## File Structure

```
MediaFormatConverter/
├── converter.py                              # Main CLI converter script
├── MediaFormatConverter_Colab.ipynb          # Google Colab notebook (step-by-step)
├── MediaFormatConverter_Colab_OneClick.ipynb # Google Colab notebook (one-click)
├── requirements.txt                          # Python dependencies
├── spec.md                                   # Project specification
└── README.md                                 # This file
```

Browser application files:

- `web/` - browser converter source
- `package.json` and `package-lock.json` - frontend dependencies and scripts
- `scripts/copy-ffmpeg-core.mjs` - copies the pinned local WASM core into the build
- `vite.config.js` - Vite configuration
- `.github/workflows/pages.yml` - Pages build and deployment workflow

## Technical Details

- **Audio Codec**: libmp3lame
- **Bitrate**: 192kbps
- **Sample Rate**: Preserved from source
- **Channels**: Preserved from source

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the MIT License.

## Changelog

### Version 1.0.0
- Initial release
- Single file conversion
- Batch conversion
- CLI interface
- Google Colab support
- Automatic dependency installation for Colab
- File upload/download support for Colab

## Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section above
2. Search existing issues
3. Create a new issue with detailed information about your problem

## Acknowledgments

- Built with [ffmpeg](https://ffmpeg.org/)
- Uses [ffmpeg-python](https://github.com/kkroening/ffmpeg-python)
- Designed for both local and Google Colab environments
