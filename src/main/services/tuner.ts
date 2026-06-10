import type { SystemInfo, TuningRecommendation } from '@shared/types'

/** Drapeaux JVM « Aikar » optimisés pour Minecraft, adaptés à la RAM allouée. */
export function aikarFlags(ramMb: number): string {
  const big = ramMb >= 12_288
  const base = [
    '-XX:+UseG1GC',
    '-XX:+ParallelRefProcEnabled',
    '-XX:MaxGCPauseMillis=200',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:+DisableExplicitGC',
    '-XX:+AlwaysPreTouch',
    '-XX:G1HeapWastePercent=5',
    '-XX:G1MixedGCCountTarget=4',
    '-XX:G1MixedGCLiveThresholdPercent=90',
    '-XX:G1RSetUpdatingPauseTimePercent=5',
    '-XX:SurvivorRatio=32',
    '-XX:+PerfDisableSharedMem',
    '-XX:MaxTenuringThreshold=1'
  ]
  const tuned = big
    ? [
        '-XX:G1NewSizePercent=40',
        '-XX:G1MaxNewSizePercent=50',
        '-XX:G1HeapRegionSize=16M',
        '-XX:G1ReservePercent=15',
        '-XX:InitiatingHeapOccupancyPercent=20'
      ]
    : [
        '-XX:G1NewSizePercent=30',
        '-XX:G1MaxNewSizePercent=40',
        '-XX:G1HeapRegionSize=8M',
        '-XX:G1ReservePercent=20',
        '-XX:InitiatingHeapOccupancyPercent=15'
      ]
  return [...base, ...tuned].join(' ')
}

function recommendRam(total: number, manifestRecMb: number, modCount: number): number {
  const reserve = Math.min(6144, Math.max(2048, Math.round(total * 0.25)))
  const usable = Math.max(2048, total - reserve)
  let rec = Math.max(manifestRecMb || 4096, 4096)
  if (modCount > 150) rec = Math.max(rec, 8192)
  else if (modCount > 80) rec = Math.max(rec, 6144)
  rec = Math.min(rec, usable)
  rec = Math.max(2048, Math.round(rec / 512) * 512)
  return rec
}

function score(sys: SystemInfo): { value: number; label: string } {
  let s = 0
  s += sys.totalRamMb >= 32_000 ? 4 : sys.totalRamMb >= 16_000 ? 3.2 : sys.totalRamMb >= 8_000 ? 2.2 : sys.totalRamMb >= 4_000 ? 1.2 : 0.5
  s += sys.cores >= 16 ? 3 : sys.cores >= 8 ? 2.5 : sys.cores >= 6 ? 2 : sys.cores >= 4 ? 1.4 : 0.7
  s += sys.arch === 'x64' || sys.arch === 'arm64' ? 2 : 0
  s += sys.freeRamMb >= 8_000 ? 1 : sys.freeRamMb >= 4_000 ? 0.6 : 0.2
  const value = Math.max(0, Math.min(10, Math.round(s * 10) / 10))
  const label =
    value >= 8.5 ? 'Excellent' : value >= 7 ? 'Très bon' : value >= 5 ? 'Bon' : value >= 3 ? 'Correct' : 'Limité'
  return { value, label }
}

export function computeTuning(
  sys: SystemInfo,
  manifestRecMb: number,
  modCount: number,
  currentRamMb: number
): TuningRecommendation {
  const recommendedRamMb = recommendRam(sys.totalRamMb, manifestRecMb, modCount)
  const jvmArgs = aikarFlags(recommendedRamMb)
  const { value, label } = score(sys)
  const gb = (mb: number): string => (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)
  const notes = [
    `RAM optimale : ${gb(recommendedRamMb)} Go sur ${gb(sys.totalRamMb)} Go installés`,
    `Processeur : ${sys.cores} cœurs détectés`,
    'Drapeaux JVM Aikar (G1GC) optimisés pour Minecraft',
    sys.arch === 'x64' || sys.arch === 'arm64'
      ? 'Système 64 bits — compatible avec une grande allocation mémoire'
      : 'Système 32 bits — allocation mémoire limitée'
  ]
  return {
    recommendedRamMb,
    jvmArgs,
    score: value,
    scoreLabel: label,
    notes,
    current: { ramMb: currentRamMb, matchesRam: currentRamMb === recommendedRamMb }
  }
}
