#!/usr/bin/env bash
# Mirrors the per-session memory directory into the repo's .claude/memory so that
# accumulated project lessons are committed and shared across the team.
#
# Wire it up in .claude/settings.json as a Stop hook:
#   { "hooks": { "Stop": [ { "hooks": [
#       { "type": "command", "command": "bash .claude/hooks/sync-memory.sh" } ] } ] } }
#
# SRC is the harness-managed memory dir for this project. Override with $SDD_MEMORY_SRC
# if your path differs (the default mirrors Claude Code's project memory layout).
set -euo pipefail

SRC="${SDD_MEMORY_SRC:-$HOME/.claude/projects/$(pwd | sed 's#[/\\:]#-#g')/memory}"
DST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/memory"

[ -d "$SRC" ] || exit 0
mkdir -p "$DST"
cp -f "$SRC"/* "$DST"/ 2>/dev/null || true
