/* =========================================================================
   Pilares Engenharia e Construções — app.js
   HTML + CSS + JS vanilla, zero dependência externa.

   Motor de movimento próprio (não o motion/ empacotado, que é de uma geração
   anterior e não responde aos atributos documentados). Segue a especificação
   do sistema-de-movimento.md: gate data-motion, movimento curto + easing longo,
   3 camadas de gatilho, prefers-reduced-motion respeitado.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     0. Constantes de projeto
     --------------------------------------------------------------------- */
  var WA_NUMERO = '5571983979696';                 // fonte única do WhatsApp
  var WA_MSG_PADRAO = 'Olá! Vi o site da Pilares e gostaria de solicitar um orçamento.';
  var PARALLAX = 0.12;                             // teto da casa

  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
  var semMovimento = reduz.matches;

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------------
     1. Loader — sai no load; timer de segurança se algum recurso travar
     --------------------------------------------------------------------- */
  function fechaLoader() { document.body.classList.add('is-loaded'); }
  window.addEventListener('load', fechaLoader);
  setTimeout(fechaLoader, 2600);

  /* ---------------------------------------------------------------------
     2. Ano do rodapé
     --------------------------------------------------------------------- */
  var ano = $('#ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------------------
     3. WhatsApp centralizado
        O HTML já traz href funcional (funciona sem JS). Aqui garantimos que
        o número venha de UM lugar só, e marcamos o clique no dataLayer.
     --------------------------------------------------------------------- */
  $$('[data-wa-btn]').forEach(function (el) {
    var atual = el.getAttribute('href') || '';
    var texto = WA_MSG_PADRAO;
    var m = atual.match(/[?&]text=([^&]+)/);
    if (m) { try { texto = decodeURIComponent(m[1]); } catch (e) {} }
    el.setAttribute('href', 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(texto));

    el.addEventListener('click', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'clique_whatsapp',
        origem: el.getAttribute('data-wa-btn') || 'nao-identificado'
      });
    });
  });

  /* ---------------------------------------------------------------------
     4. Header — sombra ao rolar + esconde ao descer (a partir de 260px)
     --------------------------------------------------------------------- */
  var hdr = $('#hdr');
  var ultimoY = window.scrollY;

  function atualizaHeader() {
    var y = window.scrollY;
    if (!hdr) return;
    hdr.setAttribute('data-scrolled', y > 40 ? 'true' : 'false');

    var travado = document.body.classList.contains('is-locked');
    if (y > 260 && y > ultimoY + 4 && !travado) {
      hdr.setAttribute('data-hide', 'true');
    } else if (y < ultimoY - 4 || y <= 260) {
      hdr.setAttribute('data-hide', 'false');
    }
    ultimoY = y;
  }

  /* ---------------------------------------------------------------------
     5. Menu off-canvas
     --------------------------------------------------------------------- */
  var burger = $('#burger');
  var drawer = $('#drawer');
  var scrim  = $('#scrim');

  function abreMenu(abrir) {
    if (!drawer || !burger) return;
    drawer.setAttribute('data-open', abrir ? 'true' : 'false');
    if (scrim) scrim.setAttribute('data-open', abrir ? 'true' : 'false');
    burger.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    burger.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('is-locked', abrir);
    if (abrir) {
      hdr && hdr.setAttribute('data-hide', 'false');
      var primeiro = drawer.querySelector('a');
      primeiro && primeiro.focus();
    } else {
      burger.focus();
    }
  }

  var drawerClose = $('#drawerClose');
  burger && burger.addEventListener('click', function () {
    abreMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  drawerClose && drawerClose.addEventListener('click', function () { abreMenu(false); });
  scrim && scrim.addEventListener('click', function () { abreMenu(false); });
  drawer && $$('a', drawer).forEach(function (a) {
    a.addEventListener('click', function () { abreMenu(false); });
  });

  /* ---------------------------------------------------------------------
     6. Reveals — 3 camadas de gatilho (spec do sistema de movimento)
        (a) primeira tela por rAF + timeout (observer não dispara em aba oculta)
        (b) IntersectionObserver no scroll normal
        (c) hook de scroll que "libera" o que foi pulado num salto de âncora
     --------------------------------------------------------------------- */
  /* ---- split de título: cada palavra numa máscara própria ----
     Feito via DOM (não innerHTML) para não depender de escape de entidades.
     Só divide elementos de texto puro — com filho elemento, sai fora, senão
     a marcação do cliente seria destruída. */
  function dividePalavras(el) {
    if (el.getAttribute('data-split-ok') === '1') return;
    var filhos = Array.prototype.slice.call(el.childNodes);
    if (filhos.some(function (x) { return x.nodeType === 1; })) return;
    // Só colapsa espaço ASCII: \s também casa U+00A0, e normalizar o espaço
    // inquebrável desfaria justamente as amarrações de quebra de linha.
    var texto = (el.textContent || '').replace(/[ \t\r\n]+/g, ' ').trim();
    if (!texto) return;
    var palavras = texto.split(' ');   // pares presos por &nbsp; viram UMA palavra
    el.textContent = '';
    palavras.forEach(function (pal, i) {
      var w = document.createElement('span');
      w.className = 'w';
      var it = document.createElement('i');
      it.textContent = pal;
      // 42ms por palavra (calibragem da casa), com teto para não arrastar
      it.style.setProperty('--wd', Math.min(i, 15) * 42 + 'ms');
      w.appendChild(it);
      el.appendChild(w);
      if (i < palavras.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.setAttribute('data-split-ok', '1');
  }

  var divisiveis = $$('[data-split]');
  if (!semMovimento) divisiveis.forEach(dividePalavras);

  var alvos = $$('[data-reveal], .step, .passos, .hero');

  // stagger automático entre irmãos diretos: índice × 80ms, teto 480ms
  (function aplicaStagger() {
    var porPai = new Map();
    $$('[data-reveal], .step').forEach(function (el) {
      var pai = el.parentElement;
      if (!pai) return;
      if (!porPai.has(pai)) porPai.set(pai, 0);
      var i = porPai.get(pai);
      porPai.set(pai, i + 1);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 80 + 'ms');
    });
  })();

  function revela(el, instantaneo) {
    if (el.classList.contains('is-in')) return;
    if (instantaneo) {
      // sem atraso e sem escalonamento: usado quando o bloco JÁ está visível
      // ou quando o usuário chegou ao fim — nada deve "entrar" atrasado ali
      el.style.setProperty('--d', '0ms');
      $$('.w > i', el).forEach(function (it) { it.style.setProperty('--wd', '0ms'); });
    }
    el.classList.add('is-in');
    if (el.hasAttribute('data-count')) contaUm(el);
    $$('[data-count]', el).forEach(contaUm);

    // A cortina usa clip-path; mantê-lo depois da animação recortaria o anel de
    // foco e o filete decorativo que sai da caixa. Libera ao terminar.
    var tipo = el.getAttribute('data-reveal');
    if (tipo === 'fig' || tipo === 'mask') {
      setTimeout(function () { el.style.clipPath = 'none'; }, instantaneo ? 60 : 1400);
    }
  }

  if (semMovimento) {
    alvos.forEach(function (el) { el.classList.add('is-in'); el.style.clipPath = 'none'; });
    $$('.step').forEach(function (st) { st.style.setProperty('--sp', '1'); });
    $$('[data-count]').forEach(function (el) { el.classList.add('is-counted'); });
  } else {
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { revela(e.target); obs.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
      alvos.forEach(function (el) { obs.observe(el); });
    } else {
      alvos.forEach(revela);
    }

    // (a) primeira tela
    function primeiraTela() {
      var h = window.innerHeight;
      alvos.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < h * 0.92 && r.bottom > 0) revela(el);
      });
    }
    requestAnimationFrame(primeiraTela);
    setTimeout(primeiraTela, 140);

    // (c) salto de âncora / arraste da barra: o sincronizador resolve
    window.addEventListener('hashchange', function () {
      setTimeout(function () { sincronizaEntradas(); }, 60);
    });
  }

  /* ---------------------------------------------------------------------
     7. Contadores
     --------------------------------------------------------------------- */
  function contaUm(el) {
    if (el.classList.contains('is-counted')) return;
    el.classList.add('is-counted');

    var alvo = parseFloat(el.getAttribute('data-count'));
    if (isNaN(alvo)) return;
    var prefixo = el.getAttribute('data-prefix') || '';
    var sufixo  = el.getAttribute('data-suffix') || '';
    var agrupa  = el.hasAttribute('data-group');

    function formata(n) {
      var v = Math.round(n);
      return prefixo + (agrupa ? v.toLocaleString('pt-BR') : String(v)) + sufixo;
    }
    if (semMovimento) { el.textContent = formata(alvo); return; }

    var dur = 1600, ini = null;
    function passo(t) {
      if (ini === null) ini = t;
      var p = Math.min((t - ini) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);                  // easeOutCubic
      el.textContent = formata(alvo * e);
      if (p < 1) requestAnimationFrame(passo);
      else el.textContent = formata(alvo);
    }
    requestAnimationFrame(passo);
  }

  /* ---------------------------------------------------------------------
     8. Parallax das faixas de imagem + do hero (≤ 0.12)
     --------------------------------------------------------------------- */
  var camadas = [];
  if (!semMovimento) {
    $$('[data-parallax] img').forEach(function (img) { camadas.push({ el: img, f: PARALLAX }); });
    var heroImg = $('.hero__media img');
    if (heroImg) camadas.push({ el: heroImg, f: 0.08 });
  }

  function atualizaParallax() {
    var h = window.innerHeight;
    camadas.forEach(function (c) {
      var pai = c.el.parentElement;
      if (!pai) return;
      var r = pai.getBoundingClientRect();
      if (r.bottom < -80 || r.top > h + 80) return;      // fora de vista: não calcula
      var centro = r.top + r.height / 2 - h / 2;
      var d = -centro * c.f;
      var teto = r.height * 0.12;
      if (d > teto) d = teto;
      if (d < -teto) d = -teto;
      c.el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
    });
  }

  /* ---------------------------------------------------------------------
     8b. Processo — o filete de cada etapa é DESENHADO pelo scroll (scrub)
     --------------------------------------------------------------------- */
  var procSec = $('#processo');
  var passosProc = $$('.step');

  function atualizaProcesso() {
    if (!procSec || semMovimento || !passosProc.length) return;
    var r = procSec.getBoundingClientRect();
    var h = window.innerHeight;
    var p = (h * 0.82 - r.top) / (r.height + h * 0.45);
    if (p < 0) p = 0; if (p > 1) p = 1;
    passosProc.forEach(function (st, i) {
      var sp = (p - i * 0.11) / 0.40;
      if (sp < 0) sp = 0; if (sp > 1) sp = 1;
      st.style.setProperty('--sp', sp.toFixed(3));
    });
  }

  /* ---------------------------------------------------------------------
     8c. Nenhuma entrada atrasada: o que já está visível entra na hora, e ao
         chegar ao fim da página tudo que restou aparece sem animação.
     --------------------------------------------------------------------- */
  function noFimDaPagina() {
    var de = document.documentElement;
    return (window.scrollY + window.innerHeight) >= (de.scrollHeight - 140);
  }

  function sincronizaEntradas() {
    if (semMovimento) return;
    var h = window.innerHeight;
    var fim = noFimDaPagina();
    alvos.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      var r = el.getBoundingClientRect();
      if (fim) { revela(el, true); return; }          // fim do scroll: sem animação
      if (r.bottom < h * 0.3) { revela(el, true); return; }  // já passou
      if (r.top < h * 0.94 && r.bottom > 0) revela(el);      // visível: entra agora
    });
  }

  /* ---------------------------------------------------------------------
     8d. Botão flutuante de WhatsApp — só aparece depois do hero, para não
         competir com o CTA principal na primeira tela
     --------------------------------------------------------------------- */
  var waFlutua = $('#waFlutua');
  var heroEl = $('.hero');

  function atualizaFlutuante() {
    if (!waFlutua) return;
    var gatilho = heroEl ? heroEl.offsetHeight * 0.72 : 420;
    var mostrar = window.scrollY > gatilho;
    if (waFlutua.getAttribute('data-visivel') !== String(mostrar)) {
      waFlutua.setAttribute('data-visivel', String(mostrar));
      // fora da ordem de tabulação enquanto invisível
      if (mostrar) waFlutua.removeAttribute('tabindex');
      else waFlutua.setAttribute('tabindex', '-1');
    }
  }

  /* ---------------------------------------------------------------------
     9. Scrollspy — marca a seção atual na navegação
     --------------------------------------------------------------------- */
  var linksNav = $$('.nav a[href^="#"]');
  var secoes = linksNav.map(function (a) {
    return { link: a, alvo: document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (s) { return s.alvo; });

  function atualizaSpy() {
    var meio = window.innerHeight * 0.42;
    var atual = null;
    secoes.forEach(function (s) {
      var r = s.alvo.getBoundingClientRect();
      if (r.top <= meio && r.bottom > meio) atual = s;
    });
    secoes.forEach(function (s) {
      if (s === atual) s.link.setAttribute('aria-current', 'true');
      else s.link.removeAttribute('aria-current');
    });
  }

  /* ---------------------------------------------------------------------
     10. Loop de scroll único (header + parallax + spy + flush)
     --------------------------------------------------------------------- */
  var agendado = false;
  function noScroll() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      agendado = false;
      atualizaHeader();
      atualizaParallax();
      atualizaProcesso();
      atualizaFlutuante();
      atualizaSpy();
      sincronizaEntradas();
    });
  }
  window.addEventListener('scroll', noScroll, { passive: true });
  window.addEventListener('resize', noScroll);
  noScroll();

  /* ---------------------------------------------------------------------
     11. Lightbox — galeria por obra
     --------------------------------------------------------------------- */
  var lb      = $('#lb');
  var lbImg   = $('#lbImg');
  var lbTitle = $('#lbTitle');
  var lbCount = $('#lbCount');
  var lbPrev  = $('#lbPrev');
  var lbNext  = $('#lbNext');
  var lbClose = $('#lbClose');

  var galItems = $$('.gal__item');
  var galeria = [], alts = [], caps = [], indice = 0, gatilho = null;

  function mostra(i) {
    if (!galeria.length) return;
    indice = (i + galeria.length) % galeria.length;
    if (lbTitle) lbTitle.textContent = caps[indice] || 'Obra';
    lbImg.classList.remove('is-ready');
    var pronta = new Image();
    pronta.onload = function () {
      lbImg.src = galeria[indice];
      lbImg.alt = alts[indice] || '';
      lbImg.classList.add('is-ready');
    };
    pronta.onerror = function () {
      lbImg.src = galeria[indice];
      lbImg.alt = alts[indice] || '';
      lbImg.classList.add('is-ready');
    };
    pronta.src = galeria[indice];
    lbCount.textContent = (indice + 1) + ' / ' + galeria.length;
  }

  function abreLb(botao) {
    if (!galItems.length) return;
    // galeria única: todas as fotos, começando na que foi clicada
    galeria = galItems.map(function (b) { return b.getAttribute('data-full'); });
    alts    = galItems.map(function (b) { return b.getAttribute('data-alt') || ''; });
    caps    = galItems.map(function (b) { return b.getAttribute('data-cap') || 'Obra'; });
    gatilho = botao;

    var uma = galeria.length < 2;
    lbPrev.hidden = uma;
    lbNext.hidden = uma;

    lb.setAttribute('data-open', 'true');
    document.body.classList.add('is-locked');
    var start = galItems.indexOf(botao);
    mostra(start < 0 ? 0 : start);
    lbClose.focus();
  }

  function fechaLb() {
    lb.setAttribute('data-open', 'false');
    document.body.classList.remove('is-locked');
    lbImg.removeAttribute('src');   // src="" resolveria para a URL da página
    lbImg.alt = '';
    lbImg.classList.remove('is-ready');
    if (gatilho) { gatilho.focus(); gatilho = null; }
  }

  galItems.forEach(function (b) {
    b.addEventListener('click', function () { abreLb(b); });
  });

  lbPrev  && lbPrev.addEventListener('click',  function () { mostra(indice - 1); });
  lbNext  && lbNext.addEventListener('click',  function () { mostra(indice + 1); });
  lbClose && lbClose.addEventListener('click', fechaLb);

  lb && lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb__stage')) fechaLb();
  });

  document.addEventListener('keydown', function (e) {
    // Esc fecha o que estiver aberto
    if (e.key === 'Escape') {
      if (lb && lb.getAttribute('data-open') === 'true') { fechaLb(); return; }
      if (burger && burger.getAttribute('aria-expanded') === 'true') { abreMenu(false); return; }
    }
    if (!lb || lb.getAttribute('data-open') !== 'true') return;

    if (e.key === 'ArrowLeft')  { e.preventDefault(); mostra(indice - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); mostra(indice + 1); }

    // laço de foco dentro do diálogo
    if (e.key === 'Tab') {
      var focaveis = [lbPrev, lbClose, lbNext].filter(function (b) { return b && !b.hidden; });
      if (!focaveis.length) return;
      var i = focaveis.indexOf(document.activeElement);
      e.preventDefault();
      var prox = e.shiftKey ? i - 1 : i + 1;
      if (prox < 0) prox = focaveis.length - 1;
      if (prox >= focaveis.length) prox = 0;
      focaveis[prox].focus();
    }
  });

  /* ---------------------------------------------------------------------
     12. Cookies (LGPD) — consentimento com evento no dataLayer
         As tags (GTM/GA4/Pixel) devem disparar SÓ com consentimento.
     --------------------------------------------------------------------- */
  var ck = $('#ck');
  var CHAVE = 'pilares_consentimento';

  function empurraConsentimento(valor) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'consentimento_cookies',
      consentimento_analytics: valor === 'todos' ? 'concedido' : 'negado',
      consentimento_marketing: valor === 'todos' ? 'concedido' : 'negado'
    });
  }

  function leConsentimento() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }

  function marcaBarraCookies(aberta) {
    document.body.classList.toggle('ck-aberta', aberta);
    if (aberta && ck) {
      // altura real da barra: o botão flutuante sobe exatamente o necessário
      document.documentElement.style.setProperty('--ck-altura', ck.offsetHeight + 'px');
    }
  }

  if (ck) {
    var salvo = leConsentimento();
    if (salvo) {
      empurraConsentimento(salvo);
    } else {
      setTimeout(function () {
        ck.setAttribute('data-open', 'true');
        marcaBarraCookies(true);
      }, 900);
    }

    $$('[data-ck]', ck).forEach(function (b) {
      b.addEventListener('click', function () {
        var valor = b.getAttribute('data-ck') === 'accept' ? 'todos' : 'necessarios';
        try { localStorage.setItem(CHAVE, valor); } catch (e) {}
        empurraConsentimento(valor);
        ck.setAttribute('data-open', 'false');
        marcaBarraCookies(false);
      });
    });
  }

  /* ---------------------------------------------------------------------
     13. Se o usuário ligar "reduzir movimento" durante a sessão
     --------------------------------------------------------------------- */
  var onMudanca = function () {
    if (reduz.matches) {
      semMovimento = true;
      alvos.forEach(function (el) { el.classList.add('is-in'); el.style.clipPath = 'none'; });
      $$('.w > i').forEach(function (it) { it.style.setProperty('--wd', '0ms'); });
      passosProc.forEach(function (st) { st.style.setProperty('--sp', '1'); });
      camadas.forEach(function (c) { c.el.style.transform = ''; });
      camadas = [];
    }
  };
  if (reduz.addEventListener) reduz.addEventListener('change', onMudanca);
  else if (reduz.addListener) reduz.addListener(onMudanca);

})();
