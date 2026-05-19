#!/usr/bin/env python3
"""Generate placeholder PWA icons for EverDream."""
import struct
import zlib
import os

def create_png(w, h, r, g, b):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    raw = b''
    for y in range(h):
        raw += b'\x00' + bytes([r, g, b]) * w
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

icons_dir = os.path.join(os.path.dirname(__file__), 'public', 'icons')
os.makedirs(icons_dir, exist_ok=True)

for size in [72, 96, 128, 144, 152, 192, 384, 512]:
    png = create_png(size, size, 94, 196, 168)
    path = os.path.join(icons_dir, f'icon-{size}.png')
    with open(path, 'wb') as f:
        f.write(png)
    print(f'Created {path} ({size}x{size})')

# Also create record shortcut icon
png = create_png(96, 96, 139, 92, 246)
path = os.path.join(icons_dir, 'record-96.png')
with open(path, 'wb') as f:
    f.write(png)
print(f'Created {path}')

print('Done!')
