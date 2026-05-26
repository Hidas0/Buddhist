# Ручная отправка всех изменений на GitHub: .\scripts\git-push.ps1 [-Message "текст"]
# Не используется сайтом в браузере — только для разработчика.

param(
    [string]$Message = ''  # текст коммита; если пусто — дата/время
)

$ProjectRoot = Split-Path $PSScriptRoot -Parent  # корень репозитория (папка public)
Set-Location $ProjectRoot

if (-not (Test-Path '.git')) {
    Write-Error 'Не найден git-репозиторий.'
    exit 1
}

$dirty = git status --porcelain  # есть ли изменённые файлы
if (-not $dirty) {
    Write-Host 'Нет изменений для отправки.'
    exit 0
}

git add -A  # все файлы в индекс (кроме .gitignore)
if (-not $Message) {
    $Message = "Обновление сайта ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$branch = git rev-parse --abbrev-ref HEAD  # обычно main
git push -u origin $branch
exit $LASTEXITCODE
