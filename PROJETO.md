# Pilares Engenharia e Construções — projeto de site

- **Cliente:** Pilares Engenharia LTDA, construtora e incorporadora em Salvador (BA)
- **Slug:** `pilares` · **Repo:** [dev-buildv/pilares-site](https://github.com/dev-buildv/pilares-site) (privado)
- **Drive:** https://drive.google.com/drive/folders/1yISMYB-iFyZtYk_73C4vo6u2F0wNvwMF
- **Stack:** HTML estático + CSS + JS vanilla (padrão BuildV), PHP só no backend do formulário
- **Iniciado:** 27/08/2026 · **Atualizado:** 31/08/2026

## Checklist do pipeline

- [x] **1. Extrair do Drive** — rclone, 30 arquivos / 37 MB → `_raw/materiais/`
      ⚠️ As pastas `02. Criativos` e `03. Site e páginas` do Drive estão **vazias**.
- [x] **2. Organizar pastas** — `Marca/`, `Copys/`, `imagens/`, `.gitignore` seguro
- [x] **2b. Repo GitHub** — `dev-buildv/pilares-site` privado, versionando só o entregável
- [x] **3. Design system** — `design-system/` (tokens + doc + direção de estilo)
- [x] **4. Extrair copy** — `Copys/institucional.md` + `Copys/_discrepancias.md`
- [x] **5. Front-end** — `Site/` (3 páginas)
- [x] **6. Ajustes finais** — imagens webp + auditoria por medição (overflow, WCAG)
- [x] **7. Tags e módulos** — LGPD completo; GTM/Merlin pulados (sem IDs)
- [ ] **8. Revisão humana** 🛑 gate — preview em http://localhost:8795/
- [ ] **9. Deploy** 🛑 `deploy-vercel/` pronta; falta importar na Vercel, domínio e `RESEND_API_KEY`

## O que foi entregue

| Arquivo | O que é |
|---|---|
| `Site/index.html` | página única institucional (13 seções) |
| `Site/privacidade.html` | Política de Privacidade LGPD |
| `Site/fornecedores.html` | Fornecedores e Trabalhe Conosco (com formulário) |
| `Site/css/tokens.css` | tokens derivados da marca real |
| `Site/css/styles.css` | folha única compartilhada pelas 3 páginas |
| `Site/js/app.js` | motor de movimento, lightbox, menu, cookies, contadores |
| `Site/js/form.js` | validação do formulário no cliente |
| `Site/php/` | backend do formulário + schema SQL + README de instalação |
| `Site/assets/img/` | 34 webp (2 larguras) + logo em 2 versões + símbolo |
| `.github/workflows/` | deploy por FTP para Hostinger (alternativa, aguardando segredos) |
| `deploy-vercel/` | **pasta de publicação na Vercel** — gerada por `node _raw/build-deploy-vercel.js` |

## Fluxo de seções da home

hero (foto full-bleed) → números → sobre (split, imagem sangrando) → faixa de imagem →
frentes de atuação (zigzag, imagens sangrando) → processo (banda escura) → obras (mosaico
com lightbox) → obra em destaque → depoimento → clientes → faixa de imagem → CTA (banda
escura + foto com corte diagonal + timeline de 3 passos) → rodapé

Botão flutuante de WhatsApp nas 3 páginas: aparece depois do hero, sai da ordem de
tabulação enquanto invisível, some com lightbox/menu aberto e sobe quando a barra de
cookies está na tela.

Nenhuma seção adjacente repete o mesmo tipo de layout, e há imagem real a cada 2-3 seções.

## Decisões registradas

1. **Fonte canônica da copy = apresentação institucional + cartão de visita.**
   A planilha "Aprofundamento" do Drive descreve outra praça e outra escala (SP Capital,
   15 anos, +100 projetos) e **contradiz** o material da própria marca (Salvador/BA, DDD 71,
   SINAPI-**BA**, +3 anos, +20 obras). Não foi usada. Ver `Copys/_discrepancias.md`.
2. **Nenhuma certificação publicada.** A planilha lista "Certificação X" e "NBR Y" —
   placeholders não preenchidos — além de ISO 9001 não confirmada. Ficaram fora.
3. **Paleta e tipografia da marca real.** A logo foi extraída como **vetor** do PDF do
   cartão: a cor dos 190 paths é `#0A0B32`; acento `#5E4C9A`; fundo `#EBEBF4`. Serifada de
   display porque o wordmark do cliente é serifado — não é o default vetado pelo guard rail.
4. **WhatsApp real disponível** — `(71) 9 8397-9696`, confirmado em 2 fontes. Sem placeholder.
5. **Sem travessão na copy** (pedido do cliente): reescrito com vírgula, dois-pontos,
   ponto ou parênteses, nunca trocando um símbolo por outro.
6. **Sem pseudoelemento decorativo nos rótulos** (`.eyebrow` sem `::before`): o peso vem
   do tracking e da cor.
7. **Imagens em largura total** (pedido do cliente): hero full-bleed com véu, e nas seções
   a figura sangra até a borda da tela enquanto a coluna de texto continua alinhada ao
   container do header. A sangria usa `padding` na coluna de texto, nunca margem negativa
   com `vw` — assim a barra de rolagem não vira overflow.
8. **Stack:** HTML + CSS + JS vanilla, sem framework e sem dependência externa de JS.
9. **Botão de WhatsApp:** o contêiner é da marca e só o **glifo** usa o verde real
   (`#25D366`). Texto branco sobre o verde puro dá 1.98:1 e reprovaria AA; o glifo sobre
   o ink dá 9.57:1 e preserva o reconhecimento do canal (guard rail do `design-bank`).
10. **Deploy na Vercel:** `deploy-vercel/` é **sempre gerada** por
   `node _raw/build-deploy-vercel.js`, nunca editada à mão — `Site/` continua sendo a
   fonte única. Na variante da Vercel o backend PHP sai e entra uma serverless function;
   o campo de anexo sai (upload exigiria dependência externa) e a página pede por e-mail.

## Como rodar o preview

```bash
PORT=8795 node _raw/preview-server.js     # registra image/webp explicitamente
# depois: http://localhost:8795/
```

## Ferramentas de auditoria (em `_raw/`)

Escritas para este projeto, dirigem o Chrome por CDP (Node puro, sem dependências):

| Script | Mede |
|---|---|
| `audit.js` + `audit-page.js` | overflow horizontal, contraste, alt, nome acessível, alvos de toque, headings, requisitos BuildV, interação (menu, lightbox, cookies, contadores), reduced-motion |
| `linhas-page.js` | quebras de linha reais palavra por palavra: viúvas, quebra pós-vírgula, unidade separada do número, medida de leitura |
| `pixel-fundo.js` | contraste de texto sobre foto por **pixel real** (duas capturas: com e sem o texto) |
| `wcag-extra.js` | WCAG 1.4.12 (espaçamento de texto), 1.4.4 (zoom 200%/400%), ordem de foco |
| `proc-check.js` | verifica o scrub do processo com scroll real |

⚠️ Todas medem no **estado assentado** (transições desligadas): ler `getComputedStyle`
no mesmo frame em que a classe de reveal entra devolve o valor **inicial** da transição —
foi a origem de vários falsos positivos durante o build.
