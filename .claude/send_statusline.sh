#!/usr/bin/env bash
TO="jensenp@hmc.harvard.edu"
FROM="prod@hmc.harvard.edu"
SUBJECT="statusline.sh"
SMTP="mail.hmc.harvard.edu"
SMTP_PORT=25
FILE="$HOME/.claude/statusline.sh"
TMPMAIL=$(mktemp)

# Write headers into temp file
cat > "$TMPMAIL" <<ENDOFHEADERS
From: $FROM
To: $TO
Subject: $SUBJECT
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

ENDOFHEADERS

# Append file content directly (no variable expansion) — strip ANSI escape codes
sed 's/\x1b\[[0-9;]*[a-zA-Z]//g' "$FILE" >> "$TMPMAIL"

curl --silent --show-error \
  --url "smtp://${SMTP}:${SMTP_PORT}" \
  --mail-from "$FROM" \
  --mail-rcpt "$TO" \
  --upload-file "$TMPMAIL"

STATUS=$?
rm -f "$TMPMAIL"
[ $STATUS -eq 0 ] && echo "Sent" || echo "FAILED"
