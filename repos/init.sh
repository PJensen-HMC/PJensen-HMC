#!/usr/bin/env bash
# repos/init.sh — clone or pull all repos; set HMC NuGet credentials
# Standalone: can run independently of ~/init.sh
# Prereq: ~/.claude/.secrets must exist (run ~/init.sh on first boot)

set -euo pipefail

SECRETS_FILE="$HOME/.claude/.secrets"
REPOS_FILE="$HOME/repos.list"
REPOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$SECRETS_FILE" ]; then
  echo "ERROR: $SECRETS_FILE not found — run ~/init.sh first to create it"
  exit 1
fi

# shellcheck source=../.claude/.secrets
source "$SECRETS_FILE"

# ---------------------------------------------------------------------------
# 1. NuGet credentials (HMCgitNuget private feed)
# ---------------------------------------------------------------------------
echo ">>> NuGet: HMCgitNuget"
dotnet nuget update source HMCgitNuget \
  --username "$ADO_USER" \
  --password "$ADO_PAT" \
  --store-password-in-clear-text 2>&1 | grep -v "^$"

# ---------------------------------------------------------------------------
# 2. Clone / pull repos
# ---------------------------------------------------------------------------
echo ">>> Repos"

while IFS= read -r url; do
  [[ -z "$url" || "$url" == \#* ]] && continue

  name="${url##*/}"   # last path segment = repo name
  dest="$REPOS_DIR/$name"

  # inject PAT for ADO; GitHub repos are public (no PAT needed)
  if [[ "$url" == *"dev.azure.com"* ]]; then
    auth_url="https://${ADO_PAT}@${url#https://}"
  else
    auth_url="$url"
  fi

  if [ -d "$dest/.git" ]; then
    echo "    pull  $name"
    git -C "$dest" pull --ff-only 2>&1 | tail -1
  else
    echo "    clone $name"
    git clone "$auth_url" "$dest"
  fi

done < "$REPOS_FILE"

echo ""
echo "Done."
