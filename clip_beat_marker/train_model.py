import argparse
import json
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


def pseudo_label_who_is_strongest(feats: np.ndarray, fps: float, min_gap_sec: float = 0.25) -> np.ndarray:
    """
    Generate clean 'Who is Strongest' training labels:
    - Requires persistent before-vs-after change (rejects 1-2 frame flashes/strobes)
      OR a Category <-> Winner split-seam transition (even if Winner reuses same character clip).
    - Localizes exact peak using instant change + seam jump so bookmarks land on the exact cut frame.
    """
    inst_full = 0.65 * feats[:, 0] + 0.35 * feats[:, 1]
    inst_half = np.maximum(feats[:, 2], feats[:, 3])
    pers_full = 0.65 * feats[:, 4] + 0.35 * feats[:, 5]
    pers_half = np.maximum(feats[:, 6], feats[:, 7])
    pers_asym = feats[:, 8]
    seam_flip = feats[:, 9]
    seam_inst = feats[:, 11]

    # Gate: kills isolated flashes where pers_full & pers_half stay low
    persistent_support = np.maximum.reduce([
        pers_full,
        pers_half * 0.90,
        seam_flip * 0.45 + 0.35 * np.maximum(pers_full, pers_half),
    ])

    raw_score = (
        0.44 * inst_full
        + 0.16 * inst_half
        + 0.36 * pers_full
        + 0.12 * pers_half
        + 0.14 * pers_asym
        + 0.22 * seam_flip
        + 0.12 * seam_inst
    )
    # Zero out non-persistent spikes (flashes/strobes)
    gated_score = np.where(persistent_support >= 0.22, raw_score, 0.0)
    rank_score = gated_score + 0.35 * inst_full + 0.20 * inst_half

    labels = np.zeros(len(feats), dtype=np.float32)
    min_gap_frames = max(1, int(round(min_gap_sec * fps)))
    candidates = [(float(rank_score[i]), i) for i in range(len(gated_score)) if gated_score[i] >= 0.33]
    candidates.sort(key=lambda x: x[0], reverse=True)

    selected = []
    for _, i in candidates:
        if all(abs(i - s) >= min_gap_frames for s in selected):
            selected.append(i)
            labels[i] = 1.0

    return labels


def apply_beat_markers_txt(video_path: str, feats: np.ndarray, labels: np.ndarray, fps: float) -> np.ndarray:
    """
    If 'Beat Markers.txt' exists in the same folder as video_path, parse HH:MM:SS:FF
    markers, align timeline offset to the video's instantaneous cut peaks, and reinforce
    exact ground-truth cut frames.
    """
    marker_file = Path(video_path).parent / "Beat Markers.txt"
    if not marker_file.exists():
        return labels

    raw_frames = []
    for line in marker_file.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        tc = line.split(" - ")[0].strip()
        parts = tc.split(":")
        if len(parts) == 4:
            hh, mm, ss, ff = [int(x) for x in parts]
            f_idx = int(round((hh * 3600 + mm * 60 + ss) * fps)) + ff
            raw_frames.append(f_idx)

    if not raw_frames:
        return labels

    inst_sharp = feats[:, 0] + feats[:, 1] + 0.5 * np.maximum(feats[:, 2], feats[:, 3])
    n_feats = len(feats)

    # Find timeline offset (0 if markers start at 0, or constant shift if trimmed from a longer timeline)
    best_offset = 0
    best_score = -1.0
    max_marker = max(raw_frames)
    for offset in range(0, max(1, max_marker)):
        valid = [m - offset - 1 for m in raw_frames if 1 <= (m - offset) <= n_feats]
        if len(valid) < 5:
            continue
        score = float(np.mean([inst_sharp[idx] for idx in valid]))
        if score > best_score:
            best_score = score
            best_offset = offset

    matched = 0
    for m in raw_frames:
        idx = m - best_offset - 1
        if 0 <= idx < n_feats:
            # Snap within +/-1 frame to exact visual transition
            lo = max(0, idx - 1)
            hi = min(n_feats, idx + 2)
            best_idx = lo + int(np.argmax(inst_sharp[lo:hi]))
            if inst_sharp[best_idx] >= 0.25:
                # Clear +/-2 shoulder labels so only exact cut frame is 1.0
                for k in range(max(0, best_idx - 2), min(n_feats, best_idx + 3)):
                    labels[k] = 0.0
                labels[best_idx] = 1.0
                matched += 1

    print(f"  -> Applied Beat Markers.txt ({matched} aligned ground-truth cuts, offset=-{best_offset} frames)")
    return labels


def train(videos: list[str], out_model: str, epochs: int = 200) -> None:
    all_x, all_y = [], []

    for v in videos:
        print(f"Extracting 12D features: {v}")
        feats, _, fps, total_frames = extract_video_features(v)
        labels = pseudo_label_who_is_strongest(feats, fps)
        labels = apply_beat_markers_txt(v, feats, labels, fps)
        print(f"  -> {total_frames} frames ({fps:.2f} fps), {int(labels.sum())} cuts")
        all_x.append(feats)
        all_y.append(labels)

    x_np = np.concatenate(all_x, axis=0)
    y_np = np.concatenate(all_y, axis=0)

    x_t = torch.from_numpy(x_np)
    y_t = torch.from_numpy(y_np)

    pos_count = max(1.0, float(y_np.sum()))
    neg_count = max(1.0, float(len(y_np) - pos_count))
    pos_weight = torch.tensor([min(18.0, neg_count / pos_count)], dtype=torch.float32)

    model = ClipCutNetV2(in_dim=12)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.02, weight_decay=1e-4)

    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad()
        logits = model(x_t)
        loss = criterion(logits, y_t)
        loss.backward()
        optimizer.step()

        if epoch % 50 == 0 or epoch == epochs:
            with torch.no_grad():
                probs = torch.sigmoid(logits)
                preds = (probs >= 0.5).float()
                tp = int(((preds == 1) & (y_t == 1)).sum().item())
                fp = int(((preds == 1) & (y_t == 0)).sum().item())
                fn = int(((preds == 0) & (y_t == 1)).sum().item())
            print(f"Epoch {epoch:3d}/{epochs} | loss={loss.item():.4f} | TP={tp} FP={fp} FN={fn}")

    out_path = Path(out_model)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": model.state_dict(), "in_dim": 12, "version": 2}, out_path)
    print(f"Saved trained v2 model to: {out_path}")

    weights_json = {k: v.tolist() for k, v in model.state_dict().items()}
    json_path = out_path.with_suffix(".json")
    json_path.write_text(json.dumps(weights_json), encoding="utf-8")
    print(f"Exported JSON weights to: {json_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ClipCutNetV2 for Who-is-Strongest edits.")
    parser.add_argument("videos", nargs="+", help="Training video paths")
    parser.add_argument("--out", default=str(Path(__file__).with_name("model.pt")), help="Output model.pt path")
    parser.add_argument("--epochs", type=int, default=200)
    args = parser.parse_args()
    train(args.videos, args.out, args.epochs)
