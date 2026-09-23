import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { Box3, Euler, Matrix4, Vector3, type Mesh, type MeshStandardMaterial } from 'three'
import { decompose } from './decompose'
import type { PendantModel } from '../catalog'

// Pingente carregado de .glb. Qualquer arquivo entra na mesma convenção dos
// procedurais: frente em +Z, altura = heightCm e topo (encaixe) em y = 0.
// A transformação vai no objeto (não na geometria) porque o arquivo
// otimizado usa vértices quantizados.
export function ModelPendant({ spec, metal }: { spec: PendantModel; metal: MeshStandardMaterial }) {
  const { scene } = useGLTF(spec.url)

  const { source, matrix } = useMemo(() => {
    scene.updateMatrixWorld(true)
    const source = scene.getObjectByName(spec.mesh) as Mesh | undefined
    if (!source) throw new Error(`Malha "${spec.mesh}" não encontrada em ${spec.url}`)

    const oriented = new Matrix4()
      .makeRotationFromEuler(new Euler(...spec.rotation))
      .multiply(source.matrixWorld)

    const box = new Box3()
    const pos = source.geometry.getAttribute('position')
    const v = new Vector3()
    for (let i = 0; i < pos.count; i++) box.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(oriented))

    const size = box.getSize(new Vector3())
    const k = spec.heightCm / size.y
    const center = box.getCenter(new Vector3())
    const matrix = new Matrix4()
      .makeTranslation(-center.x * k, -box.max.y * k, -center.z * k)
      .multiply(new Matrix4().makeScale(k, k, k))
      .multiply(oriented)
    return { source, matrix }
  }, [scene, spec])

  // Modelo com textura própria: mantém relevo, pátina e mapa de metal, e tinge
  // com a cor do banho (a não ser que seja policromado: tint: false).
  // Modelo sem textura nenhuma: usa o metal do banho direto.
  const material = useMemo(() => {
    const original = source.material as MeshStandardMaterial
    const textured = Boolean(original.map || original.normalMap || original.metalnessMap)
    if (!textured) return null
    const m = original.clone()
    if (spec.tint !== false) m.color.copy(metal.color)
    return m
  }, [source, metal, spec.tint])
  useEffect(() => () => material?.dispose(), [material])

  return <mesh geometry={source.geometry} material={material ?? metal} {...decompose(matrix)} />
}
