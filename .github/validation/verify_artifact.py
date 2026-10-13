"""Verify the public static artifact. No network and no publishing."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import base64
import hashlib
import re
import sys

APPROVED = {
    '.nojekyll', 'CNAME', '404.html', 'index.html', 'privacy.html', 'styles.css',
    'app.js', 'assets/demo-kitchen.svg', 'assets/demo-owner.svg',
    'demo/cafe/index.html', 'demo/cafe/styles.css', 'demo/cafe/app.js',
    'demo/cafe/fixtures.js',
}

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'form':
            assert attrs.get('data-state') == 'inactive' and not attrs.get('action')
            assert not attrs.get('method')
        if tag in {'input', 'select', 'textarea'} or (tag == 'button' and attrs.get('type') == 'submit'):
            assert 'disabled' in attrs
        for attr in ('src', 'href', 'action'):
            if attrs.get(attr):
                self.links.append(attrs[attr])

def verify(root):
    root = Path(root).resolve()
    manifest = {}
    for line in (root / 'SHA256SUMS').read_text().splitlines():
        digest, name = line.split('  ', 1)
        assert name in APPROVED and name not in manifest, name
        assert hashlib.sha256((root / name).read_bytes()).hexdigest() == digest, name
        manifest[name] = digest
    assert set(manifest) == APPROVED
    # Review documentation and validation machinery may exist outside this
    # deployable set; they are never treated as runtime artifact entries.
    public_files = {p.relative_to(root).as_posix() for p in root.rglob('*')
                    if p.is_file() and not any(part in {'.git', '.github', '_review'} for part in p.relative_to(root).parts)}
    assert public_files <= APPROVED | {'SHA256SUMS', 'README.md'}, public_files - APPROVED
    for p in root.rglob('*'):
        if '.git' not in p.parts:
            assert not p.is_symlink(), p
            if p.is_file():
                assert p.name not in {'.env', '.DS_Store'}, p
                assert p.suffix.lower() not in {'.dump', '.sql', '.map', '.pem', '.key', '.pyc'}, p
                assert not p.name.startswith('.env.'), p
    for name in APPROVED:
        p = root / name
        text = p.read_text()
        assert not re.search(r'github_pat_|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY|AKIA[0-9A-Z]{16}', text)
        if p.suffix in {'.js', '.html'}:
            assert not re.search(r'\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(|localStorage|sessionStorage|document\.cookie|indexedDB', text)
        if p.suffix != '.html':
            continue
        assert "connect-src 'none'" in text and "form-action 'none'" in text
        assert 'metabrain' in text and 'ERP Cloud' not in text
        assert not re.search(r'(?i)phase\s+3m|review artifact|artefak review', text)
        for script in re.findall(r'<script>(.*?)</script>', text, re.S):
            digest = base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
            assert f"script-src 'sha256-{digest}'" in text
        parser = PageParser()
        parser.feed(text)
        for link in parser.links:
            parsed = urlparse(link)
            assert not parsed.scheme and not link.startswith('//'), link
            if not parsed.path:
                assert f'id="{parsed.fragment}"' in text, link
                continue
            target = (p.parent / parsed.path).resolve()
            assert target.is_relative_to(root), link
            if target.is_dir():
                target /= 'index.html'
            assert target.is_file(), link
            if parsed.fragment:
                assert f'id="{parsed.fragment}"' in target.read_text(), link
    print(f'PASS: {len(APPROVED)} allowlisted static files, checksums, links, branding, CSP, inert form, no network/storage/secrets')

if __name__ == '__main__':
    verify(sys.argv[1])
