import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, Matrix4, TorusGeometry, Vector3, type Material, type MeshStandardMaterial } from 'three'
import { pendants, thicknesses, type PendantModel } from '../catalog'
import type { Config } from '../config'
import { decompose } from './decompose'
import { linkSpec } from './linkGeometry'
import { ModelPendant } from './ModelPendant'
import { necklaceCurve } from './necklaceCurve'
import { pendantParts } from './pendantGeometry'

const UP = new Vector3(0, 1, 0)
const BAIL_RADIUS = 0.12
const BAIL_TUBE = 0.028

// Base ortonormal no ponto u da curva: X = tangente (direção da corrente).
function frameAt(curve: ReturnType<typeof necklaceCurve>, u: number, roll: boolean) {
  const t = curve.getTangentAt(u)
  const b = new Vector3().crossVectors(t, UP)
  if (b.lengthSq() < 1e-6) b.set(0, 0, 1)
  b.normalize()
  const n = new Vector3().crossVectors(b, t)
  const m = roll ? new Matrix4().makeBasis(t, b, n.negate()) : new Matrix4().makeBasis(t, n, b)
  return m.setPosition(curve.getPointAt(u))
}

type Props = Pick<Config, 'chain' | 'thickness' | 'length' | 'pendant'> & {
  metal: MeshStandardMaterial
  gem: Material
}

export function Necklace({ chain, thickness, length, pendant, metal, gem }: Props) {
  const scale = thicknesses[thickness].scale
  const curve = useMemo(() => necklaceCurve(length), [length])
  const link = useMemo(() => linkSpec(chain, scale), [chain, scale])
  const parts = useMemo(() => pendantParts(pendant), [pendant])
  const model = (pendants[pendant] as { model?: PendantModel }).model
  const bail = useMemo(() => new TorusGeometry(BAIL_RADIUS, BAIL_TUBE, 12, 32).rotateY(Math.PI / 2), [])
  const clasp = useMemo(() => new TorusGeometry(0.2 * scale, 0.045 * scale, 12, 40), [scale])

  // Nº par de elos para o entrelaçado fechar certinho no fecho.
  let count = Math.max(2, Math.round(curve.getLength() / link.pitch))
  if (link.alternate && count % 2) count++

  const links = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = links.current!
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, frameAt(curve, i / count, link.alternate && i % 2 === 1))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
  }, [curve, link, count])

  useEffect(() => () => link.geometry.dispose(), [link])
  useEffect(() => () => clasp.dispose(), [clasp])
  useEffect(
    () => () => {
      parts?.metal.dispose()
      parts?.gem?.dispose()
    },
    [parts],
  )

  const front = curve.getPointAt(0)
  // A argola apoia no elo da frente; o pingente pende logo abaixo dela.
  const bailY = front.y + link.hangOffset - (BAIL_RADIUS - BAIL_TUBE)
  const pendantTop = bailY - BAIL_RADIUS - BAIL_TUBE + 0.02

  return (
    <group>
      {/* só `count` vai em args: mudar args recria a malha e zera as matrizes */}
      <instancedMesh key={count} ref={links} args={[undefined, undefined, count]} geometry={link.geometry} material={metal} />
      <mesh geometry={clasp} material={metal} {...decompose(frameAt(curve, 0.5, true))} />
      {(parts || model) && (
        <>
          <mesh geometry={bail} material={metal} position={[front.x, bailY, front.z]} />
          <group position={[front.x, pendantTop, front.z + 0.02]}>
            {model && <ModelPendant spec={model} metal={metal} />}
            {parts && <mesh geometry={parts.metal} material={metal} />}
            {parts?.gem && <mesh geometry={parts.gem} material={gem} />}
          </group>
        </>
      )}
    </group>
  )
}
