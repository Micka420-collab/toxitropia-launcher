import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles, useTexture } from '@react-three/drei'
import * as THREE from 'three'

import grassTopUrl from '@/assets/blocks/grass_block_top.png'
import grassSideUrl from '@/assets/blocks/grass_block_side.png'
import dirtUrl from '@/assets/blocks/dirt.png'
import logUrl from '@/assets/blocks/oak_log.png'
import logTopUrl from '@/assets/blocks/oak_log_top.png'
import planksUrl from '@/assets/blocks/oak_planks.png'
import cobbleUrl from '@/assets/blocks/cobblestone.png'
import diamondOreUrl from '@/assets/blocks/diamond_ore.png'
import goldOreUrl from '@/assets/blocks/gold_ore.png'
import emeraldUrl from '@/assets/blocks/emerald_block.png'
import diamondBlockUrl from '@/assets/blocks/diamond_block.png'
import craftTopUrl from '@/assets/blocks/crafting_table_top.png'
import craftSideUrl from '@/assets/blocks/crafting_table_side.png'
import craftFrontUrl from '@/assets/blocks/crafting_table_front.png'
import tntSideUrl from '@/assets/blocks/tnt_side.png'
import tntTopUrl from '@/assets/blocks/tnt_top.png'
import glowstoneUrl from '@/assets/blocks/glowstone.png'
import redstoneOreUrl from '@/assets/blocks/redstone_ore.png'
import bricksUrl from '@/assets/blocks/bricks.png'
import mossyUrl from '@/assets/blocks/mossy_cobblestone.png'
import crackedUrl from '@/assets/blocks/cracked_stone_bricks.png'
import netherrackUrl from '@/assets/blocks/netherrack.png'
import gravelUrl from '@/assets/blocks/gravel.png'
import coalOreUrl from '@/assets/blocks/coal_ore.png'

type BlockType =
  | 'grass'
  | 'log'
  | 'craft'
  | 'tnt'
  | 'diamondOre'
  | 'goldOre'
  | 'emerald'
  | 'diamondBlock'
  | 'cobble'
  | 'glowstone'
  | 'redstoneOre'
  | 'bricks'
  | 'planks'
  | 'mossy'
  | 'cracked'
  | 'netherrack'
  | 'gravel'
  | 'coalOre'

// Friche post-apo : débris de pierre/gravats dominants, rares lueurs (lave, redstone, TNT).
// Les trésors (diamant/or/émeraude) sont quasi disparus — vestiges d'un monde effondré.
const TYPES: BlockType[] = [
  'cobble',
  'cobble',
  'cracked',
  'cracked',
  'mossy',
  'gravel',
  'gravel',
  'netherrack',
  'coalOre',
  'coalOre',
  'bricks',
  'log',
  'redstoneOre',
  'tnt',
  'craft',
  'diamondOre',
  'goldOre'
]

interface BlockDef {
  type: BlockType
  pos: [number, number, number]
  scale: number
  speed: number
  dir: number
  tilt: [number, number, number]
}

function makeBlocks(n: number): BlockDef[] {
  const arr: BlockDef[] = []
  for (let i = 0; i < n; i++) {
    arr.push({
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
      pos: [(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 8, -2 - Math.random() * 7],
      scale: 0.55 + Math.random() * 1.05,
      speed: 0.35 + Math.random() * 0.85,
      dir: Math.random() > 0.5 ? 1 : -1,
      tilt: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
    })
  }
  return arr
}

/** Filtre « pixel art » net (nearest) + espace colorimétrique correct. */
function pixelate(t: THREE.Texture): THREE.Texture {
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestMipmapNearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  t.generateMipmaps = true
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

interface MatOpts {
  color?: number
  emissive?: number
  emissiveMap?: THREE.Texture
  emissiveIntensity?: number
  roughness?: number
  metalness?: number
}

function useBlockMaterials(): Record<BlockType, THREE.Material[]> {
  const tex = useTexture({
    grassTop: grassTopUrl,
    grassSide: grassSideUrl,
    dirt: dirtUrl,
    log: logUrl,
    logTop: logTopUrl,
    planks: planksUrl,
    cobble: cobbleUrl,
    diamondOre: diamondOreUrl,
    goldOre: goldOreUrl,
    emerald: emeraldUrl,
    diamondBlock: diamondBlockUrl,
    craftTop: craftTopUrl,
    craftSide: craftSideUrl,
    craftFront: craftFrontUrl,
    tntSide: tntSideUrl,
    tntTop: tntTopUrl,
    glowstone: glowstoneUrl,
    redstoneOre: redstoneOreUrl,
    bricks: bricksUrl,
    mossy: mossyUrl,
    cracked: crackedUrl,
    netherrack: netherrackUrl,
    gravel: gravelUrl,
    coalOre: coalOreUrl
  }) as Record<string, THREE.Texture>

  return useMemo(() => {
    Object.values(tex).forEach(pixelate)

    const mat = (map: THREE.Texture, o: MatOpts = {}): THREE.MeshStandardMaterial =>
      new THREE.MeshStandardMaterial({
        map,
        roughness: o.roughness ?? 0.92,
        metalness: o.metalness ?? 0.0,
        color: o.color ?? 0xffffff,
        emissive: o.emissive ?? 0x000000,
        emissiveMap: o.emissiveMap,
        emissiveIntensity: o.emissiveIntensity ?? 0
      })

    // Bloc uniforme : même matériau sur les 6 faces.
    const uni = (map: THREE.Texture, o?: MatOpts): THREE.Material[] => {
      const m = mat(map, o)
      return [m, m, m, m, m, m]
    }

    // Ordre des faces BoxGeometry : [+X, -X, +Y(haut), -Y(bas), +Z(face), -Z]
    const grassTopMat = mat(tex.grassTop, { color: 0x7cbf55, emissive: 0x2f5a22, emissiveIntensity: 0.12 })
    const grassSideMat = mat(tex.grassSide)
    const dirtMat = mat(tex.dirt)
    const grass = [grassSideMat, grassSideMat, grassTopMat, dirtMat, grassSideMat, grassSideMat]

    const logSideMat = mat(tex.log)
    const logTopMat = mat(tex.logTop)
    const log = [logSideMat, logSideMat, logTopMat, logTopMat, logSideMat, logSideMat]

    const craftTopMat = mat(tex.craftTop)
    const craftSideMat = mat(tex.craftSide)
    const craftFrontMat = mat(tex.craftFront)
    const planksMat = mat(tex.planks)
    const craft = [craftSideMat, craftSideMat, craftTopMat, planksMat, craftFrontMat, craftFrontMat]

    const tntSideMat = mat(tex.tntSide)
    const tntTopMat = mat(tex.tntTop)
    const tnt = [tntSideMat, tntSideMat, tntTopMat, tntTopMat, tntSideMat, tntSideMat]

    return {
      grass,
      log,
      craft,
      tnt,
      diamondOre: uni(tex.diamondOre, { emissive: 0x6fe5ff, emissiveMap: tex.diamondOre, emissiveIntensity: 0.3, metalness: 0.2 }),
      goldOre: uni(tex.goldOre, { emissive: 0xffcf52, emissiveMap: tex.goldOre, emissiveIntensity: 0.18, metalness: 0.25 }),
      emerald: uni(tex.emerald, { emissive: 0x36d96b, emissiveMap: tex.emerald, emissiveIntensity: 0.28, metalness: 0.2 }),
      diamondBlock: uni(tex.diamondBlock, { emissive: 0x6fe5ff, emissiveMap: tex.diamondBlock, emissiveIntensity: 0.2, metalness: 0.25 }),
      cobble: uni(tex.cobble, { color: 0xb7b3a8 }),
      glowstone: uni(tex.glowstone, { emissive: 0xffce6e, emissiveMap: tex.glowstone, emissiveIntensity: 1.0, roughness: 0.6 }),
      redstoneOre: uni(tex.redstoneOre, { emissive: 0xff2b2b, emissiveMap: tex.redstoneOre, emissiveIntensity: 0.6 }),
      bricks: uni(tex.bricks, { color: 0xc2998a }),
      planks: uni(tex.planks),
      mossy: uni(tex.mossy, { color: 0x9aa07f }),
      cracked: uni(tex.cracked, { color: 0xa8a399 }),
      netherrack: uni(tex.netherrack, { emissive: 0x7a1d10, emissiveMap: tex.netherrack, emissiveIntensity: 0.35 }),
      gravel: uni(tex.gravel, { color: 0x9c958a }),
      coalOre: uni(tex.coalOre, { color: 0x8f8a82 })
    }
  }, [tex])
}

function Block({
  def,
  mats,
  geo
}: {
  def: BlockDef
  mats: THREE.Material[]
  geo: THREE.BoxGeometry
}): JSX.Element {
  const spin = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const g = spin.current
    if (!g) return
    g.rotation.x += dt * 0.12 * def.speed * def.dir
    g.rotation.y += dt * 0.18 * def.speed
  })
  return (
    <group position={def.pos}>
      <Float speed={1 + def.speed} rotationIntensity={0.45} floatIntensity={1.3}>
        <group ref={spin} rotation={def.tilt}>
          <mesh geometry={geo} material={mats} scale={def.scale} castShadow={false} />
        </group>
      </Float>
    </group>
  )
}

function Scene({ accent, accent2 }: { accent: string; accent2: string }): JSX.Element {
  const blocks = useMemo(() => makeBlocks(16), [])
  const materials = useBlockMaterials()
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const group = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const drift = useRef(0)

  useEffect(() => {
    const onMove = (e: PointerEvent): void => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    drift.current += dt * 0.04
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, pointer.current.x * 0.25 + drift.current, 0.05)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.current.y * 0.14, 0.05)
  })

  return (
    <>
      <fog attach="fog" args={['#0a0b09', 7, 21]} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={[accent2, '#0a0b09', 0.35]} />
      <directionalLight position={[6, 9, 5]} intensity={1.15} color={'#cdd0bf'} />
      <pointLight position={[-8, -2, 3]} intensity={42} color={accent} distance={28} />
      <pointLight position={[9, 5, 2]} intensity={20} color={accent2} distance={26} />
      <pointLight position={[2, -6, 4]} intensity={22} color={'#c2342a'} distance={22} />
      <group ref={group}>
        {blocks.map((b, i) => (
          <Block key={i} def={b} mats={materials[b.type]} geo={geo} />
        ))}
      </group>
      {/* Spores radioactives + cendres en suspension */}
      <Sparkles count={55} scale={[20, 11, 9]} size={2.1} speed={0.22} color={accent2} opacity={0.45} />
      <Sparkles count={40} scale={[18, 10, 7]} size={3.4} speed={0.1} color={'#6b6256'} opacity={0.32} />
    </>
  )
}

export function BackgroundScene({
  accent = '#8fc026',
  accent2 = '#c2e85a'
}: {
  accent?: string
  accent2?: string
}): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Scene accent={accent} accent2={accent2} />
        </Suspense>
      </Canvas>
    </div>
  )
}
