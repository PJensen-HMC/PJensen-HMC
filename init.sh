#!/usr/bin/env bash
# init.sh — bootstrap a dev session on a fresh machine
# Run after: git init ~/ && git remote add origin <url> && git pull origin main

SECRETS_FILE="$HOME/.claude/.secrets"

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

# ---------------------------------------------------------------------------
# 2. Git identity
# ---------------------------------------------------------------------------
echo ">>> Git identity"
git config --global user.email "$ADO_USER"
git config --global user.name "Jensen, Pete"

# ---------------------------------------------------------------------------
# 3. Clone / pull repos + NuGet credentials
# ---------------------------------------------------------------------------
bash "$HOME/repos/init.sh"
