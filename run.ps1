# -----------------------------
# XTL Newman Runner with TOTP
# -----------------------------

$ErrorActionPreference = "Stop"

Write-Host "=== XTL Newman Run Started ==="

# -----------------------------
# REQUIRED ENV VARIABLES
# -----------------------------
if (-not $env:TOTP_SECRET_BASE32) {
    throw "Missing env var: TOTP_SECRET_BASE32"
}
if (-not $env:USERNAME_OR_EMAIL) {
    throw "Missing env var: USERNAME_OR_EMAIL"
}
if (-not $env:PASSWORD) {
    throw "Missing env var: PASSWORD"
}

# Default base url
if (-not $env:BASE_URL) {
    $env:BASE_URL = "https://app.xautrendlab.com"
}

# -----------------------------
# FUNCTION: Generate TOTP
# -----------------------------
function Get-TOTP {
    return node gen_totp.js
}

# -----------------------------
# FUNCTION: Run Newman
# -----------------------------
function Run-Newman($totpCode) {

    Write-Host "Running Newman with TOTP: $totpCode"

    newman run XTL.postman_collection.json `
        -e XTL.postman_environment.json `
        --env-var "base_url=$env:BASE_URL" `
        --env-var "username_or_email=$env:USERNAME_OR_EMAIL" `
        --env-var "password=$env:PASSWORD" `
        --env-var "totp=$totpCode"
}

# -----------------------------
# FIRST RUN
# -----------------------------
$totp = Get-TOTP
Run-Newman $totp

# -----------------------------
# RETRY ON FAILURE (TOTP ROTATION)
# -----------------------------
if ($LASTEXITCODE -ne 0) {

    Write-Host "First run failed. Retrying with fresh TOTP..."
    Start-Sleep -Seconds 2

    $totp2 = Get-TOTP
    Run-Newman $totp2

    exit $LASTEXITCODE
}

Write-Host "=== XTL Newman Run Completed ==="
