import cv2
import numpy as np

_GAUSS_1D = np.array([0.25, 0.5, 0.25], dtype=np.float32)

ACCURACY_PRESETS = {
    1: {"name": "Turbo", "width": 160, "height": 90, "frame_step": 3, "prob_threshold": 0.72, "refine_win": 0},
    2: {"name": "Fast", "width": 160, "height": 90, "frame_step": 2, "prob_threshold": 0.74, "refine_win": 0},
    3: {"name": "Default", "width": 320, "height": 180, "frame_step": 1, "prob_threshold": 0.75, "refine_win": 0},
    4: {"name": "High", "width": 480, "height": 270, "frame_step": 1, "prob_threshold": 0.73, "refine_win": 1},
    5: {"name": "Ultra", "width": 640, "height": 360, "frame_step": 1, "prob_threshold": 0.70, "refine_win": 2},
}


def get_accuracy_preset(accuracy: int = 3) -> dict:
    lvl = max(1, min(5, int(round(accuracy))))
    return ACCURACY_PRESETS[lvl]


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
    Detect horizontal split-screen seam across y = H/2 (180px baseline -> mid=90).
    Compares max row-to-row color jump near mid against surrounding texture.
    """
    h = rgb_f.shape[0]
    band_lo = max(1, int(round(84 * h / 180)))
    band_hi = min(h - 1, int(round(96 * h / 180)))
    sa_lo = max(1, int(round(72 * h / 180)))
    sa_hi = min(h - 1, int(round(81 * h / 180)))
    sb_lo = max(1, int(round(99 * h / 180)))
    sb_hi = min(h - 1, int(round(108 * h / 180)))

    d_band = [float(np.mean(np.abs(rgb_f[y] - rgb_f[y - 1]))) for y in range(band_lo, band_hi + 1)]
    surr_a = float(np.mean(np.abs(rgb_f[sa_lo : sa_hi + 1] - rgb_f[sa_lo - 1 : sa_hi])))
    surr_b = float(np.mean(np.abs(rgb_f[sb_lo : sb_hi + 1] - rgb_f[sb_lo - 1 : sb_hi])))
    surr = 0.5 * (surr_a + surr_b) + 0.006
    return max(d_band) / surr


def _changed_frac(a_u8: np.ndarray, b_u8: np.ndarray, pix: int = 20) -> float:
    """video-lens changed_mask(): fraction of pixels with channel_max(|a - b|) > pix."""
    diff = np.abs(a_u8.astype(np.int16) - b_u8.astype(np.int16))
    cmax = diff.max(axis=2)
    return float(np.count_nonzero(cmax > pix)) / float(cmax.size)


def extract_video_features(video_path: str, accuracy: int = 3) -> tuple[np.ndarray, np.ndarray, float, int]:
    """
    Extract 16-dim 'Who is Strongest' + video-lens temporal/pixel/split-seam
    features with 3x3 binomial smoothing for each frame transition.
    Accuracy 1..5 controls spatial resolution and frame sampling (3 = 320x180 default).
    Returns (features [N-1, 16], is_split [N], fps, sample_count).
    """
    preset = get_accuracy_preset(accuracy)
    w, h = preset["width"], preset["height"]
    half_h = h // 2
    frame_step = preset["frame_step"]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 60.0)

    frames_f, frames_u8 = [], []
    h_full, h_top, h_bot, seams, lumas = [], [], [], [], []

    raw_idx = 0
    while True:
        if frame_step > 1:
            if not cap.grab():
                break
            if raw_idx % frame_step != 0:
                raw_idx += 1
                continue
            ret, frame = cap.retrieve()
            if not ret or frame is None:
                raw_idx += 1
                continue
        else:
            ret, frame = cap.read()
            if not ret:
                break
        raw_idx += 1

        s = cv2.resize(frame, (w, h), interpolation=cv2.INTER_AREA)
        # video-lens Gaussian pre-blur reduces codec compression shimmer before diffing
        s_blur_f = cv2.sepFilter2D(s.astype(np.float32), -1, _GAUSS_1D, _GAUSS_1D)
        s_blur_u8 = np.clip(np.round(s_blur_f), 0, 255).astype(np.uint8)
        sf = s_blur_f / 255.0

        frames_f.append(sf)
        frames_u8.append(s_blur_u8)
        h_full.append(_frame_hist_hs(s))
        h_top.append(_frame_hist_hs(s[:half_h]))
        h_bot.append(_frame_hist_hs(s[half_h:]))
        seams.append(_seam_spike(sf))
        lumas.append(float(np.mean(sf)))

    cap.release()
    n = len(frames_f)
    if n < 2:
        raise RuntimeError(f"Video has fewer than 2 readable frames: {video_path}")

    eff_fps = fps / frame_step
    seams_np = np.array(seams, dtype=np.float32)
    lumas_np = np.array(lumas, dtype=np.float32)
    k = max(2 if frame_step > 1 else 3, int(round(0.10 * eff_fps)))  # ~6 frames at 60fps
    local_win = max(4 if frame_step > 1 else 6, int(round(0.25 * eff_fps)))  # +-0.25s neighborhood for video-lens cut ratio

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
