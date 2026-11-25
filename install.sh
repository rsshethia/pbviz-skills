#!/usr/bin/env bash
# Installs this repo as an Agent Skill named "powerbi-visuals".
set -euo pipefail

TARGET="${1:-claude-personal}"
NAME="powerbi-visuals"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$TARGET" in
  claude-personal) DEST="$HOME/.claude/skills/$NAME" ;;
  claude-project)  DEST="$PWD/.claude/skills/$NAME" ;;
  custom)
    if [ -z "${2:-}" ]; then
      echo "Usage: ./install.sh custom /path/to/your/skills/$NAME" >&2
      exit 1
    fi
    DEST="$2"
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    echo "Choose: claude-personal | claude-project | custom" >&2
    exit 1
    ;;
esac

mkdir -p "$DEST"
cp -R "$SOURCE"/. "$DEST"/
rm -rf "$DEST/.git"

echo "Installed '$NAME' skill at:"
echo "  $DEST"
echo "Restart your agent so it discovers the skill."
