import cv2
import numpy as np


def _region_diff(prev_bgr: np.ndarray, curr_bgr: np.ndarray) -> tuple[float, float]:
    prev_hsv = cv2.cvtColor(prev_bgr, cv2.COLOR_BGR2HSV)
    curr_hsv = cv2.cvtColor(curr_bgr, cv2.COLOR_BGR2HSV)

    hist_prev = cv2.calcHist([prev_hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
    hist_curr = cv2.calcHist([curr_hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
    cv2.normalize(hist_prev, hist_prev)
    cv2.normalize(hist_curr, hist_curr)

    hist_diff = float(cv2.compareHist(hist_prev, hist_curr, cv2.HISTCMP_BHATTACHARYYA))

    prev_gray = cv2.cvtColor(prev_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    curr_gray = cv2.cvtColor(curr_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    luma_mae = float(np.mean(np.abs(curr_gray - prev_gray)) / 255.0)
    return hist_diff, luma_mae


def _seam_energy(bgr: np.ndarray) -> float:
    """Measure horizontal edge energy at the vertical midpoint (split-screen seam)."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    mid = gray.shape[0] // 2
    band = gray[max(0, mid - 2) : min(gray.shape[0], mid + 2), :]
    if band.shape[0] < 2:
        return 0.0
    return float(np.mean(np.abs(np.diff(band, axis=0))))


def extract_video_features(video_path: str) -> tuple[np.ndarray, float, int]:
    """
    Extract per-frame transition features for all consecutive frame pairs.
    Returns (features [N, 8], fps, total_frames).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    ret, prev = cap.read()
    if not ret:
        cap.release()
        raise RuntimeError(f"No readable frames in {video_path}")

    prev_s = cv2.resize(prev, (160, 90))
    prev_seam = _seam_energy(prev_s)
    mid = prev_s.shape[0] // 2

    feats = []
    while True:
        ret, curr = cap.read()
        if not ret:
            break

        curr_s = cv2.resize(curr, (160, 90))
        curr_seam = _seam_energy(curr_s)

        full_h, full_l = _region_diff(prev_s, curr_s)
        top_h, top_l = _region_diff(prev_s[:mid], curr_s[:mid])
        bot_h, bot_l = _region_diff(prev_s[mid:], curr_s[mid:])
        seam_delta = abs(curr_seam - prev_seam)
        split_asym = abs(top_h - bot_h)

        feats.append([full_h, full_l, top_h, top_l, bot_h, bot_l, seam_delta, split_asym])

        prev_s = curr_s
        prev_seam = curr_seam

    cap.release()
    return np.array(feats, dtype=np.float32), float(fps), total_frames
