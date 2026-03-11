"""アルバムアートワークを抽出・生成する"""

import argparse
import json
import os
import re
import hashlib
import time
from pathlib import Path
from mutagen import File as MutagenFile
from mutagen.mp4 import MP4
from mutagen.mp3 import MP3
from mutagen.id3 import APIC
from PIL import Image
from pydub import AudioSegment
from dotenv import load_dotenv
from google import genai
from google.genai import types
import io


MUSIC_DIR = Path(__file__).parent.parent / "music-library"
CATALOG_PATH = Path(__file__).parent.parent / "src" / "data" / "catalog.json"
ARTWORK_DIR = Path(__file__).parent.parent / "public" / "artwork"
ARTWORK_SIZE = (300, 300)


def extract_artwork_m4a(file_path: Path) -> bytes | None:
    try:
        audio = MP4(str(file_path))
        if "covr" in audio.tags:
            return bytes(audio.tags["covr"][0])
    except Exception:
        pass
    return None


def extract_artwork_mp3(file_path: Path) -> bytes | None:
    try:
        audio = MP3(str(file_path))
        for tag in audio.tags.values():
            if isinstance(tag, APIC):
                return tag.data
    except Exception:
        pass
    return None


def extract_artwork(file_path: Path) -> bytes | None:
    if file_path.suffix.lower() == ".m4a":
        return extract_artwork_m4a(file_path)
    elif file_path.suffix.lower() == ".mp3":
        return extract_artwork_mp3(file_path)
    return None


def generate_placeholder(album_name: str, artist_name: str, output_path: Path):
    """色付きのプレースホルダー画像を生成"""
    h = int(hashlib.md5(album_name.encode()).hexdigest()[:6], 16)
    hue = h % 360
    r, g, b = hsl_to_rgb(hue / 360, 0.4, 0.3)

    img = Image.new("RGB", ARTWORK_SIZE, (r, g, b))
    img.save(str(output_path), "JPEG", quality=85)


def hsl_to_rgb(h: float, s: float, l: float) -> tuple[int, int, int]:
    if s == 0:
        v = int(l * 255)
        return v, v, v
    q = l * (1 + s) if l < 0.5 else l + s - l * s
    p = 2 * l - q
    r = hue_to_rgb(p, q, h + 1/3)
    g = hue_to_rgb(p, q, h)
    b = hue_to_rgb(p, q, h - 1/3)
    return int(r * 255), int(g * 255), int(b * 255)


def hue_to_rgb(p: float, q: float, t: float) -> float:
    if t < 0: t += 1
    if t > 1: t -= 1
    if t < 1/6: return p + (q - p) * 6 * t
    if t < 1/2: return q
    if t < 2/3: return p + (q - p) * (2/3 - t) * 6
    return p


def find_peak_section(file_path: Path, clip_duration_ms: int = 30000) -> AudioSegment | None:
    """トラックの最もエネルギーの高い区間を切り出す"""
    try:
        audio = AudioSegment.from_file(str(file_path))
    except Exception as e:
        print(f"    オーディオ読み込み失敗: {file_path.name} ({e})")
        return None

    if len(audio) <= clip_duration_ms:
        return audio

    window_ms = 1000
    rms_values = []
    for i in range(0, len(audio) - window_ms + 1, window_ms):
        rms_values.append(audio[i:i + window_ms].rms)

    clip_windows = clip_duration_ms // window_ms
    if len(rms_values) < clip_windows:
        return audio

    current_sum = sum(rms_values[:clip_windows])
    best_sum = current_sum
    best_start = 0
    for i in range(1, len(rms_values) - clip_windows + 1):
        current_sum += rms_values[i + clip_windows - 1] - rms_values[i - 1]
        if current_sum > best_sum:
            best_sum = current_sum
            best_start = i

    start_ms = best_start * window_ms
    return audio[start_ms:start_ms + clip_duration_ms]


def select_representative_tracks(tracks: list[Path], max_count: int = 5) -> list[Path]:
    """アルバムから代表曲を等間隔で選択"""
    if len(tracks) <= max_count:
        return tracks
    step = len(tracks) / max_count
    return [tracks[int(i * step)] for i in range(max_count)]


def extract_peak_clips(album_dir: Path) -> list[tuple[str, AudioSegment]]:
    """アルバムディレクトリから代表クリップを抽出"""
    tracks = sorted(
        [f for f in album_dir.iterdir() if f.suffix.lower() in (".m4a", ".mp3")]
    )
    if not tracks:
        return []

    selected = select_representative_tracks(tracks)
    clips = []
    for track in selected:
        clip = find_peak_section(track)
        if clip is not None:
            clips.append((track.name, clip))
    return clips


def clips_to_wav_bytes(clips: list[tuple[str, AudioSegment]]) -> list[tuple[str, bytes]]:
    """クリップをモノラルWAVバイト列に変換"""
    result = []
    for name, clip in clips:
        mono = clip.set_channels(1)
        buf = io.BytesIO()
        mono.export(buf, format="wav")
        result.append((name, buf.getvalue()))
    return result


def delete_artwork_if_exists(album_id: str):
    """既存のアートワークファイルがあれば削除"""
    path = ARTWORK_DIR / f"{album_id}.jpg"
    if path.exists():
        print(f"  既存アートワーク削除: {path.name}")
        path.unlink()


def resolve_regen_targets(
    catalog: dict, artist_dirs: dict[str, str], specifiers: list[str]
) -> list[tuple[dict, str, str]]:
    """--regen-ai の引数を解析し、対象アルバムのリストを返す"""
    targets: dict[str, tuple[dict, str, str]] = {}

    for spec in specifiers:
        if spec == "all":
            for artist in catalog["artists"]:
                dir_name = artist_dirs.get(artist["name"], "")
                for album in artist["albums"]:
                    targets[album["id"]] = (album, artist["name"], dir_name)

        elif spec == "no-embedded":
            for artist in catalog["artists"]:
                dir_name = artist_dirs.get(artist["name"], "")
                for album in artist["albums"]:
                    if album["id"] in targets:
                        continue
                    album_dir = MUSIC_DIR / dir_name / album["name"]
                    if not album_dir.exists():
                        targets[album["id"]] = (album, artist["name"], dir_name)
                        continue
                    has_artwork = False
                    for track_file in sorted(album_dir.iterdir()):
                        if track_file.suffix.lower() in (".m4a", ".mp3"):
                            if extract_artwork(track_file):
                                has_artwork = True
                                break
                    if not has_artwork:
                        targets[album["id"]] = (album, artist["name"], dir_name)

        elif spec.startswith("id:"):
            target_id = spec[3:]
            for artist in catalog["artists"]:
                dir_name = artist_dirs.get(artist["name"], "")
                for album in artist["albums"]:
                    if album["id"] == target_id:
                        targets[album["id"]] = (album, artist["name"], dir_name)

        elif spec.startswith("name:"):
            target_name = spec[5:].lower()
            for artist in catalog["artists"]:
                dir_name = artist_dirs.get(artist["name"], "")
                for album in artist["albums"]:
                    if target_name in album["name"].lower():
                        targets[album["id"]] = (album, artist["name"], dir_name)

    return list(targets.values())


def generate_ai_artwork(clips: list[tuple[str, AudioSegment]], album_name: str, artist_name: str, model: str = "gemini-3.1-flash-image-preview") -> bytes | None:
    """Gemini APIで音楽の雰囲気からアートワークを生成"""
    load_dotenv()
    api_key = os.environ.get("google-studio-api-key")
    if not api_key:
        print("    google-studio-api-key が設定されていません")
        return None

    wav_clips = clips_to_wav_bytes(clips)
    if not wav_clips:
        return None

    client = genai.Client(api_key=api_key)

    contents = []
    prompt_text = (
        f"I'm sending you audio clips from the album '{album_name}' by '{artist_name}'. "
        "Listen to the music and understand its mood, genre, and energy. "
        "Then generate an album cover artwork image that captures the essence of this music. "
        "The image should be artistic and visually compelling. "
        "Do NOT include any text, letters, or words in the image."
    )
    contents.append(types.Part.from_text(text=prompt_text))

    for name, wav_data in wav_clips:
        contents.append(types.Part.from_bytes(data=wav_data, mime_type="audio/wav"))

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                        return part.inline_data.data
            if attempt < max_retries:
                wait = 3 * (2 ** (attempt - 1))
                print(f"    画像未生成、リトライ {attempt}/{max_retries}（{wait}秒後）...")
                time.sleep(wait)
            else:
                print("    Gemini APIから画像が返されませんでした（リトライ上限）")
                return None
        except Exception as e:
            if attempt < max_retries:
                wait = 3 * (2 ** (attempt - 1))
                print(f"    APIエラー、リトライ {attempt}/{max_retries}（{wait}秒後）: {e}")
                time.sleep(wait)
            else:
                print(f"    Gemini APIエラー（リトライ上限）: {e}")
                return None
    return None


def process_album(album: dict, artist_name: str, artist_dir_name: str, model: str = "gemini-3.1-flash-image-preview"):
    album_id = album["id"]
    output_path = ARTWORK_DIR / f"{album_id}.jpg"

    if output_path.exists():
        print(f"  スキップ（既存）: {album['name']}")
        return

    album_dir = MUSIC_DIR / artist_dir_name / album["name"]
    if not album_dir.exists():
        print(f"  ディレクトリ無し: {album['name']}")
        generate_placeholder(album["name"], artist_name, output_path)
        return

    # アルバム内の最初の音楽ファイルからアートワーク抽出を試みる
    for track_file in sorted(album_dir.iterdir()):
        if track_file.suffix.lower() in (".m4a", ".mp3"):
            artwork_data = extract_artwork(track_file)
            if artwork_data:
                img = Image.open(io.BytesIO(artwork_data))
                img = img.convert("RGB")
                img = img.resize(ARTWORK_SIZE, Image.LANCZOS)
                img.save(str(output_path), "JPEG", quality=85)
                print(f"  抽出成功: {album['name']}")
                return

    # AI生成パイプラインを試行
    try:
        print(f"  アートワーク無し → AI生成を試行: {album['name']}")
        clips = extract_peak_clips(album_dir)
        if clips:
            ai_image_data = generate_ai_artwork(clips, album["name"], artist_name, model=model)
            if ai_image_data:
                img = Image.open(io.BytesIO(ai_image_data))
                img = img.convert("RGB")
                img = img.resize(ARTWORK_SIZE, Image.LANCZOS)
                img.save(str(output_path), "JPEG", quality=85)
                print(f"  AI生成成功: {album['name']}")
                time.sleep(2)
                return
        print(f"  AI生成失敗 → プレースホルダー生成: {album['name']}")
    except Exception as e:
        print(f"  AI生成エラー → プレースホルダー生成: {album['name']} ({e})")

    generate_placeholder(album["name"], artist_name, output_path)


def main():
    parser = argparse.ArgumentParser(description="アルバムアートワークを抽出・生成する")
    parser.add_argument("--regenerate", action="store_true",
                        help="プレースホルダー画像（≤5KB）を削除して再生成する")
    parser.add_argument("--regen-ai", nargs="+", metavar="SPEC",
                        help="AIアートワークを再生成 (all, no-embedded, id:<ID>, name:<名前>)")
    parser.add_argument("--model", default="gemini-3.1-flash-image-preview",
                        help="AI生成に使用するモデル (デフォルト: gemini-3.1-flash-image-preview)")
    args = parser.parse_args()

    ARTWORK_DIR.mkdir(parents=True, exist_ok=True)

    if args.regenerate:
        deleted = 0
        for artwork_file in ARTWORK_DIR.glob("*.jpg"):
            if artwork_file.stat().st_size <= 5 * 1024:
                print(f"  プレースホルダー削除: {artwork_file.name} ({artwork_file.stat().st_size} bytes)")
                artwork_file.unlink()
                deleted += 1
        print(f"\n{deleted} 個のプレースホルダー画像を削除しました\n")

    catalog = json.loads(CATALOG_PATH.read_text())

    # アーティストディレクトリ名のマッピング
    artist_dirs = {}
    for d in sorted(MUSIC_DIR.iterdir()):
        if d.is_dir() and not d.name.startswith("."):
            m = re.match(r"^(\d+)_(.+)$", d.name)
            if m:
                artist_name = m.group(2)
                artist_dirs[artist_name] = d.name

    if args.regen_ai:
        targets = resolve_regen_targets(catalog, artist_dirs, args.regen_ai)
        print(f"\n再生成対象: {len(targets)} アルバム")
        for album, artist_name, dir_name in targets:
            print(f"\n  再生成: {artist_name} / {album['name']}")
            delete_artwork_if_exists(album["id"])
            process_album(album, artist_name, dir_name, model=args.model)
        print(f"\nAIアートワーク再生成完了: {len(targets)} アルバム")
        return

    for artist in catalog["artists"]:
        print(f"\n{artist['name']}:")
        dir_name = artist_dirs.get(artist["name"], "")
        for album in artist["albums"]:
            process_album(album, artist["name"], dir_name, model=args.model)

    print(f"\nアートワーク生成完了: {ARTWORK_DIR}")


if __name__ == "__main__":
    main()
