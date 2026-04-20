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
# 2. System tools
# ---------------------------------------------------------------------------
echo ">>> System tools"

# apt packages
APT_PKGS=()
command -v rg      &>/dev/null || APT_PKGS+=(ripgrep)
command -v jq      &>/dev/null || APT_PKGS+=(jq)
command -v ffmpeg  &>/dev/null || APT_PKGS+=(ffmpeg)
command -v unzip   &>/dev/null || APT_PKGS+=(unzip)

if [ ${#APT_PKGS[@]} -gt 0 ]; then
  echo "    apt-get: ${APT_PKGS[*]}"
  sudo apt-get install -y "${APT_PKGS[@]}" 2>&1 | grep -E "^(Inst|Err)" || true
else
  echo "    apt: all present"
fi

# deno (not in apt)
if ! command -v deno &>/dev/null; then
  echo "    installing deno..."
  curl -fsSL https://deno.land/install.sh | sh
  export DENO_INSTALL="$HOME/.deno"
  export PATH="$DENO_INSTALL/bin:$PATH"
else
  echo "    deno: $(deno --version | head -1)"
fi

# dotnet (warn only — needs Microsoft feed on fresh machine)
if ! command -v dotnet &>/dev/null; then
  echo "    WARNING: dotnet not found — install .NET 10 from https://dot.net"
else
  echo "    dotnet: $(dotnet --version)"
fi

# ---------------------------------------------------------------------------
# 3. Git identity
# ---------------------------------------------------------------------------
echo ">>> Git identity"
git config --global user.email "$ADO_USER"
git config --global user.name "Jensen, Pete"

# ---------------------------------------------------------------------------
# 3. Clone / pull repos + NuGet credentials
# ---------------------------------------------------------------------------
bash "$HOME/repos/init.sh"
