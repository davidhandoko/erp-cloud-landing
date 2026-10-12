# Phase 3M-P — public landing synchronization readiness (Issue #40)

Preparation only; no source/destination PR merge, new public release, domain
configuration, lead collection, outreach, payment, VPS, or ERP deployment.

## Provenance and canonical authority

Resolved 2026-10-12:

- source main: `88750e1cc8940f9a818a71f8ab609e33ac401fda` (PR #39 merged);
- destination main: `621630225d8d7e59fcda880f39e6410f8c044051`;
- accepted branding head: `ee8a97828663a58f6c96cb77ff4f4ab07e08a12d`,
  previous CI `38227186365`, 334 PostgreSQL tests;
- contract: `https://github.com/davidhandoko/erp-cloud/issues/40`;
- canonical marketing content remains `erp-cloud/marketing/site/`.

The source companion PR contains the bounded Issue #40 copy/path/build fixes.
The destination PR is a staged build of that exact source feature head, not
an independently authored fork. Both need architect review. Before destination
merge/publication, approve and merge the source PR, resolve the resulting main,
and rebuild/compare its runtime manifest with the staged artifact. A mismatch
requires refreshing the destination PR and review, not automatic publication.

## Content audit and changes

| Area | Prepared behavior |
| --- | --- |
| Brand/title/metadata/illustrations | lowercase metabrain; Cloud ERP untuk Bisnis |
| Demo intro/footer | no Phase 3M-D or review-branch labels in UI; synthetic/backend/payment disclosure retained |
| Landing CTA | opens the available synthetic Cafe demo, never a nonexistent registration endpoint |
| Industry status | Cafe first; Retail guided workflow only, interactive Retail absent; Distributor/other industries roadmap/discovery |
| Mobile navigation | main links remain visible and wrap; no new runtime dependency |
| Privacy/form | disabled controls, no action/method/endpoint; production and lead gates remain separate |
| 404 | exact-hash-authorized inline recovery selects root or `/erp-cloud-landing/` for CSS/home navigation even at nested missing URLs |
| Business state | unchanged OPEN → PAID while OPEN → explicit CLOSED → receipt/final-sales → shift close |

`demo/cafe/app.js` and `fixtures.js` are unchanged from source main. No Django
domain, calculation, feature availability, or data collection was altered.

## Exact artifact and preservation policy

The builder produces 13 allowlisted runtime/configuration files plus
`SHA256SUMS`: root HTML/CSS/JS, two synthetic SVGs, the four Cafe demo files,
`.nojekyll`, and the unchanged `CNAME`. `README.md` is operator documentation
and deliberately excluded from runtime manifest. Unknown files or symlinks
abort packaging; `.env`, dumps, source maps, secrets and development assets are
not allowed.

The destination baseline has only the old 10 static files plus SHA256SUMS.
The existing destination README is preserved and augmented with preparation
evidence; no unrelated destination change is overwritten. Review docs,
screenshots, and validation scripts are separate from the runtime manifest.
They are public-safe repository evidence, never private ERP source/config/data.

Reproduce from the pinned source feature head (then from merged main before
publication):

```sh
python -m unittest discover -s marketing/tests -v
python marketing/scripts/build_pages.py --output /tmp/metabrain-pages-new
python marketing/scripts/verify_artifact.py /tmp/metabrain-pages-new
(cd /tmp/metabrain-pages-new && sha256sum --check SHA256SUMS)
node marketing/scripts/verify_pages.mjs /tmp/metabrain-pages-new /tmp/metabrain-browser-evidence
```

Use a new empty output directory. Playwright/Chrome are test tooling only.
Final source/destination commit SHAs, changed-file inventory, manifest digest,
CI run, and screenshots are recorded in the PR evidence package.

## DNS and Pages observations — read-only

Google Public DNS JSON resolver on 2026-10-12 returned:

| Query | Observed result |
| --- | --- |
| `metabrain.cloud NS` | `alec.ns.cloudflare.com`, `tricia.ns.cloudflare.com` |
| `erp.metabrain.cloud CNAME` | `davidhandoko.github.io` |
| `app.erp.metabrain.cloud A` | NXDOMAIN at observation time |

This proves the observed DNS delegation points to Cloudflare, rather than
inferring authority from registrar/provider names. The operator's account
ownership/access and a fresh direct-authoritative check remain pre-publication
gates. Do not change nameservers or parent-domain records. No wildcard is
proposed; `app.erp.metabrain.cloud` remains reserved and unconfigured.

The destination main retains `CNAME` = `erp.metabrain.cloud`; its latest existing
Pages build/deployment run `38161877352` is SUCCESS for `6216302…`. A read-only
HTTPS HEAD returned 200 from GitHub.com for the currently published old release.
This is not publication of the prepared artifact.

The GitHub connector rejected GET `/repos/davidhandoko/erp-cloud-landing/pages`
as an unsupported endpoint. Therefore current publishing branch/folder,
Enforce HTTPS switch, certificate provisioning status, and GitHub account
verified-domain state are **NOT VERIFIED** administratively. Historical docs
record main/root, but Owner must confirm current Settings → Pages before merge.

## Conditional owner publication and domain checklist

Only after independent architect PASS and separate Owner authorization:

1. Approve/merge canonical source fixes. Rebuild the exact merged source and
   compare all runtime hashes with the destination PR.
2. Confirm destination Settings → Pages uses Deploy from a branch, main/root,
   and does not publish the preparation branch. Record the current settings.
   A main merge is a publication-triggering action; review PASS alone does not
   authorize that merge.
3. Verify the owning GitHub account's domain status. If additional verification
   is needed, Owner must approve the exact GitHub-provided TXT record and
   authorized DNS account before any write. Do not invent a challenge value.
4. Freshly check authoritative NS/SOA and the exact `erp` CNAME. Conditional
   desired record: DNS-only `erp` → `davidhandoko.github.io`, with no repository
   path or protocol. Existing identical configuration needs no change. No
   root/parent, nameserver, wildcard, or `app.erp` change is authorized.
5. If needed and separately approved, set Pages custom domain to
   `erp.metabrain.cloud`, wait for DNS/certificate success, then enforce HTTPS.
   Preserve identical CNAME configuration and avoid mixed-content assets.
6. Owner authorizes destination merge/publication. Verify actual Pages success,
   HTTPS/certificate, homepage/privacy/nested 404/demo, mobile/keyboard, inert
   form, no unexpected requests, and fetch/hash every runtime manifest entry.
   Do not claim the new release live until that independent verification passes.

Official guidance reviewed 2026-10-12:

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

## Rollback and remaining risks

Before publication, rollback is simply leave both PRs unmerged; main, DNS, and
public site remain unchanged. Do not change the Pages publishing branch to
preview this PR.

After a separately authorized publication, a failure requires Owner-approved
revert of the destination release commit (including removal of newly added
demo files), restoring the previous complete artifact/manifest from
`621630225d8d7e59fcda880f39e6410f8c044051` while retaining unchanged CNAME.
Verify Pages success and old runtime hashes over HTTPS. Cache TTL can delay
visible rollback; record release/revert SHAs and verification time.

If a separately authorized domain change fails, restore only the recorded
previous `erp` DNS/Pages values. Do not alter root, nameservers, or reserved app
host. If retiring Pages completely, avoid leaving a dangling GitHub-directed
CNAME; removal needs separate DNS authorization and preserved verification.

Risks: source fixes remain unmerged pending review; Pages admin/verified-domain
state is inaccessible here; 404 recovery uses a CSP-hashed inline script with a
documented project-prefix assumption; no-JavaScript nested-404 navigation lacks
the prefix correction; hosting security logs may record visitor IPs; browser
accessibility checks cover basics only, not a formal WCAG audit. No production
or customer outcome is inferred from repository tests.
