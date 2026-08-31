# Backend PHP — Fornecedores e Trabalhe Conosco

Só é necessário em hospedagem **com PHP** (Hostinger, cPanel, WordPress).
Em hospedagem estática (Vercel) o formulário precisa de outro destino — ver o fim deste arquivo.

## Instalação (3 passos)

1. **Banco:** rode `schema.sql` no MySQL (phpMyAdmin → aba SQL). Cria a tabela `cadastros`.
2. **Credenciais:** copie `db-config.example.php` para `db-config.php` **no servidor** e
   preencha host, nome do banco, usuário e senha.
   `db-config.php` está no `.gitignore` — nunca suba credenciais para o repositório.
3. **Pasta de anexos:** o script cria `uploads-cadastros/` **um nível acima da raiz pública**
   (fora de `public_html/`). Confirme que o PHP tem permissão de escrita ali.
   Se sua hospedagem não permitir, mude `$destinoDir` em `enviar-cadastro.php`
   para uma pasta dentro da raiz **com `.htaccess` negando acesso direto**.

## Como se comporta

- Sem `db-config.php`, o script **não quebra**: valida, salva o anexo e envia o e-mail de
  aviso. Só falha (500) se nem o banco nem o e-mail funcionarem — e aí registra no log.
- Sem JavaScript, o formulário envia por POST normal e volta para
  `fornecedores.html?envio=ok|erro`.
- Com JavaScript, envia por `fetch` e responde JSON, sem recarregar a página.

## Proteções já implementadas

| Risco | Proteção |
|---|---|
| SQL injection | `PDO` com prepared statements e `EMULATE_PREPARES=false` |
| Upload malicioso | extensão + **MIME real** (`finfo`), limite de 5 MB, nome gerado, pasta fora da raiz |
| Robôs | campo honeypot `site_web` (responde "ok" e descarta) |
| Injeção em cabeçalho de e-mail | `\r` e `\n` removidos do Reply-To |
| Prova de consentimento (LGPD) | grava `consentimento`, `consentimento_em`, `ip` e `user_agent` |

## Se a hospedagem for Vercel (estática, sem PHP)

`enviar-cadastro.php` não roda. Escolha uma das opções:

1. **Serverless function** — portar a lógica para `api/enviar-cadastro.js` (Vercel Functions).
2. **Serviço de formulário** — apontar o `action` para Formspree/Basin e manter a validação do JS.
3. **Só WhatsApp/e-mail** — trocar o formulário por botões de contato (a home já é assim).

Definir isso depende da hospedagem escolhida, que ainda é uma pendência do projeto.
