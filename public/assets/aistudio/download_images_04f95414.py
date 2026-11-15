"""Download remote images to the repo and return {url: local_relative_path}. Standard library only."""
import time, urllib.request, urllib.error, mimetypes
from pathlib import Path

UA = "Mozilla/5.0 (compatible; question-bank-ingest/1.0)"
MAGIC = [(b"\x89PNG", ".png"), (b"\xff\xd8\xff", ".jpg"), (b"GIF8", ".gif"), (b"RIFF", ".webp"), (b"<svg", ".svg"), (b"<?xml", ".svg")]

def guess_ext(data, ctype, url):
    for sig, ext in MAGIC:
        if data[:12].lstrip().startswith(sig): return ext
    ext = mimetypes.guess_extension((ctype or "").split(";")[0].strip()) if ctype else None
    return ext or Path(url.split("?")[0]).suffix or ".bin"

def fetch(url, retries=3, timeout=30):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*,*/*"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data, ctype = r.read(), r.headers.get("Content-Type", "")
            if not data: raise ValueError("empty body")
            return data, ctype, None
        except Exception as e:                      # keep going, record the reason
            last = f"{type(e).__name__}: {e}"; time.sleep(1.5 * (i + 1))
    return None, None, last

def download_all(jobs, dest_dir, rel_prefix, pause=0.3):
    """jobs: list of (url, wanted_basename_without_ext). Same URL is stored once.
    Returns {url: {"status": "ok"|"failed", "local": "rel/path" , "bytes": n, "error": str}}"""
    dest_dir = Path(dest_dir); dest_dir.mkdir(parents=True, exist_ok=True)
    out = {}
    for url, base in jobs:
        if url in out: continue
        existing = next(iter(dest_dir.glob(base + ".*")), None)   # resume support
        if existing:
            out[url] = {"status": "ok", "local": f"{rel_prefix}/{existing.name}", "bytes": existing.stat().st_size, "reused": True}; continue
        data, ctype, err = fetch(url)
        if data is None:
            out[url] = {"status": "failed", "local": None, "error": err}; continue
        f = dest_dir / (base + guess_ext(data, ctype, url))
        f.write_bytes(data)
        out[url] = {"status": "ok", "local": f"{rel_prefix}/{f.name}", "bytes": len(data), "contentType": ctype}
        time.sleep(pause)
    return out
