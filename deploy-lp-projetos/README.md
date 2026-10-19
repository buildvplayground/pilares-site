# deploy-lp-projetos: LP da frente de Projetos

Gerada automaticamente. **Não edite aqui.** A fonte é `lp/projetos/`. Para atualizar, rode:

```bash
python scripts/build-lp-projetos.py
```

| Pasta | Destino | Como publicar |
|---|---|---|
| `vercel/` | Vercel | Importar o repo e definir **Root Directory = `deploy-lp-projetos/vercel`**, com Framework Preset **Other** e sem build. Também dá para rodar `vercel --prod` dentro da pasta. |
| `public_html/` | Hostinger / cPanel | Enviar o **conteúdo** da pasta (inclusive o `.htaccess` oculto) para `public_html/` ou para um subdomínio. |

A mesma LP também sai em `/projetos` no projeto Vercel das LPs atuais (Root Directory = `lp`),
sem mexer nas LPs de obras e reformas.

Tags: GTM `GTM-KZRTTKDV` e o popup Merlin das LPs atuais. Todo CTA abre o Merlin.
O consentimento de cookies envia o evento `consentimento_cookies` ao dataLayer.
