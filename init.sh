#!/usr/bin/env bash
# init.sh — bootstrap a dev session on a fresh machine
# Run after: git init ~/ && git remote add origin <url> && git pull origin main

SECRETS_FILE="$HOME/.claude/.secrets"
REPOS_FILE="$HOME/repos.list"

# ---------------------------------------------------------------------------
# 1. Secrets — prompt on first run, source on subsequent runs
# ---------------------------------------------------------------------------
if [ ! -f "$SECRETS_FILE" ]; then
  echo "=== First run: creating .secrets ==="
  read -p  "ADO user email:  " ADO_USER
  read -sp "ADO PAT:         " ADO_PAT;  echo
  read -sp "GitHub PAT:      " GH_PAT;   echo

  cat > "$SECRETS_FILE" <<EOF
ADO_USER="$ADO_USER"
ADO_PAT="$ADO_PAT"
GH_PAT="$GH_PAT"
EOF
  chmod 600 "$SECRETS_FILE"
  echo ".secrets created."
  echo ""
fi

# shellcheck source=.secrets
source "$SECRETS_FILE"

ADO_BASE="dev.azure.com/HarvMgmt/HMCgit/_git"

# ---------------------------------------------------------------------------
# 2. Git identity
# ---------------------------------------------------------------------------
echo ">>> Git identity"
git config --global user.email "$ADO_USER"
git config --global user.name "Jensen, Pete"

# ---------------------------------------------------------------------------
# 3. NuGet credentials (Azure DevOps feed)
# ---------------------------------------------------------------------------
echo ">>> NuGet credentials"
dotnet nuget update source HMCgitNuget \
  --username "$ADO_USER" \
  --password "$ADO_PAT" \
  --store-password-in-clear-text 2>&1 | grep -v "^$"

# ---------------------------------------------------------------------------
# 4. Fix ADO remote URLs with PAT (so git push works without interactive auth)
# ---------------------------------------------------------------------------
echo ">>> Patching ADO remote URLs"
ADO_REPOS=(Shared CoreServices Crimson.Legacy)
for repo_name in "${ADO_REPOS[@]}"; do
  repo_path="$HOME/$repo_name"
  if [ -d "$repo_path/.git" ]; then
    git -C "$repo_path" remote set-url origin "https://${ADO_PAT}@${ADO_BASE}/${repo_name}"
    echo "    $repo_name -> OK"
  else
    echo "    SKIP $repo_name (not cloned)"
  fi
done

# ---------------------------------------------------------------------------
# 5. Pull all repos
# ---------------------------------------------------------------------------
echo ">>> Pulling repos"
if [ ! -f "$REPOS_FILE" ]; then
  echo "ERROR: $REPOS_FILE not found"
  exit 1
fi

while IFS= read -r repo; do
  [[ -z "$repo" || "$repo" == \#* ]] && continue
  if [ -d "$repo/.git" ]; then
    echo "    $repo"
    git -C "$repo" pull --ff-only 2>&1 | tail -1
  else
    echo "    SKIP $repo — not cloned"
  fi
done < "$REPOS_FILE"

echo ""
echo "Ready."
