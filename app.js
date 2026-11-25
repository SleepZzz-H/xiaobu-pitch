/* 小步 · 演讲站 —— 翻页、讲稿、演示模式、封面动效、操作影片 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const slides = $$('.slide');
  const total = slides.length;
  const slidesEl = $('#slides');

  /* ───────── 章节点 + 页码 ───────── */
  const rail = $('#rail');
  slides.forEach((s, i) => {
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.innerHTML = `<span>${s.dataset.title || i + 1}</span><i></i>`;
    a.addEventListener('click', (e) => { e.preventDefault(); go(i); });
    rail.appendChild(a);
  });
  const railLinks = $$('#rail a');
  $('#pagerAll').textContent = total;
  $('#pbAll').textContent = total;

  /* ───────── 当前页 ───────── */
  let current = -1;
  function setCurrent(i) {
    if (i === current) return;
    current = i;
    railLinks.forEach((a, k) => a.classList.toggle('on', k === i));
    $$('.note-item').forEach((n, k) => n.classList.toggle('active', k === i));
    $('#pagerNow').textContent = i + 1;
    $('#pbNow').textContent = i + 1;
    $('#progBar').style.width = ((i + 1) / total * 100).toFixed(2) + '%';
    document.title = `${(slides[i]?.dataset.title || '')} · 小步`;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setCurrent(slides.indexOf(e.target)); });
  }, { threshold: 0.55 });
  slides.forEach((s) => io.observe(s));

  /* ───────── 翻页 ───────── */
  function go(i) {
    i = Math.max(0, Math.min(total - 1, i));
    slides[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  // 点一下翻一页（避开交互元素）
  slides.forEach((s) => {
    s.addEventListener('click', (e) => {
      if (e.target.closest('a,button,input,textarea,.notes,.present-bar,.film')) return;
      if (window.getSelection().toString()) return;
      next();
    });
  });

  // 平滑滚一次（键盘/按钮用）
  let wheelLock = 0;
  slidesEl.addEventListener('wheel', (e) => {
    if (window.innerWidth <= 980) return;
    if (Math.abs(e.deltaY) < 12) return;
    const now = Date.now();
    if (now < wheelLock) { return; }
    const el = slidesEl;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    const atTop = el.scrollTop <= 2;
    if ((e.deltaY > 0 && atBottom) || (e.deltaY < 0 && atTop)) return;
    // 让浏览器原生 snap 处理，只加一点锁，避免一次滚好几页
    wheelLock = now + 620;
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'Escape') {
      if ($('#notes').classList.contains('open')) return toggleNotes(false);
      if (document.body.classList.contains('present')) return setPresent(false);
    }
    if (k === 'n' || k === 'N') return toggleNotes();
    if (k === 'p' || k === 'P') return setPresent(!document.body.classList.contains('present'));
    if (k === 'f' || k === 'F') return toggleFull();
    if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'ArrowRight') { e.preventDefault(); return next(); }
    if (k === 'ArrowUp' || k === 'PageUp' || k === 'ArrowLeft') { e.preventDefault(); return prev(); }
    if (k === 'Home') { e.preventDefault(); return go(0); }
    if (k === 'End') { e.preventDefault(); return go(total - 1); }
  });

  // 触屏横滑
  let touchX = 0, touchY = 0;
  document.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (window.innerWidth > 980) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
  }, { passive: true });

  /* ───────── 入场 ───────── */
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const sibs = [...e.target.parentElement.children].filter((n) => n.classList.contains('reveal'));
      const i = sibs.indexOf(e.target);
      e.target.style.transitionDelay = Math.max(0, Math.min(i, 6)) * 70 + 'ms';
      e.target.classList.add('in');
      rio.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => rio.observe(el));

  /* ───────── 讲稿 ───────── */
  const notes = $('#notes'), notesBody = $('#notesBody');
  slides.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'note-item';
    d.innerHTML = `<h4>${String(i + 1).padStart(2, '0')}　${s.dataset.title || ''}</h4><p>${s.dataset.note || ''}</p>`;
    d.addEventListener('click', () => { go(i); toggleNotes(false); });
    notesBody.appendChild(d);
  });
  const foot = document.createElement('p');
  foot.className = 'notes-foot';
  foot.textContent = '← → 或空格翻页　·　N 开关讲稿　·　P 演讲模式　·　F 全屏';
  notesBody.appendChild(foot);

  function toggleNotes(force) {
    const open = force === undefined ? !notes.classList.contains('open') : force;
    notes.classList.toggle('open', open);
    notes.setAttribute('aria-hidden', String(!open));
  }
  $('#notesBtn').addEventListener('click', () => toggleNotes());
  $('#notesClose').addEventListener('click', () => toggleNotes(false));
  $('#pbNotes').addEventListener('click', () => toggleNotes());

  /* ───────── 演示模式 ───────── */
  function setPresent(on) {
    document.body.classList.toggle('present', on);
    if (on && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  }
  $('#presentBtn').addEventListener('click', () => setPresent(true));
  $('#pbExit').addEventListener('click', () => setPresent(false));
  $('#pbPrev').addEventListener('click', prev);
  $('#pbNext').addEventListener('click', next);

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  /* ───────── 封面打字 ───────── */
  const typed = $('#typed'), chips = $$('#cardChips .chip'), card = $('#mockCard'),
        startBtn = $('.mock-start'), ringFg = $('#ringFg'), ringNum = $('#ringNum');
  const TEXT = '明天下午三点提醒我给导师发开题报告，大概一个半小时，很重要';
  const TRIGGERS = [[6, 0], [25, 1], [29, 2]];
  let ti = 0, raf = null, alive = true;

  function resetHero() {
    if (!typed) return;
    typed.textContent = '';
    card.classList.remove('show');
    chips.forEach((c) => c.classList.remove('on'));
    startBtn.classList.remove('on');
    ringFg.style.strokeDashoffset = '113';
    ringNum.textContent = '0';
    ti = 0;
  }
  function typeHero() {
    if (!alive) return;
    if (ti <= TEXT.length) {
      typed.textContent = TEXT.slice(0, ti);
      TRIGGERS.forEach(([at, k]) => { if (ti === at && chips[k]) chips[k].classList.add('on'); });
      ti++;
      raf = setTimeout(typeHero, 62);
    } else {
      card.classList.add('show');
      setTimeout(() => startBtn.classList.add('on'), 320);
      setTimeout(() => { ringFg.style.strokeDashoffset = '75'; ringNum.textContent = '1'; }, 520);
      setTimeout(() => { resetHero(); raf = setTimeout(typeHero, 400); }, 5200);
    }
  }
  if (typed) { raf = setTimeout(typeHero, 700); }
  document.addEventListener('visibilitychange', () => { alive = !document.hidden; });

  /* ───────── 操作影片 ───────── */
  const film = $('#film');
  if (film) {
    const a = $('.film-a', film), b = $('.film-b', film),
          prog = $('#filmProg'), toggle = $('#filmToggle');
    let frames = [], idx = 0, timer = null, playing = true, showingA = true, ms = 260;

    const useFrames = (list, dur) => {
      frames = list; ms = dur || 260;
      idx = 0; a.src = frames[0]; a.classList.add('on'); b.classList.remove('on');
      play();
    };

    const tick = () => {
      if (!playing || frames.length < 2) return;
      idx = (idx + 1) % frames.length;
      const showEl = showingA ? b : a, hideEl = showingA ? a : b;
      showEl.src = frames[idx];
      showEl.classList.add('on');
      hideEl.classList.remove('on');
      showingA = !showingA;
      prog.style.width = ((idx + 1) / frames.length * 100).toFixed(1) + '%';
    };
    const play = () => { clearInterval(timer); if (frames.length > 1) timer = setInterval(tick, ms); playing = true; toggle.textContent = '暂停'; };
    const pause = () => { clearInterval(timer); playing = false; toggle.textContent = '播放'; };

    toggle.addEventListener('click', (e) => { e.stopPropagation(); playing ? pause() : play(); });

    fetch('assets/flow/manifest.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((m) => {
        const list = (m.frames || []).map((f) => 'assets/flow/' + f);
        // 预加载
        let loaded = 0;
        list.forEach((src) => { const im = new Image(); im.onload = im.onerror = () => { if (++loaded === list.length) useFrames(list, m.ms); }; im.src = src; });
        if (!list.length) throw new Error('empty');
      })
      .catch(() => { /* 没有影片就用静态首页截图 */ });

    const fio = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting && playing) play(); else if (!e.isIntersecting) clearInterval(timer); });
    }, { threshold: 0.25 });
    fio.observe(film);
  }
})();
