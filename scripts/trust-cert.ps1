# Marque le certificat « Survival MC » comme fiable sur CETTE machine.
# Effet : les binaires signés Survival MC passent au statut « Valide » et ne
# déclenchent plus l'avertissement « éditeur inconnu » / SmartScreen sur ce poste.
#
# À exécuter sur ta machine et/ou par tes utilisateurs (clic droit → Exécuter avec
# PowerShell en administrateur). Distribue uniquement le .cer (jamais le .pfx).
#
# Pour annuler : supprime le certificat « Survival MC » via certlm.msc
# (Autorités de certification racines de confiance + Éditeurs approuvés).

#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$cer = Join-Path $PSScriptRoot '..\build\certs\survival-codesign.cer'
if (-not (Test-Path $cer)) { Write-Error "Certificat introuvable : $cer" }

Import-Certificate -FilePath $cer -CertStoreLocation Cert:\LocalMachine\Root | Out-Null
Import-Certificate -FilePath $cer -CertStoreLocation Cert:\LocalMachine\TrustedPublisher | Out-Null
Write-Host "✓ Certificat « Survival MC » approuvé (Racines de confiance + Éditeurs approuvés)." -ForegroundColor Green
