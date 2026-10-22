"""
Ninzard wiki: makes the smaller copies of every picture, automatically, each time Cloudflare
publishes the site.

Cloudflare runs this file before every deploy (Settings → Builds → Build command:
python3 build_images.py). It looks through the whole site for pictures (.jpg, .jpeg, .png,
.webp), and for each one writes three smaller copies with the same file name:

    Images/160/Portrait_Poka.jpg    160 pixels wide   (name icons, talk rooms, the codes page)
    Images/320/Portrait_Poka.jpg    320 pixels wide   (the gallery, hover previews)
    Images/640/Portrait_Poka.jpg    640 pixels wide   (infoboxes)

wiki.js and elections.js load these copies instead of the full-size photo. So only the
original ever needs uploading to GitHub; the copies are made fresh on every deploy and never
need to be in the repository.

This file never stops the site from publishing. If a picture can't be read, it is skipped
(that picture then loads at full size), and the rest of the deploy carries on.
"""
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = 'Images'                      # the copies go in Images/160, Images/320 and Images/640
WIDTHS = {160: 84, 320: 82, 640: 80}  # width in pixels: JPEG quality
PICTURE = ('.jpg', '.jpeg', '.png', '.webp')
SKIP_DIRS = {'.git', '.github', 'node_modules', '__pycache__'}


def say(*a):
    print('[images]', *a, flush=True)


def get_pillow():
    """Pillow does the resizing. Cloudflare's build machine has Python but not Pillow, so install it."""
    try:
        from PIL import Image, ImageOps  # noqa: F401
        return True
    except ImportError:
        pass
    for extra in ([], ['--break-system-packages'], ['--user']):
        cmd = [sys.executable, '-m', 'pip', 'install', '--quiet', '--disable-pip-version-check'] + extra + ['Pillow']
        if subprocess.call(cmd) == 0:
            import importlib
            import site
            importlib.invalidate_caches()
            try:
                sys.path.append(site.getusersitepackages())
            except Exception:
                pass
            try:
                from PIL import Image, ImageOps  # noqa: F401
                return True
            except ImportError:
                continue
    return False


def originals():
    """Every picture in the site, except the copies themselves."""
    copy_dirs = {os.path.join(ROOT, OUT, str(w)) for w in WIDTHS}
    found = {}
    for here, dirs, files in os.walk(ROOT):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS and os.path.join(here, d) not in copy_dirs)
        for f in sorted(files):
            if not f.lower().endswith(PICTURE):
                continue
            path = os.path.join(here, f)
            if f in found:
                say('two pictures share the name', f, '- using', os.path.relpath(found[f], ROOT))
                continue
            found[f] = path
    return found


def shrink(name, path):
    from PIL import Image, ImageOps
    big = max(WIDTHS)
    with Image.open(path) as im:
        fmt = (im.format or '').upper()
        if fmt == 'JPEG':
            # decode at a reduced scale straight away: much faster, and still at least twice the largest copy
            im.draft('RGB', (big * 2, big * 2))
        im = ImageOps.exif_transpose(im)
        icc = im.info.get('icc_profile')
        keep_alpha = fmt != 'JPEG' and (im.mode in ('RGBA', 'LA') or 'transparency' in im.info)
        im = im.convert('RGBA' if keep_alpha else 'RGB')
        for w, q in sorted(WIDTHS.items(), reverse=True):
            if im.width > w:
                copy = im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)
            else:
                copy = im  # never enlarge a small picture
            folder = os.path.join(ROOT, OUT, str(w))
            os.makedirs(folder, exist_ok=True)
            dest = os.path.join(folder, name)
            extra = {'icc_profile': icc} if icc else {}
            ext = name.lower().rsplit('.', 1)[-1]
            if ext in ('jpg', 'jpeg'):
                copy.save(dest, 'JPEG', quality=q, optimize=True, progressive=w >= 320, **extra)
            elif ext == 'webp':
                copy.save(dest, 'WEBP', quality=q, method=4, **extra)
            else:
                copy.save(dest, 'PNG', optimize=True, **extra)


def main():
    start = time.time()
    if not get_pillow():
        say('could not install Pillow; no copies made this time (pictures load at full size)')
        return
    pics = originals()
    done = failed = 0
    for name, path in pics.items():
        try:
            shrink(name, path)
            done += 1
        except Exception as e:  # a broken picture must never stop the deploy
            failed += 1
            say('skipped', os.path.relpath(path, ROOT), '-', type(e).__name__, e)
    say(f'{done} pictures, {done * len(WIDTHS)} copies in {OUT}/' + '/'.join(map(str, WIDTHS))
        + (f', {failed} skipped' if failed else '') + f' ({time.time() - start:.1f} s)')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        say('stopped early:', type(e).__name__, e)
    sys.exit(0)
