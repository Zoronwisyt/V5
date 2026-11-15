/* ==========================================================================
   FLIPPY v5 — IN-BROWSER CLIPCUTNET BEAT DETECTOR
   100% client-side fallback using exported PyTorch ClipCutNet weights
   Works on GitHub Pages / Cloudflare / static hosts with zero localhost server
   ========================================================================== */
(function () {
  'use strict';

  const MODEL_WEIGHTS = {
    w0: [
      [0.769938051700592, 0.2572818696498871, 0.30712732672691345, 0.4770788848400116, 0.45602142810821533, 0.607699990272522, 0.31798458099365234, 0.899259626865387],
      [-0.04636799916625023, -0.09491720795631409, -0.09410497546195984, 0.08776502311229706, 0.03431340306997299, -0.06868727505207062, -0.3244228959083557, 0.2143782377243042],
      [0.1308998167514801, 0.261201947927475, -0.30740562081336975, -0.2805854380130768, -0.3022277057170868, -0.1492127776145935, -0.2329225242137909, -0.08826389908790588],
      [-0.4676806330680847, -0.4446866810321808, -0.14855921268463135, -0.3108452260494232, -0.4214923679828644, -0.2462734580039978, -0.3328355848789215, -0.18838149309158325],
      [0.39575180411338806, 0.5465786457061768, 0.5943430662155151, 0.34784233570098877, 0.42730164527893066, 0.794138491153717, 0.2673536539077759, 0.7665979862213135],
      [0.14393259584903717, 0.7468774318695068, 0.4488055408000946, 0.4171782433986664, 0.6329138875007629, 0.5996178388595581, 0.348776638507843, 0.2446707785129547],
      [-0.227677583694458, -0.26090487837791443, 0.12592282891273499, 0.25633710622787476, -0.0362127460539341, -0.15309369564056396, -0.14539353549480438, -0.18598322570323944],
      [0.30438029766082764, 0.8277683854103088, 0.40210697054862976, 0.5720000267028809, 0.5821133255958557, 0.5035015344619751, 0.4736084043979645, 0.37506088614463806],
      [0.8786273002624512, 0.3637087643146515, 0.8516510128974915, 0.47331133484840393, 0.6456542015075684, 0.7604573965072632, 0.5652531385421753, 0.2473776936531067],
      [-0.6027783751487732, -0.024951525032520294, -0.05628962442278862, -0.11110932379961014, -0.16576115787029266, -0.3755240738391876, -0.14180675148963928, -0.25525984168052673],
      [-0.21933771669864655, -0.5014513731002808, -0.35071906447410583, -0.33872076869010925, -0.2622756361961365, -0.9255365133285522, -0.9500128030776978, -0.8026959896087646],
      [0.19914114475250244, 0.6291200518608093, 0.6750932931900024, 0.6003694534301758, 0.6179388165473938, 0.5936780571937561, 0.2125902622938156, 0.2903944253921509],
      [0.4627368748188019, 0.34202542901039124, 0.13363540172576904, 0.5770450830459595, 0.7946982979774475, 0.7374891042709351, 0.5636227130889893, 0.6301774978637695],
      [-0.13014893233776093, 0.08836319297552109, 0.1965995728969574, 0.1658601015806198, -0.3039412796497345, -0.19728703796863556, 0.06282950192689896, -0.001659395988099277],
      [0.8711820244789124, 0.526951253414154, 0.5498437285423279, 0.6755997538566589, 0.36303290724754333, 0.6182929277420044, 0.46347102522850037, 0.8079162240028381],
      [-0.4290856122970581, 0.008786050602793694, -0.035769108682870865, -0.0485161729156971, -0.24065618216991425, -0.14927010238170624, -0.5591550469398499, -0.6740302443504333]
    ],
    b0: [
      -0.12078765034675598, -0.37382960319519043, -0.06025421619415283, 1.044905424118042,
      -0.15418124198913574, -0.11339107155799866, -0.15720593929290771, -0.1039164587855339,
      -0.15743687748908997, 1.0597107410430908, 1.0428780317306519, -0.11267078667879105,
      -0.1457241177558899, -0.38296937942504883, -0.13150787353515625, 1.13817298412323
    ],
    w2: [
      0.6457478404045105, -0.13789665699005127, -0.24366500973701477, -0.9893918633460999,
      0.5875900387763977, 0.7199070453643799, -0.020014064386487007, 0.7543798089027405,
      0.5303764939308167, -0.8248962163925171, -0.9135714769363403, 0.7065063714981079,
      0.6262017488479614, -0.13186411559581757, 0.6376091837882996, -0.7527017593383789
    ],
    b2: -0.8280545473098755
  };

  function inferClipCutProb(feats) {
    let logit = MODEL_WEIGHTS.b2;
    for (let j = 0; j < 16; j++) {
      const row = MODEL_WEIGHTS.w0[j];
      let sum = MODEL_WEIGHTS.b0[j];
      for (let k = 0; k < 8; k++) {
        sum += row[k] * feats[k];
      }
      if (sum > 0) {
        logit += MODEL_WEIGHTS.w2[j] * sum;
      }
    }
    return 1 / (1 + Math.exp(-logit));
  }

  function extractFrameStats(rgba, w, h) {
    const mid = h >> 1;
    const histFull = new Float32Array(256);
    const histTop = new Float32Array(256);
    const histBot = new Float32Array(256);
    const gray = new Float32Array(w * h);

    for (let y = 0; y < h; y++) {
      const isTop = y < mid;
      const targetHist = isTop ? histTop : histBot;
      const rowOff = y * w;
      for (let x = 0; x < w; x++) {
        const px = rowOff + x;
        const p4 = px << 2;
        const r = rgba[p4];
        const g = rgba[p4 + 1];
        const b = rgba[p4 + 2];

        gray[px] = 0.299 * r + 0.587 * g + 0.114 * b;

        const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
        const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
        const delta = max - min;

        let hue180 = 0;
        if (delta > 0) {
          let h6 = 0;
          if (max === r) h6 = ((g - b) / delta) % 6;
          else if (max === g) h6 = (b - r) / delta + 2;
          else h6 = (r - g) / delta + 4;
          hue180 = Math.round(h6 * 30);
          if (hue180 < 0) hue180 += 180;
          if (hue180 >= 180) hue180 -= 180;
        }
        const sat255 = max === 0 ? 0 : Math.round((delta * 255) / max);

        const hBin = Math.min(15, (hue180 * 16) >> 7); // 16 bins over [0,180)
        const hBinExact = Math.min(15, Math.floor((hue180 * 16) / 180));
        const sBin = Math.min(15, sat255 >> 4);
        const bin = (hBinExact << 4) | sBin;

        histFull[bin] += 1;
        targetHist[bin] += 1;
      }
    }

    // Seam energy at y = mid - 2 .. mid + 1
    const yStart = Math.max(0, mid - 2);
    const yEnd = Math.min(h, mid + 2);
    let seamSum = 0;
    let seamCount = 0;
    for (let y = yStart; y < yEnd - 1; y++) {
      const r0 = y * w;
      const r1 = (y + 1) * w;
      for (let x = 0; x < w; x++) {
        seamSum += Math.abs(gray[r1 + x] - gray[r0 + x]) / 255.0;
        seamCount++;
      }
    }

    return {
      histFull,
      histTop,
      histBot,
      gray,
      seamEnergy: seamCount > 0 ? seamSum / seamCount : 0,
    };
  }

  function bhattacharyya(h1, h2, count) {
    let bc = 0;
    for (let i = 0; i < 256; i++) {
      if (h1[i] > 0 && h2[i] > 0) {
        bc += Math.sqrt((h1[i] / count) * (h2[i] / count));
      }
    }
    return Math.sqrt(Math.max(0, 1 - bc));
  }

  function lumaMae(g1, g2, startPx, endPx) {
    let sum = 0;
    const n = endPx - startPx;
    for (let i = startPx; i < endPx; i++) {
      sum += Math.abs(g2[i] - g1[i]);
    }
    return n > 0 ? sum / (n * 255.0) : 0;
  }

  function seekVideo(video, timeSec) {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('Browser could not decode this video format.'));
      };
      const cleanup = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
      };
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.currentTime = timeSec;
    });
  }

  window.detectBeatsInBrowser = async function detectBeatsInBrowser(file, options = {}) {
    const fps = Number(options.fps) || 60;
    const probThreshold = Number(options.probThreshold) || 0.5;
    const minGapSec = Number(options.minGapSec) || 0.15;
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    try {
      await new Promise((resolve, reject) => {
        video.addEventListener('loadeddata', resolve, { once: true });
        video.addEventListener('error', () => reject(new Error('Unsupported video codec for browser playback.')), { once: true });
      });

      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) {
        throw new Error('Could not read video duration.');
      }

      const W = 160;
      const H = 90;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const totalSteps = Math.max(2, Math.floor(duration * fps));
      const fullPx = W * H;
      const halfPx = (H >> 1) * W;

      await seekVideo(video, 0);
      ctx.drawImage(video, 0, 0, W, H);
      let prev = extractFrameStats(ctx.getImageData(0, 0, W, H).data, W, H);

      const probs = new Float32Array(totalSteps - 1);

      for (let i = 1; i < totalSteps; i++) {
        const t = Math.min(duration - 0.001, i / fps);
        await seekVideo(video, t);
        ctx.drawImage(video, 0, 0, W, H);
        const curr = extractFrameStats(ctx.getImageData(0, 0, W, H).data, W, H);

        const fullH = bhattacharyya(prev.histFull, curr.histFull, fullPx);
        const fullL = lumaMae(prev.gray, curr.gray, 0, fullPx);
        const topH = bhattacharyya(prev.histTop, curr.histTop, halfPx);
        const topL = lumaMae(prev.gray, curr.gray, 0, halfPx);
        const botH = bhattacharyya(prev.histBot, curr.histBot, fullPx - halfPx);
        const botL = lumaMae(prev.gray, curr.gray, halfPx, fullPx);
        const seamDelta = Math.abs(curr.seamEnergy - prev.seamEnergy);
        const splitAsym = Math.abs(topH - botH);

        probs[i - 1] = inferClipCutProb([fullH, fullL, topH, topL, botH, botL, seamDelta, splitAsym]);
        prev = curr;

        if (onProgress && (i % 10 === 0 || i === totalSteps - 1)) {
          onProgress(Math.round((i / (totalSteps - 1)) * 100), i, totalSteps - 1);
        }
      }

      const minGapFrames = Math.max(1, Math.round(minGapSec * fps));
      let lastCutFrame = -minGapFrames;
      const cuts = [];

      for (let i = 0; i < probs.length; i++) {
        const p = probs[i];
        const isLocalPeak =
          (i === 0 || p >= probs[i - 1]) &&
          (i === probs.length - 1 || p >= probs[i + 1]);
        if (p >= probThreshold && isLocalPeak && (i - lastCutFrame) >= minGapFrames) {
          const frameIdx = i + 1;
          const tSec = frameIdx / fps;
          cuts.push({
            frame: frameIdx,
            time_sec: Number(tSec.toFixed(4)),
            time_ms: Math.round(tSec * 1000),
            score: Number(p.toFixed(4)),
          });
          lastCutFrame = i;
        }
      }

      return {
        ok: true,
        engine: 'browser-clipcutnet',
        fps,
        total_frames: totalSteps,
        duration_sec: Number(duration.toFixed(3)),
        cut_count: cuts.length,
        cuts,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  };
})();
