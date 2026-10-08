# Connexion MCGENESIS — 2026-10-08

Le profil intégré utilise le client **vanilla 1.21.11 / Java 21**, compatible
avec le serveur Paper 1.21.11 testé. L'ancien client NeoForge 1.21.1 ne peut
pas rejoindre ce serveur. Les mods et scripts KubeJS du pack précédent ne
sont plus installés dans le profil vanilla. Le code de support des profils
moddés personnalisés reste disponible.

IP publique conservée : **82.67.63.61**. Port intégré : **25565**, correspondant
à l'allocation du panel. La connexion automatique Quick Play et l'entrée
multijoueur utilisent les mêmes paramètres du manifeste. Si le routeur
publie un autre port externe (par exemple 25569 vers le port interne 25565),
modifier le port dans Administration. Aucune redirection NAT n'a été modifiée
ou vérifiée par ce correctif.

Le manifeste HTTP historique :8090 pouvait rétablir l'ancien modpack après
une simple modification des valeurs intégrées. Les installations utilisant
le profil livré Zarn/NeoForge et cette URL migrent vers le profil local
MCGENESIS. Le dossier standard devient `minecraft-mcgenesis` dans les données
du launcher ; l'ancien dossier `minecraft`, ses mondes/mods et comptes ne
sont pas supprimés. Dossiers et manifestes personnalisés sont préservés.
Une URL personnalisée reste supportée et son cache est conservé hors ligne.

## Validation et accès réseau

`npm ci --ignore-scripts --no-audit --no-fund`, `npm test` (4 tests),
`npm run typecheck` et `npm run build` passent sur Ubuntu / Node 22.
La CI de PR vérifie ces mêmes étapes sans publier une release.
Installation Windows/macOS, connexion avec le client graphique Java et
authentification Microsoft n'ont pas été exécutées sur cette machine.
Les derniers binaires publiés ne changent pas avant une nouvelle release.

Le Paper actuel est un environnement privé de tests avec accès Minecraft
externe bloqué, backend local 127.0.0.1:45565 et authentification offline.
Les sondes depuis Ubuntu vers les ports publics 25565/25569 n'ont pas établi
une connexion ; cela ne prouve pas à lui seul l'état d'une redirection NAT.
Ce correctif de launcher ne rend pas le serveur joignable depuis Internet.
Pour les tests privés, utiliser un tunnel SSH/VPN et configurer son endpoint
dans Administration. Une ouverture publique nécessite un serveur authentifié
et la configuration réseau correspondante ; ne pas supprimer le pare-feu
privé de tests pour contourner cette étape.

Le compagnon Paper bloque le compte réservé `MCGenesisAI` sans permis.
Un joueur humain doit utiliser son propre compte/pseudo.
Retour arrière : conserver un manifeste personnalisé ou revenir au commit
précédent. Les anciennes données utilisateur restent sur disque.
