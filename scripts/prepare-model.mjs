// Prepara um .glb baixado/exportado para uso no configurador.
//
//   npm run model -- <entrada.glb> <public/models/saida.glb> [opções]
//
// - --drop <regex> remove nós pelo nome (ex.: a corrente que vem junto com o pingente)
// - --simplify <0..1> reduz a malha (modelos de IA costumam vir com milhões de vértices)
// - --error <0..1> tolerância da simplificação (padrão 0.001; maior = mais agressivo)
// - --sloppy simplificação que ignora topologia; única que funciona bem em malhas
//   de IA, feitas de várias cascas soltas (exige --plain, pois refaz as normais)
// - --keep-color mantém as cores originais do modelo (peça policromada: esmalte,
//   pedras). Sem ele, a textura de cor vira cinza para o banho poder tingir.
// - --plain descarta texturas e UVs: a peça usa o metal do banho (bem mais leve,
//   e sem costuras de UV a simplificação vai muito mais longe)
// - a textura de cor vira tons de cinza, para o banho (ouro/prata/rosé) tingir
// - texturas redimensionadas para 1024px em WebP e malhas comprimidas (meshopt)
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, normals, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import fs from 'node:fs'

const [input, output, ...rest] = process.argv.slice(2)
if (!input || !output) {
  console.error('uso: npm run model -- <entrada.glb> <saida.glb> [--drop <regex>]')
  process.exit(1)
}
const flag = (name) => {
  const i = rest.indexOf(name)
  return i >= 0 ? rest[i + 1] : null
}
const dropArg = flag('--drop')
const drop = dropArg ? new RegExp(dropArg, 'i') : null
const ratio = flag('--simplify') ? Number(flag('--simplify')) : null
const error = flag('--error') ? Number(flag('--error')) : 0.001
const plain = rest.includes('--plain')
const keepColor = rest.includes('--keep-color')
const sloppy = rest.includes('--sloppy')

// Simplificação "sloppy" do meshoptimizer: não preserva topologia nem UVs, mas é
// a que realmente reduz malhas geradas por IA. Depois remapeia os vértices ainda
// usados e as normais são recalculadas.
async function sloppySimplify(doc, ratio, error) {
  await MeshoptSimplifier.ready
  for (const prim of doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())) {
    const indices = prim.getIndices()
    const position = prim.getAttribute('POSITION')
    if (!indices || !position) continue
    const src = new Uint32Array(indices.getArray())
    const pos = new Float32Array(position.getArray())
    const target = Math.max(3, Math.floor((src.length * ratio) / 3) * 3)
    const [dst] = MeshoptSimplifier.simplifySloppy(src, pos, 3, null, target, error)

    const remap = new Map()
    const kept = []
    const out = new Uint32Array(dst.length)
    for (let i = 0; i < dst.length; i++) {
      const old = dst[i]
      let next = remap.get(old)
      if (next === undefined) {
        next = kept.length
        remap.set(old, next)
        kept.push(old)
      }
      out[i] = next
    }

    const packed = new Float32Array(kept.length * 3)
    for (let i = 0; i < kept.length; i++) packed.set(pos.subarray(kept[i] * 3, kept[i] * 3 + 3), i * 3)

    for (const name of prim.listSemantics()) if (name !== 'POSITION') prim.setAttribute(name, null)
    position.setArray(packed)
    indices.setArray(out)
  }
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
const doc = await io.read(input)
const root = doc.getRoot()

if (drop) {
  for (const node of root.listNodes()) {
    if (drop.test(node.getName())) {
      console.log('removendo', node.getName())
      node.dispose()
    }
  }
}

if (plain) {
  for (const prim of root.listMeshes().flatMap((m) => m.listPrimitives())) {
    for (const name of prim.listSemantics()) if (name.startsWith('TEXCOORD')) prim.setAttribute(name, null)
  }
  for (const material of root.listMaterials()) {
    material
      .setBaseColorTexture(null)
      .setMetallicRoughnessTexture(null)
      .setNormalTexture(null)
      .setOcclusionTexture(null)
      .setEmissiveTexture(null)
      .setBaseColorFactor([1, 1, 1, 1])
      .setMetallicFactor(1)
      .setRoughnessFactor(0.25)
  }
}

for (const material of plain || keepColor ? [] : root.listMaterials()) {
  const tex = material.getBaseColorTexture()
  if (!tex) continue
  const gray = await sharp(tex.getImage()).grayscale().png().toBuffer()
  tex.setImage(new Uint8Array(gray)).setMimeType('image/png')
  material.setBaseColorFactor([1, 1, 1, 1])
}

const before = root.listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + p.getAttribute('POSITION').getCount(), 0)

if (sloppy && ratio) {
  await doc.transform(weld())
  await sloppySimplify(doc, ratio, error)
}

await doc.transform(
  prune(),
  dedup(),
  ...(ratio && !sloppy ? [weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error })] : []),
  ...(sloppy ? [normals({ overwrite: true })] : []),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024] }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)

await io.write(output, doc)
const after = root.listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + p.getAttribute('POSITION').getCount(), 0)
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB'
console.log(`${input} (${kb(input)}, ${before} vértices) -> ${output} (${kb(output)}, ${after} vértices)`)
