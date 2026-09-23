import { Matrix4, Quaternion, Vector3 } from 'three'

// Matriz -> props position/quaternion/scale do R3F. A prop `matrix` com
// matrixAutoUpdate={false} não é aplicada a tempo de medir a caixa envolvente.
export function decompose(matrix: Matrix4) {
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)
  return { position, quaternion, scale }
}
