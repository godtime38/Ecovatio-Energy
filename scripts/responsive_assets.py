"""Regenerate responsive photographs without rewriting HTML or source images."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
for path in (root/'assets/img/proyectos').rglob('*.webp'):
    if path.stem.endswith(('-thumb', '-medium')):
        continue
    with Image.open(path) as image:
        for suffix, size in [('thumb', (360, 240)), ('medium', (800, 600))]:
            img = image.copy()
            img.thumbnail(size)
            img.save(path.with_stem(path.stem+'-'+suffix), quality=76, method=6)
with Image.open(root/'assets/img/hero-green.webp') as image:
    ImageOps.fit(image, (768, 1152)).save(root/'assets/img/hero-mobile.webp', quality=73, method=6)
with Image.open(root/'assets/img/logo.png') as image:
    image.thumbnail((160,160))
    image.save(root/'assets/img/logo-small.webp', quality=85, method=6)

print('Responsive image derivatives generated.')
