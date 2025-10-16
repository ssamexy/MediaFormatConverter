#!/usr/bin/env python3
"""
Media Format Converter
Converts MP4 files to MP3 format using ffmpeg
"""

import os
import sys
import ffmpeg
import glob
import shutil
import subprocess
from pathlib import Path


def check_ffmpeg():
    """Check if ffmpeg is installed and available"""
    if shutil.which("ffmpeg") is None:
        print("=" * 70)
        print("錯誤: 找不到 ffmpeg")
        print("=" * 70)
        print()
        print("請先安裝 ffmpeg：")
        print()
        print("=" * 70)
        print("Windows - 方法 1: 使用 Chocolatey (推薦)")
        print("=" * 70)
        print()
        print("步驟 1: 安裝 Chocolatey (以系統管理員身分執行 PowerShell)")
        print()
        print("Set-ExecutionPolicy Bypass -Scope Process -Force; `")
        print("[System.Net.ServicePointManager]::SecurityProtocol = `")
        print("    [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `")
        print("iex ((New-Object System.Net.WebClient).DownloadString(")
        print("    'https://chocolatey.org/install.ps1'))")
        print()
        print("步驟 2: 安裝 ffmpeg")
        print("  choco install ffmpeg")
        print()
        print("=" * 70)
        print("Windows - 方法 2: 手動安裝")
        print("=" * 70)
        print("  1. 下載: https://www.gyan.dev/ffmpeg/builds/")
        print("  2. 解壓縮並將 bin 資料夾路徑加入系統 PATH")
        print()
        print("=" * 70)
        print("Windows - 方法 3: 使用 winget")
        print("=" * 70)
        print("  winget install ffmpeg")
        print()
        print("=" * 70)
        print("macOS:")
        print("=" * 70)
        print("  brew install ffmpeg")
        print()
        print("=" * 70)
        print("Linux:")
        print("=" * 70)
        print("  sudo apt install ffmpeg  # Ubuntu/Debian")
        print("  sudo yum install ffmpeg  # CentOS/RHEL")
        print()
        print("=" * 70)
        print("安裝完成後，請重新開啟終端機視窗再執行此程式")
        print("=" * 70)
        return False
    return True


def validate_input_file(file_path):
    """Validate if the input file exists and has correct extension"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"找不到檔案: {file_path}")

    if not file_path.lower().endswith('.mp4'):
        raise ValueError("輸入檔案必須是 MP4 格式")

    return True


def convert_mp4_to_mp3(input_file, output_file=None, skip_existing=False):
    """
    Convert MP4 file to MP3 format

    Args:
        input_file (str): Path to input MP4 file
        output_file (str): Path to output MP3 file (optional)
        skip_existing (bool): Skip conversion if output file exists (for batch mode)

    Returns:
        str: Path to the output MP3 file, or None if skipped/cancelled
    """
    # Validate input file
    validate_input_file(input_file)

    # Generate output filename if not provided
    if output_file is None:
        input_path = Path(input_file)
        output_file = str(input_path.with_suffix('.mp3'))
    else:
        # Ensure output file has .mp3 extension
        if not output_file.lower().endswith('.mp3'):
            output_file += '.mp3'

    # Check if output file already exists
    if os.path.exists(output_file):
        if skip_existing:
            print(f"⊘ 跳過 (檔案已存在): {output_file}")
            return None
        else:
            response = input(f"檔案 {output_file} 已存在，是否覆蓋？ (y/n): ")
            if response.lower() != 'y':
                print("取消轉換")
                return None

    try:
        print(f"開始轉換: {input_file} -> {output_file}")

        # Convert using ffmpeg
        stream = ffmpeg.input(input_file)
        stream = ffmpeg.output(stream, output_file, acodec='libmp3lame', audio_bitrate='192k')
        ffmpeg.run(stream, overwrite_output=True, quiet=True)

        print(f"✓ 轉換完成: {output_file}")
        return output_file

    except ffmpeg.Error as e:
        print(f"✗ 轉換失敗: {e.stderr.decode() if e.stderr else str(e)}")
        raise
    except Exception as e:
        print(f"✗ 發生錯誤: {str(e)}")
        raise


def batch_convert(input_pattern, output_dir=None):
    """
    Batch convert multiple MP4 files to MP3 format

    Args:
        input_pattern (str): File pattern or directory path (e.g., "*.mp4" or "/path/to/videos/")
        output_dir (str): Output directory for converted files (optional)

    Returns:
        tuple: (success_count, fail_count, skip_count)
    """
    # Find all MP4 files matching the pattern
    if os.path.isdir(input_pattern):
        # If it's a directory, search for all MP4 files in it
        search_pattern = os.path.join(input_pattern, "*.mp4")
        files = glob.glob(search_pattern)
    else:
        # Use the pattern as-is
        files = glob.glob(input_pattern)

    if not files:
        print(f"找不到符合的檔案: {input_pattern}")
        return 0, 0, 0

    print(f"找到 {len(files)} 個檔案")
    print()

    # Ask about overwriting existing files
    skip_existing = False
    if any(os.path.exists(str(Path(f).with_suffix('.mp3'))) for f in files):
        response = input("是否跳過已存在的檔案？ (y/n, 預設為 y): ").strip().lower()
        skip_existing = response != 'n'

    success_count = 0
    fail_count = 0
    skip_count = 0

    for i, input_file in enumerate(files, 1):
        print(f"\n[{i}/{len(files)}] 處理: {input_file}")

        # Determine output file path
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            output_file = os.path.join(output_dir, Path(input_file).stem + '.mp3')
        else:
            output_file = None

        try:
            result = convert_mp4_to_mp3(input_file, output_file, skip_existing=skip_existing)
            if result:
                success_count += 1
            else:
                skip_count += 1
        except Exception as e:
            fail_count += 1
            print(f"✗ 處理失敗: {input_file}")
            continue

    return success_count, fail_count, skip_count


def main():
    """Main CLI interface"""
    print("=" * 50)
    print("多媒體格式轉換器 - MP4 to MP3")
    print("=" * 50)
    print()

    # Check if ffmpeg is installed
    if not check_ffmpeg():
        sys.exit(1)

    print()

    # Choose mode
    print("請選擇模式：")
    print("1. 單一檔案轉換")
    print("2. 批次檔案轉換")
    mode = input("請輸入選項 (1 或 2): ").strip()

    if mode == "1":
        # Single file mode
        print()
        input_file = input("請輸入 MP4 檔案路徑: ").strip()
        input_file = input_file.strip('"').strip("'")

        if not input_file:
            print("錯誤: 未提供輸入檔案")
            sys.exit(1)

        output_file = input("請輸入輸出 MP3 檔案名稱 (留空則使用預設名稱): ").strip()
        output_file = output_file.strip('"').strip("'") if output_file else None

        try:
            result = convert_mp4_to_mp3(input_file, output_file)
            if result:
                print()
                print("轉換成功！")
        except FileNotFoundError as e:
            print(f"\n錯誤: {e}")
            sys.exit(1)
        except ValueError as e:
            print(f"\n錯誤: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"\n發生未預期的錯誤: {e}")
            sys.exit(1)

    elif mode == "2":
        # Batch mode
        print()
        print("批次轉換模式")
        print("提示：可以輸入資料夾路徑或檔案模式 (例如: *.mp4 或 /path/to/videos/)")
        input_pattern = input("請輸入檔案路徑或模式: ").strip()
        input_pattern = input_pattern.strip('"').strip("'")

        if not input_pattern:
            print("錯誤: 未提供輸入路徑")
            sys.exit(1)

        output_dir = input("請輸入輸出目錄 (留空則輸出到原檔案位置): ").strip()
        output_dir = output_dir.strip('"').strip("'") if output_dir else None

        try:
            success, fail, skip = batch_convert(input_pattern, output_dir)
            print()
            print("=" * 50)
            print("批次轉換完成！")
            print(f"成功: {success} 個檔案")
            print(f"失敗: {fail} 個檔案")
            print(f"跳過: {skip} 個檔案")
            print("=" * 50)
        except Exception as e:
            print(f"\n發生未預期的錯誤: {e}")
            sys.exit(1)

    else:
        print("錯誤: 無效的選項")
        sys.exit(1)


if __name__ == "__main__":
    main()
