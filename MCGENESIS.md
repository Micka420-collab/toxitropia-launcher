# MCGenesis — version graphique

Refonte du launcher Toxitropia/Zarn à partir du concept de cité flottante fourni le 8 octobre 2026.

Accueil, navigation, palette cyan/violet, icône cristal, panorama original et écran de chargement adaptés. Intro et effets apocalyptiques retirés de l’interface.

Le serveur, les versions Minecraft/NeoForge, les mods et les fonctions existantes sont conservés. Les compagnons IA ne sont pas implémentés par cette refonte. La configuration distante peut toujours fournir des actualités du serveur existant. Aucun nouveau serveur MCGenesis n’a été déployé.

Les mises à jour automatiques Zarn sont désactivées afin d’éviter de remplacer cette variante par l’ancien launcher. Configurer un canal MCGenesis dédié avant réactivation.

## Développement

npm ci
npm run dev
npm run typecheck
npm run build

## Windows sans certificat

npx electron-builder --win --dir --config.win.signAndEditExecutable=false

L’exécutable livré est non signé. Extraire tout le dossier Windows avant de lancer MCGenesis.exe.

## Visuel

Panorama créé avec imagegen intégré, à partir de l’illustration de référence. Prompt : panorama voxel cinématographique, cité flottante à droite, ciel bleu calme à gauche, cascades, végétation, cristal cyan et portail violet, lanternes ambrées, sans texte ni logo. Asset : src/renderer/src/assets/genesis-panorama.png.
