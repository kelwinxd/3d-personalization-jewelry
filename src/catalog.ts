// Catálogo do configurador. Preços são placeholders — ajuste para os valores reais.

export const pieceTypes = {
  colar: { label: 'Colar', available: true },
  pulseira: { label: 'Pulseira', available: false },
  terco: { label: 'Terço', available: false },
} as const

export const metals = {
  ouro: { label: 'Ouro 18k', hint: 'Banho de ouro', color: '#f3c46b', roughness: 0.14, priceFactor: 1 },
  prata: { label: 'Prata 925', hint: 'Prata de lei', color: '#eceff2', roughness: 0.1, priceFactor: 1.15 },
  rose: { label: 'Ouro rosé', hint: 'Banho rosé', color: '#f1b39b', roughness: 0.14, priceFactor: 1.05 },
} as const

export const chains = {
  cadeado: { label: 'Cadeado', hint: 'Elos ovais entrelaçados', basePrice: 49.9, pricePerCm: 1.2 },
  bolinha: { label: 'Bolinha', hint: 'Esferas polidas', basePrice: 39.9, pricePerCm: 0.9 },
  veneziana: { label: 'Veneziana', hint: 'Elos quadrados', basePrice: 44.9, pricePerCm: 1.0 },
} as const

export const thicknesses = {
  fina: { label: 'Fina', scale: 0.75, priceFactor: 0.85 },
  media: { label: 'Média', scale: 1, priceFactor: 1 },
  grossa: { label: 'Grossa', scale: 1.35, priceFactor: 1.3 },
} as const

export const lengths = {
  40: 'Gargantilha',
  45: 'Princesa',
  50: 'Matinê',
  60: 'Matinê longo',
  70: 'Ópera',
} as const

// Pingente vindo de arquivo .glb (preparado com `npm run model`).
export type PendantModel = {
  url: string
  mesh: string // nome da malha dentro do arquivo
  rotation: readonly [number, number, number] // deixa a frente em +Z e o topo para cima
  heightCm: number // altura real da peça; a escala do arquivo é ignorada
  tint?: boolean // false = peça policromada (esmalte/pedras), o banho não a tinge
  credit?: string
}

type Pendant = { label: string; price: number; model?: PendantModel }

export const pendants = {
  nenhum: { label: 'Sem pingente', price: 0 },
  coracao: { label: 'Coração', price: 39.9 },
  cruz: { label: 'Cruz', price: 34.9 },
  medalha: { label: 'Medalha', price: 44.9 },
  'ponto-de-luz': { label: 'Ponto de luz', price: 54.9 },
  gotico: {
    label: 'Gótico',
    price: 69.9,
    model: {
      url: '/models/gothic-pendant.glb',
      mesh: 'PendantGothic_M_Pendant_LP_0',
      rotation: [Math.PI / 2, 0, 0], // o arquivo vem deitado (frente para +Y)
      heightCm: 3.5,
      credit: '"Gothic Pendant Necklace" por cedeon (Sketchfab), CC-BY 4.0',
    },
  },
  independencia: {
    label: 'Independência',
    price: 79.9,
    model: {
      url: '/models/independencia.glb',
      mesh: 'tripo_node_4b7bddfa-967a-4a12-9149-2d57b809a785',
      rotation: [0, 0, 0], // já vem em pé, de frente
      heightCm: 3.8,
      tint: false,
    },
  },
} as const satisfies Record<string, Pendant>

export type PieceType = keyof typeof pieceTypes
export type MetalId = keyof typeof metals
export type ChainId = keyof typeof chains
export type ThicknessId = keyof typeof thicknesses
export type LengthCm = keyof typeof lengths
export type PendantId = keyof typeof pendants
