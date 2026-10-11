# Phase 3M-L landing-page launch artifact

This is a self-contained, review-only static site. It has no active form
endpoint, analytics, cookies, browser persistence, external runtime assets or
network call. It must not be published until the independent architect accepts
the repository work and the owner separately authorizes public publication.

Preview locally:

~~~sh
python -m http.server 8080 --directory marketing/site
~~~

Then open `http://127.0.0.1:8080`. Local preview is not a production
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

The recommended free target is a separate public deploy-only repository,
`davidhandoko/erp-cloud-landing`, at
`https://davidhandoko.github.io/erp-cloud-landing/`. Never make the private
application repository public and never copy Django source, configuration,
secrets, dumps or customer data into the deploy repository.

Publication and lead collection are distinct gates. The first approved public
release keeps the form disabled. Form activation additionally requires an
approved controller/contact, privacy notice, processor, retention/deletion
procedure, named operator, test deletion, and explicit owner authorization.
See `docs/marketing/phase-3m-l-launch-readiness.md` for the exact checklist.
