# Windows variant of sync-memory.sh. Mirrors the per-session memory directory into
# the repo's .claude/memory so accumulated lessons are committed and shared.
#
# Wire it up in .claude/settings.json as a Stop hook:
#   { "hooks": { "Stop": [ { "hooks": [
#       { "type": "command", "command": "pwsh -File \".claude/hooks/sync-memory.ps1\"",
#         "shell": "powershell" } ] } ] } }
#
# Override the source with $env:SDD_MEMORY_SRC if your path differs.

$slug = (Get-Location).Path -replace '[/\\:]', '-'
$src = if ($env:SDD_MEMORY_SRC) { $env:SDD_MEMORY_SRC }
       else { "$env:USERPROFILE\.claude\projects\$slug\memory" }
$dst = "$PSScriptRoot\..\memory"

if (-not (Test-Path $src)) { exit 0 }
if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Force $dst | Out-Null }

Copy-Item "$src\*" $dst -Force -ErrorAction SilentlyContinue
