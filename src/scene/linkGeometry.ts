import {
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { ChainId } from '../catalog'

// Cada estilo de corrente é UM elo repetido ao longo da curva (instancing).
// Convenção: o eixo X do elo aponta na direção da corrente.
export type LinkSpec = {
  geometry: BufferGeometry
  pitch: number // distância entre centros de elos consecutivos
  alternate: boolean // gira 90° a cada elo (entrelaçado)
  // Onde a argola do pingente se apoia, relativo ao centro do elo.
  hangOffset: number
}

function ovalLink(s: number): LinkSpec {
  const a = 0.16 * s
  const b = 0.095 * s
  const tube = 0.03 * s
  const points = Array.from({ length: 32 }, (_, i) => {
    const t = (i / 32) * Math.PI * 2
    return new Vector3(a * Math.cos(t), b * Math.sin(t), 0)
  })
  const path = new CatmullRomCurve3(points, true)
  return {
    geometry: new TubeGeometry(path, 64, tube, 10, true),
    pitch: 2 * (a - tube),
    alternate: true,
    hangOffset: -b + tube,
  }
}

function ballLink(s: number): LinkSpec {
  const radius = 0.075 * s
  const pitch = 0.2 * s
  const ball = new SphereGeometry(radius, 20, 14)
  const neck = new CylinderGeometry(0.018 * s, 0.018 * s, pitch, 8)
  neck.rotateZ(Math.PI / 2)
  neck.translate(pitch / 2, 0, 0)
  return {
    geometry: mergeGeometries([ball, neck])!,
    pitch,
    alternate: false,
    hangOffset: -radius,
  }
}

function boxLink(s: number): LinkSpec {
  const size = 0.15 * s
  return {
    geometry: new RoundedBoxGeometry(size, size, size, 2, size * 0.18),
    pitch: size * 1.12,
    alternate: false,
    hangOffset: -size / 2,
  }
}

export function linkSpec(style: ChainId, scale: number): LinkSpec {
  switch (style) {
    case 'cadeado':
      return ovalLink(scale)
    case 'bolinha':
      return ballLink(scale)
    case 'veneziana':
      return boxLink(scale)
  }
}
