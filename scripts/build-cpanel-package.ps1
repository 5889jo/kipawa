[CmdletBinding()]
param(
  [string]$ApiUrl = '/api',
  [string]$SiteUrl = $env:VITE_SITE_URL,
  [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$frontendRoot = Join-Path $repoRoot 'frontend'
$backendRoot = Join-Path $repoRoot 'backend'

if ($ApiUrl -ne '/api' -and $ApiUrl -notmatch '^https://[^/?#]+/api$') {
  throw "ApiUrl must be '/api' or an HTTPS API URL ending in /api."
}

if (-not [string]::IsNullOrWhiteSpace($SiteUrl) -and $SiteUrl -notmatch '^https://[^/?#]+/?$') {
  throw "SiteUrl must be the public HTTPS origin without a path, query, or fragment."
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $repoRoot 'deployment\cpanel-package'
}
elseif (-not [IO.Path]::IsPathRooted($OutputDirectory)) {
  $OutputDirectory = Join-Path $repoRoot $OutputDirectory
}

if (Test-Path -LiteralPath $OutputDirectory) {
  throw "Output directory already exists. Move it or choose another output path: $OutputDirectory"
}

$previousApiUrl = $env:VITE_API_BASE_URL
$previousSiteUrl = $env:VITE_SITE_URL
try {
  Push-Location $frontendRoot
  try {
    $env:VITE_API_BASE_URL = $ApiUrl
    if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) {
      $env:VITE_SITE_URL = $SiteUrl.TrimEnd('/')
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
  }
  finally {
    Pop-Location
  }
}
finally {
  if ($null -eq $previousApiUrl) {
    Remove-Item Env:\VITE_API_BASE_URL -ErrorAction SilentlyContinue
  }
  else {
    $env:VITE_API_BASE_URL = $previousApiUrl
  }
  if ($null -eq $previousSiteUrl) {
    Remove-Item Env:\VITE_SITE_URL -ErrorAction SilentlyContinue
  }
  else {
    $env:VITE_SITE_URL = $previousSiteUrl
  }
}

Push-Location $backendRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
}
finally {
  Pop-Location
}

$publicHtml = Join-Path $OutputDirectory 'public_html'
$backendPackage = Join-Path $OutputDirectory 'backend'
$prismaPackage = Join-Path $OutputDirectory 'prisma'
New-Item -ItemType Directory -Path `
  $publicHtml, `
  $backendPackage, `
  (Join-Path $backendPackage 'prisma'), `
  (Join-Path $backendPackage 'src\generated'), `
  $prismaPackage | Out-Null

Copy-Item -Path (Join-Path $frontendRoot 'dist\*') -Destination $publicHtml -Recurse -Force
Copy-Item -LiteralPath (Join-Path $frontendRoot 'public\.htaccess') -Destination (Join-Path $publicHtml '.htaccess') -Force

Copy-Item -LiteralPath (Join-Path $backendRoot 'dist') -Destination $backendPackage -Recurse -Force
Copy-Item -LiteralPath (Join-Path $backendRoot 'package.json') -Destination $backendPackage -Force
Copy-Item -LiteralPath (Join-Path $backendRoot 'package-lock.json') -Destination $backendPackage -Force
Copy-Item -LiteralPath (Join-Path $backendRoot 'prisma.config.ts') -Destination $backendPackage -Force
Copy-Item -LiteralPath (Join-Path $backendRoot 'prisma\seed.ts') -Destination (Join-Path $backendPackage 'prisma\seed.ts') -Force
Copy-Item -LiteralPath (Join-Path $backendRoot 'src\generated\prisma') -Destination (Join-Path $backendPackage 'src\generated\prisma') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'cpanel-passenger.js') -Destination (Join-Path $backendPackage 'passenger.js') -Force
Copy-Item -LiteralPath (Join-Path $repoRoot 'prisma\schema.prisma') -Destination $prismaPackage -Force
Copy-Item -LiteralPath (Join-Path $repoRoot 'prisma\migrations') -Destination $prismaPackage -Recurse -Force

foreach ($directory in @('courses', 'news', 'organization', 'partners', 'publications', 'payment-proofs')) {
  New-Item -ItemType Directory -Path (Join-Path $backendPackage "uploads\$directory") -Force | Out-Null
}

Write-Host "cPanel package created at $OutputDirectory"
Write-Host 'Upload public_html contents to the domain document root.'
Write-Host 'Keep backend and prisma together outside public_html; set the Node app root to backend.'
