#!/usr/bin/env bash
# pr.sh — create an Azure DevOps pull request
# Usage: pr.sh "Title" ["Description"] [source-branch] [target-branch]
#
# Defaults:
#   source  = current git branch
#   target  = dev
#   repo    = auto-detected from git remote

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_FILE="$SCRIPT_DIR/.secrets"

if [ ! -f "$SECRETS_FILE" ]; then
  echo "ERROR: .secrets not found — run init.sh first"
  exit 1
fi

# shellcheck source=.secrets
source "$SECRETS_FILE"

ORG="HarvMgmt"
PROJECT="HMCgit"

TITLE="${1?Usage: pr.sh <title> [description] [source-branch] [target-branch]}"
DESCRIPTION="${2:-}"
SOURCE="${3:-$(git branch --show-current 2>/dev/null)}"
TARGET="${4:-dev}"

if [ -z "$SOURCE" ]; then
  echo "ERROR: could not detect current branch"
  exit 1
fi

# Auto-detect repo name from git remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
REPO=$(echo "$REMOTE_URL" | sed 's|.*/_git/||' | sed 's|\.git$||' | sed 's|[^A-Za-z0-9._-]||g')

if [ -z "$REPO" ]; then
  echo "ERROR: could not detect repo from git remote"
  exit 1
fi

echo "Creating PR: [$REPO] $SOURCE -> $TARGET"

RESPONSE=$(curl -s -X POST \
  "https://dev.azure.com/${ORG}/${PROJECT}/_apis/git/repositories/${REPO}/pullrequests?api-version=7.1" \
  -H "Content-Type: application/json" \
  -u ":${ADO_PAT}" \
  -d "$(jq -n \
    --arg title "$TITLE" \
    --arg desc "$DESCRIPTION" \
    --arg src "refs/heads/$SOURCE" \
    --arg tgt "refs/heads/$TARGET" \
    '{title:$title, description:$desc, sourceRefName:$src, targetRefName:$tgt, isDraft:false}'
  )")

PR_ID=$(echo "$RESPONSE" | jq -r '.pullRequestId // empty')

if [ -z "$PR_ID" ]; then
  echo "ERROR:"
  echo "$RESPONSE" | jq -r '.message // .'
  exit 1
fi

echo "PR #${PR_ID} — https://dev.azure.com/${ORG}/${PROJECT}/_git/${REPO}/pullrequest/${PR_ID}"
