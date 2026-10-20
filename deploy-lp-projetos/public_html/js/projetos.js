/* Pilares · LP Projetos · motor de movimento + interações (vanilla, sem libs)
   Segue o sistema de movimento BuildV: movimento curto, easing longo,
   gate html[data-motion], 3 camadas de gatilho, lerp só em ponteiro fino. */
(function () {
  'use strict';
  var html = document.documentElement;
  var MOTION = html.hasAttribute('data-motion');
  window.__pmotion = true;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var vh = function () { return window.innerHeight; };
  var FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- 1. Títulos palavra a palavra ---------- */
  if (MOTION) {
    // preserva o <em> (acento em itálico da serifada) palavra a palavra;
    // quebra só em espaço comum, para o &nbsp; manter palavras juntas (sem viúva)
    $$('[data-split]').forEach(function (h) {
      var ws = [];
      Array.prototype.forEach.call(h.childNodes, function (n) {
        var em = n.nodeType === 1 && n.tagName === 'EM';
        n.textContent.split(/[ \t\n\r]+/).forEach(function (w) { if (w) ws.push(em ? '<em>' + w + '</em>' : w); });
      });
      h.innerHTML = ws.map(function (w) {
        return '<span class="w"><i>' + w + '</i></span>';
      }).join(' ');
      $$('.w>i', h).forEach(function (i, k) { i.style.transitionDelay = (k * 42) + 'ms'; });
    });
  }

  /* ---------- 2. Reveal (stagger por irmãos) ---------- */
  var targets = $$('[data-reveal],[data-split]');
  targets.forEach(function (el) {
    if (!el.hasAttribute('data-reveal')) return;
    var sibs = $$(':scope > [data-reveal]', el.parentNode);
    var i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 80 + 'ms';
  });
  function show(el) {
    if (el.hasAttribute('data-split')) el.classList.add('is-split');
    else el.classList.add('is-in');
    if (el.querySelector('[data-count]') || el.hasAttribute('data-count')) countIn(el);
  }
  function inView(el, f) { var r = el.getBoundingClientRect(); return r.top < vh() * (f || 1) && r.bottom > 0; }

  if (!MOTION) {
    targets.forEach(show);
  } else {
    // clip-path 100% recortado zera a interseção no Chrome: a máscara observa o pai
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target.__rv || e.target); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' }) : null;
    targets.forEach(function (el) {
      if (!io) return show(el);
      var obs = el;
      if (el.getAttribute('data-reveal') === 'mask') { obs = el.parentNode; obs.__rv = el; }
      io.observe(obs);
    });
    // primeira tela por timer (IO não dispara em aba oculta)
    setTimeout(function () {
      requestAnimationFrame(function () { $('.hero').classList.add('is-in'); });
      targets.forEach(function (el) { if (inView(el, .95)) show(el); });
    }, 140);
    setTimeout(function () { $('.hero').classList.add('is-in'); }, 400);
    // saltos (âncora/barra): revela sem animar o que já passou
    window.addEventListener('scroll', function () {
      targets.forEach(function (el) {
        if (el.getBoundingClientRect().bottom < vh() * .3 && !el.classList.contains('is-in') && !el.classList.contains('is-split')) {
          el.style.transition = 'none'; $$('i', el).forEach(function (i) { i.style.transition = 'none'; }); show(el);
        }
      });
    }, { passive: true });
    // persianas do hero abrem do centro para fora
    $$('.hero__slats i').forEach(function (s, k, a) {
      s.style.transitionDelay = Math.abs(k - (a.length - 1) / 2) * 70 + 'ms';
    });
  }

  /* ---------- 3. Contadores ---------- */
  function fmt(n, g) { return g ? n.toLocaleString('pt-BR') : String(n); }
  function countIn(root) {
    var list = root.hasAttribute('data-count') ? [root] : $$('[data-count]', root);
    list.forEach(function (el, k) {
      if (el.__c || !MOTION) return; el.__c = 1;
      var to = +el.getAttribute('data-count'), p = el.getAttribute('data-prefix') || '', g = el.hasAttribute('data-group');
      var t0 = null, dur = 1600;
      setTimeout(function () {
        requestAnimationFrame(function step(t) {
          if (!t0) t0 = t; var x = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - x, 3);
          el.textContent = p + fmt(Math.round(to * e), g);
          if (x < 1) requestAnimationFrame(step);
        });
      }, k * 180);
    });
  }

  /* ---------- 4. Header: sólido, esconde ao descer ---------- */
  var hdr = $('#hdr'), lastY = 0;
  function onHdr() {
    var y = window.scrollY;
    hdr.setAttribute('data-solid', y > vh() * .82 - 76 ? 'true' : 'false');
    var menuOpen = hdr.classList.contains('menu-open');
    hdr.setAttribute('data-hide', (!menuOpen && y > 260 && y > lastY + 2) ? 'true' : (y < lastY - 2 || y < 260 ? 'false' : hdr.getAttribute('data-hide')));
    lastY = y;
  }
  window.addEventListener('scroll', onHdr, { passive: true }); onHdr();

  /* ---------- 5. Hero: câmera recua ao rolar ---------- */
  var heroMedia = $('#heroMedia'), heroIn = $('#heroIn');
  if (MOTION) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var p = Math.min(1, Math.max(0, window.scrollY / vh()));
        heroMedia.style.transform = 'translate3d(0,' + (p * 10) + 'vh,0) scale(' + (1 + p * .06) + ')';
        heroIn.style.transform = 'translate3d(0,' + (-p * 60) + 'px,0)';
        heroIn.style.opacity = String(1 - Math.min(1, p * 1.3));
      });
    }, { passive: true });
  }

  /* ---------- 6. Escopo: abas + cena travada no desktop ---------- */
  var esc = $('#escopo'), tabs = $$('.esc__tab'), pans = $$('.esc__pan'), figs = $$('.esc__fig'), bar = $('#escBar'), cur = 0;
  function setTab(i, focus) {
    if (i === cur && !focus) return; cur = i;
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    pans.forEach(function (p, k) { p.hidden = k !== i; p.setAttribute('data-on', k === i); });
    figs.forEach(function (f, k) { f.setAttribute('data-on', k === i); });
    if (bar) bar.style.transform = 'scaleY(' + ((i + 1) / 3) + ')';
    if (focus) tabs[i].focus();
  }
  function pinOK() { return MOTION && innerWidth >= 900 && innerHeight >= 560; }
  function escPin() { esc.setAttribute('data-pin', pinOK() ? 'on' : 'off'); }
  escPin(); window.addEventListener('resize', escPin);
  function escProg() {
    if (esc.getAttribute('data-pin') !== 'on') return -1;
    var r = esc.getBoundingClientRect(), span = esc.offsetHeight - vh();
    return Math.min(1, Math.max(0, -r.top / span));
  }
  window.addEventListener('scroll', function () {
    var p = escProg(); if (p < 0) return;
    setTab(Math.min(2, Math.floor(p * 3)));
  }, { passive: true });
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () {
      if (esc.getAttribute('data-pin') === 'on') {
        var top = esc.getBoundingClientRect().top + window.scrollY, span = esc.offsetHeight - vh();
        ssTo(top + span * (k + .5) / 3, true);
      }
      setTab(k);
    });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (n) { e.preventDefault(); setTab((cur + n + 3) % 3, true); }
    });
  });

  /* ---------- 7. Scroll suave (lerp 0.105, só ponteiro fino) ---------- */
  var target = window.scrollY, current = target, running = false;
  function maxY() { return document.documentElement.scrollHeight - vh(); }
  function loop() {
    current += (target - current) * .105;
    if (Math.abs(target - current) < .5) { current = target; running = false; }
    window.scrollTo(0, current);
    if (running) requestAnimationFrame(loop);
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
  function locked() { return document.body.style.overflow === 'hidden'; }
  function ssTo(y, raw) {
    y = Math.max(0, Math.min(maxY(), raw ? y : y - 76));
    if (!MOTION) { window.scrollTo(0, y); return; }
    current = window.scrollY; target = y; kick();
  }
  window.addEventListener('scroll', function () { if (!running) { target = current = window.scrollY; } }, { passive: true });
  if (MOTION && FINE) {
    window.addEventListener('wheel', function (e) {
      if (locked() || e.ctrlKey) return;
      for (var n = e.target, k = 0; n && n !== document.body && k < 8; n = n.parentNode, k++) {
        if (n.nodeType === 1) { var s = getComputedStyle(n); if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight) return; }
      }
      e.preventDefault();
      if (!running) current = window.scrollY;
      target = Math.max(0, Math.min(maxY(), target + e.deltaY * (e.deltaMode === 1 ? 32 : 1)));
      kick();
    }, { passive: false });
  }

  /* ---------- 8. Âncoras e menu ---------- */
  var burger = $('#burger'), nav = $('#nav');
  function menu(open) {
    nav.classList.toggle('open', open); hdr.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) hdr.setAttribute('data-hide', 'false');
  }
  burger.addEventListener('click', function () { menu(!nav.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { menu(false); burger.focus(); } });
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var el = $(id); if (!el) return; e.preventDefault();
      var fromMenu = nav.classList.contains('open'); if (fromMenu) menu(false);
      setTimeout(function () {
        ssTo(el.getBoundingClientRect().top + window.scrollY, true);
        el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true });
      }, fromMenu ? 420 : 80);
    });
  });
  $('#cta-merlin8').addEventListener('click', function () { menu(false); });

  /* ---------- 9. Lightbox de galeria por projeto ---------- */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbT = $('#lbTitle'), lbC = $('#lbCount'), gal = null, gi = 0, opener = null, tx = null;
  function lbShow() {
    lbImg.style.opacity = 0;
    var src = 'assets/img/' + gal.slug + '-' + (gi + 1);
    var im = new Image(); im.onload = function () { lbImg.src = im.src; lbImg.style.opacity = 1; };
    im.src = src + (innerWidth < 900 ? '@sm' : '') + '.webp';
    lbImg.alt = gal.title + ', imagem ' + (gi + 1) + ' de ' + gal.n;
    lbC.textContent = (gi + 1) + ' / ' + gal.n;
  }
  function lbOpen(btn) {
    opener = btn; gal = { slug: btn.getAttribute('data-gal'), n: +btn.getAttribute('data-n'), title: btn.getAttribute('data-title') }; gi = 0;
    lbT.textContent = gal.title; lb.hidden = false; document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { lb.setAttribute('data-open', 'true'); });
    lbShow(); $('#lbClose').focus();
  }
  function lbClose() {
    lb.setAttribute('data-open', 'false'); document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; }, 450); if (opener) opener.focus();
  }
  function lbGo(d) { gi = (gi + d + gal.n) % gal.n; lbShow(); }
  $$('.pf__card').forEach(function (b) { b.addEventListener('click', function () { lbOpen(b); }); });
  $('#lbClose').addEventListener('click', lbClose);
  $('#lbPrev').addEventListener('click', function () { lbGo(-1); });
  $('#lbNext').addEventListener('click', function () { lbGo(1); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowLeft') lbGo(-1);
    else if (e.key === 'ArrowRight') lbGo(1);
    else if (e.key === 'Tab') {
      var f = $$('button', lb), a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1);
  });

  /* ---------- 10. Cookies (LGPD) com evento no dataLayer ---------- */
  var CHAVE = 'pilares_consentimento', ck = $('#ck');
  function push(v) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'consentimento_cookies', consentimento_analytics: v === 'todos' ? 'concedido' : 'negado', consentimento_marketing: v === 'todos' ? 'concedido' : 'negado' });
  }
  var salvo = null; try { salvo = localStorage.getItem(CHAVE); } catch (e) {}
  if (salvo) push(salvo); else setTimeout(function () { ck.setAttribute('data-open', 'true'); }, 1600);
  $$('[data-ck]', ck).forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-ck') === 'accept' ? 'todos' : 'necessarios';
      try { localStorage.setItem(CHAVE, v); } catch (e) {}
      push(v); ck.setAttribute('data-open', 'false');
    });
  });

  $('#ano').textContent = new Date().getFullYear();
})();
