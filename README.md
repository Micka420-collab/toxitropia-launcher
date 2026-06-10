# Toxitropia Launcher

Launcher officiel du serveur Minecraft **Toxitropia** (NeoForge 1.21.1) — Windows **et macOS**
(Apple Silicon & Intel). Gère Java automatiquement, synchronise le modpack et lance le jeu.

## 📥 Télécharger

➡️ **[Dernière version — page des Releases](../../releases/latest)**

| Système | Fichier à télécharger |
| --- | --- |
| 🪟 **Windows** | `Zarn-Setup-*.exe` |
| 🍎 **Mac Apple Silicon** (M1 / M2 / M3 / M4) | `Zarn-*-arm64.dmg` |
| 🍎 **Mac Intel** | `Zarn-*-x64.dmg` |

**Windows** : lance le `Zarn-Setup-*.exe`. Si SmartScreen prévient → *Informations complémentaires*
→ *Exécuter quand même*.

**macOS** :
1. Ouvre le `.dmg` téléchargé.
2. Glisse l'icône **Zarn** dans le dossier **Applications**.
3. **Premier lancement** (app non signée) : **clic droit** sur *Zarn* dans Applications → **Ouvrir**
   → confirme. (Une seule fois. Sinon : Terminal → `xattr -cr /Applications/Zarn.app`.)

> Pas besoin d'installer Java : le launcher télécharge le bon JRE (Temurin 21) tout seul.

## 🛠️ Construire soi-même

Voir **[MAC-BUILD.md](MAC-BUILD.md)** pour les détails macOS. En résumé :

```bash
npm ci
npm run build:win   # Windows → dist/Zarn-Setup-<version>.exe
npm run build:mac   # macOS (sur un Mac) → dist/Zarn-<version>-arm64.dmg + -x64.dmg + .zip
```

Les versions Windows **et** macOS sont aussi construites automatiquement par GitHub Actions
(`.github/workflows/build.yml`) à chaque tag `launcher-v*`, puis publiées en Release.
