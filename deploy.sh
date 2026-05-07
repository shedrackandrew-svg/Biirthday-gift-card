#!/usr/bin/env bash
set -euo pipefail

echo "Deploy helper — will create GitHub repo, push, set secrets, and optionally trigger Render deploy."

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install it: https://cli.github.com/" >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "git is required." >&2
  exit 1
fi

read -p "GitHub owner (username or org): " GH_OWNER
read -p "Repository name (will be created): " REPO_NAME
read -p "Make repo private? (y/N): " PRIVATE_ANS
PRIVATE="--public"
if [[ "$PRIVATE_ANS" =~ ^[Yy] ]]; then PRIVATE="--private"; fi

# Create repository and push
echo "Creating repository ${GH_OWNER}/${REPO_NAME}..."
gh repo create "${GH_OWNER}/${REPO_NAME}" ${PRIVATE} --source=. --remote=origin --push

echo "Repository created and pushed."

echo "Now you can add the following secrets. You may paste empty values to skip."
read -p "SMTP_HOST (enter to skip): " SMTP_HOST
read -p "SMTP_PORT (enter to skip): " SMTP_PORT
read -p "SMTP_USER (enter to skip): " SMTP_USER
read -s -p "SMTP_PASS (enter to skip): " SMTP_PASS
echo
read -p "TWILIO_ACCOUNT_SID (enter to skip): " TWILIO_ACCOUNT_SID
read -s -p "TWILIO_AUTH_TOKEN (enter to skip): " TWILIO_AUTH_TOKEN
echo
read -p "TWILIO_WHATSAPP_FROM (e.g. whatsapp:+1415... enter to skip): " TWILIO_WHATSAPP_FROM

# Set GitHub secrets in the repo
set_secret(){
  local name="$1" value="$2"
  if [ -n "$value" ]; then
    echo "Setting secret $name"
    echo -n "$value" | gh secret set "$name" --repo "${GH_OWNER}/${REPO_NAME}"
  fi
}

set_secret SMTP_HOST "$SMTP_HOST"
set_secret SMTP_PORT "$SMTP_PORT"
set_secret SMTP_USER "$SMTP_USER"
set_secret SMTP_PASS "$SMTP_PASS"
set_secret TWILIO_ACCOUNT_SID "$TWILIO_ACCOUNT_SID"
set_secret TWILIO_AUTH_TOKEN "$TWILIO_AUTH_TOKEN"
set_secret TWILIO_WHATSAPP_FROM "$TWILIO_WHATSAPP_FROM"

echo "Secrets set (skipped empty)."

read -p "Do you want to trigger a Render deploy now? (y/N): " TRIGGER_RENDER
if [[ "$TRIGGER_RENDER" =~ ^[Yy] ]]; then
  read -p "RENDER_API_KEY: " RENDER_API_KEY
  read -p "RENDER_SERVICE_ID: " RENDER_SERVICE_ID
  if [ -z "$RENDER_API_KEY" ] || [ -z "$RENDER_SERVICE_ID" ]; then
    echo "Missing Render API key or Service ID. Skipping trigger.";
  else
    echo "Triggering Render deploy..."
    curl -s -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
      -H "Authorization: Bearer ${RENDER_API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{"clearCache": true}'
    echo "Render deploy triggered."
  fi
fi

echo "Done. Visit https://github.com/${GH_OWNER}/${REPO_NAME} and follow deployments." 
