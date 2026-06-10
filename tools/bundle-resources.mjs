// Embarque le pack de ressources + les scripts KubeJS dans le launcher (base64),
// pour que le client n'ait plus à les télécharger depuis :8090 (source d'un échec
// de sha1 quand le fichier change). Régénère src/main/services/bundledResources.ts.
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const apoc = join(here, '..', '..', 'apoc-server')

const FILES = {
  'casatropia-apoc.zip': join(apoc, 'casatropia-apoc.zip'),
  'apoc_ui.js': join(apoc, 'pack', 'kubejs', 'startup_scripts', 'apoc_ui.js'),
  'apoc_items.js': join(apoc, 'pack', 'kubejs', 'startup_scripts', 'apoc_items.js')
}

let out =
  '// AUTO-GÉNÉRÉ par tools/bundle-resources.mjs — NE PAS éditer à la main.\n' +
  '// Ressources Zarn embarquées (base64) : pack + scripts KubeJS écrits au lancement.\n' +
  'export const BUNDLED_RESOURCES: Record<string, string> = {\n'
for (const [name, p] of Object.entries(FILES)) {
  const b64 = readFileSync(p).toString('base64')
  out += `  ${JSON.stringify(name)}: ${JSON.stringify(b64)},\n`
  console.log(`${name}: ${statSync(p).size} o → ${b64.length} o base64`)
}
out += '}\n'

const dest = join(here, '..', 'src', 'main', 'services', 'bundledResources.ts')
writeFileSync(dest, out)
console.log(`OK → ${dest}`)
