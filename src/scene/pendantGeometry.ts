import {
  Box3,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  TorusGeometry,
  Vector2,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { PendantId } from '../catalog'

// Pingentes procedurais (placeholders). Quando os modelos do Blender/IA
// chegarem, basta trocar por GLBs mantendo a mesma convenção:
// frente virada para +Z e topo da peça em y = 0 (ponto de encaixe na argola).
export type PendantParts = {
  metal: BufferGeometry
  gem?: BufferGeometry
}

function heart(): PendantParts {
  const s = new Shape()
  s.moveTo(25, 25)
  s.bezierCurveTo(25, 25, 20, 0, 0, 0)
  s.bezierCurveTo(-30, 0, -30, 35, -30, 35)
  s.bezierCurveTo(-30, 55, -10, 77, 25, 95)
  s.bezierCurveTo(60, 77, 80, 55, 80, 35)
  s.bezierCurveTo(80, 35, 80, 0, 50, 0)
  s.bezierCurveTo(35, 0, 25, 25, 25, 25)
  const g = new ExtrudeGeometry(s, {
    depth: 8,
    bevelEnabled: true,
    bevelThickness: 5,
    bevelSize: 4,
    bevelSegments: 6,
    curveSegments: 32,
  })
  g.rotateZ(Math.PI) // o shape original é de ponta-cabeça
  g.scale(1.5 / 95, 1.5 / 95, 1.5 / 95)
  return { metal: g }
}

function cross(): PendantParts {
  const w = 0.16 // meia largura da haste
  const h = 1.0 // meia altura
  const arm = 0.6 // meio braço
  const armY = 0.35 // altura dos braços
  const s = new Shape()
  s.moveTo(-w, -h)
  s.lineTo(w, -h)
  s.lineTo(w, armY - w)
  s.lineTo(arm, armY - w)
  s.lineTo(arm, armY + w)
  s.lineTo(w, armY + w)
  s.lineTo(w, h)
  s.lineTo(-w, h)
  s.lineTo(-w, armY + w)
  s.lineTo(-arm, armY + w)
  s.lineTo(-arm, armY - w)
  s.lineTo(-w, armY - w)
  s.closePath()
  const g = new ExtrudeGeometry(s, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 5,
  })
  return { metal: g }
}

function medal(): PendantParts {
  const disc = new CylinderGeometry(0.72, 0.72, 0.1, 72)
  disc.rotateX(Math.PI / 2)
  const rim = new TorusGeometry(0.72, 0.06, 16, 96)
  return { metal: mergeGeometries([disc.toNonIndexed(), rim.toNonIndexed()])! }
}

function solitaire(): PendantParts {
  // Lapidação brilhante simplificada: 16 facetas em torno do eixo.
  const r = 0.3
  const profile = [
    new Vector2(0, -r * 0.8), // culaça
    new Vector2(r, -0.01),
    new Vector2(r, 0.02), // cintura
    new Vector2(r * 0.6, r * 0.4), // mesa
    new Vector2(0, r * 0.4),
  ]
  const gem = new LatheGeometry(profile, 16)
  gem.rotateX(Math.PI / 2) // mesa virada para a frente
  const bezel = new TorusGeometry(r + 0.01, 0.045, 12, 48)
  return { metal: bezel, gem }
}

const builders: Partial<Record<PendantId, () => PendantParts>> = {
  coracao: heart,
  cruz: cross,
  medalha: medal,
  'ponto-de-luz': solitaire,
}

// Centraliza em X/Z e coloca o topo em y = 0.
function anchorTop(parts: PendantParts): PendantParts {
  const box = new Box3()
  for (const g of [parts.metal, parts.gem]) {
    if (!g) continue
    g.computeBoundingBox()
    box.union(g.boundingBox!)
  }
  const dx = -(box.min.x + box.max.x) / 2
  const dy = -box.max.y
  const dz = -(box.min.z + box.max.z) / 2
  parts.metal.translate(dx, dy, dz)
  parts.gem?.translate(dx, dy, dz)
  return parts
}

// null para "sem pingente" e para pingentes que vêm de arquivo (ModelPendant).
export function pendantParts(id: PendantId): PendantParts | null {
  const build = builders[id]
  return build ? anchorTop(build()) : null
}
