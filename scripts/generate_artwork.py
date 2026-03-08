"""アルバムアートワークを抽出・生成する"""

import json
import re
import hashlib
from pathlib import Path
from mutagen import File as MutagenFile
from mutagen.mp4 import MP4
from mutagen.mp3 import MP3
from mutagen.id3 import APIC
from PIL import Image
import io


MUSIC_DIR = Path(__file__).parent.parent / "music-library"
CATALOG_PATH = Path(__file__).parent.parent / "src" / "data" / "catalog.json"
ARTWORK_DIR = Path(__file__).parent.parent / "src" / "assets" / "artwork"
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


def process_album(album: dict, artist_name: str, artist_dir_name: str):
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

    print(f"  アートワーク無し → プレースホルダー生成: {album['name']}")
    generate_placeholder(album["name"], artist_name, output_path)


def main():
    ARTWORK_DIR.mkdir(parents=True, exist_ok=True)

    catalog = json.loads(CATALOG_PATH.read_text())

    # アーティストディレクトリ名のマッピング
    artist_dirs = {}
    for d in sorted(MUSIC_DIR.iterdir()):
        if d.is_dir() and not d.name.startswith("."):
            m = re.match(r"^(\d+)_(.+)$", d.name)
            if m:
                artist_name = m.group(2)
                artist_dirs[artist_name] = d.name

    for artist in catalog["artists"]:
        print(f"\n{artist['name']}:")
        dir_name = artist_dirs.get(artist["name"], "")
        for album in artist["albums"]:
            process_album(album, artist["name"], dir_name)

    print(f"\nアートワーク生成完了: {ARTWORK_DIR}")


if __name__ == "__main__":
    main()
