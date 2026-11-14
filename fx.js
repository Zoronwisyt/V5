/* ==========================================================================
   FL-5 — STUDIO INTERACTION, THEME & TACTILE AUDIO CONTROLLER
   Inspector accordions · Math drawer · Dark green theme · Shortcuts
   GSAP & ScrollTrigger Staggered Card Entrance Animations
   Web Audio API Studio Synthesizer (Zero-dependency, offline sound effects)
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // 1. TACTILE STUDIO SFX ENGINE (WEB AUDIO API SYNTHESIS)
  // ==========================================================================
  const StudioAudio = (function () {
    let ctx = null;
    let isMuted = false;

    try {
      const saved = localStorage.getItem('flippy_sfx_enabled');
      if (saved === 'false') isMuted = true;
    } catch (e) {}

    function getContext() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    // Unlock audio context on first user interaction
    function unlockAudio() {
      const c = getContext();
      if (c && c.state === 'suspended') {
        c.resume().catch(() => {});
      }
    }
    ['click', 'touchstart', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, unlockAudio, { once: true, passive: true });
    });

    return {
      isMuted() {
        return isMuted;
      },
      toggleMute() {
        isMuted = !isMuted;
        try {
          localStorage.setItem('flippy_sfx_enabled', isMuted ? 'false' : 'true');
        } catch (e) {}
        if (!isMuted) {
          this.playSuccess();
        }
        return isMuted;
      },

      // 1. Soft organic tactile click for buttons/pills
      playClick() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;
        try {
          const now = c.currentTime;
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(now);
          osc.stop(now + 0.038);
        } catch (e) {}
      },

      // 2. Crisp mechanical switch click for toggles
      playToggle(isActive) {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;
        try {
          const now = c.currentTime;
          const osc1 = c.createOscillator();
          const osc2 = c.createOscillator();
          const gain = c.createGain();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          const startFreq = isActive ? 520 : 380;
          const endFreq = isActive ? 780 : 260;
          osc1.frequency.setValueAtTime(startFreq, now);
          osc1.frequency.exponentialRampToValueAtTime(endFreq, now + 0.045);
          osc2.frequency.setValueAtTime(startFreq * 1.5, now);
          osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + 0.045);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(c.destination);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.05);
          osc2.stop(now + 0.05);
        } catch (e) {}
      },

      // 3. Card accordion smooth whoosh
      playAccordion(isOpen) {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;
        try {
          const now = c.currentTime;
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          const f1 = isOpen ? 240 : 400;
          const f2 = isOpen ? 480 : 200;
          osc.frequency.setValueAtTime(f1, now);
          osc.frequency.exponentialRampToValueAtTime(f2, now + 0.07);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(now);
          osc.stop(now + 0.075);
        } catch (e) {}
      },

      // 4. Tab switch melodic ambient chime
      playTab() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;
        try {
          const now = c.currentTime;
          [523.25, 659.25].forEach((freq, idx) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sine';
            const start = now + idx * 0.035;
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.045, start);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(start);
            osc.stop(start + 0.13);
          });
        } catch (e) {}
      },

      // 5. Success / Export harmonic chime
      playSuccess() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;
        try {
          const now = c.currentTime;
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sine';
            const delay = idx * 0.045;
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0.05, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.22);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.25);
          });
        } catch (e) {}
      },

      // 6. Play / Pause transport snap
      playTransport(isPlaying) {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;
        try {
          const now = c.currentTime;
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'triangle';
          const start = isPlaying ? 350 : 550;
          const end = isPlaying ? 720 : 260;
          osc.frequency.setValueAtTime(start, now);
          osc.frequency.exponentialRampToValueAtTime(end, now + 0.04);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(now);
          osc.stop(now + 0.045);
        } catch (e) {}
      },

      // 7. Soft keypress tick
      playKey() {
        if (isMuted) return;
        const c = getContext();
        if (!c) return;
        try {
          const now = c.currentTime;
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(580 + Math.random() * 120, now);
          gain.gain.setValueAtTime(0.025, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(now);
          osc.stop(now + 0.028);
        } catch (e) {}
      }
    };
  })();

  window.FlippyAudio = StudioAudio;

  // Sync sound toggle button UI
  function syncSoundToggleUI() {
    const isMuted = StudioAudio.isMuted();
    ['soundToggleBtn', 'mobileSoundToggleBtn'].forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.classList.toggle('active', !isMuted);
      const iconOn = btn.querySelector('.icon-sound-on');
      const iconOff = btn.querySelector('.icon-sound-off');
      if (iconOn) iconOn.style.display = isMuted ? 'none' : 'block';
      if (iconOff) iconOff.style.display = isMuted ? 'block' : 'none';
    });
  }

  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      StudioAudio.toggleMute();
      syncSoundToggleUI();
    });
  }

  const mobileSoundBtn = document.getElementById('mobileSoundToggleBtn');
  if (mobileSoundBtn) {
    mobileSoundBtn.addEventListener('click', () => {
      StudioAudio.toggleMute();
      syncSoundToggleUI();
    });
  }

  syncSoundToggleUI();

  // ==========================================================================
  // 2. INSPECTOR MODULE ACCORDIONS & FOLD/EXPAND ALL
  // ==========================================================================
  const modules = Array.from(document.querySelectorAll('.module[data-module]'));
  const collapseAllBtn = document.getElementById('collapseAllBtn');

  function syncCollapseAllLabel() {
    if (!collapseAllBtn) return;
    const labelSpan = collapseAllBtn.querySelector('span');
    if (!labelSpan) return;
    const anyOpen = modules.some((m) => m.classList.contains('open'));
    labelSpan.textContent = anyOpen ? 'Fold All' : 'Expand All';
  }

  modules.forEach((mod) => {
    const head = mod.querySelector('.module-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const willOpen = !mod.classList.contains('open');
      mod.classList.toggle('open', willOpen);
      head.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      syncCollapseAllLabel();
      StudioAudio.playAccordion(willOpen);
    });
  });

  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      const anyOpen = modules.some((m) => m.classList.contains('open'));
      const targetState = !anyOpen;
      modules.forEach((mod) => {
        mod.classList.toggle('open', targetState);
        const head = mod.querySelector('.module-head');
        if (head) head.setAttribute('aria-expanded', targetState ? 'true' : 'false');
      });
      syncCollapseAllLabel();
      StudioAudio.playAccordion(targetState);
    });
  }

  // On compact mobile screens, fold secondary modules (04, 05) initially so Setup stays scannable
  if (window.innerWidth <= 860 && modules.length >= 5) {
    [3, 4].forEach((idx) => {
      const mod = modules[idx];
      if (!mod) return;
      mod.classList.remove('open');
      const head = mod.querySelector('.module-head');
      if (head) head.setAttribute('aria-expanded', 'false');
    });
    syncCollapseAllLabel();
  }

  // Prevent focused number inputs inside the left Inspector from hijacking mouse-wheel scrolling
  const controlsBody = document.querySelector('.controls-body');
  if (controlsBody) {
    controlsBody.addEventListener(
      'wheel',
      (e) => {
        const active = document.activeElement;
        if (active && active.tagName === 'INPUT' && active.type === 'number' && controlsBody.contains(active)) {
          active.blur();
        }
      },
      { passive: true }
    );
  }

  // ==========================================================================
  // 3. SLICE MATH & COORDINATES COLLAPSIBLE DRAWER
  // ==========================================================================
  const formulasCard = document.getElementById('formulasCard');
  const formulasToggleBtn = document.getElementById('formulasToggleBtn');

  if (formulasCard && formulasToggleBtn) {
    // Collapse math breakdown by default on mobile so Canvas + Transport fit above the fold
    if (window.innerWidth <= 860) {
      formulasCard.classList.add('collapsed');
      formulasToggleBtn.setAttribute('aria-expanded', 'false');
    }

    formulasToggleBtn.addEventListener('click', () => {
      const isCollapsed = formulasCard.classList.toggle('collapsed');
      formulasToggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      StudioAudio.playAccordion(!isCollapsed);
    });
  }

  // ==========================================================================
  // 4. DARK GREEN THEME CONTROLLER
  // ==========================================================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const mobileThemeToggleBtn = document.getElementById('mobileThemeToggleBtn');
  const metaThemeColor = document.getElementById('metaThemeColor');

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', next === 'light' ? '#f2eee5' : '#070e0a');
    }
    try {
      localStorage.setItem('flippy_v5_theme', next);
      localStorage.setItem('flippy_v4_theme', next);
    } catch (e) {}

    // Sync embedded Bezier Curve editors
    ['graphIframe', 'graphIframe2'].forEach((id) => {
      const frame = document.getElementById(id);
      if (frame && frame.contentWindow) {
        try {
          frame.contentWindow.postMessage({ type: 'SET_THEME', theme: next }, '*');
        } catch (e) {}
      }
    });

    window.dispatchEvent(new CustomEvent('flippy:themechange', { detail: { theme: next } }));
    StudioAudio.playClick();
  }

  let pageFlipSheetTimer = null;
  function triggerPageFlipTransition(forward = true) {
    let sheet = document.getElementById('guiPageFlipSheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'guiPageFlipSheet';
      sheet.className = 'gui-pageflip-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sheet);
    }
    sheet.classList.remove('flip-forward', 'flip-reverse');
    void sheet.offsetWidth; // force reflow so rapid switches replay cleanly
    sheet.classList.add(forward ? 'flip-forward' : 'flip-reverse');
    clearTimeout(pageFlipSheetTimer);
    pageFlipSheetTimer = setTimeout(() => {
      sheet.classList.remove('flip-forward', 'flip-reverse');
    }, 620);
  }

  let themeTransitionTimer = null;
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextLight = cur === 'dark';
    triggerPageFlipTransition(nextLight);
    document.documentElement.classList.add('theme-transitioning');
    clearTimeout(themeTransitionTimer);
    themeTransitionTimer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 540);
    applyTheme(nextLight ? 'light' : 'dark');
  }

  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener('click', toggleTheme);

  // Sync theme to iframes once they finish loading
  ['graphIframe', 'graphIframe2'].forEach((id) => {
    const frame = document.getElementById(id);
    if (frame) {
      frame.addEventListener('load', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        try {
          frame.contentWindow.postMessage({ type: 'SET_THEME', theme: cur }, '*');
        } catch (e) {}
      });
    }
  });

  // ==========================================================================
  // 4B. CLASSIC GUI LOCK + TRANSITION SFX HELPER
  // ==========================================================================
  let guiTransitionTimer = null;
  document.documentElement.setAttribute('data-gui', 'classic');
  localStorage.removeItem('flippy_v5_gui_mode');

  function playGuiSwitch(isForward) {
    if (localStorage.getItem('flippy_sfx_enabled') === 'false') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const freqs = isForward ? [440, 587.33] : [587.33, 440];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.0001, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.065 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.065 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.17);
      });
    } catch (e) {}
  }

  // ==========================================================================
  // 4C. INSPECTOR LAYOUT SWITCH (OWN FULL-PAGE TAB [DEFAULT] vs FLOATING)
  // ==========================================================================
  const inspectorModeBtn = document.getElementById('mobileInspectorModeBtn');
  const inspectorPill = document.getElementById('mobileInspectorToggleBtn');
  const floatingInspector = document.getElementById('mobileFloatingInspector');
  const inspectorTabPage = document.getElementById('mobileTabInspector');
  const inspectorPageSlot = document.getElementById('mobileInspectorPageSlot');
  const mobileConfigSlot = document.getElementById('mobileConfigSlot');
  const rootEl = document.documentElement;

  function syncInspectorDomPlacement() {
    if (window.innerWidth > 860) return;
    const mode = rootEl.getAttribute('data-inspector') || 'tab';
    const controlsBody = document.querySelector('#mobileConfigSlot > .controls-body, #mobileInspectorPageSlot > .controls-body');
    if (!controlsBody) return;
    if (mode === 'tab' && inspectorPageSlot && controlsBody.parentElement !== inspectorPageSlot) {
      inspectorPageSlot.appendChild(controlsBody);
    } else if (mode === 'floating' && mobileConfigSlot && controlsBody.parentElement !== mobileConfigSlot) {
      mobileConfigSlot.appendChild(controlsBody);
    }
  }

  function setInspectorTabOpen(open) {
    rootEl.classList.toggle('inspector-tab-open', open);
    if (inspectorPill) {
      inspectorPill.classList.toggle('active', open);
      inspectorPill.setAttribute('aria-expanded', String(open));
    }
    if (open) {
      syncInspectorDomPlacement();
      document.querySelectorAll('.mobile-tab-content.active').forEach((c) => {
        if (c !== inspectorTabPage) c.classList.remove('active');
      });
      document.querySelectorAll('.mobile-tab.active').forEach((t) => t.classList.remove('active'));
      if (inspectorTabPage) inspectorTabPage.classList.add('active');
    } else {
      if (inspectorTabPage) inspectorTabPage.classList.remove('active');
      if (!document.querySelector('.mobile-tab-content.active')) {
        const previewTab = document.getElementById('mobileTabPreview');
        if (previewTab) previewTab.classList.add('active');
      }
      if (!document.querySelector('.mobile-tab.active')) {
        const activeContent = document.querySelector('.mobile-tab-content.active');
        const match = activeContent && document.querySelector(`.mobile-tab[data-tab="${activeContent.id}"]`);
        if (match) match.classList.add('active');
      }
    }
  }

  function applyInspectorMode(mode, withTransition = false) {
    const next = mode === 'floating' ? 'floating' : 'tab';
    if (withTransition) {
      triggerPageFlipTransition(next === 'tab');
      rootEl.classList.add('gui-transitioning');
      clearTimeout(guiTransitionTimer);
      guiTransitionTimer = setTimeout(() => rootEl.classList.remove('gui-transitioning'), 540);
      playGuiSwitch(next === 'tab');
    }
    rootEl.setAttribute('data-inspector', next);
    localStorage.setItem('flippy_v5_inspector_mode', next);
    if (inspectorModeBtn) inspectorModeBtn.classList.toggle('active', next === 'tab');
    syncInspectorDomPlacement();
    if (next === 'floating') {
      setInspectorTabOpen(false);
    } else {
      setInspectorTabOpen(false);
    }
  }

  if (inspectorModeBtn) {
    inspectorModeBtn.addEventListener('click', () => {
      const cur = rootEl.getAttribute('data-inspector') || 'tab';
      applyInspectorMode(cur === 'floating' ? 'tab' : 'floating', true);
    });
  }

  // In tab mode, Inspector pill switches to the dedicated #mobileTabInspector full page
  if (inspectorPill) {
    inspectorPill.addEventListener('click', (e) => {
      if (rootEl.getAttribute('data-inspector') !== 'tab') return;
      e.stopImmediatePropagation();
      e.preventDefault();
      setInspectorTabOpen(true);
      StudioAudio.playTab();
    }, true);
  }

  document.querySelectorAll('.mobile-tab[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (rootEl.getAttribute('data-inspector') === 'tab') {
        rootEl.classList.remove('inspector-tab-open');
        if (inspectorTabPage) inspectorTabPage.classList.remove('active');
        if (inspectorPill) inspectorPill.classList.remove('active');
      }
    });
  });

  window.addEventListener('flippy:unlocked', () => setTimeout(syncInspectorDomPlacement, 60));
  window.addEventListener('resize', () => setTimeout(syncInspectorDomPlacement, 60));
  applyInspectorMode(localStorage.getItem('flippy_v5_inspector_mode') || 'tab', false);
  setTimeout(syncInspectorDomPlacement, 120);

  // ==========================================================================
  // 5. GLOBAL INTERACTIVE SFX & ANIMATIONS HOOK
  // ==========================================================================
  document.addEventListener('click', (e) => {
    // 1. Navigation and Mobile tabs
    const tabBtn = e.target.closest('.nav-tab, .mobile-tab');
    if (tabBtn) {
      StudioAudio.playTab();
      return;
    }

    // 2. Segmented toggle buttons
    const toggleBtn = e.target.closest('.toggle-btn');
    if (toggleBtn) {
      const willBeActive = !toggleBtn.classList.contains('active');
      StudioAudio.playToggle(willBeActive);
      return;
    }

    // 3. Preset pills
    const pill = e.target.closest('.preset-pill');
    if (pill) {
      StudioAudio.playClick();
      return;
    }

    // 4. Export & Download action buttons
    const exportBtn = e.target.closest(
      '.header-export-btn, #mobileHeaderDlBtn, #exportXmlBtn, #copyXmlBtn, #downloadXmlBtn, .xml-action-btn'
    );
    if (exportBtn) {
      StudioAudio.playSuccess();
      return;
    }

    // 5. Play / Pause button
    const playBtn = e.target.closest('#playBtn, #hbPlayBtn, #rpPlayBtn');
    if (playBtn) {
      const isPlaying = playBtn.classList.contains('active') || playBtn.getAttribute('aria-pressed') === 'true';
      StudioAudio.playTransport(!isPlaying);
      return;
    }

    // 6. Generic buttons, modal triggers, icons
    const anyBtn = e.target.closest('button, .ph-action, .pw-vis-btn, .link-btn, .close-btn');
    if (anyBtn) {
      StudioAudio.playClick();
    }
  });

  // Subtle keypress ticks for inputs
  let lastKeyTick = 0;
  document.addEventListener(
    'input',
    (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        const now = Date.now();
        if (now - lastKeyTick > 60) {
          lastKeyTick = now;
          StudioAudio.playKey();
        }
      }
    },
    { passive: true }
  );

  // Scrubber audio feedback
  const scrubber = document.getElementById('playbackScrubber');
  if (scrubber) {
    let lastScrub = 0;
    scrubber.addEventListener(
      'input',
      () => {
        const now = Date.now();
        if (now - lastScrub > 75) {
          lastScrub = now;
          StudioAudio.playKey();
        }
      },
      { passive: true }
    );
  }

  // ==========================================================================
  // 6. STUDIO KEYBOARD SHORTCUTS
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('locked')) return;

    if (e.key === 'Escape') {
      ['graphModal', 'pasteXmlModal', 'importSettingsModal'].forEach((id) => {
        const modal = document.getElementById(id);
        if (modal && modal.style.display !== 'none') {
          modal.style.display = 'none';
          StudioAudio.playClick();
        }
      });
      return;
    }

    if (e.code === 'Space') {
      const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || (e.target && e.target.isContentEditable)) {
        return;
      }
      const anyModalOpen = ['graphModal', 'pasteXmlModal', 'importSettingsModal'].some((id) => {
        const el = document.getElementById(id);
        return el && el.style.display !== 'none';
      });
      if (anyModalOpen) return;

      const hollowPanel = document.getElementById('hollowboxPanel');
      const mobileHbTab = document.getElementById('mobileTabHollowBox');
      const hbVisible = (hollowPanel && hollowPanel.offsetParent !== null) || (mobileHbTab && mobileHbTab.classList.contains('active'));
      if (hbVisible) {
        const hbPlay = document.getElementById('hbPlayBtn');
        if (hbPlay) {
          e.preventDefault();
          hbPlay.click();
        }
        return;
      }

      const previewPanel = document.getElementById('preview-panel');
      const mobilePrevTab = document.getElementById('mobileTabPreview');
      const studioVisible = (previewPanel && previewPanel.offsetParent !== null) || (mobilePrevTab && mobilePrevTab.classList.contains('active'));
      if (studioVisible) {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
          e.preventDefault();
          playBtn.click();
        }
      }
    }
  });

  // ==========================================================================
  // 7. GSAP & SCROLLTRIGGER STAGGERED CARD ENTRANCE CONTROLLER
  // ==========================================================================
  function initGsapScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Subtle scale & entrance for the access key card on page load
    const accessCard = document.getElementById('accessCard');
    if (accessCard && document.body.classList.contains('locked')) {
      gsap.fromTo(
        accessCard,
        { opacity: 0, y: 26, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
      );
    }

    function setupCardScrollTriggers() {
      // Clean up previous triggers to avoid stale references
      ScrollTrigger.getAll().forEach((t) => t.kill());

      const isMobile = window.innerWidth <= 860;

      // 1. Left Inspector Modules stagger on scroll
      const cBody = document.querySelector('.controls-body');
      const moduleCards = gsap.utils.toArray('.controls-body .module');

      if (moduleCards.length > 0) {
        if (!isMobile && cBody) {
          // Desktop: scrolling inside the controls-body container
          moduleCards.forEach((mod) => {
            gsap.fromTo(
              mod,
              { opacity: 0, y: 20, scale: 0.985 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: mod,
                  scroller: cBody,
                  start: 'top 96%',
                  toggleActions: 'play none none none',
                  once: true
                }
              }
            );
          });
        } else {
          // Mobile: main window scrolling
          ScrollTrigger.batch(moduleCards, {
            scroller: window,
            start: 'top 92%',
            once: true,
            onEnter: (batch) => {
              gsap.fromTo(
                batch,
                { opacity: 0, y: 22, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
              );
            }
          });
        }
      }

      // 2. Wipe Studio Center & Data Cards
      const studioCards = gsap.utils.toArray(
        '.canvas-container, .playback-controls, .formulas-card, .table-container, .xml-preview-card, .preset-shelf-card'
      );
      if (studioCards.length > 0) {
        ScrollTrigger.batch(studioCards, {
          scroller: window,
          start: 'top 92%',
          once: true,
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.55, stagger: 0.09, ease: 'power2.out' }
            );
          }
        });
      }

      // 3. Media Converter Cards
      const convCards = gsap.utils.toArray('.converter-card, .hb-card');
      if (convCards.length > 0) {
        ScrollTrigger.batch(convCards, {
          scroller: window,
          start: 'top 88%',
          once: true,
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 28, scale: 0.97 },
              { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.15)' }
            );
          }
        });
      }

      // 4. YT Converter Cards
      const ytcCards = gsap.utils.toArray('.ytc-card');
      if (ytcCards.length > 0) {
        ScrollTrigger.batch(ytcCards, {
          scroller: window,
          start: 'top 88%',
          once: true,
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 28, scale: 0.97 },
              { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.15)' }
            );
          }
        });
      }

      // 5. Real Preview Cards
      const rpCards = gsap.utils.toArray('.realpreview-stage-card, .realpreview-inspector-card, .realpreview-transport');
      if (rpCards.length > 0) {
        ScrollTrigger.batch(rpCards, {
          scroller: window,
          start: 'top 90%',
          once: true,
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.55, stagger: 0.09, ease: 'power2.out' }
            );
          }
        });
      }

      ScrollTrigger.refresh();
    }

    function triggerTabCardEntrance(tabName) {
      let containerSelector = '';
      if (tabName === 'converter') containerSelector = '#converter-panel';
      else if (tabName === 'realpreview') containerSelector = '#realpreview-panel';
      else if (tabName === 'ytconverter') containerSelector = '#ytconverter-panel';
      else containerSelector = '#app-main';

      const container = document.querySelector(containerSelector);
      if (!container) return;

      const cards = container.querySelectorAll(
        '.module, .converter-card, .ytc-card, .realpreview-stage-card, .realpreview-inspector-card, .formulas-card, .playback-controls'
      );
      if (!cards.length) return;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 20, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out', clearProps: 'transform' }
      );

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 60);
    }

    setupCardScrollTriggers();

    window.addEventListener('flippy:unlocked', () => {
      StudioAudio.playSuccess();
      setTimeout(() => {
        setupCardScrollTriggers();
        triggerTabCardEntrance('studio');
      }, 120);
    });

    window.addEventListener('flippy:tabswitched', (e) => {
      setTimeout(() => {
        setupCardScrollTriggers();
        triggerTabCardEntrance(e.detail && e.detail.tab);
      }, 80);
    });

    window.addEventListener('resize', () => {
      ScrollTrigger.refresh();
    });
  }

  // Initialize GSAP ScrollTrigger animations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGsapScrollAnimations);
  } else {
    initGsapScrollAnimations();
  }

  // ==========================================================================
  // 8. ALIGHT LINK -> ALIGHT MOTION XML CONVERTER (OWN TAB + NATIVE GUI)
  // ==========================================================================
  const navTabAmLink = document.getElementById('navTabAmLink');
  const amlinkPanel = document.getElementById('amlink-panel');
  const mobileNavAmLink = document.getElementById('mobileNavAmLink');
  const mobileTabAmLink = document.getElementById('mobileTabAmLink');
  const mobileAmLinkSlot = document.getElementById('mobileAmLinkSlot');
  const appMainEl = document.getElementById('app-main');

  function syncAmLinkPlacement() {
    if (!amlinkPanel) return;
    if (window.innerWidth <= 860) {
      if (mobileAmLinkSlot && amlinkPanel.parentElement !== mobileAmLinkSlot) {
        mobileAmLinkSlot.appendChild(amlinkPanel);
      }
      amlinkPanel.style.display = 'block';
    } else if (appMainEl && amlinkPanel.parentElement !== appMainEl) {
      appMainEl.appendChild(amlinkPanel);
      amlinkPanel.style.display = (navTabAmLink && navTabAmLink.classList.contains('active')) ? 'flex' : 'none';
    }
  }

  if (navTabAmLink && amlinkPanel) {
    navTabAmLink.addEventListener('click', () => {
      ['controls-panel', 'preview-panel', 'data-panel', 'converter-panel', 'xmlbeat-panel', 'realpreview-panel', 'ytconverter-panel', 'hollowboxPanel', 'editing-panel'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
      navTabAmLink.classList.add('active');
      syncAmLinkPlacement();
      amlinkPanel.style.display = 'flex';
      window.dispatchEvent(new CustomEvent('flippy:tabswitched', { detail: { tab: 'amlink' } }));
    });
  }

  document.querySelectorAll('.nav-tab').forEach((tab) => {
    if (tab === navTabAmLink) return;
    tab.addEventListener('click', () => {
      if (navTabAmLink) navTabAmLink.classList.remove('active');
      if (amlinkPanel && window.innerWidth > 860) amlinkPanel.style.display = 'none';
    });
  });

  if (mobileNavAmLink && mobileTabAmLink) {
    mobileNavAmLink.addEventListener('click', () => {
      syncAmLinkPlacement();
      document.querySelectorAll('.mobile-tab-content.active').forEach((c) => c.classList.remove('active'));
      document.querySelectorAll('.mobile-tab.active, .mobile-inspector-pill.active').forEach((t) => t.classList.remove('active'));
      document.documentElement.classList.remove('inspector-tab-open');
      mobileTabAmLink.classList.add('active');
      mobileNavAmLink.classList.add('active');
    });
  }

  document.querySelectorAll('.mobile-tab, #mobileInspectorToggleBtn').forEach((btn) => {
    if (btn === mobileNavAmLink) return;
    btn.addEventListener('click', () => {
      if (mobileNavAmLink) mobileNavAmLink.classList.remove('active');
      if (mobileTabAmLink) mobileTabAmLink.classList.remove('active');
    });
  });

  window.addEventListener('resize', () => setTimeout(syncAmLinkPlacement, 60));
  window.addEventListener('flippy:unlocked', () => setTimeout(syncAmLinkPlacement, 80));
  setTimeout(syncAmLinkPlacement, 120);

  const amLinkInput = document.getElementById('amShareLinkInput');
  const amLinkConvertBtn = document.getElementById('amLinkConvertBtn');
  const amProjFileInput = document.getElementById('amProjFileInput');
  const amLinkMetaCard = document.getElementById('amLinkMetaCard');
  const amLinkThumb = document.getElementById('amLinkThumb');
  const amLinkTitle = document.getElementById('amLinkTitle');
  const amLinkDesc = document.getElementById('amLinkDesc');
  const amLinkIds = document.getElementById('amLinkIds');
  const amLinkStatus = document.getElementById('amLinkStatus');
  const amLinkXmlCode = document.getElementById('amLinkXmlCode');
  const amLinkDownloadXmlBtn = document.getElementById('amLinkDownloadXmlBtn');
  const amLinkCopyXmlBtn = document.getElementById('amLinkCopyXmlBtn');
  let lastGeneratedAmXml = '';
  let lastAmFilename = 'alight_project.xml';

  function escXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function buildAlightProjectXml(meta) {
    const title = meta.title || 'Alight Motion Project';
    const uid = meta.uid || '';
    const projectId = meta.projectId || '';
    const ver = meta.amVersionString || '3.6.1';
    const desc = meta.description || '';
    const url = meta.canonical || meta.rawUrl || '';
    return [
      '<?xml version="1.0" encoding="utf-8"?>',
      `<!-- Converted by FL-5 · Source: ${escXml(url)} -->`,
      desc ? `<!-- Package Info: ${escXml(desc)} -->` : '',
      `<scene title="${escXml(title)}" width="1080" height="1920" exportWidth="1080" exportHeight="1920" fps="60" totalTime="5000" bgcolor="#ff000000" amver="${escXml(ver)}">`,
      `  <bookmark t="0" label="${escXml(title)}" />`,
      `  <shape id="1" label="${escXml(title)}" startTime="0" endTime="5000" fillType="color" s=".rect">`,
      '    <transform>',
      '      <location value="540.000,960.000,0.000" />',
      '      <scale value="1.000,1.000" />',
      '      <rotation value="0.000" />',
      '    </transform>',
      '    <property name="size" type="vec2" value="540.000,540.000" />',
      '    <fillColor value="#ff5d866c" />',
      '  </shape>',
      uid || projectId ? `  <!-- Alight Share IDs: uid=${escXml(uid)} projectId=${escXml(projectId)} -->` : '',
      '</scene>'
    ].filter(Boolean).join('\n');
  }

  function setAmXmlOutput(xml, filename, statusMsg) {
    lastGeneratedAmXml = xml;
    lastAmFilename = filename || 'alight_project.xml';
    if (amLinkXmlCode) amLinkXmlCode.textContent = xml;
    if (amLinkDownloadXmlBtn) amLinkDownloadXmlBtn.disabled = !xml;
    if (amLinkCopyXmlBtn) amLinkCopyXmlBtn.disabled = !xml;
    if (amLinkStatus) amLinkStatus.textContent = statusMsg || '';
  }

  if (amLinkConvertBtn && amLinkInput) {
    amLinkConvertBtn.addEventListener('click', async () => {
      const url = (amLinkInput.value || '').trim();
      if (!url) {
        if (amLinkStatus) amLinkStatus.textContent = 'Please paste an Alight Motion share link first.';
        return;
      }
      if (amLinkStatus) amLinkStatus.textContent = 'Fetching Alight Motion share metadata...';
      try {
        const res = await fetch(`/__fl5_am_link?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        if (amLinkMetaCard) amLinkMetaCard.style.display = 'flex';
        if (amLinkThumb) {
          if (data.thumbnail) {
            amLinkThumb.src = data.thumbnail;
            amLinkThumb.style.display = 'block';
          } else {
            amLinkThumb.style.display = 'none';
          }
        }
        if (amLinkTitle) amLinkTitle.textContent = data.title || 'Alight Motion Project';
        if (amLinkDesc) amLinkDesc.textContent = data.description || '';
        if (amLinkIds) {
          amLinkIds.textContent = `UID: ${data.uid || '—'} · Project: ${data.projectId || '—'} · AM v${data.amVersionString || '3.6.1'}`;
        }
        const safeName = (data.title || 'alight_project').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'alight_project';
        const xml = buildAlightProjectXml(data);
        setAmXmlOutput(
          xml,
          `${safeName}.xml`,
          'Generated Alight Motion XML from share link metadata. (Note: Alight Creative does not expose private layer internals over public share links—load an exported .amproj/.xml file if you have the package file.)'
        );
        StudioAudio.playSuccess();
      } catch (err) {
        const m = url.match(/\/u\/([^/]+)\/p\/([^/?#]+)/i);
        const fallbackMeta = {
          title: m ? `Alight Project ${m[2].slice(0, 10)}` : 'Alight Motion Project',
          uid: m ? m[1] : '',
          projectId: m ? m[2] : '',
          rawUrl: url
        };
        const xml = buildAlightProjectXml(fallbackMeta);
        setAmXmlOutput(xml, 'alight_project.xml', `Generated XML shell (${err.message}).`);
      }
    });
  }

  if (amProjFileInput) {
    amProjFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const xmlMatch = text.match(/<\?xml[\s\S]*<\/scene>|<scene[\s\S]*<\/scene>/i);
        if (xmlMatch) {
          const base = file.name.replace(/\.[^.]+$/, '') || 'alight_project';
          setAmXmlOutput(xmlMatch[0], `${base}.xml`, `Extracted Alight Motion XML from ${file.name}.`);
          StudioAudio.playSuccess();
        } else {
          if (amLinkStatus) amLinkStatus.textContent = `Could not find uncompressed <scene> XML inside ${file.name}. If it is a compressed .amproj zip, extract project.xml from the archive first.`;
        }
      } catch (err) {
        if (amLinkStatus) amLinkStatus.textContent = `Failed to read file: ${err.message}`;
      }
    });
  }

  if (amLinkDownloadXmlBtn) {
    amLinkDownloadXmlBtn.addEventListener('click', () => {
      if (!lastGeneratedAmXml) return;
      const blob = new Blob([lastGeneratedAmXml], { type: 'application/xml;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = lastAmFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 250);
      StudioAudio.playClick();
    });
  }

  if (amLinkCopyXmlBtn) {
    amLinkCopyXmlBtn.addEventListener('click', async () => {
      if (!lastGeneratedAmXml) return;
      try {
        await navigator.clipboard.writeText(lastGeneratedAmXml);
        if (amLinkStatus) amLinkStatus.textContent = 'Copied XML to clipboard.';
        StudioAudio.playClick();
      } catch (err) {}
    });
  }

  // ==========================================================================
  // 9. TAB QUICK FADE & POST-UNLOCK BUTTON BOUNCE TWEENING
  // ==========================================================================
  function triggerTabFade(el) {
    if (!el) return;
    el.classList.remove('tab-fade-enter');
    void el.offsetWidth;
    el.classList.add('tab-fade-enter');
    setTimeout(() => el.classList.remove('tab-fade-enter'), 300);
  }

  window.addEventListener('flippy:tabswitched', () => {
    document.querySelectorAll('#app-main > .panel').forEach((panel) => {
      if (panel.style.display !== 'none') triggerTabFade(panel);
    });
  });

  document.querySelectorAll('.mobile-tab, #mobileInspectorToggleBtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setTimeout(() => {
        const activeTab = document.querySelector('.mobile-tab-content.active');
        if (activeTab) triggerTabFade(activeTab);
      }, 10);
    });
  });

  let unlockBounceTimer = null;
  window.addEventListener('flippy:unlocked', () => {
    const targets = document.querySelectorAll(
      '.nav-tab, .header-right > *, .mobile-tab, .mobile-inspector-pill, .mobile-header-right > *, .module, .converter-card'
    );
    const rots = ['-4.5deg', '4deg', '-3deg', '3.5deg', '-2.5deg', '2.5deg'];
    targets.forEach((el, i) => {
      el.style.setProperty('--unlock-rot', rots[i % rots.length]);
      el.style.setProperty('--unlock-delay', `${Math.min(i * 22, 320)}ms`);
    });
    document.documentElement.classList.add('fl5-unlock-bounce');
    clearTimeout(unlockBounceTimer);
    unlockBounceTimer = setTimeout(() => {
      document.documentElement.classList.remove('fl5-unlock-bounce');
    }, 980);
  });

  // ==========================================================================
  // 10. XML BEAT MARKER ANALYZER & GROUP COPIER
  // ==========================================================================
  const navTabXmlBeat = document.getElementById('navTabXmlBeatTool');
  const xmlbeatPanel = document.getElementById('xmlbeat-panel');
  const mobileNavXmlBeat = document.getElementById('mobileNavXmlBeatTool');
  const mobileTabXmlBeat = document.getElementById('mobileTabXmlBeatTool');
  const mobileXmlBeatSlot = document.getElementById('mobileXmlBeatSlot');

  function syncXmlBeatPlacement() {
    if (!xmlbeatPanel) return;
    if (window.innerWidth <= 860) {
      if (mobileXmlBeatSlot && xmlbeatPanel.parentElement !== mobileXmlBeatSlot) {
        mobileXmlBeatSlot.appendChild(xmlbeatPanel);
      }
      xmlbeatPanel.style.display = 'block';
    } else if (appMainEl && xmlbeatPanel.parentElement !== appMainEl) {
      appMainEl.appendChild(xmlbeatPanel);
      xmlbeatPanel.style.display = (navTabXmlBeat && navTabXmlBeat.classList.contains('active')) ? 'flex' : 'none';
    }
  }

  if (navTabXmlBeat && xmlbeatPanel) {
    navTabXmlBeat.addEventListener('click', () => {
      ['controls-panel', 'preview-panel', 'data-panel', 'converter-panel', 'amlink-panel', 'realpreview-panel', 'ytconverter-panel', 'hollowboxPanel', 'editing-panel'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
      navTabXmlBeat.classList.add('active');
      syncXmlBeatPlacement();
      xmlbeatPanel.style.display = 'flex';
      const headerExportLabelEl = document.getElementById('headerExportLabel');
      if (headerExportLabelEl) headerExportLabelEl.textContent = 'Export Beat XML';
      window.dispatchEvent(new CustomEvent('flippy:tabswitched', { detail: { tab: 'xmlbeat' } }));
    });
  }

  document.querySelectorAll('.nav-tab').forEach((tab) => {
    if (tab === navTabXmlBeat) return;
    tab.addEventListener('click', () => {
      if (navTabXmlBeat) navTabXmlBeat.classList.remove('active');
      if (xmlbeatPanel && window.innerWidth > 860) xmlbeatPanel.style.display = 'none';
    });
  });

  if (mobileNavXmlBeat && mobileTabXmlBeat) {
    mobileNavXmlBeat.addEventListener('click', () => {
      syncXmlBeatPlacement();
      document.querySelectorAll('.mobile-tab-content.active').forEach((c) => c.classList.remove('active'));
      document.querySelectorAll('.mobile-tab.active, .mobile-inspector-pill.active').forEach((t) => t.classList.remove('active'));
      document.documentElement.classList.remove('inspector-tab-open');
      mobileTabXmlBeat.classList.add('active');
      mobileNavXmlBeat.classList.add('active');
      const mobileDlTextEl = document.getElementById('mobileHeaderDlText');
      if (mobileDlTextEl) mobileDlTextEl.textContent = 'Export Beat XML';
    });
  }

  document.querySelectorAll('.mobile-tab, #mobileInspectorToggleBtn').forEach((btn) => {
    if (btn === mobileNavXmlBeat) return;
    btn.addEventListener('click', () => {
      if (mobileNavXmlBeat) mobileNavXmlBeat.classList.remove('active');
      if (mobileTabXmlBeat) mobileTabXmlBeat.classList.remove('active');
    });
  });

  window.addEventListener('resize', () => setTimeout(syncXmlBeatPlacement, 60));
  window.addEventListener('flippy:unlocked', () => setTimeout(syncXmlBeatPlacement, 80));
  setTimeout(syncXmlBeatPlacement, 140);

  // --- Analyzer & Group Copier State ---
  const xbFileInput = document.getElementById('xmlBeatFileInput');
  const xbLoadSampleBtn = document.getElementById('xmlBeatLoadSampleBtn');
  const xbProjectInfo = document.getElementById('xmlBeatProjectInfo');
  const xbMarkersList = document.getElementById('xmlBeatMarkersList');
  const xbGroupSelect = document.getElementById('xmlBeatGroupSelect');
  const xbStartSelect = document.getElementById('xmlBeatStartSelect');
  const xbEndSelect = document.getElementById('xmlBeatEndSelect');
  const xbStartSec = document.getElementById('xmlBeatStartSec');
  const xbEndSec = document.getElementById('xmlBeatEndSec');
  const xbLockLenToggle = document.getElementById('xmlBeatLockLenToggle');
  const xbRangeSummary = document.getElementById('xmlBeatRangeSummary');
  const xbCopyGroupBtn = document.getElementById('xmlBeatCopyGroupBtn');
  const xbCloneAllBtn = document.getElementById('xmlBeatCloneAllBtn');
  const xbActionStatus = document.getElementById('xmlBeatActionStatus');
  const xbRuler = document.getElementById('xmlBeatRuler');
  const xbMarkersTrack = document.getElementById('xmlBeatMarkersTrack');
  const xbTargetRange = document.getElementById('xmlBeatTargetRange');
  const xbGroupsTrack = document.getElementById('xmlBeatGroupsTrack');
  const xbOutputCode = document.getElementById('xmlBeatOutputCode');
  const xbCopyOutBtn = document.getElementById('xmlBeatCopyOutBtn');
  const xbDownloadOutBtn = document.getElementById('xmlBeatDownloadOutBtn');
  const xbSeparateCopyBtn = document.getElementById('xmlBeatSeparateCopyBtn');
  const xbSeparateDownloadBtn = document.getElementById('xmlBeatSeparateDownloadBtn');
  const xbExportMeta = document.getElementById('xmlBeatExportMeta');

  let xbDoc = null;
  let xbFilename = 'beat_edited.xml';
  let xbBookmarks = [];
  let xbGroups = [];
  let xbTotalMs = 5000;

  // Format ms as 0:00:00 (1..59 seconds -> 0:00:01..0:00:59, 60s -> 0:01:00)
  function formatAlightClock(ms) {
    const safeMs = Math.max(0, Math.round(Number(ms) || 0));
    const totalSec = Math.floor(safeMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function serializeXbDoc() {
    if (!xbDoc) return '';
    const raw = new XMLSerializer().serializeToString(xbDoc);
    return raw.startsWith('<?xml') ? raw : `<?xml version="1.0" encoding="utf-8"?>\n${raw}`;
  }

  function collectUsedIds(scene) {
    const ids = new Set();
    scene.querySelectorAll('[id]').forEach((el) => {
      const n = parseInt(el.getAttribute('id'), 10);
      if (!Number.isNaN(n)) ids.add(n);
    });
    return ids;
  }

  function nextUniqueId(usedIds) {
    let candidate = 100;
    while (usedIds.has(candidate)) candidate += 1;
    usedIds.add(candidate);
    return String(candidate);
  }

  function cloneGroupForRange(sourceGroup, targetStartMs, targetEndMs, usedIds) {
    const clone = sourceGroup.cloneNode(true);
    const origStart = Number(sourceGroup.getAttribute('startTime') || 0);
    const origEnd = Number(sourceGroup.getAttribute('endTime') || (origStart + 1000));
    const origDur = Math.max(1, origEnd - origStart);
    const tStart = Math.max(0, Math.round(targetStartMs));
    const tEnd = Math.max(tStart + 10, Math.round(targetEndMs));
    const tDur = tEnd - tStart;

    clone.setAttribute('id', nextUniqueId(usedIds));
    clone.setAttribute('startTime', String(tStart));
    clone.setAttribute('endTime', String(tEnd));
    const baseLabel = sourceGroup.getAttribute('label') || `Group ${sourceGroup.getAttribute('id') || ''}`;
    clone.setAttribute('label', `${baseLabel} (Copy)`);

    clone.querySelectorAll('[startTime], [endTime], [id]').forEach((child) => {
      if (child.hasAttribute('id')) child.setAttribute('id', nextUniqueId(usedIds));
      if (child.hasAttribute('startTime')) {
        const cs = Number(child.getAttribute('startTime') || origStart);
        const mapped = tStart + ((cs - origStart) / origDur) * tDur;
        child.setAttribute('startTime', String(Math.round(Math.max(tStart, Math.min(tEnd, mapped)))));
      }
      if (child.hasAttribute('endTime')) {
        const ce = Number(child.getAttribute('endTime') || origEnd);
        const mapped = tStart + ((ce - origStart) / origDur) * tDur;
        child.setAttribute('endTime', String(Math.round(Math.max(tStart + 1, Math.min(tEnd, mapped)))));
      }
    });
    return clone;
  }

  function updateRangeSummaryAndTimeline() {
    const sSec = Math.max(0, parseFloat(xbStartSec && xbStartSec.value) || 0);
    const eSec = Math.max(sSec + 0.01, parseFloat(xbEndSec && xbEndSec.value) || (sSec + 1));
    const sMs = Math.round(sSec * 1000);
    const eMs = Math.round(eSec * 1000);
    const durSec = ((eMs - sMs) / 1000).toFixed(2);
    if (xbRangeSummary) {
      xbRangeSummary.textContent = `Range: ${formatAlightClock(sMs)} (${sSec.toFixed(2)}s) → ${formatAlightClock(eMs)} (${eSec.toFixed(2)}s) · Length ${durSec}s`;
    }
    if (xbTargetRange && xbTotalMs > 0) {
      const leftFrac = Math.max(0, Math.min(1, sMs / xbTotalMs));
      const rightFrac = Math.max(leftFrac + 0.005, Math.min(1, eMs / xbTotalMs));
      xbTargetRange.style.display = 'block';
      xbTargetRange.style.left = `calc(38px + (100% - 38px) * ${leftFrac.toFixed(5)})`;
      xbTargetRange.style.width = `calc((100% - 38px) * ${(rightFrac - leftFrac).toFixed(5)})`;
    }
  }

  let xbPlayheadMs = 0;
  let xbPlaying = false;
  let xbLoop = true;
  let xbRafId = null;
  let xbLastFrameTs = 0;

  function setXbPlayheadMs(ms) {
    xbPlayheadMs = Math.max(0, Math.min(xbTotalMs || 5000, ms));
    const frac = xbTotalMs > 0 ? (xbPlayheadMs / xbTotalMs) : 0;
    const clockText = formatAlightClock(xbPlayheadMs);
    const playheadLine = document.getElementById('xbPlayheadLine');
    const playheadBadge = document.getElementById('xbPlayheadBadge');
    const playheadClock = document.getElementById('xbPlayheadClock');
    if (playheadLine) playheadLine.style.left = `calc(38px + (100% - 38px) * ${frac.toFixed(5)})`;
    if (playheadBadge) playheadBadge.textContent = clockText;
    if (playheadClock) playheadClock.textContent = clockText;
  }

  function renderXmlBeatUI() {
    if (!xbDoc) return;
    const scene = xbDoc.querySelector('scene');
    if (!scene) return;

    const bookmarkEls = Array.from(scene.querySelectorAll('bookmark'));
    xbBookmarks = bookmarkEls
      .map((el, idx) => ({
        idx,
        t: Number(el.getAttribute('t') || 0),
        label: el.getAttribute('label') || `Beat ${idx + 1}`
      }))
      .sort((a, b) => a.t - b.t);

    xbGroups = Array.from(scene.querySelectorAll('group'));
    const maxBookmarkT = xbBookmarks.length ? xbBookmarks[xbBookmarks.length - 1].t : 0;
    const maxGroupEnd = xbGroups.reduce((m, g) => Math.max(m, Number(g.getAttribute('endTime') || 0)), 0);
    xbTotalMs = Math.max(Number(scene.getAttribute('totalTime') || 5000), maxBookmarkT, maxGroupEnd, 1000);

    const title = scene.getAttribute('title') || xbFilename;
    const fps = scene.getAttribute('fps') || '60';
    if (xbProjectInfo) {
      xbProjectInfo.textContent = `${title} · ${fps}fps · ${formatAlightClock(xbTotalMs)} (${(xbTotalMs / 1000).toFixed(2)}s) · ${xbBookmarks.length} Beats · ${xbGroups.length} Groups`;
    }

    // Populate Beat Marker list
    if (xbMarkersList) {
      if (!xbBookmarks.length) {
        xbMarkersList.innerHTML = '<div class="xmlbeat-empty">No &lt;bookmark&gt; beat markers found in this XML.</div>';
      } else {
        xbMarkersList.innerHTML = xbBookmarks.map((b, i) => `
          <div class="xmlbeat-marker-row" data-beat-idx="${i}">
            <span class="xmlbeat-marker-idx">#${i + 1} · ${b.label}</span>
            <span class="xmlbeat-marker-clock">${formatAlightClock(b.t)}</span>
            <span class="xmlbeat-marker-sub">${(b.t / 1000).toFixed(2)}s (${b.t}ms)</span>
          </div>
        `).join('');
        xbMarkersList.querySelectorAll('.xmlbeat-marker-row').forEach((row) => {
          row.addEventListener('click', () => {
            const bi = Number(row.getAttribute('data-beat-idx'));
            if (xbStartSelect && xbBookmarks[bi]) {
              xbStartSelect.value = String(bi);
              xbStartSelect.dispatchEvent(new Event('change'));
            }
          });
        });
      }
    }

    // Populate Beat Dropdowns
    if (xbStartSelect && xbEndSelect) {
      if (xbBookmarks.length) {
        const opts = xbBookmarks.map((b, i) => `<option value="${i}">Beat #${i + 1} · ${formatAlightClock(b.t)} (${(b.t / 1000).toFixed(2)}s)</option>`).join('');
        xbStartSelect.innerHTML = opts;
        xbEndSelect.innerHTML = opts;
        xbStartSelect.disabled = false;
        xbEndSelect.disabled = false;
        xbStartSelect.value = '0';
        xbEndSelect.value = String(Math.min(1, xbBookmarks.length - 1));
        if (xbStartSec) xbStartSec.value = (xbBookmarks[0].t / 1000).toFixed(2);
        const endBeat = xbBookmarks[Math.min(1, xbBookmarks.length - 1)];
        const fallbackEnd = endBeat.t > xbBookmarks[0].t ? endBeat.t : xbBookmarks[0].t + 1000;
        if (xbEndSec) xbEndSec.value = (fallbackEnd / 1000).toFixed(2);
      } else {
        xbStartSelect.innerHTML = '<option value="">No bookmarks</option>';
        xbEndSelect.innerHTML = '<option value="">No bookmarks</option>';
        xbStartSelect.disabled = true;
        xbEndSelect.disabled = true;
      }
    }

    // Populate Group Select
    if (xbGroupSelect) {
      if (xbGroups.length) {
        xbGroupSelect.innerHTML = xbGroups.map((g, i) => {
          const gs = Number(g.getAttribute('startTime') || 0);
          const ge = Number(g.getAttribute('endTime') || 0);
          const label = g.getAttribute('label') || `Group #${g.getAttribute('id') || i + 1}`;
          return `<option value="${i}">${label} (${formatAlightClock(gs)} → ${formatAlightClock(ge)} · ${((ge - gs) / 1000).toFixed(2)}s)</option>`;
        }).join('');
        xbGroupSelect.disabled = false;
      } else {
        xbGroupSelect.innerHTML = '<option value="">No &lt;group&gt; elements found</option>';
        xbGroupSelect.disabled = true;
      }
    }

    const canEdit = xbGroups.length > 0;
    if (xbStartSec) xbStartSec.disabled = !canEdit;
    if (xbEndSec) xbEndSec.disabled = !canEdit;
    if (xbCopyGroupBtn) xbCopyGroupBtn.disabled = !canEdit;
    if (xbCloneAllBtn) xbCloneAllBtn.disabled = !(canEdit && xbBookmarks.length >= 2);
    if (typeof populateVsControls === 'function') populateVsControls(canEdit);

    // Visual Timeline Ruler & Pins
    if (xbMarkersTrack) {
      xbMarkersTrack.querySelectorAll('.xmlbeat-marker-pin').forEach((p) => p.remove());
      xbBookmarks.forEach((b, i) => {
        const pin = document.createElement('div');
        pin.className = 'xmlbeat-marker-pin';
        pin.style.left = `${Math.max(0, Math.min(100, (b.t / xbTotalMs) * 100))}%`;
        pin.setAttribute('data-label', `#${i + 1} ${formatAlightClock(b.t)}`);
        pin.title = `Beat #${i + 1}: ${formatAlightClock(b.t)} (${(b.t / 1000).toFixed(2)}s)`;
        pin.addEventListener('click', (ev) => {
          ev.stopPropagation();
          setXbPlayheadMs(b.t);
          if (xbStartSelect) {
            xbStartSelect.value = String(i);
            xbStartSelect.dispatchEvent(new Event('change'));
          }
        });
        xbMarkersTrack.appendChild(pin);
      });
    }

    // Alight Motion Style Layer Rows (Groups, Shapes, Text, Media + Keyframe Diamonds)
    if (xbGroupsTrack) {
      const layerEls = Array.from(scene.children).filter((el) =>
        ['group', 'shape', 'text', 'media', 'image', 'video', 'nullobj'].includes(el.tagName.toLowerCase())
      );
      if (!layerEls.length) {
        xbGroupsTrack.innerHTML = '<div class="xmlbeat-empty">No timeline layers found in this XML.</div>';
      } else {
        xbGroupsTrack.innerHTML = '';
        layerEls.forEach((layerEl, idx) => {
          const tag = layerEl.tagName.toLowerCase();
          const typeClass = tag === 'group' ? 'group' : tag === 'text' ? 'text' : (tag === 'media' || tag === 'image' || tag === 'video') ? 'media' : 'shape';
          const iconGlyph = typeClass === 'group' ? '↗' : typeClass === 'text' ? 'T' : typeClass === 'media' ? '▣' : '✦';
          const ls = Number(layerEl.getAttribute('startTime') || 0);
          const le = Number(layerEl.getAttribute('endTime') || (ls + 500));
          const left = Math.max(0, Math.min(100, (ls / xbTotalMs) * 100));
          const width = Math.max(2, Math.min(100 - left, ((le - ls) / xbTotalMs) * 100));

          const row = document.createElement('div');
          row.className = 'am-tl-row';

          const gutter = document.createElement('div');
          gutter.className = 'am-tl-gutter';
          gutter.innerHTML = `<span class="am-tl-icon-badge ${typeClass}">${iconGlyph}</span>`;

          const lane = document.createElement('div');
          lane.className = 'am-tl-lane';

          const bar = document.createElement('button');
          bar.type = 'button';
          const groupIdx = xbGroups.indexOf(layerEl);
          const isSelectedGroup = groupIdx !== -1 && xbGroupSelect && Number(xbGroupSelect.value) === groupIdx;
          bar.className = `am-tl-bar type-${typeClass}${isSelectedGroup ? ' selected' : ''}`;
          bar.style.left = `${left}%`;
          bar.style.width = `${width}%`;
          bar.textContent = layerEl.getAttribute('label') || `${tag} ${idx + 1}`;
          bar.title = `${bar.textContent} · ${formatAlightClock(ls)} → ${formatAlightClock(le)} (${((le - ls) / 1000).toFixed(2)}s)`;

          // Plot keyframe diamonds inside the layer bar
          const dur = Math.max(1, le - ls);
          const seenKf = new Set();
          layerEl.querySelectorAll('keyframe[t]').forEach((kf) => {
            const kt = Number(kf.getAttribute('t'));
            if (Number.isNaN(kt) || seenKf.has(kt)) return;
            seenKf.add(kt);
            const relPct = Math.max(3, Math.min(97, ((kt - ls) / dur) * 100));
            const diamond = document.createElement('span');
            diamond.className = 'am-tl-kf';
            diamond.style.left = `${relPct}%`;
            bar.appendChild(diamond);
          });

          bar.addEventListener('click', () => {
            setXbPlayheadMs(ls);
            if (groupIdx !== -1 && xbGroupSelect) {
              xbGroupSelect.value = String(groupIdx);
              xbGroupsTrack.querySelectorAll('.am-tl-bar').forEach((b) => b.classList.remove('selected'));
              bar.classList.add('selected');
            }
          });

          lane.appendChild(bar);
          row.appendChild(gutter);
          row.appendChild(lane);
          xbGroupsTrack.appendChild(row);
        });
      }
    }

    const xmlOut = serializeXbDoc();
    const beatExportName = xbFilename.replace(/\.xml$/i, '') + '_beats.xml';
    if (xbOutputCode) xbOutputCode.textContent = xmlOut;
    if (xbCopyOutBtn) xbCopyOutBtn.disabled = !xmlOut;
    if (xbDownloadOutBtn) xbDownloadOutBtn.disabled = !xmlOut;
    if (xbSeparateCopyBtn) xbSeparateCopyBtn.disabled = !xmlOut;
    if (xbSeparateDownloadBtn) xbSeparateDownloadBtn.disabled = !xmlOut;
    if (xbExportMeta) {
      xbExportMeta.textContent = xmlOut
        ? `Ready to export ${beatExportName} (${(xmlOut.length / 1024).toFixed(1)} KB)`
        : 'Import an Alight Motion XML to enable separate Beat Groups export.';
    }
    setXbPlayheadMs(xbPlayheadMs);
    updateRangeSummaryAndTimeline();
  }

  function loadAlightXmlString(xmlStr, filename) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'application/xml');
      const err = doc.querySelector('parsererror');
      if (err || !doc.querySelector('scene')) {
        if (xbActionStatus) xbActionStatus.textContent = 'Invalid Alight Motion XML (missing <scene>).';
        return;
      }
      xbDoc = doc;
      xbFilename = filename || 'beat_edited.xml';
      renderXmlBeatUI();
      if (xbActionStatus) xbActionStatus.textContent = `Loaded ${xbFilename} (${xbBookmarks.length} bookmarks, ${xbGroups.length} groups).`;
      StudioAudio.playSuccess();
    } catch (e) {
      if (xbActionStatus) xbActionStatus.textContent = `Failed to parse XML: ${e.message}`;
    }
  }

  if (xbFileInput) {
    xbFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      loadAlightXmlString(await file.text(), file.name);
    });
  }

  if (xbLoadSampleBtn) {
    xbLoadSampleBtn.addEventListener('click', () => {
      const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
<scene title="FL-5 Beat Demo" width="1080" height="1920" exportWidth="1080" exportHeight="1920" fps="60" totalTime="62000" bgcolor="#ff000000">
  <bookmark t="1000" label="Beat 1" />
  <bookmark t="2500" label="Beat 2" />
  <bookmark t="4200" label="Beat 3" />
  <bookmark t="60000" label="1 Min Mark" />
  <group id="10" label="Category Text" startTime="1000" endTime="2500">
    <shape id="11" label="Category Card" startTime="1000" endTime="2500" fillType="color" s=".rect">
      <fillColor value="#ff5d866c" />
    </shape>
  </group>
  <group id="20" label="Winner Text" startTime="2500" endTime="4200">
    <text id="21" label="Winner Label" startTime="2500" endTime="4200">Winner</text>
  </group>
</scene>`;
      loadAlightXmlString(sampleXml, 'fl5_beat_demo.xml');
    });
  }

  if (xbStartSelect) {
    xbStartSelect.addEventListener('change', () => {
      const i = Number(xbStartSelect.value);
      const b1 = xbBookmarks[i];
      if (!b1) return;
      if (xbStartSec) xbStartSec.value = (b1.t / 1000).toFixed(2);
      const nextIdx = Math.min(i + 1, xbBookmarks.length - 1);
      if (xbEndSelect && xbLockLenToggle && xbLockLenToggle.checked) {
        xbEndSelect.value = String(nextIdx);
      }
      const b2 = xbBookmarks[Number(xbEndSelect ? xbEndSelect.value : nextIdx)];
      if (b2 && b2.t > b1.t && xbEndSec) {
        xbEndSec.value = (b2.t / 1000).toFixed(2);
      }
      updateRangeSummaryAndTimeline();
    });
  }

  if (xbEndSelect) {
    xbEndSelect.addEventListener('change', () => {
      const b2 = xbBookmarks[Number(xbEndSelect.value)];
      if (b2 && xbEndSec) {
        xbEndSec.value = (b2.t / 1000).toFixed(2);
        updateRangeSummaryAndTimeline();
      }
    });
  }

  if (xbStartSec) {
    xbStartSec.addEventListener('input', () => {
      if (xbLockLenToggle && xbLockLenToggle.checked && xbBookmarks.length >= 2) {
        const i1 = Number(xbStartSelect ? xbStartSelect.value : 0);
        const i2 = Number(xbEndSelect ? xbEndSelect.value : Math.min(1, xbBookmarks.length - 1));
        const b1 = xbBookmarks[i1];
        const b2 = xbBookmarks[i2];
        if (b1 && b2 && b2.t > b1.t && xbEndSec) {
          const beatDurSec = (b2.t - b1.t) / 1000;
          xbEndSec.value = ((parseFloat(xbStartSec.value) || 0) + beatDurSec).toFixed(2);
        }
      }
      updateRangeSummaryAndTimeline();
    });
  }
  if (xbEndSec) xbEndSec.addEventListener('input', updateRangeSummaryAndTimeline);

  if (xbCopyGroupBtn) {
    xbCopyGroupBtn.addEventListener('click', () => {
      if (!xbDoc || !xbGroups.length) return;
      const scene = xbDoc.querySelector('scene');
      const srcGroup = xbGroups[Number(xbGroupSelect ? xbGroupSelect.value : 0)];
      if (!scene || !srcGroup) return;

      const sMs = Math.max(0, Math.round((parseFloat(xbStartSec && xbStartSec.value) || 0) * 1000));
      let eMs = Math.max(sMs + 10, Math.round((parseFloat(xbEndSec && xbEndSec.value) || (sMs / 1000 + 1)) * 1000));
      if (xbLockLenToggle && xbLockLenToggle.checked && xbBookmarks.length >= 2) {
        const b1 = xbBookmarks[Number(xbStartSelect ? xbStartSelect.value : 0)];
        const b2 = xbBookmarks[Number(xbEndSelect ? xbEndSelect.value : 1)];
        if (b1 && b2 && b2.t > b1.t) eMs = sMs + (b2.t - b1.t);
      }

      const usedIds = collectUsedIds(scene);
      const cloned = cloneGroupForRange(srcGroup, sMs, eMs, usedIds);
      scene.appendChild(cloned);
      if (eMs > Number(scene.getAttribute('totalTime') || 0)) {
        scene.setAttribute('totalTime', String(eMs));
      }
      renderXmlBeatUI();
      if (xbActionStatus) {
        xbActionStatus.textContent = `Copied group to ${formatAlightClock(sMs)} → ${formatAlightClock(eMs)} (${((eMs - sMs) / 1000).toFixed(2)}s).`;
      }
      StudioAudio.playSuccess();
    });
  }

  if (xbCloneAllBtn) {
    xbCloneAllBtn.addEventListener('click', () => {
      if (!xbDoc || !xbGroups.length || xbBookmarks.length < 2) return;
      const scene = xbDoc.querySelector('scene');
      const srcGroup = xbGroups[Number(xbGroupSelect ? xbGroupSelect.value : 0)];
      if (!scene || !srcGroup) return;

      const usedIds = collectUsedIds(scene);
      let count = 0;
      for (let i = 0; i < xbBookmarks.length - 1; i += 1) {
        const t1 = xbBookmarks[i].t;
        const t2 = xbBookmarks[i + 1].t;
        if (t2 > t1) {
          scene.appendChild(cloneGroupForRange(srcGroup, t1, t2, usedIds));
          count += 1;
        }
      }
      renderXmlBeatUI();
      if (xbActionStatus) xbActionStatus.textContent = `Cloned group across ${count} beat intervals with matching beat lengths.`;
      StudioAudio.playSuccess();
    });
  }

  async function copyXbOutputXml() {
    const xmlOut = serializeXbDoc();
    if (!xmlOut) return;
    try {
      await navigator.clipboard.writeText(xmlOut);
      if (xbActionStatus) xbActionStatus.textContent = 'Copied modified Beat Groups XML to clipboard.';
      StudioAudio.playClick();
    } catch (e) {}
  }

  function downloadXbOutputXml() {
    const xmlOut = serializeXbDoc();
    if (!xmlOut) return;
    const beatExportName = xbFilename.replace(/\.xml$/i, '') + '_beats.xml';
    const blob = new Blob([xmlOut], { type: 'application/xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = beatExportName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 250);
    if (xbActionStatus) xbActionStatus.textContent = `Downloaded ${beatExportName}.`;
    StudioAudio.playClick();
  }

  if (xbCopyOutBtn) xbCopyOutBtn.addEventListener('click', copyXbOutputXml);
  if (xbDownloadOutBtn) xbDownloadOutBtn.addEventListener('click', downloadXbOutputXml);
  if (xbSeparateCopyBtn) xbSeparateCopyBtn.addEventListener('click', copyXbOutputXml);
  if (xbSeparateDownloadBtn) xbSeparateDownloadBtn.addEventListener('click', downloadXbOutputXml);

  // Smooth Arrow Dropdown for Modified Alight Motion XML
  const xbOutputCard = document.getElementById('xmlBeatOutputCard');
  const xbOutputToggle = document.getElementById('xmlBeatOutputToggle');
  if (xbOutputToggle && xbOutputCard) {
    xbOutputToggle.addEventListener('click', () => {
      const isOpen = xbOutputCard.classList.toggle('open');
      xbOutputToggle.setAttribute('aria-expanded', String(isOpen));
      StudioAudio.playClick();
    });
  }

  // Alight Motion Timeline Transport, Scrubbing & Zoom
  const xbPlayBtn = document.getElementById('xbPlayBtn');
  const xbLoopBtn = document.getElementById('xbLoopBtn');
  const xbPrevBeatBtn = document.getElementById('xbPrevBeatBtn');
  const xbNextBeatBtn = document.getElementById('xbNextBeatBtn');
  const xbZoomSelect = document.getElementById('xbZoomSelect');
  const xbAmStage = document.getElementById('xbAmStage');

  function updatePlayBtnIcons() {
    if (!xbPlayBtn) return;
    const p = xbPlayBtn.querySelector('.xb-icon-play');
    const s = xbPlayBtn.querySelector('.xb-icon-pause');
    if (p) p.style.display = xbPlaying ? 'none' : 'block';
    if (s) s.style.display = xbPlaying ? 'block' : 'none';
  }

  function stepXbPlayback(ts) {
    if (!xbPlaying) return;
    if (!xbLastFrameTs) xbLastFrameTs = ts;
    const dt = ts - xbLastFrameTs;
    xbLastFrameTs = ts;
    let next = xbPlayheadMs + dt;
    if (next >= xbTotalMs) {
      if (xbLoop) {
        next = 0;
      } else {
        next = xbTotalMs;
        xbPlaying = false;
        updatePlayBtnIcons();
      }
    }
    setXbPlayheadMs(next);
    if (xbPlaying) xbRafId = requestAnimationFrame(stepXbPlayback);
  }

  if (xbPlayBtn) {
    xbPlayBtn.addEventListener('click', () => {
      xbPlaying = !xbPlaying;
      if (xbPlaying) {
        if (xbPlayheadMs >= xbTotalMs) xbPlayheadMs = 0;
        xbLastFrameTs = 0;
        xbRafId = requestAnimationFrame(stepXbPlayback);
      } else {
        cancelAnimationFrame(xbRafId);
      }
      updatePlayBtnIcons();
      StudioAudio.playClick();
    });
  }

  if (xbLoopBtn) {
    xbLoopBtn.addEventListener('click', () => {
      xbLoop = !xbLoop;
      xbLoopBtn.classList.toggle('active', xbLoop);
      StudioAudio.playClick();
    });
  }

  if (xbPrevBeatBtn) {
    xbPrevBeatBtn.addEventListener('click', () => {
      const prev = [...xbBookmarks].reverse().find((b) => b.t < xbPlayheadMs - 30);
      setXbPlayheadMs(prev ? prev.t : 0);
      StudioAudio.playClick();
    });
  }

  if (xbNextBeatBtn) {
    xbNextBeatBtn.addEventListener('click', () => {
      const next = xbBookmarks.find((b) => b.t > xbPlayheadMs + 30);
      setXbPlayheadMs(next ? next.t : xbTotalMs);
      StudioAudio.playClick();
    });
  }

  if (xbZoomSelect && xbAmStage) {
    xbZoomSelect.addEventListener('change', () => {
      const z = Math.max(1, Number(xbZoomSelect.value) || 1);
      xbAmStage.style.width = `${z * 100}%`;
      StudioAudio.playClick();
    });
  }

  if (xbRuler) {
    const scrubFromClientX = (clientX) => {
      const rect = xbRuler.getBoundingClientRect();
      if (!rect.width) return;
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setXbPlayheadMs(frac * xbTotalMs);
    };
    let scrubbing = false;
    xbRuler.addEventListener('pointerdown', (e) => {
      scrubbing = true;
      scrubFromClientX(e.clientX);
    });
    window.addEventListener('pointermove', (e) => {
      if (scrubbing) scrubFromClientX(e.clientX);
    });
    window.addEventListener('pointerup', () => {
      scrubbing = false;
    });
  }

  // VS Edit: Category Start + Winner End Controller
  const vsCatGroupSel = document.getElementById('xbVsCategoryGroup');
  const vsWinGroupSel = document.getElementById('xbVsWinnerGroup');
  const vsCatStartBeat = document.getElementById('xbVsCatStartBeat');
  const vsWinEndBeat = document.getElementById('xbVsWinEndBeat');
  const vsCatStartSec = document.getElementById('xbVsCatStartSec');
  const vsWinEndSec = document.getElementById('xbVsWinEndSec');
  const vsSplitMode = document.getElementById('xbVsSplitMode');
  const vsSummary = document.getElementById('xbVsSummary');
  const vsCopyPairBtn = document.getElementById('xbVsCopyPairBtn');
  const vsCloneAllBtn = document.getElementById('xbVsCloneAllBtn');

  function getVsSpan(catStartMs, winEndMs, startBeatIdx = 0) {
    const s = Math.max(0, Math.round(catStartMs));
    const e = Math.max(s + 20, Math.round(winEndMs));
    const mode = vsSplitMode ? vsSplitMode.value : 'sequential';
    if (mode === 'overlap') {
      return { catStart: s, catEnd: e, winStart: s, winEnd: e };
    }
    if (mode === 'beat2beat' && xbBookmarks[startBeatIdx] && xbBookmarks[startBeatIdx + 1] && xbBookmarks[startBeatIdx + 2]) {
      const b1 = xbBookmarks[startBeatIdx].t;
      const b2 = xbBookmarks[startBeatIdx + 1].t;
      const b3 = xbBookmarks[startBeatIdx + 2].t;
      if (b2 > b1 && b3 > b2) {
        return { catStart: b1, catEnd: b2, winStart: b2, winEnd: b3 };
      }
    }
    const mid = Math.round((s + e) / 2);
    return { catStart: s, catEnd: mid, winStart: mid, winEnd: e };
  }

  function updateVsSummary() {
    if (!vsSummary) return;
    const sMs = Math.max(0, Math.round((parseFloat(vsCatStartSec && vsCatStartSec.value) || 0) * 1000));
    const eMs = Math.max(sMs + 20, Math.round((parseFloat(vsWinEndSec && vsWinEndSec.value) || (sMs / 1000 + 2)) * 1000));
    const bi = Number(vsCatStartBeat && vsCatStartBeat.value) || 0;
    const span = getVsSpan(sMs, eMs, bi);
    vsSummary.textContent =
      `Category: ${formatAlightClock(span.catStart)} → ${formatAlightClock(span.catEnd)} (${((span.catEnd - span.catStart) / 1000).toFixed(2)}s)` +
      ` · Winner: ${formatAlightClock(span.winStart)} → ${formatAlightClock(span.winEnd)} (${((span.winEnd - span.winStart) / 1000).toFixed(2)}s)`;
  }

  function populateVsControls(canEdit) {
    if (vsCatGroupSel && vsWinGroupSel) {
      if (xbGroups.length) {
        const gOpts = xbGroups.map((g, i) => {
          const label = g.getAttribute('label') || `Group #${g.getAttribute('id') || i + 1}`;
          return `<option value="${i}">${label}</option>`;
        }).join('');
        vsCatGroupSel.innerHTML = gOpts;
        vsWinGroupSel.innerHTML = gOpts;
        vsCatGroupSel.value = '0';
        vsWinGroupSel.value = String(xbGroups.length > 1 ? 1 : 0);
        vsCatGroupSel.disabled = false;
        vsWinGroupSel.disabled = false;
      } else {
        vsCatGroupSel.innerHTML = '<option value="">No groups</option>';
        vsWinGroupSel.innerHTML = '<option value="">No groups</option>';
        vsCatGroupSel.disabled = true;
        vsWinGroupSel.disabled = true;
      }
    }

    if (vsCatStartBeat && vsWinEndBeat) {
      if (xbBookmarks.length) {
        const bOpts = xbBookmarks.map((b, i) => `<option value="${i}">Beat #${i + 1} · ${formatAlightClock(b.t)} (${(b.t / 1000).toFixed(2)}s)</option>`).join('');
        vsCatStartBeat.innerHTML = bOpts;
        vsWinEndBeat.innerHTML = bOpts;
        vsCatStartBeat.value = '0';
        const endIdx = Math.min(xbBookmarks.length >= 3 ? 2 : 1, xbBookmarks.length - 1);
        vsWinEndBeat.value = String(endIdx);
        vsCatStartBeat.disabled = false;
        vsWinEndBeat.disabled = false;
        if (vsCatStartSec) vsCatStartSec.value = (xbBookmarks[0].t / 1000).toFixed(2);
        if (vsWinEndSec) vsWinEndSec.value = (xbBookmarks[endIdx].t / 1000).toFixed(2);
      } else {
        vsCatStartBeat.innerHTML = '<option value="">No bookmarks</option>';
        vsWinEndBeat.innerHTML = '<option value="">No bookmarks</option>';
        vsCatStartBeat.disabled = true;
        vsWinEndBeat.disabled = true;
      }
    }

    if (vsCatStartSec) vsCatStartSec.disabled = !canEdit;
    if (vsWinEndSec) vsWinEndSec.disabled = !canEdit;
    if (vsCopyPairBtn) vsCopyPairBtn.disabled = !canEdit;
    if (vsCloneAllBtn) vsCloneAllBtn.disabled = !(canEdit && xbBookmarks.length >= 2);
    updateVsSummary();
  }

  if (vsCatStartBeat) {
    vsCatStartBeat.addEventListener('change', () => {
      const b = xbBookmarks[Number(vsCatStartBeat.value)];
      if (b && vsCatStartSec) vsCatStartSec.value = (b.t / 1000).toFixed(2);
      updateVsSummary();
    });
  }
  if (vsWinEndBeat) {
    vsWinEndBeat.addEventListener('change', () => {
      const b = xbBookmarks[Number(vsWinEndBeat.value)];
      if (b && vsWinEndSec) vsWinEndSec.value = (b.t / 1000).toFixed(2);
      updateVsSummary();
    });
  }
  if (vsCatStartSec) vsCatStartSec.addEventListener('input', updateVsSummary);
  if (vsWinEndSec) vsWinEndSec.addEventListener('input', updateVsSummary);
  if (vsSplitMode) vsSplitMode.addEventListener('change', updateVsSummary);

  if (vsCopyPairBtn) {
    vsCopyPairBtn.addEventListener('click', () => {
      if (!xbDoc || !xbGroups.length) return;
      const scene = xbDoc.querySelector('scene');
      const catSrc = xbGroups[Number(vsCatGroupSel ? vsCatGroupSel.value : 0)];
      const winSrc = xbGroups[Number(vsWinGroupSel ? vsWinGroupSel.value : 0)];
      if (!scene || !catSrc || !winSrc) return;

      const sMs = Math.max(0, Math.round((parseFloat(vsCatStartSec && vsCatStartSec.value) || 0) * 1000));
      const eMs = Math.max(sMs + 20, Math.round((parseFloat(vsWinEndSec && vsWinEndSec.value) || (sMs / 1000 + 2)) * 1000));
      const bi = Number(vsCatStartBeat && vsCatStartBeat.value) || 0;
      const span = getVsSpan(sMs, eMs, bi);

      const usedIds = collectUsedIds(scene);
      const catClone = cloneGroupForRange(catSrc, span.catStart, span.catEnd, usedIds);
      catClone.setAttribute('label', `${catSrc.getAttribute('label') || 'Category'} (VS)`);
      const winClone = cloneGroupForRange(winSrc, span.winStart, span.winEnd, usedIds);
      winClone.setAttribute('label', `${winSrc.getAttribute('label') || 'Winner'} (VS)`);

      scene.appendChild(catClone);
      scene.appendChild(winClone);
      const maxEnd = Math.max(span.catEnd, span.winEnd);
      if (maxEnd > Number(scene.getAttribute('totalTime') || 0)) {
        scene.setAttribute('totalTime', String(maxEnd));
      }
      renderXmlBeatUI();
      if (xbActionStatus) {
        xbActionStatus.textContent = `Copied VS pair: Category (${formatAlightClock(span.catStart)}→${formatAlightClock(span.catEnd)}) + Winner (${formatAlightClock(span.winStart)}→${formatAlightClock(span.winEnd)}).`;
      }
      StudioAudio.playSuccess();
    });
  }

  if (vsCloneAllBtn) {
    vsCloneAllBtn.addEventListener('click', () => {
      if (!xbDoc || !xbGroups.length || xbBookmarks.length < 2) return;
      const scene = xbDoc.querySelector('scene');
      const catSrc = xbGroups[Number(vsCatGroupSel ? vsCatGroupSel.value : 0)];
      const winSrc = xbGroups[Number(vsWinGroupSel ? vsWinGroupSel.value : 0)];
      if (!scene || !catSrc || !winSrc) return;

      const usedIds = collectUsedIds(scene);
      let pairs = 0;
      for (let i = 0; i < xbBookmarks.length - 1; i += 1) {
        const t1 = xbBookmarks[i].t;
        const t2 = xbBookmarks[i + 1].t;
        if (t2 <= t1) continue;
        const mid = Math.round((t1 + t2) / 2);
        const catClone = cloneGroupForRange(catSrc, t1, mid, usedIds);
        catClone.setAttribute('label', `${catSrc.getAttribute('label') || 'Category'} #${i + 1}`);
        const winClone = cloneGroupForRange(winSrc, mid, t2, usedIds);
        winClone.setAttribute('label', `${winSrc.getAttribute('label') || 'Winner'} #${i + 1}`);
        scene.appendChild(catClone);
        scene.appendChild(winClone);
        pairs += 1;
      }
      renderXmlBeatUI();
      if (xbActionStatus) xbActionStatus.textContent = `Cloned ${pairs} VS Category + Winner pairs across beat intervals.`;
      StudioAudio.playSuccess();
    });
  }
})();
