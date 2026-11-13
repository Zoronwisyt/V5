/* ==========================================================================
   FLIPPY v5 — STUDIO INTERACTION, THEME & TACTILE AUDIO CONTROLLER
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

  let themeTransitionTimer = null;
  function toggleTheme() {
    document.documentElement.classList.add('theme-transitioning');
    clearTimeout(themeTransitionTimer);
    themeTransitionTimer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 480);
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
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
  // 4B. GUI MODE SWITCHER (CLASSIC vs FLEXIBLE) + SMOOTH TRANSITION & SFX
  // ==========================================================================
  const guiModeToggleBtn = document.getElementById('guiModeToggleBtn');
  const mobileGuiModeToggleBtn = document.getElementById('mobileGuiModeToggleBtn');
  const mobileBottomGuiModeBtn = document.getElementById('mobileBottomGuiModeBtn');
  const guiModeLabel = document.getElementById('guiModeLabel');
  const mobileGuiModeLabel = document.getElementById('mobileGuiModeLabel');
  let guiTransitionTimer = null;

  function playGuiSwitch(isFlexible) {
    if (localStorage.getItem('flippy_sfx_enabled') === 'false') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const freqs = isFlexible ? [440, 587.33] : [587.33, 440];
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

  function applyGuiMode(mode, withTransition = false) {
    const next = mode === 'flexible' ? 'flexible' : 'classic';
    const isFlexible = next === 'flexible';

    if (withTransition) {
      document.documentElement.classList.add('gui-transitioning');
      clearTimeout(guiTransitionTimer);
      guiTransitionTimer = setTimeout(() => {
        document.documentElement.classList.remove('gui-transitioning');
      }, 480);
      playGuiSwitch(isFlexible);
    }

    document.documentElement.setAttribute('data-gui', next);
    localStorage.setItem('flippy_v5_gui_mode', next);

    if (guiModeToggleBtn) guiModeToggleBtn.classList.toggle('active', isFlexible);
    if (mobileGuiModeToggleBtn) mobileGuiModeToggleBtn.classList.toggle('active', isFlexible);
    if (mobileBottomGuiModeBtn) mobileBottomGuiModeBtn.classList.toggle('active', isFlexible);
    if (guiModeLabel) guiModeLabel.textContent = isFlexible ? 'Flexible' : 'Classic';
    if (mobileGuiModeLabel) mobileGuiModeLabel.textContent = isFlexible ? 'Flexible' : 'Classic';
  }

  function toggleGuiMode() {
    const cur = document.documentElement.getAttribute('data-gui') || 'classic';
    applyGuiMode(cur === 'classic' ? 'flexible' : 'classic', true);
  }

  if (guiModeToggleBtn) guiModeToggleBtn.addEventListener('click', toggleGuiMode);
  if (mobileGuiModeToggleBtn) mobileGuiModeToggleBtn.addEventListener('click', toggleGuiMode);
  if (mobileBottomGuiModeBtn) mobileBottomGuiModeBtn.addEventListener('click', toggleGuiMode);
  applyGuiMode(localStorage.getItem('flippy_v5_gui_mode') || 'classic', false);

  // ==========================================================================
  // 4C. INSPECTOR LAYOUT SWITCH (FLOATING vs OWN TAB) - mobile
  // ==========================================================================
  const inspectorModeBtn = document.getElementById('mobileInspectorModeBtn');
  const inspectorPill = document.getElementById('mobileInspectorToggleBtn');
  const floatingInspector = document.getElementById('mobileFloatingInspector');
  const rootEl = document.documentElement;

  function setInspectorTabOpen(open) {
    rootEl.classList.toggle('inspector-tab-open', open);
    if (inspectorPill) {
      inspectorPill.classList.toggle('active', open);
      inspectorPill.setAttribute('aria-expanded', String(open));
    }
    if (open) {
      document.querySelectorAll('.mobile-tab.active').forEach((t) => t.classList.remove('active'));
      if (floatingInspector) floatingInspector.classList.remove('minimized', 'collapsed', 'hidden');
    } else if (!document.querySelector('.mobile-tab.active')) {
      const activeContent = document.querySelector('.mobile-tab-content.active');
      const match = activeContent && document.querySelector(`.mobile-tab[data-tab="${activeContent.id}"]`);
      if (match) match.classList.add('active');
    }
  }

  function applyInspectorMode(mode, withTransition = false) {
    const next = mode === 'tab' ? 'tab' : 'floating';
    if (withTransition) {
      rootEl.classList.add('gui-transitioning');
      clearTimeout(guiTransitionTimer);
      guiTransitionTimer = setTimeout(() => rootEl.classList.remove('gui-transitioning'), 480);
      playGuiSwitch(next === 'tab');
    }
    rootEl.setAttribute('data-inspector', next);
    localStorage.setItem('flippy_v5_inspector_mode', next);
    if (inspectorModeBtn) inspectorModeBtn.classList.toggle('active', next === 'tab');
    if (next === 'floating') rootEl.classList.remove('inspector-tab-open');
    else setInspectorTabOpen(false);
  }

  if (inspectorModeBtn) {
    inspectorModeBtn.addEventListener('click', () => {
      const cur = rootEl.getAttribute('data-inspector') || 'floating';
      applyInspectorMode(cur === 'floating' ? 'tab' : 'floating', true);
    });
  }

  // In tab mode, Inspector pill behaves like a real tab (capture to override floating toggle)
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
        if (inspectorPill) inspectorPill.classList.remove('active');
      }
    });
  });

  applyInspectorMode(localStorage.getItem('flippy_v5_inspector_mode') || 'floating', false);

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
})();
