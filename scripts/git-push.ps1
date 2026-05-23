# Ручная отправка всех изменений на GitHub: .\scripts\git-push.ps1 [-Message "текст"]
param(
    [string]$Message = ''
)

$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

if (-not (Test-Path '.git')) {
    Write-Error 'Не найден git-репозиторий.'
    exit 1
}

$dirty = git status --porcelain
if (-not $dirty) {
    Write-Host 'Нет изменений для отправки.'
    exit 0
}

git add -A
if (-not $Message) {
    $Message = "Обновление сайта ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$branch = git rev-parse --abbrev-ref HEAD
git push -u origin $branch
exit $LASTEXITCODE
