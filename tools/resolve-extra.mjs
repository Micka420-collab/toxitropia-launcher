#!/usr/bin/env node
// Résout via l'API Modrinth les mods manquants côté client (détectés par le log de
// déconnexion NeoForge : canaux radiocraft / the_wasteland_reworked / mts requis serveur)
// + leurs dépendances REQUISES, pour NeoForge 1.21.1. Affiche les entrées {name,url,sha1,size}
// prêtes à insérer dans distribution.json, et un rapport de dépendances.
//
//   node tools/resolve-extra.mjs
//
// Node ≥ 18 (fetch natif). Aucune dépendance npm.

const API = 'https://api.modrinth.com/v2'
const UA = 'toxitropia-launcher-resolver/1.0 (contact: micka.delcato.rp@gmail.com)'
const GV = '1.21.1'
const LOADER = 'neoforge'

// slug → versionHint (sous-chaîne du version_number) ; null = dernière dispo
const TARGETS = [
  { slug: 'radiocraft', hint: null },
  { slug: 'the-wasteland', hint: null },
  { slug: 'immersive-vehicles', hint: null }
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(path) {
  const res = await fetch(`${API}${path}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`)
  return res.json()
}

async function versionsFor(slug) {
  return api(`/project/${slug}/version?loaders=["${LOADER}"]&game_versions=["${GV}"]`)
}

function pick(versions, hint) {
  if (!versions.length) return null
  if (hint) {
    const m = versions.find((v) => (v.version_number || '').includes(hint))
    if (m) return m
  }
  return versions[0] // Modrinth renvoie trié du plus récent au plus ancien
}

function fileOf(v) {
  const f = v.files.find((x) => x.primary) || v.files[0]
  return { name: f.filename, url: f.url, sha1: f.hashes?.sha1, size: f.size }
}

const seenProjects = new Map() // project_id -> slug

async function slugOf(projectId) {
  if (seenProjects.has(projectId)) return seenProjects.get(projectId)
  const p = await api(`/project/${projectId}`)
  seenProjects.set(projectId, p.slug)
  return p.slug
}

async function resolveOne(slug, hint, depth = 0) {
  const out = []
  const versions = await versionsFor(slug)
  const v = pick(versions, hint)
  if (!v) {
    console.error(`${'  '.repeat(depth)}✗ ${slug}: aucune version ${LOADER} ${GV}`)
    return out
  }
  const file = fileOf(v)
  out.push({ slug, version: v.version_number, file, deps: v.dependencies || [] })
  console.error(`${'  '.repeat(depth)}✓ ${slug.padEnd(28)} ${v.version_number}`)
  await sleep(120)
  // dépendances requises uniquement
  for (const d of v.dependencies || []) {
    if (d.dependency_type !== 'required') continue
    let depSlug
    try {
      depSlug = d.project_id ? await slugOf(d.project_id) : null
    } catch {
      depSlug = null
    }
    if (!depSlug) {
      console.error(`${'  '.repeat(depth + 1)}? dépendance non résolue (project_id=${d.project_id}, file=${d.file_name})`)
      continue
    }
    const sub = await resolveOne(depSlug, null, depth + 1)
    out.push(...sub)
  }
  return out
}

async function main() {
  const all = []
  for (const t of TARGETS) {
    const r = await resolveOne(t.slug, t.hint, 0)
    all.push(...r)
  }
  // dédup par nom de fichier
  const byName = new Map()
  for (const r of all) if (!byName.has(r.file.name)) byName.set(r.file.name, r)
  console.error('\n=== Entrées distribution.json (mods) ===')
  const entries = [...byName.values()].map((r) => r.file)
  console.log(JSON.stringify(entries, null, 2))
  console.error(`\n${entries.length} fichier(s) au total (mods + dépendances requises).`)
  console.error('Slugs:', [...byName.values()].map((r) => `${r.slug}@${r.version}`).join(', '))
}

main().catch((e) => { console.error(e); process.exit(1) })
