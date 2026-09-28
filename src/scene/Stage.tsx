import { Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import {
  Box3,
  CanvasTexture,
  MathUtils,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  SRGBColorSpace,
  Vector3,
  type Group,
  type PerspectiveCamera,
} from 'three'
import { useShallow } from 'zustand/react/shallow'
import { metals, pendants, type PendantModel } from '../catalog'
import { useConfig } from '../store'
import { Necklace } from './Necklace'

// Baixa os pingentes em .glb já no início: trocar de pingente fica instantâneo.
for (const p of Object.values(pendants) as { model?: PendantModel }[]) if (p.model) useGLTF.preload(p.model.url)

// Enquadra a peça inteira sempre que o tamanho ou o pingente muda: mira no centro da
// caixa envolvente e afasta a câmera até caber na altura e na largura da tela.
const VIEW_DIR = new Vector3(0, 0.25, 1).normalize()
const FILL = 0.82 // fração da tela ocupada pela peça

function Frame({ on, children }: { on: unknown; children: ReactNode }) {
  const group = useRef<Group>(null)
  const { camera, size, controls } = useThree()

  useLayoutEffect(() => {
    const cam = camera as PerspectiveCamera
    const box = new Box3().setFromObject(group.current!)
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
      (i) =>
        new Vector3(
          i & 1 ? box.max.x : box.min.x,
          i & 2 ? box.max.y : box.min.y,
          i & 4 ? box.max.z : box.min.z,
        ),
    )
    const target = box.getCenter(new Vector3())
    let distance = box.getSize(new Vector3()).length() * 1.5

    // Com perspectiva e câmera inclinada, a parte de baixo (mais perto) "cresce".
    // Ajusta distância e mira algumas vezes projetando os cantos da caixa na tela.
    for (let i = 0; i < 4; i++) {
      cam.position.copy(target).addScaledVector(VIEW_DIR, distance)
      cam.lookAt(target)
      cam.updateMatrixWorld()
      const ndc = new Box3().setFromPoints(corners.map((c) => c.clone().project(cam)))
      const spread = Math.max(ndc.max.x - ndc.min.x, ndc.max.y - ndc.min.y)
      const up = new Vector3().setFromMatrixColumn(cam.matrixWorld, 1)
      const right = new Vector3().setFromMatrixColumn(cam.matrixWorld, 0)
      const halfH = distance * Math.tan(MathUtils.degToRad(cam.fov / 2))
      target
        .addScaledVector(up, ((ndc.max.y + ndc.min.y) / 2) * halfH)
        .addScaledVector(right, ((ndc.max.x + ndc.min.x) / 2) * halfH * cam.aspect)
      distance *= spread / 2 / FILL
    }

    cam.position.copy(target).addScaledVector(VIEW_DIR, distance)
    cam.lookAt(target)
    const orbit = controls as unknown as { target: Vector3; update: () => void } | null
    orbit?.target.copy(target)
    orbit?.update()
  }, [on, camera, size, controls])

  return <group ref={group}>{children}</group>
}

// Fundo dentro da cena (e não só no CSS): o bloom precisa de algo para brilhar
// por cima, e o degradê escuro é o que faz o metal "saltar".
function Backdrop() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(256, 200, 20, 256, 256, 330)
    gradient.addColorStop(0, '#6a1a44')
    gradient.addColorStop(0.55, '#340f22')
    gradient.addColorStop(1, '#12060d')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    return map
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return <primitive object={texture} attach="background" />
}

// Iluminação de estúdio de joalheria, feita só de "softboxes" refletidas
// (sem HDRI externo). O que vende a peça é o reflexo, não a luz direta:
// principal ampla + contornos laterais estreitos + glints pequenos e fortes.
function StudioLights() {
  return (
    <>
      <Environment resolution={512} frames={1} environmentIntensity={1.15}>
        <color attach="background" args={['#0b0807']} />

        {/* principal: softbox grande em cima e à frente, levemente quente */}
        <Lightformer form="rect" color="#fff4e2" intensity={4} position={[-3, 9, 7]} scale={[14, 10, 1]} target={[0, 0, 0]} />
        {/* preenchimento frontal: tira as faces planas do breu, sem achatar */}
        <Lightformer form="rect" intensity={0.55} position={[0, -1, 14]} scale={[34, 22, 1]} target={[0, 0, 0]} />
        {/* contornos: faixas estreitas e fortes nas laterais desenham o fio de
            brilho que corre pela corrente e pelas bordas do pingente */}
        <Lightformer form="rect" color="#fff0da" intensity={7} position={[-8, 1, 4]} scale={[0.7, 20, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" color="#eaf2ff" intensity={5.5} position={[8, 1, 4]} scale={[0.6, 20, 1]} target={[0, 0, 0]} />
        {/* contraluz alta: separa a peça do fundo */}
        <Lightformer form="rect" intensity={5} position={[0, 10, -9]} scale={[18, 4, 1]} target={[0, 0, 0]} />
        {/* rebote de baixo: levanta a parte inferior dos elos */}
        <Lightformer form="rect" color="#ffe8cc" intensity={1.2} position={[0, -9, 6]} scale={[18, 5, 1]} target={[0, 0, 0]} />
        {/* glints: pequenos e intensos, viram os pontinhos de brilho no metal */}
        <Lightformer form="circle" intensity={16} position={[-5, 6, 9]} scale={0.9} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={12} position={[6, 3, 8]} scale={0.7} target={[0, 0, 0]} />
        <Lightformer form="circle" color="#fff1d8" intensity={10} position={[2, -5, 9]} scale={0.5} target={[0, 0, 0]} />
      </Environment>

      {/* luz direta discreta: dá volume às partes não metálicas (esmalte,
          pedras) que o mapa de ambiente sozinho deixa chapadas */}
      <directionalLight position={[4, 8, 10]} intensity={1.6} color="#fff6ea" />
      <directionalLight position={[-6, 2, 6]} intensity={0.5} color="#dce6ff" />
    </>
  )
}

export function Stage() {
  const config = useConfig(
    useShallow(({ chain, thickness, length, pendant, metal }) => ({ chain, thickness, length, pendant, metal })),
  )

  // Troca de banho = só um material novo (cor/rugosidade), sem recarregar geometria.
  const metal = useMemo(() => {
    const { color, roughness } = metals[config.metal]
    return new MeshStandardMaterial({ metalness: 1, color, roughness })
  }, [config.metal])
  useEffect(() => () => metal.dispose(), [metal])
  const gem = useMemo(
    () =>
      // Pedra: transmissão total deixaria o fundo escuro atravessar e a pedra
      // some. Um pouco menos de transmissão + reflexo forte dá o brilho de lapidação.
      new MeshPhysicalMaterial({
        transmission: 0.85,
        thickness: 0.25,
        ior: 2.2,
        dispersion: 8,
        roughness: 0.02,
        metalness: 0,
        flatShading: true,
        envMapIntensity: 5,
        specularIntensity: 1.2,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
    [],
  )

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 7, 30], fov: 30, near: 0.1, far: 500 }}
      gl={{ antialias: false, toneMapping: NeutralToneMapping, toneMappingExposure: 1.05 }}
    >
      <Backdrop />
      <StudioLights />
      <Suspense fallback={null}>
        <Frame on={`${config.length}-${config.pendant}`}>
          <Necklace {...config} metal={metal} gem={gem} />
        </Frame>
      </Suspense>
      <OrbitControls makeDefault zoomToCursor enablePan={false} minDistance={2} maxDistance={90} />
      {/* bloom só nos pontos mais claros: é o "brilho" da joia, sem lavar a imagem */}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.42} luminanceThreshold={0.95} luminanceSmoothing={0.2} radius={0.5} />
        <Vignette offset={0.3} darkness={0.45} />
      </EffectComposer>
    </Canvas>
  )
}
