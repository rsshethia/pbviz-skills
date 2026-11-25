param(
  [ValidateSet("claude-personal", "claude-project", "custom")]
  [string]$Target = "claude-personal",
  [string]$Path = ""
)

# Installs this repo as an Agent Skill named "powerbi-visuals".
$source = Split-Path -Parent $MyInvocation.MyCommand.Definition
$name = "powerbi-visuals"

switch ($Target) {
  "claude-personal" { $destination = Join-Path $HOME ".claude\skills\$name" }
  "claude-project"  { $destination = Join-Path (Get-Location) ".claude\skills\$name" }
  "custom" {
    if ([string]::IsNullOrWhiteSpace($Path)) {
      Write-Error "For -Target custom, pass -Path with the folder to install into."
      exit 1
    }
    $destination = $Path
  }
}

if (Test-Path $destination) {
  Write-Host "Updating existing install: $destination" -ForegroundColor Yellow
} else {
  New-Item -ItemType Directory -Path $destination -Force | Out-Null
}

Copy-Item -Path (Join-Path $source "*") -Destination $destination -Recurse -Force

$gitDir = Join-Path $destination ".git"
if (Test-Path $gitDir) { Remove-Item -Path $gitDir -Recurse -Force }

Write-Host "Installed 'powerbi-visuals' skill at:" -ForegroundColor Green
Write-Host "  $destination"
Write-Host "Restart your agent so it discovers the skill."
