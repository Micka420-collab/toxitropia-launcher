# MCGENESIS Launcher

Launcher **MCGENESIS** (client vanilla 1.21.11 pour Paper 1.21.11) — Windows **et macOS**
(Apple Silicon & Intel). Gère Java automatiquement et lance la connexion directe.
Adresse intégrée : **82.67.63.61:25565** (IP publique du propriétaire).
Voir [configuration et limites de connexion](docs/MCGENESIS_CONNECTION.md).

## 📥 Télécharger

➡️ **[Dernière version — page des Releases](../../releases/latest)**

| Système | Fichier à télécharger |
| --- | --- |
| 🪟 **Windows — MCGENESIS 1.5.22** | `MCGENESIS-Setup-1.5.22.exe` |
| 🍎 **macOS — anciennes versions seulement** | Voir les releases précédentes ; elles utilisent l'ancien profil |

**Windows** : lance le `MCGENESIS-Setup-*.exe`. Si SmartScreen prévient → *Informations complémentaires*
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
npm run build:win   # Windows → dist/MCGENESIS-Setup-<version>.exe
npm run build:mac   # macOS (sur un Mac) → dist/MCGENESIS-<version>-arm64.dmg + -x64.dmg + .zip
```

Les versions Windows **et** macOS sont aussi construites automatiquement par GitHub Actions
(`.github/workflows/build.yml`) à chaque tag `launcher-v*`, puis publiées en Release.

La release Windows MCGENESIS est construite, installée et démarrée sur un
runner Windows par `windows-release.yml`, depuis la branche
`release/mcgenesis-<version>`. Elle publie l'installeur et son SHA256 après
réussite des contrôles. Le visuel `mcgenesis.png` correspond exactement à
l'image fournie (SHA256 `5fa9ab0aea299bd4d6be8b4445aa7716fe6b86ef4d6c5e2c4bb465956fb8c0aa`).
