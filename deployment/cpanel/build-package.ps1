[CmdletBinding()]
param(
  [string]$ApiUrl = '/api',
  [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $scriptRoot 'package'
}
$repoRoot = (Resolve-Path (Join-Path $scriptRoot '..\..')).Path
$frontendRoot = Join-Path $repoRoot 'frontend'
$backendRoot = Join-Path $repoRoot 'backend'
$publicHtml = Join-Path $OutputDirectory 'public_html'
$backendPackage = Join-Path $OutputDirectory 'backend'

if (Test-Path $OutputDirectory) {
  Remove-Item -LiteralPath $OutputDirectory -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDirectory, $publicHtml, $backendPackage | Out-Null

Push-Location $frontendRoot
try {
  $env:VITE_API_BASE_URL = $ApiUrl
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
}
finally { Pop-Location }

# Use -Path here so PowerShell expands the dist wildcard. Dot-files are copied
# separately because wildcard enumeration omits them.
Copy-Item -Path (Join-Path $frontendRoot 'dist\*') -Destination $publicHtml -Recurse -Force
# PowerShell's wildcard copy omits dot-files; copy the SPA rewrite rules explicitly.
Copy-Item -LiteralPath (Join-Path $frontendRoot 'public\.htaccess') -Destination (Join-Path $publicHtml '.htaccess') -Force

Push-Location $backendRoot
try {
  npm run prisma:generate
  if ($LASTEXITCODE -ne 0) { throw 'Prisma client generation failed.' }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
}
finally { Pop-Location }

Copy-Item -LiteralPath (Join-Path $backendRoot 'dist') -Destination $backendPackage -Recurse -Force
Copy-Item -LiteralPath (Join-Path $backendRoot 'package.json') -Destination $backendPackage -Force
Copy-Item -LiteralPath (Join-Path $backendRoot 'package-lock.json') -Destination $backendPackage -Force
Copy-Item -LiteralPath (Join-Path $backendRoot 'passenger.js') -Destination $backendPackage -Force
Copy-Item -LiteralPath (Join-Path $repoRoot 'prisma') -Destination $OutputDirectory -Recurse -Force

Write-Host "Deployment package created at $OutputDirectory"
Write-Host "Upload public_html contents to cPanel public_html."
Write-Host "Upload backend and prisma to the cPanel Node.js app root."
