#!/bin/bash
#
# Push the Lapia Studio project to GitHub.
#
# Usage:
#   ./push-to-github.sh
#
# You'll be prompted for your GitHub username and a Personal Access Token
# (PAT) with `repo` scope. The PAT will be used only for this push — it
# is NOT saved anywhere on disk.
#
# To create a PAT: https://github.com/settings/tokens/new?scopes=repo
#

set -e

REMOTE_URL="https://github.com/gefrus112/lapia-ai-agent.git"
BRANCH="main"

cd "$(dirname "$0")"

# Sanity check
if [ ! -d .git ]; then
  echo "Error: not a git repo. Run this from the project root."
  exit 1
fi

if ! git remote get-url origin > /dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
  echo "Added remote: $REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
  echo "Updated remote to: $REMOTE_URL"
fi

echo ""
echo "Lapia Studio — Push to GitHub"
echo "============================="
echo ""
echo "You need a GitHub Personal Access Token (PAT) with 'repo' scope."
echo "Create one here: https://github.com/settings/tokens/new?scopes=repo"
echo ""

read -p "GitHub username: " GH_USER
read -s -p "GitHub Personal Access Token: " GH_TOKEN
echo ""

# URL-encode the token (in case it has special chars)
ENCODED_TOKEN=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$GH_TOKEN")

# Set the auth URL just for this push (doesn't write to .git/config)
AUTH_URL="https://${GH_USER}:${ENCODED_TOKEN}@github.com/gefrus112/lapia-ai-agent.git"

echo "Pushing to ${BRANCH}..."
git push "${AUTH_URL}" "${BRANCH}":"${BRANCH}"

# Clear the auth URL from memory
unset AUTH_URL GH_TOKEN ENCODED_TOKEN

echo ""
echo "✓ Push successful!"
echo "View your repo: https://github.com/gefrus112/lapia-ai-agent"
