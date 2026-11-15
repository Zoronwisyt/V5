import cv2
import numpy as np

_GAUSS_1D = np.array([0.25, 0.5, 0.25], dtype=np.float32)


def _frame_hist_hs(bgr_small: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(bgr_small, cv2.COLOR_BGR2HSV)
    # Near-black compression noise creates unstable H/S; collapse V < 18 into bin (0, 0)
    dark = hsv[:, :, 2] < 18
    if np.any(dark):
        hsv[dark, 0] = 0
        hsv[dark, 1] = 0
    hist = cv2.calcHist([hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
    cv2.normalize(hist, hist, norm_type=cv2.NORM_L1)
    return hist.flatten()


def _bhattacharyya(h1: np.ndarray, h2: np.ndarray) -> float:
    bc = float(np.sum(np.sqrt(np.maximum(0.0, h1 * h2))))
    return float(np.sqrt(max(0.0, 1.0 - bc)))


def _seam_spike(rgb_f: np.ndarray) -> float:
    """
    Detect horizontal split-screen seam across y = H/2 (180px height -> mid=90).
    Compares max row-to-row color jump near mid (rows 84..96)
    against surrounding texture above (72..82) and below (98..108).
    """
    d_band = [float(np.mean(np.abs(rgb_f[y] - rgb_f[y - 1]))) for y in range(84, 97)]
    surr_a = float(np.mean(np.abs(rgb_f[72:82] - rgb_f[71:81])))
    surr_b = float(np.mean(np.abs(rgb_f[99:109] - rgb_f[98:108])))
    surr = 0.5 * (surr_a + surr_b) + 0.006
    return max(d_band) / surr


def _changed_frac(a_u8: np.ndarray, b_u8: np.ndarray, pix: int = 20) -> float:
    """video-lens changed_mask(): fraction of pixels with channel_max(|a - b|) > pix."""
    diff = np.abs(a_u8.astype(np.int16) - b_u8.astype(np.int16))
    cmax = diff.max(axis=2)
    return float(np.count_nonzero(cmax > pix)) / float(cmax.size)


def extract_video_features(video_path: str) -> tuple[np.ndarray, np.ndarray, float, int]:
    """
    Extract 16-dim 'Who is Strongest' + video-lens temporal/pixel/split-seam
    features at 320x180 with 3x3 binomial smoothing for each frame transition.
    Returns (features [N-1, 16], is_split [N], fps, total_frames).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 60.0)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    frames_f, frames_u8 = [], []
    h_full, h_top, h_bot, seams, lumas = [], [], [], [], []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        s = cv2.resize(frame, (320, 180), interpolation=cv2.INTER_AREA)
        # video-lens Gaussian pre-blur reduces codec compression shimmer before diffing
        s_blur_f = cv2.sepFilter2D(s.astype(np.float32), -1, _GAUSS_1D, _GAUSS_1D)
        s_blur_u8 = np.clip(np.round(s_blur_f), 0, 255).astype(np.uint8)
        sf = s_blur_f / 255.0

        frames_f.append(sf)
        frames_u8.append(s_blur_u8)
        h_full.append(_frame_hist_hs(s))
        h_top.append(_frame_hist_hs(s[:90]))
        h_bot.append(_frame_hist_hs(s[90:]))
        seams.append(_seam_spike(sf))
        lumas.append(float(np.mean(sf)))

    cap.release()
    n = len(frames_f)
    if n < 2:
        raise RuntimeError(f"Video has fewer than 2 readable frames: {video_path}")

    seams_np = np.array(seams, dtype=np.float32)
    lumas_np = np.array(lumas, dtype=np.float32)
    k = max(3, int(round(0.10 * fps)))  # ~6 frames at 60fps
    local_win = max(6, int(round(0.25 * fps)))  # +-0.25s neighborhood for video-lens cut ratio

    is_split = np.zeros(n, dtype=bool)
    for i in range(n):
        lo = max(0, i - 2)
        hi = min(n, i + 3)
        is_split[i] = float(np.median(seams_np[lo:hi])) > 2.1

    inst_cfracs = np.zeros(n - 1, dtype=np.float32)
    for i in range(1, n):
        inst_cfracs[i - 1] = _changed_frac(frames_u8[i - 1], frames_u8[i], 20)

    feats = np.zeros((n - 1, 16), dtype=np.float32)

    for i in range(1, n):
        inst_full_h = _bhattacharyya(h_full[i - 1], h_full[i])
        inst_full_l = float(np.mean(np.abs(frames_f[i] - frames_f[i - 1])))
        inst_top_h = _bhattacharyya(h_top[i - 1], h_top[i])
        inst_bot_h = _bhattacharyya(h_bot[i - 1], h_bot[i])

        # Representative non-flash frames before and after i
        a0, a1 = max(0, i - k), i
        b0, b1 = i, min(n, i + k)
        a_idx = a0 + int(np.argsort(lumas_np[a0:a1])[len(lumas_np[a0:a1]) // 2])
        b_idx = b0 + int(np.argsort(lumas_np[b0:b1])[len(lumas_np[b0:b1]) // 2])

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

        # video-lens signals: instant & persistent changed pixel fraction + local cut contrast ratio
        inst_cf = float(inst_cfracs[i - 1])
        pers_cf = _changed_frac(frames_u8[a_idx], frames_u8[b_idx], 20)
        n_lo = max(0, (i - 1) - local_win)
        n_hi = min(n - 1, (i - 1) + local_win + 1)
        neigh = np.concatenate([inst_cfracs[n_lo : i - 1], inst_cfracs[i : n_hi]])
        base_cf = max(0.02, float(np.median(neigh)) if len(neigh) else 0.02)
        local_cf_ratio = min(1.0, (inst_cf / base_cf) / 8.0)
        seam_level = min(1.0, float(seams_np[i]) / 6.0)

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
            inst_cf,
            pers_cf,
            local_cf_ratio,
            seam_level,
        ]

    return feats, is_split, fps, n
