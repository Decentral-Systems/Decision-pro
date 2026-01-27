#!/bin/bash
# Clean decision-pro-admin repo: init here, add all, commit, and force-push to remote.
# Use from project root: ./clean-repo-push.sh
# Remote: https://github.com/Decentral-Systems/Decision-pro.git

set -e
cd "$(dirname "$0")"

REMOTE_URL="https://github.com/Decentral-Systems/Decision-pro.git"
BRANCH="main"

# Remove existing .git if this dir was part of a parent repo (we want our own repo)
if [ -d .git ]; then
  echo "Existing .git found. Remove it to make this folder a clean repo? (y/n)"
  read -r ans
  if [ "$ans" = "y" ]; then
    rm -rf .git
  else
    echo "Aborted."
    exit 1
  fi
fi

git init
git add .
git commit -m "Clean repo: decision-pro-admin"
git branch -M "$BRANCH"
git remote add origin "$REMOTE_URL"
git push -f origin "$BRANCH"

echo "Done. Remote has been replaced with this directory."
