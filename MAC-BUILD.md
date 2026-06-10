# Launcher Toxitropia — build & compatibilité macOS

Le launcher (Electron) est désormais **compatible macOS** (Apple Silicon `arm64` **et** Intel `x64`).
Le code applicatif est multiplateforme ; ce document explique comment **produire** les artefacts Mac
et les **limites** de signature.

## 1. Ce qui a été rendu compatible Mac

| Domaine | Avant (Windows only) | Maintenant |
| --- | --- | --- |
| Java auto-download | `.zip` extrait via AdmZip | `.tar.gz` Adoptium extrait via `tar` natif sur macOS/Linux, `+x` garanti |
| Détection de Java | chemins `C:\Program Files\...` | `+ /Library/Java/JavaVirtualMachines`, `~/Library/...`, Homebrew (`/opt/homebrew`, `/usr/local`), `/usr/libexec/java_home` |
| Cible de build | `win` (nsis) | `+ mac` : `.dmg` + `.zip`, `arm64` + `x64`, icône `.icns` |
| Icône | `icon.ico` | `+ icon.icns` (généré par `npm run icon`) |
| Barre de titre | boutons custom Windows | macOS : « feux tricolores » natifs intégrés, boutons custom masqués |
| Quit / activate | déjà géré (`darwin`) | inchangé |

## 2. Construire la version Mac

> ⚠️ Un `.dmg`/`.app` **ne peut être généré que sur macOS** (outils Apple requis). Sous Windows,
> seul le `--win` fonctionne. Deux options :

### Option A — GitHub Actions (recommandé, aucun Mac requis)
Le workflow `.github/workflows/launcher-mac.yml` build sur un runner Apple :
1. Pousser le dépôt sur GitHub.
2. Onglet **Actions › Build launcher (macOS) › Run workflow** (ou pousser un tag `launcher-v*`).
3. Télécharger l'artefact `toxitropia-launcher-mac` (`.dmg` + `.zip` + `latest-mac.yml`).

### Option B — sur un Mac
```bash
cd "luncher mc"
npm ci
npm run icon        # (re)génère build/icon.icns
npm run build:mac   # → dist/Zarn-<version>-arm64.dmg, -x64.dmg, .zip, latest-mac.yml
```
Sortie dans `luncher mc/dist/`.

## 3. Signature & Gatekeeper (important)

Sans **compte Apple Developer** (99 $/an), le build est **non signé / ad-hoc**. Au 1ᵉʳ lancement,
macOS affiche « app non vérifiée ». L'utilisateur doit alors **clic droit sur l'app › Ouvrir**
(une seule fois), ou exécuter :
```bash
xattr -cr /Applications/Zarn.app
```

Pour une distribution **sans friction** (signée + notarisée), fournir en variables d'env /
secrets de dépôt, puis `CSC_IDENTITY_AUTO_DISCOVERY=true` :
- `CSC_LINK` / `CSC_KEY_PASSWORD` — certificat « Developer ID Application » (.p12)
- `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` — notarisation

`hardenedRuntime`, les entitlements (`build/entitlements.mac.plist`) et la catégorie sont déjà
configurés dans `electron-builder.yml`.

## 4. Auto-update sur Mac

`electron-updater` lit `latest-mac.yml` + le `.zip` servis par le feed `publish` (nginx VM).
**L'auto-update macOS ne s'applique QUE si l'app est signée** (exigence de Squirrel.Mac). Tant que
le build reste non signé, la **vérification** de mise à jour fonctionne mais l'**installation
automatique** est ignorée → publier une nouvelle version = redistribuer le `.dmg`. Une fois signé,
l'auto-update fonctionne comme sous Windows.
