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
      [-0.17979702353477478, -0.08436620235443115, -0.02358904294669628, 0.054008305072784424, -0.11324252188205719, -0.22545631229877472, -0.09559384733438492, -0.0073034861125051975, -0.1538563370704651, -0.23404386639595032, -0.15822289884090424, 0.0036283337976783514],
      [-0.02999064140021801, -0.04493976756930351, -0.021493490785360336, -0.22613398730754852, 0.3399648368358612, 0.5460474491119385, 0.3714110553264618, 0.6252468824386597, 0.13585585355758667, -0.7288079857826233, -5.10350801050663e-05, -0.1741851419210434],
      [-0.05439113453030586, -0.15469998121261597, -0.1860213279724121, 0.016534462571144104, 0.02747659757733345, -0.05164574831724167, 0.005744613707065582, -0.32396697998046875, -0.17909523844718933, 0.047248389571905136, 0.06856675446033478, -0.17884153127670288],
      [0.6728488802909851, 0.3857562243938446, 0.6410841345787048, 0.8957929611206055, 0.32201969623565674, -0.37987616658210754, 0.13081301748752594, 0.13416774570941925, 0.2944468855857849, 0.5942279696464539, -0.15677745640277863, 0.7395465970039368],
      [-0.6338782906532288, 0.03854485601186752, -0.5780073404312134, -0.8858810067176819, 0.1439172774553299, 1.5250632762908936, 0.38810932636260986, 0.5748291015625, -0.19036689400672913, -0.5991522669792175, 0.7127193212509155, -0.4741421341896057],
      [0.7896009683609009, 0.3967166841030121, 0.4994019865989685, 0.5973532795906067, 0.4112350344657898, 0.052148595452308655, 0.13494692742824554, 0.29600656032562256, 0.5637597441673279, 0.6569614410400391, 0.2587284743785858, 0.8043801188468933],
      [-0.6798263192176819, -0.5965183973312378, -0.5989737510681152, -0.6064696907997131, -0.027136191725730896, 0.48690831661224365, 0.23585671186447144, 0.23421905934810638, 0.023999692872166634, -0.6385032534599304, 0.6850959062576294, -0.5245090126991272],
      [0.5186731815338135, 0.7516405582427979, 0.9323922395706177, 0.814927339553833, 0.3853543996810913, -0.0809231847524643, 0.28859710693359375, 0.268512099981308, 0.5885633826255798, 0.8004171848297119, 0.04343534633517265, 0.5052801966667175],
      [-0.0007257535471580923, -2.172608674300136e-06, 0.00274221901781857, -7.949788414407521e-05, -0.0008083332795649767, -1.0043230247447354e-08, 0.0032838883344084024, -6.783598655601963e-05, -5.871298526471946e-06, 0.0013197731459513307, -0.0012997100129723549, -0.009817796759307384],
      [0.5065049529075623, 0.6033981442451477, 0.8842380046844482, 0.715196967124939, 0.19032679498195648, 0.07622325420379639, 0.1126449853181839, 0.47954288125038147, 0.6350407004356384, 0.6201069951057434, 0.0357828326523304, 0.9279671907424927],
      [-0.11066217720508575, -0.19263291358947754, -0.017982428893446922, 0.0909029096364975, -0.20476552844047546, 0.022450346499681473, -0.11174675822257996, -0.08553719520568848, -0.2131340652704239, -0.20891982316970825, -0.1379953920841217, 0.10252361744642258],
      [-0.3408326804637909, -0.4454178810119629, -0.45368489623069763, -0.4098927080631256, -0.15361610054969788, 0.07691474258899689, -0.038904789835214615, 0.06076633557677269, -0.196877583861351, -0.6460609436035156, 0.3666883409023285, -0.5594348907470703],
      [-0.13319553434848785, -0.018688587471842766, -0.07592277228832245, 0.0554623045027256, -0.03754834830760956, -0.008658096194267273, -0.0499214231967926, 0.00732074910774827, -0.05436555668711662, 0.05800047144293785, 0.008198794908821583, -0.09110357612371445],
      [-0.23334772884845734, -0.23875883221626282, 0.028302893042564392, 0.023877274245023727, -0.08855945616960526, -0.1810639351606369, -0.052730362862348557, -0.18998268246650696, -0.12896649539470673, -0.05361674353480339, -0.044565536081790924, -0.09680064022541046],
      [-0.22799637913703918, -0.15238511562347412, -0.2779872417449951, -0.4075353443622589, -0.08375256508588791, 0.6152176260948181, 0.24397848546504974, 0.06814952194690704, -0.2565793991088867, -0.36718329787254333, 0.276466965675354, -0.6270532011985779],
      [-0.14247733354568481, -0.043687451630830765, -0.0625932514667511, -0.1963941901922226, -0.8140354752540588, -0.003940395545214415, -0.3684397339820862, -0.9512796998023987, -0.679058313369751, 0.24702823162078857, 0.46649038791656494, -0.3191450536251068],
      [-0.0003166330570820719, 7.849033067941491e-07, -0.004102166276425123, -0.001366499694995582, -0.009198595769703388, -5.292019523039926e-06, -0.008224068209528923, -0.019567592069506645, -2.173820348616573e-06, -6.0344054872985e-06, 0.00022403219190891832, 8.245435765275033e-07],
      [-1.2091280221939087, -1.3477723598480225, -0.6310411691665649, -1.2223163843154907, -0.38693860173225403, 1.3048186302185059, 0.8929444551467896, 0.3239712119102478, -0.8962867259979248, -1.0009387731552124, 1.7441977262496948, -0.7787351012229919],
      [-0.9208455085754395, -0.49459901452064514, -0.9078517556190491, -1.108104944229126, 0.20652861893177032, 0.7338427305221558, 0.6608052253723145, 0.5544798374176025, 0.026965521275997162, -0.23658952116966248, 0.550453245639801, -0.8738887310028076],
      [-0.25045984983444214, -0.6062671542167664, -0.39354994893074036, -0.376422256231308, 0.23954491317272186, 0.3962235152721405, 0.024844150990247726, 0.16766901314258575, -0.2842159867286682, -0.31689733266830444, 0.3495514988899231, -0.3099554181098938],
      [0.836699366569519, 0.5508841872215271, 0.7230257987976074, 0.7513275146484375, 0.40605464577674866, -0.2848912179470062, 0.34614282846450806, 0.3909967541694641, 0.5495821833610535, 0.701092004776001, 0.20238296687602997, 0.4875868558883667],
      [-0.6469181180000305, -0.6035060286521912, -0.553483784198761, -0.6084538698196411, -0.06476088613271713, 0.5005399584770203, 0.21926669776439667, 0.26060590147972107, 0.02102535031735897, -0.6307679414749146, 0.7921061515808105, -0.5118631720542908],
      [-1.953591066694571e-07, -8.107939208912285e-08, 4.122288288499476e-08, 6.670346124337811e-07, -7.480838394258171e-05, 1.7635144331507036e-06, 2.1114121409482323e-05, 0.001432016841135919, 2.139491516572889e-05, -0.0018715810729190707, 0.004712751135230064, -2.957300466732704e-07],
      [-0.5989367365837097, -0.6734336018562317, -0.644284188747406, -0.39674997329711914, -0.08382114768028259, 0.13890419900417328, 0.1835445761680603, 0.25708165764808655, 0.03441903367638588, -0.3021177649497986, 0.016733350232243538, -0.25205090641975403]
    ],
    b0: [
      -0.2972449064254761, 0.5036466717720032, -0.2527592182159424, -0.041148629039525986,
      0.4081094563007355, -0.1298283338546753, 0.7356025576591492, -0.08151174336671829,
      -0.014532282017171383, -0.10120291262865067, -0.16779547929763794, 0.8974721431732178,
      -0.18050099909305573, -0.18313857913017273, 0.7285537123680115, 0.1504913717508316,
      -0.08243399113416672, 0.9357821345329285, 0.9718176126480103, 0.9708598256111145,
      -0.12196275591850281, 0.696366548538208, -0.015895672142505646, 0.8031957149505615
    ],
    w2: [
      0.03333774581551552, -0.5775415897369385, -0.039201971143484116, 0.8598431348800659,
      -1.4385572671890259, 0.8433420658111572, -0.8807531595230103, 0.655812680721283,
      -9.158268767350819e-06, 0.6899520754814148, 0.008697783574461937, -0.8343973159790039,
      0.07247669249773026, 0.0833016037940979, -0.7069053053855896, -1.6997536420822144,
      -0.08531157672405243, -3.4008986949920654, -0.9830946922302246, -0.9338975548744202,
      0.643371045589447, -0.9304229021072388, -3.109257988853642e-07, -0.838661253452301
    ],
    b2: -0.7060819864273071
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
