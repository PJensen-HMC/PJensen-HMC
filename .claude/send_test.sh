#!/usr/bin/env bash
TO="jensenp@hmc.harvard.edu"
FROM="prod@hmc.harvard.edu"
SMTP="mail.hmc.harvard.edu"
SMTP_PORT=25
TMPMAIL=$(mktemp)

cat > "$TMPMAIL" <<EOF
From: $FROM
To: $TO
Subject: test plain
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

hello world line 1
hello world line 2
EOF

echo "=== temp file ==="
cat "$TMPMAIL"
echo "=== sending ==="

curl -v \
  --url "smtp://${SMTP}:${SMTP_PORT}" \
  --mail-from "$FROM" \
  --mail-rcpt "$TO" \
  --upload-file "$TMPMAIL" 2>&1

rm -f "$TMPMAIL"
