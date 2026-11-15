import argparse
import json
import math
import os
import xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

from features import extract_video_features


class ClipCutNetV2(nn.Module):
    def __init__(self, in_dim: int = 12):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, 24),
            nn.ReLU(),
            nn.Linear(24, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)


def detect_cuts_with_model(
    video_path: str,
    model_path: str,
    prob_threshold: float = 0.75,
    min_gap_sec: float = 0.25,
) -> dict:
    feats, is_split, fps, total_frames = extract_video_features(video_path)
    duration_sec = total_frames / fps if fps > 0 else 0.0

    ckpt = torch.load(model_path, map_location="cpu", weights_only=True)
    in_dim = ckpt.get("in_dim", 12)
    model = ClipCutNetV2(in_dim=in_dim)
    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    with torch.no_grad():
        logits = model(torch.from_numpy(feats))
        probs = torch.sigmoid(logits).numpy()

    min_gap_frames = max(1, int(round(min_gap_sec * fps)))
    candidates = []
    for i in range(len(probs)):
        p = float(probs[i])
        if p >= prob_threshold:
            # Anchor rank on instant 1-frame cut sharpness so i+/-2 never steals the peak
            rank = p + 0.25 * float(feats[i, 0]) + 0.25 * float(feats[i, 1])
            candidates.append((rank, i, p))

    candidates.sort(key=lambda x: x[0], reverse=True)
    selected = []
    for rank, i, p in candidates:
        if all(abs(i - s_i) >= min_gap_frames for s_i, _ in selected):
            selected.append((i, p))

    selected.sort(key=lambda x: x[0])
    cuts = []
    cat_count = 0
    win_count = 0

    for i, p in selected:
        frame_idx = i + 1
        t_sec = frame_idx / fps
        look_idx = min(len(is_split) - 1, frame_idx + 2)
        if is_split[look_idx]:
            cat_count += 1
            kind = "Category"
            label = f"Category {cat_count}"
        else:
            win_count += 1
            kind = "Winner"
            label = f"Winner {win_count}"

        cuts.append({
            "frame": frame_idx,
            "time_sec": round(t_sec, 4),
            "time_ms": int(math.ceil((frame_idx * 1000.0) / fps - 1e-9)),
            "score": round(p, 4),
            "kind": kind,
            "label": label,
        })

    return {
        "video": video_path,
        "fps": round(fps, 3),
        "total_frames": total_frames,
        "duration_sec": round(duration_sec, 3),
        "cut_count": len(cuts),
        "cuts": cuts,
    }


def write_alight_motion_xml(
    cuts_data: dict,
    out_xml: str,
    width: int = 1080,
    height: int = 1350,
    fps: int = 60,
    base_xml: str | None = None,
) -> None:
    if base_xml and os.path.exists(base_xml):
        tree = ET.parse(base_xml)
        root = tree.getroot()
    else:
        root = ET.Element(
            "scene",
            {
                "title": Path(cuts_data["video"]).stem,
                "width": str(width),
                "height": str(height),
                "exportWidth": str(width),
                "exportHeight": str(height),
                "fps": str(fps),
                "totalTime": str(int(round(cuts_data["duration_sec"] * 1000))),
                "bgcolor": "#ff000000",
            },
        )
        tree = ET.ElementTree(root)

    for idx, cut in enumerate(cuts_data["cuts"], start=1):
        ET.SubElement(
            root,
            "bookmark",
            {
                "t": str(cut["time_ms"]),
                "label": cut.get("label") or f"Beat {idx}",
            },
        )

    ET.indent(tree, space="  ")
    Path(out_xml).parent.mkdir(parents=True, exist_ok=True)
    tree.write(out_xml, encoding="utf-8", xml_declaration=True)


def main():
    parser = argparse.ArgumentParser(description="Detect Who-is-Strongest cuts with ClipCutNetV2.")
    parser.add_argument("video", help="Path to input video")
    parser.add_argument("--model", default=str(Path(__file__).with_name("model.pt")), help="Path to model.pt")
    parser.add_argument("--prob-threshold", type=float, default=0.75)
    parser.add_argument("--min-gap", type=float, default=0.25)
    parser.add_argument("--width", type=int, default=1080)
    parser.add_argument("--height", type=int, default=1350)
    parser.add_argument("--fps", type=int, default=60)
    parser.add_argument("--json-only", action="store_true")
    parser.add_argument("--out-dir", default="")
    parser.add_argument("--base-xml", default="")
    args = parser.parse_args()

    result = detect_cuts_with_model(
        args.video,
        args.model,
        prob_threshold=args.prob_threshold,
        min_gap_sec=args.min_gap,
    )

    if args.json_only:
        print(json.dumps(result))
        return

    stem = Path(args.video).stem
    out_dir = Path(args.out_dir) if args.out_dir else Path(__file__).with_name("output") / stem
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "cuts.json"
    xml_path = out_dir / f"{stem}_beats.xml"
    json_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    write_alight_motion_xml(result, str(xml_path), args.width, args.height, args.fps, args.base_xml or None)
    print(f"Saved {result['cut_count']} cuts -> {xml_path}")


if __name__ == "__main__":
    main()
