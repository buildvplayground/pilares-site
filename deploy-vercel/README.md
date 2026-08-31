# deploy-vercel — pasta de publicação (Vercel)

⚠️ **Gerada automaticamente. Não edite aqui.**
A fonte é `Site/`. Para atualizar:

```bash
node _raw/build-deploy-vercel.js
```

## Como publicar

1. Importar o repositório `dev-buildv/pilares-site` na Vercel.
2. **Root Directory: `deploy-vercel`**
3. **Framework Preset: Other** (site estático, sem build step)
4. Build Command e Output Directory: deixar vazios.

Ou, na raiz da pasta: `vercel --prod`.

## O que muda em relação a Site/

| Item | Site/ (Hostinger, com PHP) | deploy-vercel/ |
|---|---|---|
| Backend do formulário | `php/enviar-cadastro.php` | `api/enviar-cadastro.js` (serverless) |
| Anexo (currículo/portfólio) | upload de até 5 MB | **não há** — a página pede por e-mail |
| Banco de dados | MySQL | nenhum; o cadastro chega por e-mail |
| Pasta `php/` | presente | removida |

## Variáveis de ambiente

Em *Project Settings > Environment Variables*:

| Variável | Obrigatória | Padrão |
|---|---|---|
| `RESEND_API_KEY` | **sim**, para o formulário enviar | — |
| `EMAIL_DESTINO` | não | contratos@pilaresengltda.com.br |
| `EMAIL_REMETENTE` | não | site@pilaresengltda.com.br (domínio precisa estar verificado no Resend) |

Sem `RESEND_API_KEY` a função responde com uma mensagem clara pedindo contato por
e-mail/WhatsApp — o site não quebra, só o envio automático fica indisponível.

## Já incluído no `vercel.json`

- `cleanUrls` (as URLs ficam `/privacidade` em vez de `/privacidade.html`)
- cabeçalhos de segurança (nosniff, X-Frame-Options, Referrer-Policy, HSTS, Permissions-Policy)
- cache imutável de 1 ano para `/assets/*` e 1 hora para CSS/JS
