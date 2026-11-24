/* 小步 · 演讲站 —— 交互 */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const sections = [$('#hero'), ...$$('main .ch')].filter(Boolean);

  /* ─────────── 章节导航 ─────────── */
  const rail = $('#rail');
  sections.forEach((sec, i) => {
    const a = document.createElement('a');
    a.href = '#' + (sec.id || 'top');
    a.innerHTML = `<span>${sec.dataset.title || ''}</span><i></i>`;
    a.dataset.i = i;
    rail.appendChild(a);
  });
  const railLinks = $$('a', rail);

  /* ─────────── 入场动画 ─────────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

  $$('.reveal').forEach((el) => {
    if (!el.style.getPropertyValue('--d')) {
      const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
      const k = sibs.indexOf(el);
      el.style.setProperty('--d', Math.min(k, 4) * 70 + 'ms');
    }
    io.observe(el);
  });

  /* ─────────── 进度条 / 当前章节 ─────────── */
  const bar = $('#progressBar');
  let current = -1;

  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';

    const y = scrollY + innerHeight * 0.36;
    let idx = 0;
    sections.forEach((s, i) => { if (s.offsetTop <= y) idx = i; });
    if (idx !== current) {
      current = idx;
      railLinks.forEach((a, i) => a.classList.toggle('on', i === idx));
      $$('.note-item').forEach((n, i) => n.classList.toggle('active', i === idx));
      const sec = sections[idx];
      document.body.classList.toggle('on-dark', !!sec && (sec.classList.contains('dark') || sec.classList.contains('end')));
      const now = $('#pbNow');
      if (now) now.textContent = idx + 1;
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ─────────── 37 个版本格 ─────────── */
  const grid = $('#grid37');
  if (grid) {
    const key = new Set([0, 6, 12, 18, 27, 36]);
    for (let i = 0; i < 37; i++) {
      const b = document.createElement('i');
      const hgt = 18 + Math.round(Math.abs(Math.sin(i * 1.7) * 46 + Math.cos(i * 0.9) * 22) + (i / 37) * 26);
      b.style.height = hgt + 'px';
      if (key.has(i)) b.className = 'k';
      b.title = `第 ${i + 1} 个备份`;
      grid.appendChild(b);
    }
  }

  /* ─────────── 首屏：一句话被拆开 ─────────── */
  const typed = $('#typed');
  const card = $('#mockCard');
  const chips = $$('#cardChips .chip');
  const titleEl = $('#cardTitle');
  const startBtn = $('.mock-start');
  const ringOn = $('.ring circle.on');
  const ringTxt = $('#ringTxt');

  const TEXT = '明天下午三点提醒我给导师发开题报告，大概一个半小时，很重要';
  const TRIGGERS = [[6, 0], [25, 1], [29, 2]]; // 打字到第几个字时弹出第几颗胶囊

  function resetHero() {
    typed.textContent = '';
    card.classList.add('out');
    chips.forEach((c) => c.classList.remove('in'));
    titleEl.style.opacity = 0;
    startBtn.style.opacity = 0;
    startBtn.style.transform = 'translateY(6px)';
    ringOn.style.strokeDashoffset = 113;
    ringTxt.textContent = '0';
  }

  async function playHero() {
    resetHero();
    await sleep(420);
    card.classList.remove('out');

    const shown = new Set();
    for (let i = 1; i <= TEXT.length; i++) {
      typed.textContent = TEXT.slice(0, i);
      if (i === 1) {
        titleEl.style.transition = 'opacity .5s';
        titleEl.style.opacity = 1;
      }
      for (const [at, idx] of TRIGGERS) {
        if (i >= at && !shown.has(idx)) {
          shown.add(idx);
          chips[idx].classList.add('in');
        }
      }
      await sleep(58 + Math.random() * 26);
    }

    await sleep(380);
    startBtn.style.transition = 'opacity .45s, transform .45s cubic-bezier(.22,.61,.36,1)';
    startBtn.style.opacity = 1;
    startBtn.style.transform = 'none';
    ringOn.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)';
    ringOn.style.strokeDashoffset = 75;
    ringTxt.textContent = '1';

    await sleep(3600);
    resetHero();
    await sleep(700);
  }

  if (typed) {
    if (reduce) {
      typed.textContent = TEXT;
      card.classList.remove('out');
      chips.forEach((c) => c.classList.add('in'));
      titleEl.style.opacity = 1;
      startBtn.style.opacity = 1;
      startBtn.style.transform = 'none';
      ringOn.style.strokeDashoffset = 75;
      ringTxt.textContent = '1';
    } else {
      (async function loop() {
        for (;;) {
          await playHero();
        }
      })();
    }
  }

  /* ─────────── 在线演示 iframe ─────────── */
  const frame = $('#appFrame');
  const loading = $('#phoneLoading');
  if (frame) {
    const LIVE = 'https://x1038604972-web.github.io/xiaobu-reminder/';
    let loaded = false;

    // 同源时替观众点掉登录页与新手导览，直接落到任务列表
    const autoEnter = (tries = 0) => {
      let doc = null;
      try { doc = frame.contentDocument; } catch (_) { return; }
      if (!doc || !doc.body) { if (tries < 50) setTimeout(() => autoEnter(tries + 1), 260); return; }

      const vis = (el) => !!el && el.getClientRects().length > 0;
      const skip = doc.getElementById('loginSkip');
      if (vis(skip)) { skip.click(); setTimeout(() => autoEnter(tries + 1), 320); return; }

      const tourSkip = Array.from(doc.querySelectorAll('button,a'))
        .find((el) => vis(el) && (el.textContent || '').trim() === '跳过');
      if (tourSkip) { tourSkip.click(); setTimeout(() => autoEnter(tries + 1), 320); return; }

      if (tries < 50) setTimeout(() => autoEnter(tries + 1), 260);
    };

    const arm = () => {
      if (arm.done) return;
      arm.done = true;
      frame.src = frame.dataset.src;
      frame.addEventListener('load', () => {
        loaded = true;
        frame.classList.add('ready');
        loading && loading.classList.add('hide');
        autoEnter();
      });
      setTimeout(() => {
        if (loaded) return;
        if (loading) loading.innerHTML = '<p style="max-width:15em">预览加载得有点慢。<br>可以直接<a href="' +
          LIVE + '" target="_blank" rel="noopener" style="color:#B94F2E">在新窗口打开</a>。</p>';
      }, 9000);
    };
    const io2 = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { arm(); io2.disconnect(); } });
    }, { rootMargin: '1200px' });
    io2.observe(frame.closest('.phone'));
  }

  /* ─────────── 讲稿抽屉 ─────────── */
  const notes = $('#notes');
  const notesBody = $('#notesBody');
  sections.forEach((sec, i) => {
    if (!sec.dataset.note) return;
    const d = document.createElement('div');
    d.className = 'note-item';
    d.dataset.i = i;
    d.innerHTML = `<h3>${sec.dataset.title || ''} <button type="button" data-go="${i}">看这一节 ↑</button></h3><p>${sec.dataset.note}</p>`;
    notesBody.appendChild(d);
  });
  notesBody.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    sections[+b.dataset.go].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  const toggleNotes = (force) => {
    const open = force !== undefined ? force : !notes.classList.contains('open');
    notes.classList.toggle('open', open);
    notes.setAttribute('aria-hidden', String(!open));
  };
  $('#notesBtn').addEventListener('click', () => toggleNotes());
  $('#notesClose').addEventListener('click', () => toggleNotes(false));
  $('#pbNotes').addEventListener('click', () => toggleNotes());

  /* ─────────── 演讲模式 ─────────── */
  const body = document.body;
  const go = (i) => {
    const s = sections[Math.max(0, Math.min(sections.length - 1, i))];
    if (s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  const setPresent = (on) => {
    body.classList.toggle('present', on);
    $('#presentBar').setAttribute('aria-hidden', String(!on));
    $('#presentBtn').textContent = on ? '退出演讲' : '演讲模式';
    if (on) {
      $('#pbAll').textContent = sections.length;
      setTimeout(() => go(current < 0 ? 0 : current), 60);
    }
  };
  $('#presentBtn').addEventListener('click', () => setPresent(!body.classList.contains('present')));
  $('#pbExit').addEventListener('click', () => setPresent(false));
  $('#pbNext').addEventListener('click', () => go(current + 1));
  $('#pbPrev').addEventListener('click', () => go(current - 1));

  addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setPresent(!body.classList.contains('present')); return; }
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); toggleNotes(); return; }
    if (e.key === 'Escape') { toggleNotes(false); if (body.classList.contains('present')) setPresent(false); return; }

    if (!body.classList.contains('present')) return;
    const next = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
    const prev = ['ArrowLeft', 'ArrowUp', 'PageUp'];
    if (next.includes(e.key)) { e.preventDefault(); go(current + 1); }
    else if (prev.includes(e.key)) { e.preventDefault(); go(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(sections.length - 1); }
    else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.();
    }
  });

  /* 触屏：左右滑动翻节（演讲模式） */
  let tx = 0, ty = 0;
  addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', (e) => {
    if (!body.classList.contains('present')) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
