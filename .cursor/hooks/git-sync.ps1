# Auto-commit and push project changes to GitHub (runs on agent stop).
$ErrorActionPreference = 'Continue'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

Set-Location $ProjectRoot

if (-not (Test-Path '.git')) {
    exit 0
}

$status = git status --porcelain 2>&1
if (-not $status) {
    exit 0
}

git add -A 2>&1 | Out-Null

$stillDirty = git status --porcelain 2>&1
if (-not $stillDirty) {
    exit 0
}

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
$commitMsg = "Auto-sync: обновление сайта ($timestamp)"

git commit -m $commitMsg 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'git-sync: commit skipped or failed'
    exit 0
}

$branch = git rev-parse --abbrev-ref HEAD 2>&1
if ($LASTEXITCODE -ne 0) { $branch = 'main' }

git push origin $branch 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "git-sync: pushed to origin/$branch"
} else {
    Write-Host 'git-sync: push failed (check network or credentials)'
}

exit 0
