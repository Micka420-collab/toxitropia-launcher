import type { LauncherManifest, LauncherSettings, PlayStats } from './types'

export const SCHEMA_VERSION = 1

export const DEFAULT_MANIFEST: LauncherManifest = {
  schemaVersion: SCHEMA_VERSION,
  updatedAt: new Date(0).toISOString(),
  server: { name: 'Zarn', ip: '82.67.63.61', port: 25569 },
  // Plan A — NeoForge 1.21.1 (Java 21). loaderVersion ÉPINGLÉE volontairement :
  // client et serveur DOIVENT tourner sur le même build NeoForge, sinon kick au handshake.
  // Vérifier le dernier 21.1.x sur https://maven.neoforged.net/releases/net/neoforged/neoforge/
  // et garder cette valeur identique côté serveur (neoforge-<build>-installer.jar --installServer).
  minecraft: { version: '1.21.1', loader: 'neoforge', loaderVersion: '21.1.233' },
  java: { recommendedMajor: 21, autoDownload: true },
  mods: [
  {
    "name": "tacz-neoforge-1.21.1-1.1.8-hotfix-r1.jar",
    "url": "https://cdn.modrinth.com/data/OypNE65K/versions/N9ffXNy0/tacz-neoforge-1.21.1-1.1.8-hotfix-r1.jar",
    "sha1": "35e912ce422c8ea41eb9a154b0117334a0c348c7",
    "size": 57246334
  },
  {
    "name": "Powah-6.2.10.jar",
    "url": "https://cdn.modrinth.com/data/KZO4S4DO/versions/1prWLuga/Powah-6.2.10.jar",
    "sha1": "f134ab3e0ace3793abf93129e318eb817898a4e1",
    "size": 2737991
  },
  {
    "name": "guideme-21.1.16.jar",
    "url": "https://cdn.modrinth.com/data/Ck4E7v7R/versions/bFr2FBaJ/guideme-21.1.16.jar",
    "sha1": "6c89cb18fd426a5dd851dd30ec72f02cb8bbcce7",
    "size": 9309277
  },
  {
    "name": "ImmersiveEngineering-1.21.1-12.4.2-194.jar",
    "url": "https://cdn.modrinth.com/data/tIm2nV03/versions/uNRARSH2/ImmersiveEngineering-1.21.1-12.4.2-194.jar",
    "sha1": "a4e90c2df8009040f6d022433c5d76635944dd59",
    "size": 14232121
  },
  {
    "name": "mcw-doors-1.1.5-mc1.21.1neoforge.jar",
    "url": "https://cdn.modrinth.com/data/kNxa8z3e/versions/u7BRX44F/mcw-doors-1.1.5-mc1.21.1neoforge.jar",
    "sha1": "c127904f23db1a641dd9e065ec51c5c177cb4cd7",
    "size": 1190404
  },
  {
    "name": "mcw-furniture-3.4.1-mc1.21.1neoforge.jar",
    "url": "https://cdn.modrinth.com/data/dtWC90iB/versions/Z5V3Ps7S/mcw-furniture-3.4.1-mc1.21.1neoforge.jar",
    "sha1": "3dccc819f14bcc60b3683edd82ca8c5e64964229",
    "size": 2080436
  },
  {
    "name": "mcw-mcwwindows-2.4.2-mc1.21.1neoforge.jar",
    "url": "https://cdn.modrinth.com/data/C7I0BCni/versions/rQUE4LCz/mcw-mcwwindows-2.4.2-mc1.21.1neoforge.jar",
    "sha1": "eb1d3c118acb450cc2fe14c2ce7ce247a1bca60c",
    "size": 1261268
  },
  {
    "name": "mcw-roofs-2.3.2-mc1.21.1neoforge.jar",
    "url": "https://cdn.modrinth.com/data/B8jaH3P1/versions/jiXRXiSt/mcw-roofs-2.3.2-mc1.21.1neoforge.jar",
    "sha1": "05806ff152fab56f7c1b4b215d772ea73611283d",
    "size": 1784829
  },
  {
    "name": "mcw-mcwfences-1.2.1-mc1.21.1neoforge.jar",
    "url": "https://cdn.modrinth.com/data/GmwLse2I/versions/jVdb0r4W/mcw-mcwfences-1.2.1-mc1.21.1neoforge.jar",
    "sha1": "b5580c3fc521ed8bf4db3e407bd590efc317f74d",
    "size": 673871
  },
  {
    "name": "mcw-lights-1.1.5-mc1.21.1neoforge.jar",
    "url": "https://cdn.modrinth.com/data/w4an97C2/versions/5U2kQZIL/mcw-lights-1.1.5-mc1.21.1neoforge.jar",
    "sha1": "13c1107caf26b2c60d8626b3658b26cc7f634b38",
    "size": 525744
  },
  {
    "name": "mcw-trapdoors-1.1.5-mc1.21.1neoforge.jar",
    "url": "https://cdn.modrinth.com/data/n2fvCDlM/versions/StnP0RNi/mcw-trapdoors-1.1.5-mc1.21.1neoforge.jar",
    "sha1": "1f8b59e31f889f53b6296b42ee09d447e7e56620",
    "size": 572870
  },
  {
    "name": "mcw-bridges-3.1.2-mc1.21.1neoforge.jar",
    "url": "https://cdn.modrinth.com/data/GURcjz8O/versions/aQ7rY7ng/mcw-bridges-3.1.2-mc1.21.1neoforge.jar",
    "sha1": "71ece28129789a2123cf07e79938f488d8675bb2",
    "size": 661387
  },
  {
    "name": "DecorativeBlocks-Reborn-neoforge-1.21.1-6.0.2.jar",
    "url": "https://cdn.modrinth.com/data/hNxmWV9g/versions/NZT1mU70/DecorativeBlocks-Reborn-neoforge-1.21.1-6.0.2.jar",
    "sha1": "d5f8afffd14aa5b32ae607967f04c772a763267b",
    "size": 432992
  },
  {
    "name": "pokebike-neoforge-2.0.1.jar",
    "url": "https://cdn.modrinth.com/data/8eqU62OI/versions/PXki8vb3/pokebike-neoforge-2.0.1.jar",
    "sha1": "b0dab28333c9b122608205f59cfa8652763f0beb",
    "size": 791296
  },
  {
    "name": "radiomod-1.0.2.jar",
    "url": "https://cdn.modrinth.com/data/QUoGjGKi/versions/xYQcy5uG/radiomod-1.0.2.jar",
    "sha1": "1c01b3025010a54d3516776cee81e163ec2be669",
    "size": 353887
  },
  {
    "name": "geckolib-neoforge-1.21.1-4.8.4.jar",
    "url": "https://cdn.modrinth.com/data/8BmcQJ2H/versions/gFmrC8Ru/geckolib-neoforge-1.21.1-4.8.4.jar",
    "sha1": "eb854c8ec53ef922a5f3877a1aa4c1ce1352e0ce",
    "size": 622582
  },
  {
    "name": "simplytents-4.1.0-1.21.1.neo.jar",
    "url": "https://cdn.modrinth.com/data/yWY7WWmg/versions/6F2u5bwg/simplytents-4.1.0-1.21.1.neo.jar",
    "sha1": "c31689c83ee17d48859520d0db768166221789b1",
    "size": 910541
  },
  {
    "name": "sophisticatedcore-1.21.1-1.4.42.1892.jar",
    "url": "https://cdn.modrinth.com/data/nmoqTijg/versions/SdStULv0/sophisticatedcore-1.21.1-1.4.42.1892.jar",
    "sha1": "ae15f110192693e2f979d34dd41b114a7c556504",
    "size": 1612665
  },
  {
    "name": "sophisticatedbackpacks-1.21.1-3.25.49.1791.jar",
    "url": "https://cdn.modrinth.com/data/TyCTlI4b/versions/CMFqQKmh/sophisticatedbackpacks-1.21.1-3.25.49.1791.jar",
    "sha1": "18b0ffddb1ef60593a0c83cdb0be890fca422172",
    "size": 1063232
  },
  {
    "name": "ExplorersCompass-1.21.1-3.4.0-neoforge.jar",
    "url": "https://cdn.modrinth.com/data/RV1qfVQ8/versions/hIJ2Ev1Q/ExplorersCompass-1.21.1-3.4.0-neoforge.jar",
    "sha1": "9f62af344988a6e2d855b113e61cf0e1611c7e0f",
    "size": 174668
  },
  {
    "name": "FarmersDelight-1.21.1-1.3.2.jar",
    "url": "https://cdn.modrinth.com/data/R2OftAxM/versions/GbNuOZ4S/FarmersDelight-1.21.1-1.3.2.jar",
    "sha1": "bf7e7dede99e832de20e191b1f6c11f7a9b9a622",
    "size": 3163042
  },
  {
    "name": "crabbersdelight-1.21.1-1.2.6.jar",
    "url": "https://cdn.modrinth.com/data/gBGdVBJy/versions/uwSpUkrQ/crabbersdelight-1.21.1-1.2.6.jar",
    "sha1": "ca13cbc55ff56b8453a2e8882221e7a7be39f117",
    "size": 634794
  },
  {
    "name": "Aquaculture-1.21.1-2.7.21.jar",
    "url": "https://cdn.modrinth.com/data/Vl1uNAuy/versions/5pbz0ETj/Aquaculture-1.21.1-2.7.21.jar",
    "sha1": "93c2043c6a5cfbfbfba93321d044bc61d8a6547b",
    "size": 605949
  },
  {
    "name": "PuzzlesLib-v21.1.51-1.21.1-NeoForge.jar",
    "url": "https://cdn.modrinth.com/data/QAGBst4M/versions/PRF4qcdp/PuzzlesLib-v21.1.51-1.21.1-NeoForge.jar",
    "sha1": "035de52d3eb18ceeca4e4e63516af873c0975060",
    "size": 1425185
  },
  {
    "name": "MutantMonsters-v21.1.1-1.21.1-NeoForge.jar",
    "url": "https://cdn.modrinth.com/data/derP0ten/versions/dauEcrnZ/MutantMonsters-v21.1.1-1.21.1-NeoForge.jar",
    "sha1": "c9981cf323d5e0fd49387ad20dafec1f58b2c88d",
    "size": 1346730
  },
  {
    "name": "CustomSkinLoader_Universal-14.28.jar",
    "url": "https://cdn.modrinth.com/data/idMHQ4n2/versions/9sCm2d9K/CustomSkinLoader_Universal-14.28.jar",
    "sha1": "b2d9bf46f3d672e2bef26a8e6de55401a7c0818e",
    "size": 191666
  },
  {
    "name": "ftb-library-neoforge-2101.1.31.jar",
    "url": "http://82.67.63.61:8090/ftb-library-neoforge-2101.1.31.jar",
    "sha1": "686d4e784c28c14f7760cc22b2de6a8573b56b74",
    "size": 1411181
  },
  {
    "name": "ftb-essentials-neoforge-2101.1.9.jar",
    "url": "http://82.67.63.61:8090/ftb-essentials-neoforge-2101.1.9.jar",
    "sha1": "7d6f274b38d767215549ec066246390c49ac7ad8",
    "size": 209459
  },
  {
    "name": "kubejs-neoforge-2101.7.2-build.368.jar",
    "url": "https://cdn.modrinth.com/data/umyGl7zF/versions/F2nzeC19/kubejs-neoforge-2101.7.2-build.368.jar",
    "sha1": "edf131afd474151afe076ea975ce5fec5a206ad8",
    "size": 2281720
  },
  {
    "name": "rhino-2101.2.7-build.81.jar",
    "url": "https://cdn.modrinth.com/data/sk9knFPE/versions/ZdLtebKH/rhino-2101.2.7-build.81.jar",
    "sha1": "480235a9f7749f68ce6fec3b9c3cac3428b92a4a",
    "size": 882033
  },
  {
    "name": "architectury-13.0.8-neoforge.jar",
    "url": "https://cdn.modrinth.com/data/lhGA9TYQ/versions/ZxYGwlk0/architectury-13.0.8-neoforge.jar",
    "sha1": "6ca11d3cc136bf69bb8f4d56982481eb85b5100b",
    "size": 584004
  },
  {
    "name": "ldlib2-neoforge-1.21.1-2.2.3-all.jar",
    "url": "https://cdn.modrinth.com/data/B1CBVXHX/versions/GFEGGJyP/ldlib2-neoforge-1.21.1-2.2.3-all.jar",
    "sha1": "8675b0204ff2b38040228d5c8c9931e1b119c90c",
    "size": 5929173
  },
  {
    "name": "fancymenu_neoforge_3.8.1_MC_1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/Wq5SjeWM/versions/iNWXxME7/fancymenu_neoforge_3.8.1_MC_1.21.1.jar",
    "sha1": "061a2c1ae0563d9d433928c243c58ee9b45f630f",
    "size": 4297501
  },
  {
    "name": "konkrete_neoforge_1.9.9_MC_1.21.jar",
    "url": "https://cdn.modrinth.com/data/J81TRJWm/versions/stJDU839/konkrete_neoforge_1.9.9_MC_1.21.jar",
    "sha1": "97771eb287d5ac7fe667d1df9493d5e54c8ca1fa",
    "size": 618842
  },
  {
    "name": "melody_neoforge_1.0.10_MC_1.21.jar",
    "url": "https://cdn.modrinth.com/data/CVT4pFB2/versions/efcdRVZP/melody_neoforge_1.0.10_MC_1.21.jar",
    "sha1": "e83052a92c4ca0016bcfe7f0207273983dc84698",
    "size": 36096
  },
  {
    "name": "Tropicraft-9.8.1.jar",
    "url": "https://cdn.modrinth.com/data/20zpzIT1/versions/20oDt9Q4/Tropicraft-9.8.1.jar",
    "sha1": "9ecbd957f3c5fe0adfd4f3f533700ae57cba8720",
    "size": 19480844
  },
  {
    "name": "ToughAsNails-neoforge-1.21.1-10.1.0.13.jar",
    "url": "https://cdn.modrinth.com/data/ge1sOdFH/versions/mboAbksk/ToughAsNails-neoforge-1.21.1-10.1.0.13.jar",
    "sha1": "38046bbfcd35cb1eb2bd17d9a9c3428b9750a82a",
    "size": 429636
  },
  {
    "name": "Terralith_1.21.x_v2.5.5.jar",
    "url": "https://cdn.modrinth.com/data/8oi3bsk5/versions/rEF3UnUI/Terralith_1.21.x_v2.5.5.jar",
    "sha1": "e9681a1963843e5be381d7ba6b2e869b47f062e6",
    "size": 2966255
  },
  {
    "name": "t_and_t-neoforge-fabric-1.13.7+1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/DjLobEOy/versions/E4Wy3O8Y/t_and_t-neoforge-fabric-1.13.7%2B1.21.1.jar",
    "sha1": "eb7666961fb0b0d0ff8bc01ff62194952f6b6b8c",
    "size": 3641681
  },
  {
    "name": "legendarysurvivaloverhaul-1.21.1-2.4.2.jar",
    "url": "https://cdn.modrinth.com/data/TQr3t8Sb/versions/AgUpT99l/legendarysurvivaloverhaul-1.21.1-2.4.2.jar",
    "sha1": "826525021abbf5c9c3b53764ca1829087ddcb512",
    "size": 3742368
  },
  {
    "name": "xaerominimap-neoforge-1.21.1-25.3.13.jar",
    "url": "https://cdn.modrinth.com/data/1bokaNcj/versions/CklXEjmp/xaerominimap-neoforge-1.21.1-25.3.13.jar",
    "sha1": "06cdb37f394bdbebce94c64644ae4bc21bd98959",
    "size": 2138329
  },
  {
    "name": "xaeroworldmap-neoforge-1.21.1-1.40.16.jar",
    "url": "https://cdn.modrinth.com/data/NcUtCpym/versions/XwL25au3/xaeroworldmap-neoforge-1.21.1-1.40.16.jar",
    "sha1": "d0865b6153c4d0feaf1551fb5309884ec3568c03",
    "size": 1387011
  },
  {
    "name": "AmbientSounds_NEOFORGE_v6.1.0_mc1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/fM515JnW/versions/6EYhiEoA/AmbientSounds_NEOFORGE_v6.1.0_mc1.21.1.jar",
    "sha1": "c8f0d11b85e8a6815fdd5099a08d6ed5ca1906f4",
    "size": 85689952
  },
  {
    "name": "CreativeCore_NEOFORGE_v2.13.40_mc1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/OsZiaDHq/versions/SCrlV5vO/CreativeCore_NEOFORGE_v2.13.40_mc1.21.1.jar",
    "sha1": "265c82bfd086afe96cf81fca0bee78256129adaa",
    "size": 1216479
  },
  {
    "name": "GlitchCore-neoforge-1.21.1-2.1.0.2.jar",
    "url": "https://cdn.modrinth.com/data/s3dmwKy5/versions/S2TfWrZR/GlitchCore-neoforge-1.21.1-2.1.0.2.jar",
    "sha1": "e3d4bb80a06f619be989ab529d0cd4e33e076943",
    "size": 90717
  },
  {
    "name": "Atlas-Lib-1.21.0-1.1.14.jar",
    "url": "https://cdn.modrinth.com/data/G6VHtQr4/versions/bpOrAZJe/Atlas-Lib-1.21.0-1.1.14.jar",
    "sha1": "8aa32c7595496206dcab266705489914565cc8f7",
    "size": 93183
  },
  {
    "name": "cristellib-neoforge-1.21.1-3.1.5.jar",
    "url": "https://cdn.modrinth.com/data/cl223EMc/versions/JbGjwnV6/cristellib-neoforge-1.21.1-3.1.5.jar",
    "sha1": "349f50baba1db725636ada6b7631c14f36085aee",
    "size": 583290
  },
  {
    "name": "sodium-neoforge-0.6.13+mc1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/AANobbMI/versions/Pb3OXVqC/sodium-neoforge-0.6.13%2Bmc1.21.1.jar",
    "sha1": "38af70fa4dc4b2aaac636e92fdba3bedd5a025e1",
    "size": 1162994
  },
  {
    "name": "iris-neoforge-1.8.12+mc1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/YL57xq9U/versions/t3ruzodq/iris-neoforge-1.8.12%2Bmc1.21.1.jar",
    "sha1": "a3e6355915c7d3b2bc392724795113e51d289378",
    "size": 2438548
  },
  {
    "name": "lithium-neoforge-0.15.3+mc1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/gvQqBUqZ/versions/RXHf27Wv/lithium-neoforge-0.15.3%2Bmc1.21.1.jar",
    "sha1": "9fd5fa9076044180ae7f51672de74669196ec72e",
    "size": 774148
  },
  {
    "name": "ferritecore-7.0.3-neoforge.jar",
    "url": "https://cdn.modrinth.com/data/uXXizFIs/versions/x7kQWVju/ferritecore-7.0.3-neoforge.jar",
    "sha1": "9563692efb708b6b568df27a01ec52f6311928ef",
    "size": 121559
  },
  {
    "name": "modernfix-neoforge-5.26.1+mc1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/nmDcB62a/versions/c759JLsq/modernfix-neoforge-5.26.1%2Bmc1.21.1.jar",
    "sha1": "50abc7ff4ef2fcbc3baf4c6b96e2a7141cbd1b8a",
    "size": 498852
  },
  {
    "name": "open-parties-and-claims-neoforge-1.21.1-0.26.2.jar",
    "url": "https://cdn.modrinth.com/data/gF3BGWvG/versions/b16WHzyv/open-parties-and-claims-neoforge-1.21.1-0.26.2.jar",
    "sha1": "fa16d80d0805eb4c2998bbe0e4eec5185f53c21d",
    "size": 1577086
  },
  {
    "name": "voicechat-neoforge-1.21.1-2.6.18.jar",
    "url": "https://cdn.modrinth.com/data/9eGKb6K1/versions/eFhbQnrh/voicechat-neoforge-1.21.1-2.6.18.jar",
    "sha1": "c9e638f5c049fc143dc043c585b13e9078a3f71d",
    "size": 4902837
  },
  {
    "name": "youre-in-grave-danger-neoforge-2.0.13.jar",
    "url": "https://cdn.modrinth.com/data/HnD1GX6e/versions/Axk4bfXT/youre-in-grave-danger-neoforge-2.0.13.jar",
    "sha1": "5f8382ea90afaeb302a60e87e70a560a9329eabc",
    "size": 448888
  },
  {
    "name": "cloth-config-15.0.140-neoforge.jar",
    "url": "https://cdn.modrinth.com/data/9s6osm5g/versions/izKINKFg/cloth-config-15.0.140-neoforge.jar",
    "sha1": "c3e5733ba4503b102589a026000fd5ce0212f6f2",
    "size": 1163890
  },
  {
    "name": "comforts-neoforge-9.0.5+1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/SaCpeal4/versions/3kpPjcTc/comforts-neoforge-9.0.5%2B1.21.1.jar",
    "sha1": "21d6bee3821d62fe3356c51fb1d697871a3087ff",
    "size": 422658
  },
  {
    "name": "spark-1.10.124-neoforge.jar",
    "url": "https://cdn.modrinth.com/data/l6YH9Als/versions/v5qtqRQi/spark-1.10.124-neoforge.jar",
    "sha1": "9430cc2ab64ff89d698be593769fb9f9ee4efae6",
    "size": 3642581
  },
  {
    "name": "The-Hordes-1.21.1-1.6.3c.jar",
    "url": "https://cdn.modrinth.com/data/O3HDffUR/versions/VMzDavrc/The-Hordes-1.21.1-1.6.3c.jar",
    "sha1": "f579310dfb509e0b19382916a8f2b6d5fee75142",
    "size": 448653
  },
  {
    "name": "UndeadNights-1.2.1-NeoForge-mc1.21.jar",
    "url": "https://cdn.modrinth.com/data/g0mmcQV2/versions/yHG0Dwdf/UndeadNights-1.2.1-NeoForge-mc1.21.jar",
    "sha1": "b5de8081631474826d4e468b5414c7ebeea82be7",
    "size": 694694,
    "optional": true,
    "enabled": false
  },
  {
    "name": "cutscene-api-mc1.21.1-neoforge-1.6.6.jar",
    "url": "https://cdn.modrinth.com/data/R54NT4it/versions/qblA66Vl/cutscene-api-mc1.21.1-neoforge-1.6.6.jar",
    "sha1": "493cbf9c656f5c7a569ed0b2edc643ff124c3ec4",
    "size": 287280
  },
  {
    "name": "customchestmenus-neoforge-1.21.1-2.0.1.jar",
    "url": "https://cdn.modrinth.com/data/1rhw3Wyu/versions/tKVK57mj/customchestmenus-neoforge-1.21.1-2.0.1.jar",
    "sha1": "861f4ed1313bea055f8b4d235a8f9d870695f100",
    "size": 159640
  },
  {
    "name": "coroutil-neoforge-1.21.0-1.3.8.jar",
    "url": "https://cdn.modrinth.com/data/rLLJ1OZM/versions/H2YXCYUY/coroutil-neoforge-1.21.0-1.3.8.jar",
    "sha1": "b044c51d00d60b5645a0c0890812935cd933555f",
    "size": 63981
  },
  {
    "name": "zombieawareness-neoforge-1.21.0-1.13.2.jar",
    "url": "https://cdn.modrinth.com/data/mMTOWOaA/versions/KNtnADP6/zombieawareness-neoforge-1.21.0-1.13.2.jar",
    "sha1": "266a95f6fcdb7a629ed6e95d7b3d2b35724dc6a7",
    "size": 304511
  },
  {
    "name": "the_wasteland_reworked-1.0.5-neoforge-1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/ysJNoSEC/versions/cCTr97HM/the_wasteland_reworked-1.0.5-neoforge-1.21.1.jar",
    "sha1": "b55f9cfd064b477b28cc7450b3d30dea9dd9a0a4",
    "size": 2126907
  },
  {
    "name": "radiocraft-neoforge-1.21.1-1.1.0.jar",
    "url": "https://cdn.modrinth.com/data/i9iitQG6/versions/n6y8nnqb/radiocraft-neoforge-1.21.1-1.1.0.jar",
    "sha1": "2076d4933a122435e4bad532e760355756a79966",
    "size": 1343469
  },
  {
    "name": "Immersive Vehicles-1.21.1-24.0.0.jar",
    "url": "http://82.67.63.61:8090/mods/Immersive%20Vehicles-1.21.1-24.0.0.jar",
    "sha1": "7050a332f18d390610029de28c13fb6139786607",
    "size": 6131756
  },
  {
    "name": "MTS Official Pack-1.21.1-V29.jar",
    "url": "http://82.67.63.61:8090/mods/MTS%20Official%20Pack-1.21.1-V29.jar",
    "sha1": "7e7cc4389379cdb7addc1bb29ff1700099cee5bb",
    "size": 70999728
  },
  {
    "name": "lostcities-1.21-8.3.10.jar",
    "url": "http://82.67.63.61:8090/mods/lostcities-1.21-8.3.10.jar",
    "sha1": "92244687959aa4170faeb9ffedd5a8952db76617",
    "size": 1239484
  },
  {
    "name": "lootr-neoforge-1.21.1-1.11.37.120.jar",
    "url": "https://cdn.modrinth.com/data/EltpO5cN/versions/C2tLycH2/lootr-neoforge-1.21.1-1.11.37.120.jar",
    "sha1": "a8acaf64fb3991526bfe7456189ccde247334265",
    "size": 976023
  },
  {
    "name": "sound-physics-remastered-neoforge-1.21.1-1.5.1.jar",
    "url": "https://cdn.modrinth.com/data/qyVF9oeo/versions/Dd2tmpsk/sound-physics-remastered-neoforge-1.21.1-1.5.1.jar",
    "sha1": "a5ac35ccb902231047709530a5708fb71dc3e3b5",
    "size": 202454
  },
  {
    "name": "jei-1.21.1-neoforge-19.27.0.340.jar",
    "url": "https://cdn.modrinth.com/data/u6dRKJwZ/versions/YAcQ6elZ/jei-1.21.1-neoforge-19.27.0.340.jar",
    "sha1": "27d0d85e7e32e926fc3664ab6815df5cdabb7941",
    "size": 1529391
  },
  {
    "name": "alexsmobs-1.22.17.jar",
    "url": "https://cdn.modrinth.com/data/EmNhnNnt/versions/KSgki4uc/alexsmobs-1.22.17.jar",
    "sha1": "5070e8070f60650d773bfd9f1d031496f8f50259",
    "size": 26620546
  },
  {
    "name": "citadel-1.21.1-2.7.6.jar",
    "url": "https://cdn.modrinth.com/data/XjY0RcQj/versions/mIylVpkN/citadel-1.21.1-2.7.6.jar",
    "sha1": "e0392370117ec16a721f8d65728944398de77607",
    "size": 3028943
  },
  {
    "name": "LEndersCataclysm-1.21.1-3.27.jar",
    "url": "https://cdn.modrinth.com/data/46KJle7n/versions/RM2acghH/L_Ender%27s%20Cataclysm%201.21.1-3.27.jar",
    "sha1": "f34a5e3994fff1953c631b87b3dfa89ed62c26dc",
    "size": 73346519
  },
  {
    "name": "naturalist-1.0.2-neoforge-1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/F8BQNPWX/versions/t5ONaov5/naturalist-1.0.2-neoforge-1.21.1.jar",
    "sha1": "d026c2c4ac66a9bc656e9b894683d1131054a80a",
    "size": 5028168
  },
  {
    "name": "curios-neoforge-9.5.1+1.21.1.jar",
    "url": "https://cdn.modrinth.com/data/vvuO3ImH/versions/yohfFbgD/curios-neoforge-9.5.1%2B1.21.1.jar",
    "sha1": "418fcd42e3a7844c9bdc71c9b6401fdb3894e0c4",
    "size": 410690
  },
  {
    "name": "lionfishapi-2.8.jar",
    "url": "https://cdn.modrinth.com/data/FoVacERa/versions/EuxMIyMd/lionfishapi-2.8.jar",
    "sha1": "414fdd581bdb86f1dd1acc0adb0573f92e8d8a91",
    "size": 141562
  },
  {
    "name": "smallships-neoforge-1.21.1-2.0.0-b2.1.jar",
    "url": "https://cdn.modrinth.com/data/rGWEHQrP/versions/6poGZvvr/smallships-neoforge-1.21.1-2.0.0-b2.1.jar",
    "sha1": "aa586dc4339d49db1c988497415d197195849fb9",
    "size": 1914804
  },
  {
    "name": "immersive_aircraft-1.4.6+1.21.1-neoforge.jar",
    "url": "https://cdn.modrinth.com/data/x3HZvrj6/versions/RkWu0N4D/immersive_aircraft-1.4.6%2B1.21.1-neoforge.jar",
    "sha1": "f9bc465d0b64735ad3c3f1a5beadd796405825f1",
    "size": 2447578
  }
],
  // Pack de ressources + scripts KubeJS : désormais EMBARQUÉS dans le launcher
  // (cf. services/resources.ts + bundledResources.ts), plus de téléchargement :8090.
  resources: [],
  enforceModSync: true,
  branding: {
    appName: 'Zarn',
    primaryColor: '#3DDC84',
    accentColor: '#FF7A18',
    logoUrl: '',
    backgroundUrl: '',
    discordUrl: '',
    websiteUrl: 'https://casatropia.fr'
  },
  news: [
    {
      id: 'apocalypse-tropicale',
      title: 'Saison 1 — Apocalypse Tropicale',
      body: 'Largage en zone. L’archipel est infecté : survis le jour, tiens la nuit. Branche le manifeste du modpack (NeoForge 1.21.1 + pack apoc) dans le panneau Admin.',
      date: new Date().toISOString().slice(0, 10),
      tag: 'Saison'
    }
  ],
  recommendedRamMb: 4096
}

export function defaultSettings(gameDir: string): LauncherSettings {
  return {
    manifestUrl: 'http://82.67.63.61:8090/distribution.json',
    gameDir,
    javaPath: '',
    ramMb: 4096,
    resolution: { width: 1280, height: 720, fullscreen: false },
    jvmArgs:
      '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M',
    keepLauncherOpen: false,
    autoConnect: true,
    seasonalEffect: 'auto',
    skinId: null
  }
}

export function defaultStats(): PlayStats {
  return {
    totalMs: 0,
    sessions: 0,
    launches: 0,
    firstLaunchAt: null,
    lastPlayedDate: null,
    streakDays: 0,
    longestSessionMs: 0,
    achievements: []
  }
}
