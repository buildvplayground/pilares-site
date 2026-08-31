/* =========================================================================
   form.js — validação do formulário de Fornecedores / Trabalhe Conosco.
   Progressive enhancement: sem JS o formulário ainda envia (o PHP valida
   tudo de novo no servidor, que é a validação que vale).
   Erros aparecem JUNTO DO CAMPO (não só no topo) e o foco vai para o
   primeiro campo inválido.
   ========================================================================= */
(function () {
  'use strict';

  var form = document.getElementById('formCadastro');
  if (!form) return;

  var aviso = document.getElementById('avisoForm');
  var botao = document.getElementById('btnEnviar');
  var MAX_ARQUIVO = 5 * 1024 * 1024;                 // 5 MB
  var TIPOS_OK = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'];

  function erroDe(campo) { return document.getElementById('erro-' + campo.id); }

  function marca(campo, mensagem) {
    var alvo = erroDe(campo);
    if (mensagem) {
      campo.setAttribute('aria-invalid', 'true');
      if (alvo) alvo.textContent = mensagem;
    } else {
      campo.removeAttribute('aria-invalid');
      if (alvo) alvo.textContent = '';
    }
  }

  function valida(campo) {
    var v = (campo.value || '').trim();

    if (campo.hasAttribute('required')) {
      if (campo.type === 'checkbox' && !campo.checked) {
        marca(campo, 'É necessário autorizar o uso dos dados para enviar.');
        return false;
      }
      if (campo.type !== 'checkbox' && !v) {
        marca(campo, 'Preencha este campo.');
        return false;
      }
    }
    if (campo.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      marca(campo, 'Informe um e-mail válido.');
      return false;
    }
    if (campo.type === 'tel' && v && v.replace(/\D/g, '').length < 10) {
      marca(campo, 'Informe o telefone com DDD.');
      return false;
    }
    if (campo.type === 'file' && campo.files && campo.files.length) {
      var f = campo.files[0];
      var ext = (f.name.split('.').pop() || '').toLowerCase();
      if (TIPOS_OK.indexOf(ext) === -1) {
        marca(campo, 'Formato não aceito. Use PDF, DOC, DOCX, JPG, PNG ou WEBP.');
        return false;
      }
      if (f.size > MAX_ARQUIVO) {
        marca(campo, 'Arquivo acima de 5 MB. Comprima ou envie por e-mail.');
        return false;
      }
    }
    marca(campo, '');
    return true;
  }

  var campos = Array.prototype.slice.call(
    form.querySelectorAll('input[required], select[required], textarea[required], input[type="file"]')
  ).filter(function (el) { return el.id !== 'site_web'; });

  // valida ao sair do campo; limpa o erro assim que o usuário corrige
  campos.forEach(function (campo) {
    campo.addEventListener('blur', function () { valida(campo); });
    campo.addEventListener('input', function () {
      if (campo.getAttribute('aria-invalid') === 'true') valida(campo);
    });
    if (campo.type === 'checkbox' || campo.tagName === 'SELECT') {
      campo.addEventListener('change', function () { valida(campo); });
    }
  });

  function mostraAviso(texto, ok) {
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.className = 'form__aviso ' + (ok ? 'form__aviso--ok' : 'form__aviso--erro');
    aviso.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    var invalidos = campos.filter(function (c) { return !valida(c); });

    if (invalidos.length) {
      e.preventDefault();
      mostraAviso('Confira os campos destacados antes de enviar.', false);
      invalidos[0].focus();
      return;
    }

    // Envio por fetch para não perder a página; se falhar, deixa o POST normal seguir.
    if (!window.fetch || !window.FormData) return;
    e.preventDefault();

    var dados = new FormData(form);
    botao.disabled = true;
    var rotuloOriginal = botao.innerHTML;
    botao.textContent = 'Enviando…';
    mostraAviso('Enviando seu cadastro…', true);

    fetch(form.getAttribute('action'), {
      method: 'POST',
      body: dados,
      headers: { 'X-Requested-With': 'fetch' }
    })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
      .then(function (res) {
        if (res && res.ok) {
          form.reset();
          campos.forEach(function (c) { marca(c, ''); });
          mostraAviso('Cadastro enviado. Obrigado! Entraremos em contato quando houver demanda compatível.', true);
        } else {
          mostraAviso((res && res.erro) ||
            'Não foi possível enviar agora. Tente novamente ou escreva para contratos@pilaresengltda.com.br.', false);
        }
      })
      .catch(function () {
        mostraAviso('Falha de conexão. Tente novamente ou escreva para contratos@pilaresengltda.com.br.', false);
      })
      .then(function () {
        botao.disabled = false;
        botao.innerHTML = rotuloOriginal;
      });
  });
})();
