"""Gera as pastas de deploy da LP de Projetos a partir de lp/projetos/.

    python scripts/build-lp-projetos.py

Saída (não edite à mão, rode de novo):
  deploy-lp-projetos/vercel/       -> Vercel, Root Directory = deploy-lp-projetos/vercel
  deploy-lp-projetos/public_html/  -> Hostinger/cPanel, enviar o CONTEÚDO para public_html/

A LP também é servida em /projetos pelo projeto Vercel das LPs (Root Directory = lp).
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'lp' / 'projetos'
OUT = ROOT / 'deploy-lp-projetos'
SITE = 'https://pilaresengltda.com.br'

VERCEL_JSON = {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "cleanUrls": True,
    "trailingSlash": False,
    "headers": [
        {"source": "/(.*)\\.(webp|jpg|jpeg|png|svg|woff2|woff|css|js)",
         "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]},
        {"source": "/(.*)",
         "headers": [{"key": "X-Content-Type-Options", "value": "nosniff"},
                     {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}]},
    ],
}

HTACCESS = """# Pilares · LP Projetos (Hostinger / Apache)
Options -Indexes
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  # Força HTTPS (desative se o domínio ainda não tiver SSL ativo)
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  # URL limpa: /privacidade -> privacidade.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.+?)/?$ $1.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
"""


def privacidade():
    """Política de Privacidade das LPs, com links que funcionam fora do projeto lp/."""
    html = (ROOT / 'lp' / 'privacidade.html').read_text(encoding='utf-8')
    html = re.sub(r'href="index\.html#[^"]*"', 'href="/"', html)
    html = html.replace('href="fornecedores.html"', f'href="{SITE}/fornecedores.html"')
    return html


def build(dest: Path, extra):
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(SRC, dest)
    (dest / 'privacidade.html').write_text(privacidade(), encoding='utf-8')
    for css in ('tokens.css', 'styles.css'):  # dependências da página de privacidade
        shutil.copy(ROOT / 'lp' / 'css' / css, dest / 'css' / css)
    extra(dest)


def vercel(d):
    (d / 'vercel.json').write_text(json.dumps(VERCEL_JSON, indent=2), encoding='utf-8')


def public_html(d):
    (d / '.htaccess').write_text(HTACCESS, encoding='utf-8')


if __name__ == '__main__':
    build(OUT / 'vercel', vercel)
    build(OUT / 'public_html', public_html)
    for d in ('vercel', 'public_html'):
        files = [p for p in (OUT / d).rglob('*') if p.is_file()]
        print(f'{d}: {len(files)} arquivos, {sum(p.stat().st_size for p in files) // 1024} KB')
