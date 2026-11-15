/* ==========================================================================
   FLIPPY v5 — IN-BROWSER CLIPCUTNET v2 ("WHO IS STRONGEST") BEAT DETECTOR
   100% client-side using trained 12D ClipCutNetV2 weights (Category <-> Winner)
   - Persistent before/after window check rejects 1-2 frame flashes & shakes
   - Split-seam detector catches Category (2 stacked) <-> Winner (fullscreen)
   ========================================================================== */
(function () {
  'use strict';

  const MODEL_WEIGHTS = {
    w0: [
      [0.5591051578521729, 0.6322547793388367, 0.4824223518371582, 0.5434359312057495, 0.43277114629745483, 0.09939578920602798, 0.19118265807628632, 0.43362390995025635, 0.3728974163532257, 0.5221887826919556, 0.16696013510227203, 0.6359102129936218],
      [-0.1139313206076622, 1.989966767723672e-05, -0.22233058512210846, -0.008296303451061249, -0.2568801939487457, -0.03187664970755577, -0.2830651104450226, -0.28116801381111145, -0.034187838435173035, 2.8709177968266886e-06, -0.11672542989253998, -0.0030468120239675045],
      [0.2681826055049896, 0.16641443967819214, 0.2701091468334198, 0.9099166989326477, 1.35880708694458, -0.7825532555580139, 0.47871774435043335, 1.2745323181152344, 1.0205671787261963, 1.246834397315979, -1.5782524347305298, 1.0025032758712769],
      [-0.14754223823547363, 0.0557158999145031, -0.046038538217544556, 0.0651865005493164, -0.040870651602745056, -0.2648926079273224, -0.10695227980613708, -0.16516582667827606, -0.20694772899150848, 0.07249625772237778, -0.2688120901584625, -0.2392338216304779],
      [-0.37600177526474, -0.2750991880893707, -0.5011124610900879, -0.2854800522327423, 0.07360190153121948, 0.3831787109375, 0.37025707960128784, -0.03857521712779999, 0.07682211697101593, -0.1207532212138176, 0.4229256212711334, -0.4429680407047272],
      [0.6512941718101501, 0.6317930817604065, 0.3529195189476013, 0.6322283744812012, 0.2130897045135498, 0.2060483992099762, 0.18175040185451508, 0.34674471616744995, 0.3641265630722046, 0.7296874523162842, -0.12886777520179749, 0.6234608292579651],
      [-0.007753351237624884, 7.092810960784846e-08, -0.012918214313685894, -0.012995119206607342, -0.041797835379838943, -0.03357619047164917, -0.042702965438365936, 0.023671938106417656, -0.026266582310199738, -0.05373098701238632, 0.01787322200834751, -9.935278285411187e-06],
      [0.6611886620521545, 0.3584582805633545, 0.7546262741088867, 0.9047802686691284, 0.2660146653652191, -0.21530656516551971, 0.12067225575447083, 0.39632606506347656, 0.26443126797676086, 0.8243430852890015, -0.16431057453155518, 0.48452112078666687],
      [-0.5846875905990601, -0.3089941143989563, -0.44978785514831543, -0.3232238292694092, -0.012551980093121529, 0.32560083270072937, 0.18707138299942017, 0.11444993317127228, -0.09234186261892319, -0.3950735032558441, 0.5140622854232788, -0.2663409411907196],
      [-0.793306827545166, -0.19637474417686462, -0.6716153025627136, -0.9203280806541443, 0.06765389442443848, 0.5498160719871521, 0.40119192004203796, 0.42989590764045715, -0.07383735477924347, -0.1590116322040558, 0.7975866198539734, -0.5375882983207703],
      [-0.5281278491020203, -0.42059457302093506, -0.2768707871437073, -0.4170894920825958, 0.16807954013347626, 0.36676767468452454, 0.31577935814857483, 0.02389661595225334, 0.08365999162197113, -0.08336065709590912, 0.2166455239057541, -0.5862119197845459],
      [-0.16233229637145996, 7.068171044011251e-07, -0.18062525987625122, -0.16143828630447388, -0.1968129724264145, -0.08609209954738617, -0.036315493285655975, -0.30485618114471436, -0.14116476476192474, -0.04951066896319389, -0.17702600359916687, -0.008906522765755653],
      [-0.5599314570426941, -0.6513556241989136, -0.6142550706863403, -0.40168502926826477, -0.013544338755309582, 0.13481557369232178, 0.298067569732666, 0.24909548461437225, -0.14141929149627686, -0.23242533206939697, 0.5453413724899292, -0.6166688203811646],
      [-3.889462459483184e-05, -8.516880370734725e-06, -6.404926534742117e-05, -3.297459988971241e-05, -8.632036769995466e-05, -2.7350513846613467e-05, -0.00011535426165210083, -7.120243390090764e-05, 7.46981386328116e-05, 7.99340195953846e-05, -8.946713933255523e-05, -2.5099780032178387e-05],
      [0.08014927059412003, 0.24835820496082306, 0.28378117084503174, 0.41402047872543335, -0.01728190667927265, 0.14649538695812225, -0.04989645630121231, 0.24467313289642334, 0.24190466105937958, 0.060507263988256454, 0.31769275665283203, 0.15662427246570587],
      [-0.5719646215438843, -0.31325414776802063, -0.39250677824020386, -0.4371147155761719, 0.35879483819007874, 0.4996614456176758, 0.19676759839057922, 0.06948816776275635, -0.08665946125984192, -0.4274221956729889, 0.5251288414001465, -0.5265885591506958],
      [-0.5028306841850281, -0.4204925000667572, -0.47518590092658997, -0.4846569299697876, 0.37772420048713684, 0.5720675587654114, 0.0771089568734169, 0.3032318651676178, 0.053766585886478424, -0.5178576707839966, 0.3775138258934021, -0.27323487401008606],
      [-0.06847943365573883, -0.22036676108837128, 0.011810390278697014, 0.02312753163278103, -0.3132299482822418, -0.04818587750196457, 0.00427450193092227, -0.3376917243003845, 0.028509339317679405, -0.004445673897862434, 0.03866404667496681, -0.09699039161205292],
      [0.528593122959137, 0.6904355883598328, 0.8001276254653931, 0.45410406589508057, 0.23468933999538422, 0.13487689197063446, 0.3117913007736206, 0.4193783104419708, 0.18014755845069885, 0.309966117143631, 0.17780251801013947, 0.7714309096336365],
      [0.8355904817581177, 0.5668989419937134, 0.4797917306423187, 0.7624756693840027, 0.38400086760520935, 0.03415483236312866, 0.09853649139404297, 0.5818561911582947, 0.6366981267929077, 0.5681213736534119, -0.17481616139411926, 0.4130105674266815],
      [-0.7961539030075073, -0.43158286809921265, -0.7189799547195435, -0.7695028781890869, 0.08326712995767593, 0.4816560447216034, 0.3624112606048584, 0.24802984297275543, 0.05569284036755562, -0.19989120960235596, 0.7939794659614563, -0.490864098072052],
      [-0.016089921817183495, -0.0009724443079903722, -0.06608186662197113, 0.051483266055583954, 0.02030123956501484, -0.005448486190289259, -0.021594081073999405, 0.01290824729949236, -0.014709074050188065, -0.06963910907506943, -0.06798262149095535, 0.0016621624818071723],
      [-0.016444766893982887, -0.2425595223903656, -0.5656432509422302, -0.36994633078575134, 1.4206233024597168, 0.9660985469818115, 0.9931313991546631, 2.1035654544830322, 1.3565164804458618, 0.629981279373169, 0.8189892768859863, -0.4776417016983032],
      [-0.5077950358390808, -0.577323853969574, -0.35926809906959534, -0.26671651005744934, -0.1571296900510788, 0.1001543179154396, 0.13043370842933655, -0.07633613795042038, -0.2917585074901581, -0.22513045370578766, 0.3485639989376068, -0.31858935952186584]
    ],
    b0: [
      -0.1872163563966751, -0.07353226095438004, -0.2759931683540344, -0.289433091878891,
      0.7938645482063293, -0.1626824587583542, -0.11821150779724121, -0.2022593766450882,
      1.0149801969528198, 0.7025238871574402, 0.9240427613258362, -0.01783766970038414,
      0.9781454801559448, -0.0014134013326838613, 0.029936781153082848, 0.9140368700027466,
      0.7950480580329895, -0.34996888041496277, -0.18942232429981232, -0.20322445034980774,
      0.6739311218261719, -0.08699768036603928, -1.7439873218536377, 1.02066171169281
    ],
    w2: [
      0.780419111251831, -0.06602111458778381, 2.2934114933013916, -0.023490453138947487,
      -0.8803367614746094, 0.8665433526039124, -0.09167332202196121, 0.6895551681518555,
      -0.7889835238456726, -1.127062439918518, -0.8445433974266052, -0.13327863812446594,
      -0.85257887840271, 0.014764497987926006, 0.02668134495615959, -0.8730931282043457,
      -0.9435834288597107, 0.07222207635641098, 0.8035195469856262, 0.8451372981071472,
      -1.0878077745437622, 0.09807588905096054, -4.000088691711426, -0.817284882068634
    ],
    b2: -0.6343913674354553
  };

  function inferClipCutProb(feats) {
    let logit = MODEL_WEIGHTS.b2;
    for (let j = 0; j < 24; j++) {
      const row = MODEL_WEIGHTS.w0[j];
      let sum = MODEL_WEIGHTS.b0[j];
      for (let k = 0; k < 12; k++) {
        sum += row[k] * feats[k];
      }
      if (sum > 0) {
        logit += MODEL_WEIGHTS.w2[j] * sum;
      }
    }
    return 1 / (1 + Math.exp(-logit));
  }

  function medianOf(arr) {
    const copy = arr.slice().sort((a, b) => a - b);
    return copy[copy.length >> 1];
  }

  function extractFrameStats(rgba, w, h) {
    const mid = h >> 1;
    const histFull = new Float32Array(256);
    const histTop = new Float32Array(256);
    const histBot = new Float32Array(256);
    const rgb = new Float32Array(w * h * 3);
    let lumaSum = 0;

    for (let y = 0; y < h; y++) {
      const targetHist = y < mid ? histTop : histBot;
      const rowOff = y * w;
      for (let x = 0; x < w; x++) {
        const px = rowOff + x;
        const p4 = px << 2;
        const p3 = px * 3;
        const r = rgba[p4];
        const g = rgba[p4 + 1];
        const b = rgba[p4 + 2];

        rgb[p3] = r / 255.0;
        rgb[p3 + 1] = g / 255.0;
        rgb[p3 + 2] = b / 255.0;
        lumaSum += (r + g + b) / (3 * 255.0);

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

        const hBin = Math.min(15, Math.floor((hue180 * 16) / 180));
        const sBin = Math.min(15, sat255 >> 4);
        const bin = (hBin << 4) | sBin;

        histFull[bin] += 1;
        targetHist[bin] += 1;
      }
    }

    const rowDiff = (y) => {
      let s = 0;
      const r0 = (y - 1) * w * 3;
      const r1 = y * w * 3;
      for (let i = 0; i < w * 3; i++) {
        s += Math.abs(rgb[r1 + i] - rgb[r0 + i]);
      }
      return s / (w * 3);
    };

    let dBandMax = 0;
    for (let y = 42; y <= 48; y++) {
      const d = rowDiff(y);
      if (d > dBandMax) dBandMax = d;
    }
    let surrA = 0;
    for (let y = 36; y <= 40; y++) surrA += rowDiff(y);
    surrA /= 5;
    let surrB = 0;
    for (let y = 50; y <= 54; y++) surrB += rowDiff(y);
    surrB /= 5;

    const seam = dBandMax / (0.5 * (surrA + surrB) + 0.006);

    return {
      histFull,
      histTop,
      histBot,
      rgb,
      seam,
      luma: lumaSum / (w * h),
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

  function rgbMae(rgb1, rgb2) {
    let sum = 0;
    for (let i = 0; i < rgb1.length; i++) {
      sum += Math.abs(rgb2[i] - rgb1[i]);
    }
    return sum / rgb1.length;
  }

  function seekVideo(video, timeSec) {
    return new Promise((resolve, reject) => {
      if (Math.abs(video.currentTime - timeSec) < 0.0005 && video.readyState >= 2) {
        resolve();
        return;
      }
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      }, 1500);
      const onSeeked = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onError = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Browser could not decode this video format.'));
      };
      const cleanup = () => {
        clearTimeout(timer);
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
    const probThreshold = Number(options.probThreshold) || 0.75;
    const minGapSec = Number(options.minGapSec) || 0.25;
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.preload = 'auto';
    video.src = url;
    video.load();

    try {
      await new Promise((resolve, reject) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          video.removeEventListener('loadeddata', finish);
          video.removeEventListener('canplay', finish);
          resolve();
        };
        video.addEventListener('loadeddata', finish, { once: true });
        video.addEventListener('canplay', finish, { once: true });
        video.addEventListener('error', () => {
          if (done) return;
          done = true;
          reject(new Error('Unsupported video codec for browser playback.'));
        }, { once: true });
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
      const frames = new Array(totalSteps);

      for (let i = 0; i < totalSteps; i++) {
        // Seek to frame midpoint so browser decoder hits exact frame i without PTS rounding drift
        const t = Math.min(duration - 0.001, (i + 0.5) / fps);
        await seekVideo(video, t);
        ctx.drawImage(video, 0, 0, W, H);
        frames[i] = extractFrameStats(ctx.getImageData(0, 0, W, H).data, W, H);
        if (onProgress && (i % 10 === 0 || i === totalSteps - 1)) {
          onProgress(Math.round((i / (totalSteps - 1)) * 100), i, totalSteps - 1);
        }
        if (i % 12 === 11) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      const k = Math.max(3, Math.round(0.10 * fps));
      const isSplit = new Uint8Array(totalSteps);
      for (let i = 0; i < totalSteps; i++) {
        const win = [];
        for (let j = Math.max(0, i - 2); j < Math.min(totalSteps, i + 3); j++) {
          win.push(frames[j].seam);
        }
        isSplit[i] = medianOf(win) > 2.1 ? 1 : 0;
      }

      const medianLumaIdx = (start, end) => {
        const idxs = [];
        for (let j = start; j < end; j++) idxs.push(j);
        idxs.sort((a, b) => frames[a].luma - frames[b].luma);
        return idxs[idxs.length >> 1];
      };

      const probs = new Float32Array(totalSteps - 1);
      const ranks = new Float32Array(totalSteps - 1);
      for (let i = 1; i < totalSteps; i++) {
        const prev = frames[i - 1];
        const curr = frames[i];

        const instFullH = bhattacharyya(prev.histFull, curr.histFull, fullPx);
        const instFullL = rgbMae(prev.rgb, curr.rgb);
        const instTopH = bhattacharyya(prev.histTop, curr.histTop, halfPx);
        const instBotH = bhattacharyya(prev.histBot, curr.histBot, fullPx - halfPx);

        const aIdx = medianLumaIdx(Math.max(0, i - k), i);
        const bIdx = medianLumaIdx(i, Math.min(totalSteps, i + k));
        const fa = frames[aIdx];
        const fb = frames[bIdx];

        const persFullH = bhattacharyya(fa.histFull, fb.histFull, fullPx);
        const persFullL = rgbMae(fa.rgb, fb.rgb);
        const persTopH = bhattacharyya(fa.histTop, fb.histTop, halfPx);
        const persBotH = bhattacharyya(fa.histBot, fb.histBot, fullPx - halfPx);
        const persAsym = Math.abs(persTopH - persBotH);

        const seamsBefore = [];
        for (let j = Math.max(0, i - k); j < i; j++) seamsBefore.push(frames[j].seam);
        const seamsAfter = [];
        for (let j = i; j < Math.min(totalSteps, i + k); j++) seamsAfter.push(frames[j].seam);
        const sb = medianOf(seamsBefore);
        const sa = medianOf(seamsAfter);

        const seamFlip = ((sb > 2.1) !== (sa > 2.1) && Math.abs(sa - sb) >= 0.7) ? 1.0 : 0.0;
        const seamDelta = Math.min(1.0, Math.abs(sa - sb) / 4.0);
        const seamInst = Math.min(1.0, Math.abs(curr.seam - prev.seam) / 3.0);

        const p = inferClipCutProb([
          instFullH,
          instFullL,
          instTopH,
          instBotH,
          persFullH,
          persFullL,
          persTopH,
          persBotH,
          persAsym,
          seamFlip,
          seamDelta,
          seamInst,
        ]);
        probs[i - 1] = p;
        ranks[i - 1] = p + 0.25 * instFullH + 0.25 * instFullL;
      }

      const minGapFrames = Math.max(1, Math.round(minGapSec * fps));
      const candidates = [];
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] >= probThreshold) {
          candidates.push({ i, p: probs[i], rank: ranks[i] });
        }
      }
      candidates.sort((a, b) => b.rank - a.rank);

      const selected = [];
      for (const c of candidates) {
        if (selected.every((s) => Math.abs(c.i - s.i) >= minGapFrames)) {
          selected.push(c);
        }
      }
      selected.sort((a, b) => a.i - b.i);

      const cuts = [];
      let catCount = 0;
      let winCount = 0;

      for (const c of selected) {
        const frameIdx = c.i + 1;
        const tSec = frameIdx / fps;
        const lookIdx = Math.min(totalSteps - 1, frameIdx + 2);
        let kind = 'Winner';
        let label = '';
        if (isSplit[lookIdx]) {
          catCount++;
          kind = 'Category';
          label = `Category ${catCount}`;
        } else {
          winCount++;
          kind = 'Winner';
          label = `Winner ${winCount}`;
        }

        cuts.push({
          frame: frameIdx,
          time_sec: Number(tSec.toFixed(4)),
          time_ms: Math.ceil((frameIdx * 1000) / fps - 1e-9),
          score: Number(c.p.toFixed(4)),
          kind,
          label,
        });
      }

      return {
        ok: true,
        engine: 'browser-clipcutnet-v2',
        fps,
        total_frames: totalSteps,
        duration_sec: Number(duration.toFixed(3)),
        cut_count: cuts.length,
        cuts,
      };
    } finally {
      video.removeAttribute('src');
      try { video.load(); } catch {}
      URL.revokeObjectURL(url);
    }
  };
})();
