# metabrain — static landing synchronization preparation

This repository is the public deploy-only destination. Canonical content and
the reproducible builder live in `davidhandoko/erp-cloud/marketing/site/` and
`marketing/scripts/build_pages.py`. The historical instructions below apply
to that source repository, not this root.

Issue #40 prepares this feature branch only. Do not merge it or change the
Pages source branch: a main merge may publish automatically. Source/main and
destination/main were resolved as `88750e1cc8940f9a818a71f8ab609e33ac401fda`
and `621630225d8d7e59fcda880f39e6410f8c044051` respectively.

The artifact contains metabrain branding and the synthetic Cafe/Resto demo;
Retail interactive demo remains unavailable. No form, lead intake, analytics,
tracking, browser storage, gateway, or ERP backend is enabled. CNAME is retained
unchanged as `erp.metabrain.cloud`; no Pages or DNS setting was changed.

Read [_review/READINESS.md](_review/READINESS.md) for source dependencies,
domain observations, authorization gates, and rollback. Runtime hashes are in
`SHA256SUMS`; operator documentation and review/validation files are excluded
from that runtime manifest. This README preserves the prior operator notes
below as historical release context.

Validate locally:

```sh
sha256sum --check SHA256SUMS
python .github/validation/verify_artifact.py .
```

The PR-only workflow has read-only repository permission, runs browser/path
checks and uploads evidence. It contains no Pages deployment action.

## Historical Phase 3M-L operator notes (preserved)

This is the canonical source for the public static Early Access landing page at
`https://erp.metabrain.cloud/`. It has no active form endpoint, analytics,
cookies, browser persistence, external runtime assets or network call. Product
registration, payment, lead collection and outreach remain inactive.

Preview locally:

~~~sh
python -m http.server 8080 --directory marketing/site
~~~

Then open `http://127.0.0.1:8080`. Local preview is not an ERP production
deployment. All depicted names, users, figures and transactions are synthetic.

Run the static contract:

~~~sh
python -m unittest discover -s marketing/tests -v
~~~

Build a checksum-pinned, non-published Pages artifact:

~~~sh
pages_dir="$(mktemp -d)/erp-cloud-pages"
python marketing/scripts/build_pages.py --output "$pages_dir"
(cd "$pages_dir" && sha256sum --check SHA256SUMS)
~~~

The deployment target is the separate public deploy-only repository
`davidhandoko/erp-cloud-landing`, published by GitHub Pages from `main`/root
with custom domain `https://erp.metabrain.cloud/`. Never make the private
application repository public and never copy Django source, configuration,
secrets, dumps or customer data into the deploy repository.

Publication and lead collection remain distinct gates. The public static
release keeps the form disabled. Form activation additionally requires an
approved controller/contact, privacy notice, processor, retention/deletion
procedure, named operator, test deletion, and explicit owner authorization.
See `docs/marketing/phase-3m-l-launch-readiness.md` for the exact checklist.
