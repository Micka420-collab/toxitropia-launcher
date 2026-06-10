# Toxitropia Launcher

Launcher officiel du serveur Minecraft **Toxitropia** (NeoForge 1.21.1) — Windows **et macOS**
(Apple Silicon & Intel). Gère Java automatiquement, synchronise le modpack et lance le jeu.

## 📥 Télécharger pour macOS

➡️ **[Dernière version — page des Releases](../../releases/latest)**

| Ton Mac | Fichier à télécharger |
| --- | --- |
| Apple Silicon (M1 / M2 / M3 / M4) | `Zarn-*-arm64.dmg` |
| Intel | `Zarn-*-x64.dmg` |

1. Ouvre le `.dmg` téléchargé.
2. Glisse l'icône **Zarn** dans le dossier **Applications**.
3. **Premier lancement** (app non signée) : **clic droit** sur *Zarn* dans Applications → **Ouvrir**
   → confirme. (Une seule fois. Sinon : Terminal → `xattr -cr /Applications/Zarn.app`.)

> Pas besoin d'installer Java : le launcher télécharge le bon JRE (Temurin 21) tout seul.

## 🛠️ Construire soi-même

Voir **[MAC-BUILD.md](MAC-BUILD.md)**. En résumé, sur un Mac :

```bash
npm ci
npm run build:mac   # → dist/Zarn-<version>-arm64.dmg + -x64.dmg + .zip
```

La version macOS est aussi construite automatiquement par GitHub Actions
(`.github/workflows/build-mac.yml`) à chaque tag `launcher-v*`.
