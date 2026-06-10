# Build Windows signé (installeur NSIS) avec signature de code.
#
# Par défaut, utilise le certificat AUTO-SIGNÉ build/certs/survival-codesign.pfx.
# ⚠️ Un certificat auto-signé ne supprime SmartScreen QUE sur les machines qui ont
#    marqué le certificat comme fiable. Pour le grand public, il faut un certificat
#    acheté (idéalement EV).
#
# Pour passer à un VRAI certificat : pose ton .pfx et lance par exemple
#   $env:CSC_LINK = 'C:\chemin\vers\ton-cert.pfx'
#   $env:CSC_KEY_PASSWORD = 'mot-de-passe'
#   .\scripts\build-signed.ps1
# (les variables d'environnement déjà définies sont respectées.)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

# Caches sur F: (C: est plein).
$env:ELECTRON_CACHE = 'F:\electron-cache'
$env:electron_config_cache = 'F:\electron-cache'
$env:ELECTRON_BUILDER_CACHE = 'F:\electron-builder-cache'
$env:TEMP = 'F:\tmp'
$env:TMP = 'F:\tmp'

# Certificat de signature : respecte CSC_LINK/CSC_KEY_PASSWORD s'ils existent déjà,
# sinon retombe sur le certificat auto-signé du projet.
if (-not $env:CSC_LINK) {
  $env:CSC_LINK = Join-Path $root 'build\certs\survival-codesign.pfx'
}
if (-not $env:CSC_KEY_PASSWORD) {
  $env:CSC_KEY_PASSWORD = 'survival-mc'
}

if (-not (Test-Path $env:CSC_LINK)) {
  Write-Error "Certificat introuvable : $($env:CSC_LINK). Génère-le ou définis CSC_LINK."
}

Write-Host "Signature avec : $($env:CSC_LINK)" -ForegroundColor Green
npm run build:win