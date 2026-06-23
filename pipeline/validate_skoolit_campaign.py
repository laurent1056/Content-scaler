#!/usr/bin/env python3
"""Validate the Skoolit Katie campaign source data."""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAMPAIGN_PATH = ROOT / "campaigns" / "skoolit-katie" / "campaign.json"
EXPECTED_TYPES = {
    "product_explainer": 4,
    "ugc_testimonial": 4,
    "problem_drama_solution": 4,
}


def main() -> int:
    data = json.loads(CAMPAIGN_PATH.read_text(encoding="utf-8"))
    videos = data.get("videos", [])
    errors: list[str] = []

    if len(videos) != 12:
        errors.append(f"Expected 12 videos; found {len(videos)}")

    ids = [video.get("id") for video in videos]
    if len(ids) != len(set(ids)):
        errors.append("Video ids must be unique")

    counts = Counter(video.get("video_type") for video in videos)
    if dict(counts) != EXPECTED_TYPES:
        errors.append(f"Expected type split {EXPECTED_TYPES}; found {dict(counts)}")

    required_fields = [
        "id", "day", "slot", "video_type", "title", "hook", "script",
        "problem", "solution", "outcome", "cta", "feature_status",
        "scene", "caption", "beats",
    ]
    for video in videos:
        missing = [field for field in required_fields if field not in video or video[field] in (None, "", [])]
        if missing:
            errors.append(f"{video.get('id', '<missing id>')}: missing {missing}")
        if video.get("feature_status") != "preview":
            errors.append(f"{video.get('id')}: feature_status must be preview")
        if len(video.get("beats", [])) != 4:
            errors.append(f"{video.get('id')}: expected 4 story beats")
        if video.get("video_type") == "ugc_testimonial" and "Dramatization" not in data.get("campaign", {}).get("disclosure", ""):
            errors.append(f"{video.get('id')}: UGC format requires dramatization disclosure")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("PASS: 12-video Skoolit Katie campaign source is valid.")
    print(f"Type split: {dict(counts)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
