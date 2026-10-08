"""Bundle the site into one self-contained HTML file (dist/untied.html) for previewing/publishing."""
import base64, json, re, pathlib
root = pathlib.Path(__file__).parent

def uri(rel, mime):
    return f'data:{mime};base64,' + base64.b64encode((root / rel).read_bytes()).decode()

html = (root / 'index.html').read_text()
css = (root / 'assets/css/style.css').read_text()
for rel, mime in [('fonts/dune-rise.woff2', 'font/woff2'), ('img/wordmark-clean.png', 'image/png'), ('img/symbol.png', 'image/png'), ('img/cursor-star.png', 'image/png')]:
    css = css.replace(f'url("../{rel}")', f'url("{uri("assets/" + rel, mime)}")')
assert '../' not in css, 'unbundled asset left in CSS'
assets = {k: uri(f'assets/img/{f}', 'image/png') for k, f in [('symbol', 'symbol.png'), ('wordmark', 'wordmark-clean.png'), ('comet', 'halftone-comet.png')]}
products = json.loads((root / 'data/products.json').read_text())
for prod in products['products'] + products.get('packs', []):
    for key in ('image', 'imageDetail'):
        if prod.get(key):
            prod[key] = uri(prod[key], 'image/webp' if prod[key].endswith('.webp') else 'image/jpeg' if prod[key].endswith('.jpg') else 'image/png')
for k, rel in products.get('ways', {}).items():
    products['ways'][k] = uri(rel, 'image/webp' if rel.endswith('.webp') else 'image/jpeg' if rel.endswith('.jpg') else 'image/png')
data = json.dumps(products, separators=(',', ':'))
js = '\n'.join((root / f'assets/js/{n}.js').read_text() for n in ('patterns', 'halftone', 'app'))
body = html.split('<!--BODY-->')[1].split('<!--/BODY-->')[0]
fonts = re.search(r'<link rel="stylesheet" href="(https://fonts[^"]+)">', html).group(1)
out = f'''<title>Untied</title>
<link rel="stylesheet" href="{fonts}">
<style>
{css}
</style>
{body}
<script type="application/json" id="product-data">{data}</script>
<script>window.UNTIED_ASSETS={json.dumps(assets)};</script>
<script>
{js}
</script>
'''
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/untied.html').write_text(out)
print('wrote dist/untied.html', len(out) // 1024, 'KB')
