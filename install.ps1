param(
  [ValidateSet("claude-personal", "claude-project", "agents-project", "custom")]
  [string]$Target = "claude-personal",
  [string]$Path = ""
)

# Installs the powerbi-visuals skill from skills/powerbi-visuals into a skills directory.
$repo = Split-Path -Parent $MyInvocation.MyCommand.Definition
$source = Join-Path $repo "skills\powerbi-visuals"
$name = "powerbi-visuals"

if (-not (Test-Path $source)) {
  Write-Error "Skill source not found: $source"
  exit 1
}

switch ($Target) {
  "claude-personal" { $destination = Join-Path $HOME ".claude\skills\$name" }
  "claude-project"  { $destination = Join-Path (Get-Location) ".claude\skills\$name" }
  "agents-project"  { $destination = Join-Path (Get-Location) ".agents\skills\$name" }
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
Write-Host "Installed 'powerbi-visuals' skill at:" -ForegroundColor Green
Write-Host "  $destination"
Write-Host "Restart your agent so it discovers the skill."
