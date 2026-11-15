/* ==========================================================================
   FLIPPY v5 — IN-BROWSER CLIPCUTNET v3 ("WHO IS STRONGEST" + VIDEO-LENS)
   100% client-side using trained 16D ClipCutNetV3 weights (Category <-> Winner)
   - High-detail 320x180 frame analysis + 3x3 Gaussian anti-noise filter
   - video-lens changed_mask() pixel fraction + local cut-ratio contrast
   - Persistent before/after window rejects 1-2 frame flashes & macroblock noise
   - Split-seam detector catches Category (2 stacked) <-> Winner (fullscreen)
   - Deliberate frame settle per seek for maximum accuracy & mobile PWA safety
   ========================================================================== */
(function () {
  'use strict';

  const MODEL_WEIGHTS = {
    w0: [
      [-0.17669792473316193, -0.37618574500083923, -0.26959311962127686, -0.3916354477405548, -0.05449619144201279, 0.15309061110019684, 0.16028572618961334, 0.28230422735214233, 0.13910286128520966, 0.08775939047336578, 0.027232319116592407, -0.08786942064762115, -0.20228414237499237, 0.1314219832420349, -0.3778586685657501, 0.3386877477169037],
      [-0.09355895221233368, -0.13414941728115082, -0.13459226489067078, -0.13245627284049988, -0.33934998512268066, -0.037848908454179764, -0.4147203266620636, -0.153628408908844, 0.20552276074886322, 0.05903278663754463, 0.09171299636363983, -0.05897946283221245, -0.2908923029899597, -0.3324093818664551, -0.06308238208293915, 0.4746369421482086],
      [-0.25654464960098267, -0.42868176102638245, -0.3749021887779236, -0.4198192059993744, -0.031101001426577568, 0.28640493750572205, 0.2869766056537628, 0.4197112023830414, 0.2358389049768448, 0.16757701337337494, 0.1018606647849083, -0.3209931254386902, -0.2835671603679657, 0.20460210740566254, -0.2929595410823822, 0.5672866702079773],
      [-0.23805269598960876, -0.2771456837654114, -0.04719800502061844, -0.17671403288841248, 0.12221749871969223, 0.04422495886683464, 0.08547645062208176, 0.18367351591587067, 0.21056880056858063, 0.015073005110025406, 0.09534534811973572, -0.27759796380996704, -0.17625689506530762, -0.0678088515996933, -0.2339603304862976, 0.38724878430366516],
      [-0.37035301327705383, -0.35808733105659485, -0.22538775205612183, -0.31890353560447693, 0.13523153960704803, 0.23543739318847656, 0.12300615757703781, 0.3657480776309967, 0.2979225814342499, 0.1616506576538086, 0.24162425100803375, -0.4688646197319031, -0.16563794016838074, 0.2796224057674408, -0.507115364074707, 0.38033854961395264],
      [0.01523449458181858, -0.002222740324214101, -0.011333352886140347, -0.06942395120859146, -0.018958846107125282, -0.0016955714672803879, -0.03010520339012146, -0.015567230992019176, -0.014528924599289894, -0.0390857495367527, 0.022855088114738464, -0.018599098548293114, -0.027472779154777527, -0.09178222715854645, 0.011233133263885975, -1.0878800821956247e-05],
      [-0.27849656343460083, -0.3452276885509491, -0.20709823071956635, -0.38922491669654846, -0.07432866096496582, 0.11787495762109756, 0.10815197229385376, 0.3632240891456604, 0.24805547297000885, 0.022861871868371964, 0.12500764429569244, -0.12918157875537872, 0.0967784896492958, 0.1337900310754776, -0.37953031063079834, 0.3315713107585907],
      [2.3283146077801575e-08, -3.013003180285523e-09, 1.630328405610726e-08, -4.609607273664551e-08, -0.00010585072595858946, 1.1107680109034845e-07, -5.128511475049891e-06, -2.2336942492984235e-05, -7.692406143178232e-07, -0.0001400589826516807, -3.950502650695853e-05, -6.398460428158614e-09, 1.3238635965251433e-08, -0.0035857297480106354, -1.3419837685546554e-08, 2.1132436245352437e-07],
      [-0.17926131188869476, -0.3746829330921173, -0.25737857818603516, -0.34656819701194763, -0.13433529436588287, 0.001689760247245431, -0.0363859198987484, 0.1669275313615799, 0.2083253115415573, 0.016431864351034164, 0.14454567432403564, -0.16455882787704468, -0.17725062370300293, 0.18036982417106628, -0.2597121298313141, 0.4640151262283325],
      [-0.368335485458374, -0.31876465678215027, -0.36883461475372314, -0.45191019773483276, 0.23120728135108948, 0.26135721802711487, 0.33502501249313354, 0.32538700103759766, 0.38241899013519287, 0.16717524826526642, 0.18587173521518707, -0.3825564682483673, -0.12797948718070984, 0.21116413176059723, -0.46549585461616516, 0.6513379812240601],
      [-0.12262597680091858, -0.00625603785738349, -0.12177900969982147, -0.203208789229393, -0.043996140360832214, 0.004585604649037123, -0.05873169004917145, -0.04390367120504379, -0.018145104870200157, -0.05754404515028, -0.1348862648010254, 0.02028447389602661, -0.05495410040020943, 0.010596857406198978, 0.02525997906923294, -0.032021209597587585],
      [0.26899608969688416, 0.3158828616142273, 0.4403304159641266, 0.3822793960571289, 0.37693551182746887, -0.06456155329942703, 0.2617162764072418, 0.06866791844367981, 0.04404091462492943, 0.36028629541397095, 0.26415371894836426, 0.21358722448349, 0.3963686525821686, 0.2659077048301697, 0.42857736349105835, -0.12320635467767715],
      [0.43434375524520874, 0.3882983922958374, 0.4425201117992401, 0.32844457030296326, 0.3609325885772705, 0.20477548241615295, 0.14754515886306763, 0.11091944575309753, 0.060189057141542435, 0.29500728845596313, 0.388813316822052, 0.5129135251045227, 0.3959757685661316, 0.3644147515296936, 0.4582218527793884, -0.11217081546783447],
      [-0.22153067588806152, -0.19235411286354065, -0.08016938716173172, -0.12428885698318481, -0.10069438815116882, 0.168060302734375, -0.004743633791804314, 0.0410776287317276, 0.04825267568230629, -0.087584488093853, -0.07239896804094315, -0.09093180298805237, -0.13086605072021484, 0.09906203299760818, -0.03129160776734352, 0.3786260783672333],
      [0.2697974145412445, 0.45268163084983826, 0.3324669599533081, 0.5349709391593933, 0.438401997089386, 0.2033744752407074, 0.30264297127723694, 0.19238536059856415, 0.13038931787014008, 0.07790332287549973, 0.3598898649215698, 0.5180608034133911, 0.13176372647285461, 0.41469618678092957, 0.5375903248786926, -0.13836729526519775],
      [0.4463580250740051, 0.3963283598423004, 0.19032205641269684, 0.5027527213096619, 0.22377529740333557, -0.022396951913833618, 0.2641947865486145, 0.11061830818653107, 0.04145437851548195, 0.352114200592041, 0.2532728612422943, 0.3642450273036957, 0.438558965921402, 0.08912423998117447, 0.3640441298484802, -0.18129214644432068],
      [-0.3501340448856354, -0.3565731644630432, -0.3440006673336029, -0.433554470539093, 0.05230720713734627, 0.09326465427875519, 0.19121621549129486, 0.25958922505378723, 0.25671258568763733, 0.11564479023218155, 0.18191899359226227, -0.40420374274253845, -0.3784641623497009, 0.18905140459537506, -0.26688823103904724, 0.4270133078098297],
      [-0.14861948788166046, -0.20441259443759918, -0.06283862143754959, -0.3679700195789337, -0.1787375658750534, 0.13776209950447083, 0.08950456231832504, 0.17339877784252167, 0.1855415403842926, -0.06372838467359543, 0.1578841209411621, -0.23124372959136963, -0.017740901559591293, 0.1464420109987259, -0.12335056066513062, 0.2689412832260132],
      [-0.2189207673072815, -0.15695291757583618, -0.02523203007876873, -0.10937299579381943, -0.18778200447559357, 0.09062490612268448, 0.029628794640302658, 0.0928836241364479, -0.006632109172642231, -0.13512784242630005, 0.049809619784355164, -0.14741314947605133, -0.06706841289997101, -0.0022868369705975056, -0.10089726001024246, 0.2696722149848938],
      [-0.003268715925514698, 0.001576873124577105, 0.02343810722231865, 0.00874354038387537, -0.022457366809248924, 0.001200582250021398, -0.01362653262913227, -0.013751617632806301, -0.0008609907235950232, -0.024895643815398216, -0.011469474993646145, 0.04295048862695694, 0.0026544106658548117, -0.08348394930362701, 0.057506851851940155, -0.0023584808222949505],
      [0.4855785369873047, 1.1620513200759888, -0.08751873672008514, 0.8795437216758728, 0.5912210941314697, -0.43489179015159607, -0.1461976170539856, -0.8748282194137573, -0.5164214372634888, 0.3319758176803589, -0.17632845044136047, 0.49247661232948303, -1.1507515907287598, -0.041237473487854004, 0.8521496057510376, -0.2800987958908081],
      [0.3463783860206604, 0.30569788813591003, 0.4930689334869385, 0.36827006936073303, 0.3621657192707062, -0.15221062302589417, 0.2375406175851822, 0.06174677982926369, 0.09808754175901413, 0.07739874720573425, 0.22201180458068848, 0.37916043400764465, 0.22038541734218597, 0.17767752707004547, 0.27161210775375366, -0.09922881424427032],
      [-0.7597324252128601, -1.0582736730575562, -0.403561532497406, -1.1497013568878174, -0.3749869465827942, 0.358569473028183, -0.24996508657932281, 0.13906726241111755, -0.6516620516777039, 0.05136615037918091, -0.12217799574136734, -0.5599417686462402, 1.2487812042236328, 0.2861316502094269, 0.2690048813819885, 0.4551962614059448],
      [0.46552911400794983, 0.23839285969734192, 0.39401042461395264, 0.5436395406723022, 0.26301494240760803, -0.020072929561138153, 0.2976163327693939, 0.2292121946811676, 0.037481874227523804, 0.2939181923866272, 0.26012206077575684, 0.38155290484428406, 0.33899497985839844, 0.15897990763187408, 0.4650653004646301, -0.2686714231967926],
      [-0.4152563810348511, -0.2522798776626587, -0.5029039978981018, -0.34582868218421936, -0.17667345702648163, -0.032885387539863586, -0.16242572665214539, -0.1111983060836792, 0.22248046100139618, 0.0595787949860096, 0.1603856235742569, -0.24894821643829346, -0.25843554735183716, 0.1859995722770691, -0.08351201564073563, 0.6752319931983948],
      [-0.2862921357154846, -0.20421847701072693, -0.3131045401096344, -0.2716289460659027, -0.3354983329772949, -0.13645637035369873, -0.3910256028175354, -0.26473352313041687, 0.12362748384475708, 0.017852826043963432, 0.0836375504732132, -0.008756862953305244, -0.21138207614421844, -0.1739915907382965, -0.04294181615114212, 0.4365059435367584],
      [-0.27876803278923035, -0.25890713930130005, -0.17327851057052612, -0.27405309677124023, -0.011977948248386383, 0.21057051420211792, 0.13682779669761658, 0.38501811027526855, 0.2600076198577881, 0.030500823631882668, 0.2365899682044983, -0.32619982957839966, -0.1137164756655693, 0.1755252331495285, -0.4643182158470154, 0.40927231311798096],
      [-0.14184372127056122, -0.28391775488853455, -0.04821755737066269, -0.20198126137256622, -0.15869824588298798, 0.08429178595542908, 0.03427594527602196, 0.1311330795288086, 0.18038149178028107, -0.04202522709965706, 0.23185069859027863, -0.16019611060619354, -0.060872919857501984, -0.037512850016355515, -0.2590486705303192, 0.6643068194389343],
      [0.45852920413017273, 0.1648334562778473, 0.4128585457801819, 0.3252260982990265, 0.3183862864971161, 0.017231706529855728, 0.17199750244617462, 0.09707467257976532, 0.1028720885515213, 0.2789768874645233, 0.35412880778312683, 0.27852341532707214, 0.1565435826778412, 0.42411333322525024, 0.5441434383392334, -0.22843366861343384],
      [-0.3989858031272888, -0.30654239654541016, -0.3311241865158081, -0.24211986362934113, -0.025377362966537476, 0.0888059064745903, 0.19824416935443878, 0.18746039271354675, 0.26476430892944336, -0.04108092933893204, 0.2233956903219223, -0.2003774493932724, -0.2830921709537506, 0.33820265531539917, -0.4512012004852295, 0.5213102102279663],
      [-1.8091286690946617e-08, -2.5248786172937798e-08, 1.7246237860035762e-07, 2.014498079461191e-08, -2.028599865866454e-08, -1.6073933295501774e-08, 5.166934329281503e-07, 4.246971343491168e-07, -1.4024345773577807e-07, 5.120909030154053e-09, -1.49559170381508e-07, 6.731755775035708e-08, 1.1888248607760943e-08, 1.398244080519362e-07, -2.1303554476048703e-09, 0.014624154195189476],
      [-0.4087466597557068, -0.30800703167915344, -0.14194348454475403, -0.18448570370674133, -0.006542769260704517, 0.14536286890506744, 0.09432259202003479, 0.23789049685001373, 0.22830340266227722, 0.012386365793645382, 0.16572098433971405, -0.17621833086013794, -0.16267111897468567, 0.015397699549794197, -0.4418809711933136, 0.29696983098983765]
    ],
    b0: [
      0.6359186172485352, 0.7933884859085083, 0.41763755679130554, 0.6046958565711975,
      0.43147769570350647, -0.10132213681936264, 0.33463743329048157, -0.01078011654317379,
      0.5971837043762207, 0.3046591579914093, -0.09531745314598083, 0.0497027151286602,
      -0.05899140611290932, 0.6597389578819275, -0.0825258418917656, -0.07652393728494644,
      0.6732437014579773, 0.6756985187530518, 0.510170042514801, -0.050896912813186646,
      0.42576664686203003, 0.07269630581140518, 0.5738827586174011, -0.09496890753507614,
      0.4961010813713074, 0.8935747146606445, 0.35017773509025574, 0.4252537190914154,
      -0.04550796374678612, 0.5404321551322937, -0.17965713143348694, 0.7006983160972595
    ],
    w2: [
      -0.6237182021141052, -0.6590706706047058, -0.6828558444976807, -0.5997942686080933,
      -0.6826919317245483, 0.002702814294025302, -0.6333824396133423, -0.0017245332710444927,
      -0.5001152753829956, -0.6782805323600769, 0.07488743215799332, 0.4542093575000763,
      0.5453953146934509, -0.5805057883262634, 0.5504257082939148, 0.45279982686042786,
      -0.5918723344802856, -0.5117480754852295, -0.2760023772716522, 0.12007059156894684,
      2.6077845096588135, 0.5824742317199707, -2.6156249046325684, 0.45727092027664185,
      -0.7050900459289551, -0.6128960847854614, -0.5698666572570801, -0.6138824224472046,
      0.485005259513855, -0.6243571639060974, -0.054807715117931366, -0.5550670623779297
    ],
    b2: -0.5485325455665588
  };

  function inferClipCutProb(feats) {
    let logit = MODEL_WEIGHTS.b2;
    const hCount = MODEL_WEIGHTS.b0.length;
    const fCount = feats.length;
    for (let j = 0; j < hCount; j++) {
      const row = MODEL_WEIGHTS.w0[j];
      let sum = MODEL_WEIGHTS.b0[j];
      for (let k = 0; k < fCount; k++) {
        sum += row[k] * feats[k];
      }
      if (sum > 0) {
        logit += MODEL_WEIGHTS.w2[j] * sum;
      }
    }
    return 1 / (1 + Math.exp(-logit));
  }

  function medianOf(arr) {
    if (!arr.length) return 0;
    const copy = arr.slice().sort((a, b) => a - b);
    return copy[copy.length >> 1];
  }

  function gaussianBlurRgb3x3(rgba, w, h) {
    const tmp = new Float32Array(w * h * 3);
    const out = new Uint8Array(w * h * 3);

    // Horizontal [0.25, 0.5, 0.25] pass (replicate borders)
    for (let y = 0; y < h; y++) {
      const row4 = y * w * 4;
      const row3 = y * w * 3;
      for (let x = 0; x < w; x++) {
        const xm = x > 0 ? x - 1 : 0;
        const xp = x < w - 1 ? x + 1 : w - 1;
        const iL = row4 + (xm << 2);
        const iC = row4 + (x << 2);
        const iR = row4 + (xp << 2);
        const o = row3 + x * 3;
        tmp[o] = 0.25 * rgba[iL] + 0.5 * rgba[iC] + 0.25 * rgba[iR];
        tmp[o + 1] = 0.25 * rgba[iL + 1] + 0.5 * rgba[iC + 1] + 0.25 * rgba[iR + 1];
        tmp[o + 2] = 0.25 * rgba[iL + 2] + 0.5 * rgba[iC + 2] + 0.25 * rgba[iR + 2];
      }
    }

    // Vertical [0.25, 0.5, 0.25] pass
    for (let y = 0; y < h; y++) {
      const ym = (y > 0 ? y - 1 : 0) * w * 3;
      const yc = y * w * 3;
      const yp = (y < h - 1 ? y + 1 : h - 1) * w * 3;
      for (let i = 0; i < w * 3; i++) {
        out[yc + i] = Math.min(255, Math.max(0, Math.round(
          0.25 * tmp[ym + i] + 0.5 * tmp[yc + i] + 0.25 * tmp[yp + i]
        )));
      }
    }
    return out;
  }

  function extractFrameStats(rgba, w, h) {
    const mid = h >> 1;
    const histFull = new Float32Array(256);
    const histTop = new Float32Array(256);
    const histBot = new Float32Array(256);
    const blurU8 = gaussianBlurRgb3x3(rgba, w, h);
    let lumaSum = 0;

    for (let y = 0; y < h; y++) {
      const targetHist = y < mid ? histTop : histBot;
      const rowOff = y * w;
      for (let x = 0; x < w; x++) {
        const px = rowOff + x;
        const p4 = px << 2;
        const p3 = px * 3;

        // Histogram uses raw resized pixel (matches cv2.calcHist on s) with dark V<18 collapse
        const r = rgba[p4];
        const g = rgba[p4 + 1];
        const b = rgba[p4 + 2];

        const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
        let bin = 0;
        if (max >= 18) {
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
          const sat255 = Math.round((delta * 255) / max);
          const hBin = Math.min(15, Math.floor((hue180 * 16) / 180));
          const sBin = Math.min(15, sat255 >> 4);
          bin = (hBin << 4) | sBin;
        }
        histFull[bin] += 1;
        targetHist[bin] += 1;

        lumaSum += (blurU8[p3] + blurU8[p3 + 1] + blurU8[p3 + 2]) / (3 * 255.0);
      }
    }

    const rowDiff = (y) => {
      let s = 0;
      const r0 = (y - 1) * w * 3;
      const r1 = y * w * 3;
      for (let i = 0; i < w * 3; i++) {
        s += Math.abs(blurU8[r1 + i] - blurU8[r0 + i]);
      }
      return s / (w * 3 * 255.0);
    };

    // Scaled seam bands for H = 180 (rows 84..96 vs surrounding 72..81 and 99..108)
    let dBandMax = 0;
    for (let y = 84; y <= 96; y++) {
      const d = rowDiff(y);
      if (d > dBandMax) dBandMax = d;
    }
    let surrA = 0;
    for (let y = 72; y <= 81; y++) surrA += rowDiff(y);
    surrA /= 10;
    let surrB = 0;
    for (let y = 99; y <= 108; y++) surrB += rowDiff(y);
    surrB /= 10;

    const seam = dBandMax / (0.5 * (surrA + surrB) + 0.006);

    return {
      histFull,
      histTop,
      histBot,
      blurU8,
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

  function diffMetricsU8(u1, u2, numPx, pixThresh = 20) {
    let sumAbs = 0;
    let changed = 0;
    const len = numPx * 3;
    for (let p = 0; p < len; p += 3) {
      const dr = Math.abs(u2[p] - u1[p]);
      const dg = Math.abs(u2[p + 1] - u1[p + 1]);
      const db = Math.abs(u2[p + 2] - u1[p + 2]);
      sumAbs += dr + dg + db;
      const cmax = dr > dg ? (dr > db ? dr : db) : (dg > db ? dg : db);
      if (cmax > pixThresh) changed++;
    }
    return {
      mae: sumAbs / (len * 255.0),
      changedFrac: changed / numPx,
    };
  }

  function settleVideoFrame() {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      // Wait 1 compositor frame (~8-16ms) with timer cap so backgrounded tabs never stall
      setTimeout(finish, 18);
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => setTimeout(finish, 0));
      }
    });
  }

  function seekVideo(video, timeSec) {
    return new Promise((resolve, reject) => {
      if (Math.abs(video.currentTime - timeSec) < 0.0004 && video.readyState >= 2) {
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

      const W = 320;
      const H = 180;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const totalSteps = Math.max(2, Math.round(duration * fps));
      const fullPx = W * H;
      const halfPx = (H >> 1) * W;

      const k = Math.max(3, Math.round(0.10 * fps));
      const localWin = Math.max(6, Math.round(0.25 * fps));

      // Lightweight per-frame metadata + sliding pixel buffer (keeps mobile RAM under ~5 MB)
      const framesMeta = new Array(totalSteps);
      const pixelRing = new Map();
      const instFullH = new Float32Array(totalSteps - 1);
      const instTopH = new Float32Array(totalSteps - 1);
      const instBotH = new Float32Array(totalSteps - 1);
      const instFullL = new Float32Array(totalSteps - 1);
      const instCFrac = new Float32Array(totalSteps - 1);

      const persFullH = new Float32Array(totalSteps - 1);
      const persTopH = new Float32Array(totalSteps - 1);
      const persBotH = new Float32Array(totalSteps - 1);
      const persFullL = new Float32Array(totalSteps - 1);
      const persCFrac = new Float32Array(totalSteps - 1);

      const medianLumaIdx = (start, end) => {
        const idxs = [];
        for (let j = start; j < end; j++) idxs.push(j);
        idxs.sort((a, b) => framesMeta[a].luma - framesMeta[b].luma);
        return idxs[idxs.length >> 1];
      };

      const finalizeTransition = (c) => {
        const aIdx = medianLumaIdx(Math.max(0, c - k), c);
        const bIdx = medianLumaIdx(c, Math.min(totalSteps, c + k));
        const ma = framesMeta[aIdx];
        const mb = framesMeta[bIdx];
        const ua = pixelRing.get(aIdx);
        const ub = pixelRing.get(bIdx);

        persFullH[c - 1] = bhattacharyya(ma.histFull, mb.histFull, fullPx);
        persTopH[c - 1] = bhattacharyya(ma.histTop, mb.histTop, halfPx);
        persBotH[c - 1] = bhattacharyya(ma.histBot, mb.histBot, fullPx - halfPx);
        if (ua && ub) {
          const dm = diffMetricsU8(ua, ub, fullPx, 20);
          persFullL[c - 1] = dm.mae;
          persCFrac[c - 1] = dm.changedFrac;
        }
        // Release expired frame buffer outside [c - k, ...]
        const evictIdx = c - k;
        if (evictIdx >= 0) pixelRing.delete(evictIdx);
      };

      for (let i = 0; i < totalSteps; i++) {
        // Deliberately seek to midpoint & settle 1 compositor frame for crisp per-frame accuracy
        const t = Math.min(duration - 0.001, (i + 0.5) / fps);
        await seekVideo(video, t);
        await settleVideoFrame();
        ctx.drawImage(video, 0, 0, W, H);
        const stats = extractFrameStats(ctx.getImageData(0, 0, W, H).data, W, H);

        framesMeta[i] = {
          histFull: stats.histFull,
          histTop: stats.histTop,
          histBot: stats.histBot,
          seam: stats.seam,
          luma: stats.luma,
        };
        pixelRing.set(i, stats.blurU8);

        if (i >= 1) {
          const prevMeta = framesMeta[i - 1];
          const currMeta = framesMeta[i];
          const prevU8 = pixelRing.get(i - 1);
          instFullH[i - 1] = bhattacharyya(prevMeta.histFull, currMeta.histFull, fullPx);
          instTopH[i - 1] = bhattacharyya(prevMeta.histTop, currMeta.histTop, halfPx);
          instBotH[i - 1] = bhattacharyya(prevMeta.histBot, currMeta.histBot, fullPx - halfPx);
          const dm = diffMetricsU8(prevU8, stats.blurU8, fullPx, 20);
          instFullL[i - 1] = dm.mae;
          instCFrac[i - 1] = dm.changedFrac;
        }

        const readyC = i - k + 1;
        if (readyC >= 1) {
          finalizeTransition(readyC);
        }

        if (onProgress && (i % 4 === 0 || i === totalSteps - 1)) {
          onProgress(Math.round((i / (totalSteps - 1)) * 100), i, totalSteps - 1);
        }
      }

      for (let c = Math.max(1, totalSteps - k + 1); c < totalSteps; c++) {
        finalizeTransition(c);
      }
      pixelRing.clear();

      const isSplit = new Uint8Array(totalSteps);
      for (let i = 0; i < totalSteps; i++) {
        const win = [];
        for (let j = Math.max(0, i - 2); j < Math.min(totalSteps, i + 3); j++) {
          win.push(framesMeta[j].seam);
        }
        isSplit[i] = medianOf(win) > 2.1 ? 1 : 0;
      }

      const probs = new Float32Array(totalSteps - 1);
      const ranks = new Float32Array(totalSteps - 1);

      for (let i = 1; i < totalSteps; i++) {
        const idx = i - 1;
        const seamsBefore = [];
        for (let j = Math.max(0, i - k); j < i; j++) seamsBefore.push(framesMeta[j].seam);
        const seamsAfter = [];
        for (let j = i; j < Math.min(totalSteps, i + k); j++) seamsAfter.push(framesMeta[j].seam);
        const sb = medianOf(seamsBefore);
        const sa = medianOf(seamsAfter);

        const seamFlip = ((sb > 2.1) !== (sa > 2.1) && Math.abs(sa - sb) >= 0.7) ? 1.0 : 0.0;
        const seamDelta = Math.min(1.0, Math.abs(sa - sb) / 4.0);
        const seamInst = Math.min(1.0, Math.abs(framesMeta[i].seam - framesMeta[i - 1].seam) / 3.0);

        const neigh = [];
        const nLo = Math.max(0, idx - localWin);
        const nHi = Math.min(totalSteps - 1, idx + localWin + 1);
        for (let j = nLo; j < idx; j++) neigh.push(instCFrac[j]);
        for (let j = idx + 1; j < nHi; j++) neigh.push(instCFrac[j]);
        const baseCf = Math.max(0.02, neigh.length ? medianOf(neigh) : 0.02);
        const localCfRatio = Math.min(1.0, (instCFrac[idx] / baseCf) / 8.0);
        const seamLevel = Math.min(1.0, framesMeta[i].seam / 6.0);

        const p = inferClipCutProb([
          instFullH[idx],
          instFullL[idx],
          instTopH[idx],
          instBotH[idx],
          persFullH[idx],
          persFullL[idx],
          persTopH[idx],
          persBotH[idx],
          Math.abs(persTopH[idx] - persBotH[idx]),
          seamFlip,
          seamDelta,
          seamInst,
          instCFrac[idx],
          persCFrac[idx],
          localCfRatio,
          seamLevel,
        ]);
        probs[idx] = p;
        ranks[idx] = p + 0.22 * instFullH[idx] + 0.20 * instFullL[idx] + 0.15 * instCFrac[idx] + 0.10 * localCfRatio;
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
          // Ceiling-align 60fps frame ticks to match Alight Motion integer ms boundaries (e.g. ...34 / ...84)
          time_ms: Math.ceil((frameIdx * 1000) / fps - 1e-5),
          score: Number(c.p.toFixed(4)),
          kind,
          label,
        });
      }

      return {
        ok: true,
        engine: 'browser-clipcutnet-v3',
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
