#!/usr/bin/env bash
# Installs the powerbi-visuals skill from skills/powerbi-visuals into a skills directory.
set -euo pipefail

TARGET="${1:-claude-personal}"
NAME="powerbi-visuals"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE="$REPO/skills/$NAME"

case "$TARGET" in
  claude-personal) DEST="$HOME/.claude/skills/$NAME" ;;
  claude-project)  DEST="$PWD/.claude/skills/$NAME" ;;
  agents-project)  DEST="$PWD/.agents/skills/$NAME" ;;
  custom)
    if [ -z "${2:-}" ]; then
      echo "Usage: ./install.sh custom /path/to/your/skills/$NAME" >&2
      exit 1
    fi
    DEST="$2"
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    echo "Choose: claude-personal | claude-project | agents-project | custom" >&2
    exit 1
    ;;
esac

if [ ! -d "$SOURCE" ]; then
  echo "Skill source not found: $SOURCE" >&2
  exit 1
fi

mkdir -p "$DEST"
cp -R "$SOURCE"/. "$DEST"/
echo "Installed '$NAME' skill at:"
echo "  $DEST"
echo "Restart your agent so it discovers the skill."
