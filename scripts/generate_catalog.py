"""music-library/ をスキャンして catalog.json を生成する"""

import json
import re
import hashlib
from pathlib import Path
from mutagen import File as MutagenFile


MUSIC_DIR = Path(__file__).parent.parent / "music-library"
OUTPUT_PATH = Path(__file__).parent.parent / "src" / "data" / "catalog.json"


def make_id(*parts: str) -> str:
    raw = "/".join(parts)
    return hashlib.md5(raw.encode()).hexdigest()[:12]


def parse_artist_dir(name: str) -> tuple[int, str]:
    """'01_名取交響吹奏楽団（n響）' → (1, '名取交響吹奏楽団（n響）')"""
    m = re.match(r"^(\d+)_(.+)$", name)
    if m:
        return int(m.group(1)), m.group(2)
    return 0, name


def parse_track_file(name: str) -> tuple[int, str]:
    """'01 アナウンス.m4a' → (1, 'アナウンス')"""
    stem = Path(name).stem
    m = re.match(r"^(\d+)\s+(.+)$", stem)
    if m:
        return int(m.group(1)), m.group(2)
    return 0, stem


def get_duration(file_path: Path) -> float | None:
    try:
        audio = MutagenFile(str(file_path))
        if audio and audio.info:
            return round(audio.info.length, 2)
    except Exception:
        pass
    return None


def scan_library() -> dict:
    artists = []

    for artist_dir in sorted(MUSIC_DIR.iterdir()):
        if not artist_dir.is_dir() or artist_dir.name.startswith("."):
            continue

        sort_key, artist_name = parse_artist_dir(artist_dir.name)
        artist_id = make_id(artist_dir.name)

        albums = []
        for album_dir in sorted(artist_dir.iterdir()):
            if not album_dir.is_dir() or album_dir.name.startswith("."):
                continue

            album_id = make_id(artist_dir.name, album_dir.name)
            tracks = []

            audio_files = sorted(
                f for f in album_dir.iterdir()
                if f.is_file() and f.suffix.lower() in (".m4a", ".mp3")
            )

            for audio_file in audio_files:
                track_number, title = parse_track_file(audio_file.name)
                fmt = audio_file.suffix.lower().lstrip(".")
                track_id = make_id(artist_dir.name, album_dir.name, audio_file.name)
                s3_key = f"music/{artist_dir.name}/{album_dir.name}/{audio_file.name}"

                duration = get_duration(audio_file)

                tracks.append({
                    "id": track_id,
                    "trackNumber": track_number,
                    "title": title,
                    "fileName": audio_file.name,
                    "format": fmt,
                    "s3Key": s3_key,
                    "duration": duration,
                    "albumId": album_id,
                    "artistId": artist_id,
                })

            albums.append({
                "id": album_id,
                "name": album_dir.name,
                "artistId": artist_id,
                "artworkPath": f"/artwork/{album_id}.jpg",
                "tracks": tracks,
            })

        artists.append({
            "id": artist_id,
            "sortKey": sort_key,
            "name": artist_name,
            "albums": albums,
        })

    return {
        "artists": artists,
        "generatedAt": __import__("datetime").datetime.now().isoformat(),
    }


def main():
    catalog = scan_library()

    total_tracks = sum(
        len(t["tracks"])
        for a in catalog["artists"]
        for t in a["albums"]
    )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2))

    print(f"カタログ生成完了:")
    print(f"  アーティスト: {len(catalog['artists'])}")
    print(f"  アルバム: {sum(len(a['albums']) for a in catalog['artists'])}")
    print(f"  トラック: {total_tracks}")
    print(f"  出力: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
