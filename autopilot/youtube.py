"""Upload a video to YouTube with the official Data API (single feed: no playlists).
(Adapted from FactPop's autopilot/youtube.py.)"""
import os

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from common import youtube_description

SCOPES = ["https://www.googleapis.com/auth/youtube"]
SECRETS = ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN")


def missing_secrets():
    return [k for k in SECRETS if not os.environ.get(k)]


def _client():
    missing = missing_secrets()
    if missing:
        raise RuntimeError(f"Missing GitHub secret(s): {', '.join(missing)}")
    creds = Credentials(
        None,
        refresh_token=os.environ["YT_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["YT_CLIENT_ID"],
        client_secret=os.environ["YT_CLIENT_SECRET"],
        scopes=SCOPES,
    )
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def publish(video_path, meta, cfg):
    """upload one video; returns {"id": video id, "url": shorts url}"""
    yc = cfg["youtube"]
    yt = _client()
    body = {
        "snippet": {
            "title": str(meta["title"]).strip(),
            "description": youtube_description(meta, cfg),
            "tags": meta.get("tags") or [],
            "categoryId": str(yc.get("category_id", "27")),
            "defaultLanguage": yc.get("language", "en"),
            "defaultAudioLanguage": yc.get("language", "en"),
        },
        "status": {
            "privacyStatus": yc.get("privacy", "public"),
            "selfDeclaredMadeForKids": bool(yc.get("made_for_kids", False)),
            "containsSyntheticMedia": bool(yc.get("contains_synthetic_media", False)),
        },
    }
    media = MediaFileUpload(str(video_path), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
    request = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    while response is None:
        progress, response = request.next_chunk()
        if progress:
            print(f"  YouTube upload {int(progress.progress() * 100)}%")
    return {"id": response["id"], "url": f"https://youtube.com/shorts/{response['id']}"}


def check_connection(cfg):
    """Read-only check used by dry runs: sign in and return the channel name."""
    yt = _client()
    chans = yt.channels().list(part="snippet", mine=True).execute().get("items", [])
    if not chans:
        raise RuntimeError("Signed in, but this Google account has no YouTube channel "
                           "(authorise with the Orange Juice Productions channel selected)")
    return chans[0]["snippet"]["title"]
