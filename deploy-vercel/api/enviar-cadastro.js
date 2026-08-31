/**
 * Recebe o formulário de Fornecedores / Trabalhe Conosco na Vercel.
 * Zero dependências: usa só fetch (nativo no runtime Node da Vercel).
 *
 * Variáveis de ambiente (Project Settings > Environment Variables):
 *   RESEND_API_KEY   obrigatória para o envio funcionar
 *   EMAIL_DESTINO    opcional (padrão: contratos@pilaresengltda.com.br)
 *   EMAIL_REMETENTE  opcional (padrão: site@pilaresengltda.com.br) — precisa
 *                    ser de um domínio verificado no Resend
 *
 * Sem RESEND_API_KEY a função responde 503 com uma mensagem clara, e a página
 * continua oferecendo WhatsApp e e-mail como caminho.
 */
const DESTINO_PADRAO = 'contratos@pilaresengltda.com.br';

function limpa(v, max) {
  return String(v == null ? '' : v).replace(/[\r\0]/g, '').trim().slice(0, max);
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });
  }

  const b = req.body || {};

  // honeypot: robô preenche, gente não vê
  if (limpa(b.site_web, 50) !== '') return res.status(200).json({ ok: true });

  const tipo = limpa(b.tipo, 20);
  const nome = limpa(b.nome, 120);
  const email = limpa(b.email, 120);
  const telefone = limpa(b.telefone, 20);
  const area = limpa(b.area, 120);
  const mensagem = limpa(b.mensagem, 2000);
  const consent = !!b.consent;

  const erros = [];
  if (!['fornecedor', 'candidato'].includes(tipo)) erros.push('Selecione o tipo de cadastro.');
  if (nome.length < 3) erros.push('Informe o nome ou a razão social.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erros.push('Informe um e-mail válido.');
  if (telefone.replace(/\D/g, '').length < 10) erros.push('Informe o telefone com DDD.');
  if (!area) erros.push('Informe a área de atuação ou serviço.');
  if (mensagem.length < 10) erros.push('Escreva uma mensagem com pelo menos 10 caracteres.');
  if (!consent) erros.push('É necessário autorizar o uso dos dados.');
  if (erros.length) return res.status(422).json({ ok: false, erro: erros.join(' ') });

  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.error('[pilares] RESEND_API_KEY ausente; cadastro nao enviado:', { nome, email });
    return res.status(503).json({
      ok: false,
      erro: 'O envio automático ainda não está configurado. Escreva para ' + DESTINO_PADRAO +
            ' ou chame no WhatsApp (71) 9 8397-9696.',
    });
  }

  // prova de consentimento (LGPD)
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const agora = new Date().toISOString();

  const corpo = [
    'Novo cadastro pelo site',
    '',
    'Tipo:      ' + tipo,
    'Nome:      ' + nome,
    'E-mail:    ' + email,
    'Telefone:  ' + telefone,
    'Área:      ' + area,
    'Data:      ' + agora,
    'IP:        ' + ip,
    'Consentimento: concedido em ' + agora,
    '',
    'Mensagem:',
    mensagem,
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_REMETENTE || 'site@pilaresengltda.com.br',
        to: [process.env.EMAIL_DESTINO || DESTINO_PADRAO],
        reply_to: email,
        subject: '[Site] ' + (tipo === 'fornecedor' ? 'Fornecedor' : 'Trabalhe Conosco') + ': ' + nome,
        text: corpo,
      }),
    });
    if (!r.ok) {
      console.error('[pilares] resend falhou:', r.status, await r.text());
      return res.status(502).json({
        ok: false,
        erro: 'Não conseguimos enviar agora. Escreva para ' + DESTINO_PADRAO + '.',
      });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[pilares] erro no envio:', e);
    return res.status(500).json({
      ok: false,
      erro: 'Falha inesperada. Escreva para ' + DESTINO_PADRAO + '.',
    });
  }
}
