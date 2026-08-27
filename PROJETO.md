# Pilares Engenharia e Construções — projeto de site

- **Cliente:** Pilares Engenharia LTDA — construtora e incorporadora, Salvador (BA)
- **Slug:** `pilares` · **Repo:** `dev-buildv/pilares-site` (privado)
- **Drive:** https://drive.google.com/drive/folders/1yISMYB-iFyZtYk_73C4vo6u2F0wNvwMF
- **Iniciado:** 27/08/2026

## Checklist do pipeline

- [x] **1. Extrair do Drive** — rclone, 30 arquivos / 37 MB → `_raw/materiais/`
      ⚠️ As pastas `02. Criativos` e `03. Site e páginas` do Drive estão **vazias**.
- [x] **2. Organizar pastas** — `Marca/`, `Copys/`, `imagens/`, `.gitignore` seguro
- [ ] **2b. Repo GitHub** — `dev-buildv/pilares-site` privado
- [x] **3. Design system** — `design-system/` (tokens + doc + direção de estilo)
- [x] **4. Extrair copy** — `Copys/institucional.md` + `Copys/_discrepancias.md`
- [ ] **5. Front-end** — `Site/`
- [ ] **6. Ajustes finais** — imagens webp ✅ feito; auditoria de responsividade pendente
- [ ] **7. Tags e módulos** — LGPD sempre; GTM/Merlin só com IDs
- [ ] **8. Revisão humana** 🛑 gate
- [ ] **9. Deploy** 🛑 falta hospedagem + domínio

## Inventário do material

| Pasta | Conteúdo |
|---|---|
| `_raw/materiais/` | 30 arquivos originais do Drive (intocados) |
| `_raw/render/` | páginas dos PDFs rasterizadas + extração da logo |
| `Marca/logo/` | logo vetorial (SVG) + PNG alfa, em 2 versões + símbolo |
| `Marca/identidade/` | cartão de visita, apresentação institucional, lista de clientes |
| `Copys/` | copy oficial estruturada + registro de discrepâncias |
| `imagens/originais/` | 26 fotos (8 HEIC de câmera, até 4284×5712) |
| `imagens/tratadas/` | 34 webp em 2 larguras + `_manifest.json` |
| `design-system/` | `tokens.css`, `design-system.md`, `direcao-estilo.md` |

## Decisões registradas

1. **Fonte canônica da copy = apresentação institucional + cartão de visita.**
   A planilha "Aprofundamento" do Drive descreve outra praça e outra escala (SP Capital,
   15 anos, +100 projetos) e **contradiz** o material da própria marca (Salvador/BA, DDD 71,
   SINAPI-**BA**, +3 anos, +20 obras). Não foi usada. Ver `Copys/_discrepancias.md`.
2. **Nenhuma certificação publicada.** A planilha lista "Certificação X" e "NBR Y" —
   placeholders não preenchidos — além de ISO 9001 não confirmada. Ficaram fora.
3. **Paleta e tipografia da marca real.** Logo extraída como vetor do PDF do cartão: a cor
   dos paths é `#0A0B32`; acento `#5E4C9A`; fundo `#EBEBF4`. Serifada display porque o
   wordmark do cliente é serifado — não é o default vetado.
4. **WhatsApp real disponível** — `(71) 9 8397-9696`, confirmado em 2 fontes. Sem placeholder.
5. **Variação vs. ledger:** Confianto e Arkeon (2 projetos anteriores, mesmo setor) usaram
   hero fullbleed. Pilares usa **hero split (painel indigo + foto full-height)**, navbar
   clara sólida sem fase transparente, processo em **timeline vertical de 5 etapas**,
   portfólio em **mosaico com item em row-span**, movimento **"pilar que sobe"** (clip-path).
6. **Stack:** HTML + CSS + JS vanilla (padrão BuildV), sem framework.
