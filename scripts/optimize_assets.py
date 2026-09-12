"""Generate web-sized derivatives; keep original photography untouched."""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
mapping = {}
for folder in ('proyectos', 'inversores', 'baterias', 'paneles'):
    for path in (ROOT / 'assets/img' / folder).rglob('*'):
        if path.suffix.lower() not in ('.png', '.jpg', '.jpeg'):
            continue
        dest = path.with_suffix('.webp')
        with Image.open(path) as source:
            img = ImageOps.exif_transpose(source).convert('RGBA' if 'A' in source.getbands() else 'RGB')
            img.thumbnail((1440, 1080) if folder == 'proyectos' else (800, 800))
            img.save(dest, 'WEBP', quality=80, method=6)
        mapping['/' + path.relative_to(ROOT).as_posix()] = '/' + dest.relative_to(ROOT).as_posix()
for name in ('proyectos', 'sistemas'):
    path = ROOT / f'assets/data/{name}.json'
    content = path.read_text(encoding='utf-8')
    for old, new in mapping.items():
        content = content.replace(old, new)
    json.loads(content)
    path.write_text(content, encoding='utf-8')
with Image.open(ROOT / 'assets/img/proyectos/bani/1.jpg') as source:
    img = ImageOps.exif_transpose(source).convert('RGB')
    ImageOps.fit(img, (1440, 960)).save(ROOT / 'assets/img/hero-green.webp', quality=82)
    ImageOps.fit(img, (1200, 630)).save(ROOT / 'assets/img/og-cover.jpg', quality=85)
with Image.open(ROOT / 'assets/img/favicon.png') as source:
    ImageOps.pad(source.convert('RGB'), (180, 180), color='#01393a').save(ROOT / 'assets/img/apple-touch-icon.png')
print(f'Generated {len(mapping)} optimized derivatives and hero/social/icon assets.')
