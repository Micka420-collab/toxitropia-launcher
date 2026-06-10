#!/usr/bin/env node
// Résout les 3 mods de contenu serveur restants (perdus par la régression du manifeste
// client en 1.3.1) : OCP véhicules + Zombie Awareness + CoroUtil. Vérifie les sha1 contre
// les valeurs documentées en mémoire projet.
const API = 'https://api.modrinth.com/v2'
const UA = 'toxitropia-launcher-resolver/1.0 (contact: micka.delcato.rp@gmail.com)'
const GV = '1.21.1', LOADER = 'neoforge'

// slug → { hint, expectSha1 (mémoire, optionnel) }
const TARGETS = [
  { slug: 'immersive-vehicles-official-content-pack', hint: null, expect: null },
  { slug: 'zombie-awareness', hint: '1.13.2', expect: '266a95f6' },
  { slug: 'coroutil', hint: '1.3.8', expect: 'b044c51d' }
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function api(p) { const r = await fetch(`${API}${p}`, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error(`HTTP ${r.status} ${p}`); return r.json() }

function pick(vs, hint) { if (!vs.length) return null; if (hint) { const m = vs.find((v) => (v.version_number || '').includes(hint)); if (m) return m } return vs[0] }

const out = []
for (const t of TARGETS) {
  const vs = await api(`/project/${t.slug}/version?loaders=["${LOADER}"]&game_versions=["${GV}"]`)
  const v = pick(vs, t.hint)
  if (!v) { console.error(`✗ ${t.slug}: aucune version ${LOADER} ${GV}`); continue }
  const f = v.files.find((x) => x.primary) || v.files[0]
  const entry = { name: f.filename, url: f.url, sha1: f.hashes?.sha1, size: f.size }
  const okSha = !t.expect || (f.hashes?.sha1 || '').startsWith(t.expect)
  console.error(`${okSha ? '✓' : '⚠'} ${t.slug.padEnd(40)} ${v.version_number}  sha1=${f.hashes?.sha1?.slice(0, 8)}${t.expect ? ` (attendu ${t.expect})` : ''}`)
  const reqDeps = (v.dependencies || []).filter((d) => d.dependency_type === 'required')
  if (reqDeps.length) console.error('    deps requises:', reqDeps.map((d) => d.project_id || d.file_name).join(', '))
  out.push(entry)
  await sleep(150)
}
console.log(JSON.stringify(out, null, 2))
