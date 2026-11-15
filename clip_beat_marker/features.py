import cv2
import numpy as np


def _frame_hist_hs(bgr_small: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(bgr_small, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
    cv2.normalize(hist, hist, norm_type=cv2.NORM_L1)
    return hist.flatten()


def _bhattacharyya(h1: np.ndarray, h2: np.ndarray) -> float:
    bc = float(np.sum(np.sqrt(np.maximum(0.0, h1 * h2))))
    return float(np.sqrt(max(0.0, 1.0 - bc)))


def _seam_spike(rgb_f: np.ndarray) -> float:
    """
    Detect horizontal split-screen seam across y = H/2 (Category clip).
    Compares max row-to-row color jump near mid (rows 42..48 of 90)
    against surrounding texture above (36..41) and below (49..54).
    """
    d_band = [float(np.mean(np.abs(rgb_f[y] - rgb_f[y - 1]))) for y in range(42, 49)]
    surr_a = float(np.mean(np.abs(rgb_f[36:41] - rgb_f[35:40])))
    surr_b = float(np.mean(np.abs(rgb_f[50:55] - rgb_f[49:54])))
    surr = 0.5 * (surr_a + surr_b) + 0.006
    return max(d_band) / surr


def extract_video_features(video_path: str) -> tuple[np.ndarray, np.ndarray, float, int]:
    """
    Extract 12-dim 'Who is Strongest' temporal + split-seam features for each
    consecutive frame transition.
    Returns (features [N-1, 12], is_split [N], fps, total_frames).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 60.0)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    frames_f = []
    h_full, h_top, h_bot, seams, lumas = [], [], [], [], []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        s = cv2.resize(frame, (160, 90))
        sf = s.astype(np.float32) / 255.0
        frames_f.append(sf)
        h_full.append(_frame_hist_hs(s))
        h_top.append(_frame_hist_hs(s[:45]))
        h_bot.append(_frame_hist_hs(s[45:]))
        seams.append(_seam_spike(sf))
        lumas.append(float(np.mean(sf)))

    cap.release()
    n = len(frames_f)
    if n < 2:
        raise RuntimeError(f"Video has fewer than 2 readable frames: {video_path}")

    seams_np = np.array(seams, dtype=np.float32)
    lumas_np = np.array(lumas, dtype=np.float32)
    k = max(3, int(round(0.10 * fps)))  # ~6 frames at 60fps

    is_split = np.zeros(n, dtype=bool)
    for i in range(n):
        lo = max(0, i - 2)
        hi = min(n, i + 3)
        is_split[i] = float(np.median(seams_np[lo:hi])) > 2.1

    feats = np.zeros((n - 1, 12), dtype=np.float32)

    for i in range(1, n):
        inst_full_h = _bhattacharyya(h_full[i - 1], h_full[i])
        inst_full_l = float(np.mean(np.abs(frames_f[i] - frames_f[i - 1])))
        inst_top_h = _bhattacharyya(h_top[i - 1], h_top[i])
        inst_bot_h = _bhattacharyya(h_bot[i - 1], h_bot[i])

        # Representative non-flash frames before and after i
        a0, a1 = max(0, i - k), i
        b0, b1 = i, min(n, i + k)
        a_lumas = lumas_np[a0:a1]
        b_lumas = lumas_np[b0:b1]
        a_idx = a0 + int(np.argsort(a_lumas)[len(a_lumas) // 2])
        b_idx = b0 + int(np.argsort(b_lumas)[len(b_lumas) // 2])

        pers_full_h = _bhattacharyya(h_full[a_idx], h_full[b_idx])
        pers_full_l = float(np.mean(np.abs(frames_f[b_idx] - frames_f[a_idx])))
        pers_top_h = _bhattacharyya(h_top[a_idx], h_top[b_idx])
        pers_bot_h = _bhattacharyya(h_bot[a_idx], h_bot[b_idx])
        pers_asym = abs(pers_top_h - pers_bot_h)

        sb = float(np.median(seams_np[max(0, i - k) : i]))
        sa = float(np.median(seams_np[i : min(n, i + k)]))
        seam_flip = 1.0 if ((sb > 2.1) != (sa > 2.1) and abs(sa - sb) >= 0.7) else 0.0
        seam_delta = min(1.0, abs(sa - sb) / 4.0)
        seam_inst = min(1.0, abs(float(seams_np[i]) - float(seams_np[i - 1])) / 3.0)

        feats[i - 1] = [
            inst_full_h,
            inst_full_l,
            inst_top_h,
            inst_bot_h,
            pers_full_h,
            pers_full_l,
            pers_top_h,
            pers_bot_h,
            pers_asym,
            seam_flip,
            seam_delta,
            seam_inst,
        ]

    return feats, is_split, fps, n
