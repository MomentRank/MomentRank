# Cleanup Script for Old Files

# This script removes deprecated files after migrating to Expo Router
# Review the files before running this script!

Write-Host "🧹 Cleaning up deprecated files..." -ForegroundColor Cyan

$filesToRemove = @(
    ".\app\App.js",
    ".\app\LoginForm.js",
    ".\app\RegisterForm.js",
    ".\app\FirstTimeLoginForm.js",
    ".\app\MainApp.js",
    ".\app\AuthService.js",
    ".\index.js"
)

Write-Host "`nFiles to be removed:" -ForegroundColor Yellow
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor White
    } else {
        Write-Host "  ✗ $file (not found)" -ForegroundColor Gray
    }
}

$confirmation = Read-Host "`nDo you want to proceed with deletion? (yes/no)"

if ($confirmation -eq "yes") {
    foreach ($file in $filesToRemove) {
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-Host "  Deleted: $file" -ForegroundColor Green
        }
    }
    Write-Host "`n✨ Cleanup complete!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Cleanup cancelled." -ForegroundColor Red
}
