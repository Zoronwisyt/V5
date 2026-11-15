import argparse
import json
import os
import xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

from features import extract_video_features


class ClipCutNet(nn.Module):
    def __init__(self, in_dim: int = 8):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)


def detect_cuts_with_model(
    video_path: str,
    model_path: str,
    prob_threshold: float = 0.5,
    min_gap_sec: float = 0.15,
) -> dict:
    feats, fps, total_frames = extract_video_features(video_path)
    duration_sec = total_frames / fps if fps > 0 else 0.0

    ckpt = torch.load(model_path, map_location="cpu", weights_only=True)
    model = ClipCutNet(in_dim=ckpt.get("in_dim", 8))
    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    with torch.no_grad():
        logits = model(torch.from_numpy(feats))
        probs = torch.sigmoid(logits).numpy()

    min_gap_frames = max(1, int(round(min_gap_sec * fps)))
    last_cut_frame = -min_gap_frames
    cuts = []

    for i in range(len(probs)):
        p = float(probs[i])
        is_local_peak = (i == 0 or probs[i] >= probs[i - 1]) and (
            i == len(probs) - 1 or probs[i] >= probs[i + 1]
        )
        if p >= prob_threshold and is_local_peak and (i - last_cut_frame) >= min_gap_frames:
            frame_idx = i + 1
            t_sec = frame_idx / fps
            cuts.append({
                "frame": frame_idx,
                "time_sec": round(t_sec, 4),
                "time_ms": int(round(t_sec * 1000)),
                "score": round(p, 4),
            })
            last_cut_frame = i

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
                "label": f"Beat {idx}",
            },
        )

    ET.indent(tree, space="  ")
    tree.write(out_xml, encoding="utf-8", xml_declaration=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Detect clip changes with ClipCutNet.")
    parser.add_argument("video", help="Path to input video")
    parser.add_argument(
        "--model",
        default=str(Path(__file__).parent / "model.pt"),
        help="Path to trained ClipCutNet model.pt",
    )
    parser.add_argument("--prob-threshold", type=float, default=0.5, help="Model probability threshold")
    parser.add_argument("--min-gap", type=float, default=0.15, help="Minimum seconds between cuts")
    parser.add_argument("--width", type=int, default=1080, help="Alight Motion project width")
    parser.add_argument("--height", type=int, default=1350, help="Alight Motion project height")
    parser.add_argument("--fps", type=int, default=60, help="Alight Motion project FPS")
    parser.add_argument("--json-only", action="store_true", help="Print JSON result to stdout and exit")
    parser.add_argument("--out-dir", default=None, help="Output directory")
    parser.add_argument("--base-xml", default=None, help="Optional base Alight Motion XML")
    args = parser.parse_args()

    result = detect_cuts_with_model(
        args.video,
        model_path=args.model,
        prob_threshold=args.prob_threshold,
        min_gap_sec=args.min_gap,
    )

    if args.json_only:
        print(json.dumps(result))
        return

    stem = Path(args.video).stem
    out_dir = Path(args.out_dir) if args.out_dir else Path(__file__).parent / "output" / stem
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / "cuts.json"
    xml_path = out_dir / f"{stem}_beats.xml"
    json_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    write_alight_motion_xml(
        result,
        str(xml_path),
        width=args.width,
        height=args.height,
        fps=args.fps,
        base_xml=args.base_xml,
    )
    print(f"Cuts detected: {result['cut_count']} -> {xml_path}")


if __name__ == "__main__":
    main()
