#!/usr/bin/env bash
# SRS-028 / SRS-031: deploys the verified dist/ with the pinned local wrangler, gated by the live check.
# First run (no existing Worker): wrangler deploy -> live-check workers.dev -> fail red.
# Later runs: versions upload -> live-check preview URL -> versions deploy @100% -> live-check prod -> rollback + fail red.
set -euo pipefail
W="npx --no-install wrangler"
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "::error::CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID not set in the production environment."; exit 1
fi
# First-deploy path only on Cloudflare's explicit "Worker does not exist" (API code 10007); any other error fails red.
if $W deployments list > deployments.txt 2>&1; then EXISTS=1
elif grep -qE '\[code: 10007\]|This Worker does not exist' deployments.txt; then EXISTS=0
else cat deployments.txt; echo "::error::could not determine whether the Worker exists (auth/network/other error)"; exit 1; fi
echo "Worker exists: $EXISTS"
# PREVIOUS_HASH (production check only; the preview check gets none, so any mismatch there fails at once): sha256 of the HTML currently live at / (empty if not serving), so the live check may
# retry while the old version is still propagating, and fail on any other unexpected HTML.
PREVIOUS_HASH=""
if [ "$EXISTS" = 1 ] && [ -n "${LIVE_URL:-}" ]; then
  if curl -sf --max-time 10 -o prev.html "$LIVE_URL/"; then PREVIOUS_HASH=$(sha256sum prev.html | cut -d' ' -f1); fi
fi
export PREVIOUS_HASH
echo "PREVIOUS_HASH=${PREVIOUS_HASH:-<none>}"
if [ "$EXISTS" = 0 ]; then
  $W deploy 2>&1 | tee deploy-output.txt
  URL=$(grep -oE 'https://thomas-meltesen-site\.[a-z0-9-]+\.workers\.dev' deploy-output.txt | head -1)
  [ -n "$URL" ] || { echo "::error::could not find workers.dev URL in wrangler output"; exit 1; }
  echo "url=$URL" >> "$GITHUB_OUTPUT"
  if ! npm run live-check -- "$URL"; then
    echo "::error::live check failed on first deploy; no previous version exists, so nothing to roll back to."; exit 1
  fi
  exit 0
fi
$W versions upload 2>&1 | tee upload-output.txt
VID=$(grep -oiE 'Worker Version ID: *[0-9a-f-]{36}' upload-output.txt | grep -oE '[0-9a-f-]{36}$')
PREVIEW=$(grep -oE 'https://[a-z0-9-]+-thomas-meltesen-site\.[a-z0-9-]+\.workers\.dev' upload-output.txt | head -1)
[ -n "$VID" ] && [ -n "$PREVIEW" ] || { echo "::error::could not parse version id / preview URL"; exit 1; }
echo "Version $VID preview $PREVIEW"
PREVIOUS_HASH="" npm run live-check -- "$PREVIEW" || { echo "::error::live check failed on preview; production untouched."; exit 1; }
$W versions deploy "$VID@100%" -y 2>&1 | tee promote-output.txt
URL="https://thomas-meltesen-site.$(echo "$PREVIEW" | sed -E 's#https://[a-z0-9-]+-thomas-meltesen-site\.##')"
echo "url=$URL" >> "$GITHUB_OUTPUT"
if ! npm run live-check -- "$URL"; then
  echo "::error::live check failed on production; rolling back."
  $W rollback --message "live-check failed for $VID" -y || true
  exit 1
fi
