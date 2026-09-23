import { CatmullRomCurve3, Vector3 } from 'three'

// Unidade da cena: 1 = 1 cm.
// O colar é uma curva fechada em volta de um "pescoço" elíptico que cai na frente
// (θ = 0) formando o decote. A queda é ajustada até o perímetro bater com o
// comprimento escolhido, então 40 cm fica rente e 70 cm desce bem mais.
const NECK_RX = 6.5
const NECK_RZ = 5
const SAMPLES = 160

function shape(drop: number): Vector3[] {
  const points: Vector3[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const theta = (i / SAMPLES) * Math.PI * 2
    const fall = ((1 + Math.cos(theta)) / 2) ** 2
    points.push(
      new Vector3(
        NECK_RX * Math.sin(theta),
        -drop * fall,
        NECK_RZ * Math.cos(theta) + drop * 0.3 * fall, // apoia no colo ao descer
      ),
    )
  }
  return points
}

function perimeter(points: Vector3[]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) total += points[i].distanceTo(points[(i + 1) % points.length])
  return total
}

export function necklaceCurve(lengthCm: number): CatmullRomCurve3 {
  let lo = 0
  let hi = 60
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (perimeter(shape(mid)) < lengthCm) lo = mid
    else hi = mid
  }
  // getPointAt(0) = frente (onde fica o pingente), getPointAt(0.5) = nuca (fecho).
  return new CatmullRomCurve3(shape(lo), true, 'centripetal')
}
