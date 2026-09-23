import {
  chains,
  lengths,
  metals,
  pendants,
  pieceTypes,
  thicknesses,
  type ChainId,
  type LengthCm,
  type MetalId,
  type PendantId,
  type PieceType,
  type ThicknessId,
} from './catalog'

export type Config = {
  type: PieceType
  chain: ChainId
  thickness: ThicknessId
  length: LengthCm
  metal: MetalId
  pendant: PendantId
}

export const defaultConfig: Config = {
  type: 'colar',
  chain: 'cadeado',
  thickness: 'media',
  length: 45,
  metal: 'ouro',
  pendant: 'coracao',
}

export function priceOf(c: Config): number {
  const chain = chains[c.chain]
  const chainPrice = (chain.basePrice + chain.pricePerCm * c.length) * thicknesses[c.thickness].priceFactor
  const total = (chainPrice + pendants[c.pendant].price) * metals[c.metal].priceFactor
  return Math.round(total * 100) / 100
}

export const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Configuração <-> query string, para o link compartilhável.
const params = {
  type: 'tipo',
  chain: 'corrente',
  thickness: 'espessura',
  length: 'comprimento',
  metal: 'banho',
  pendant: 'pingente',
} as const satisfies Record<keyof Config, string>

function pick<T extends object>(table: T, raw: string | null, fallback: keyof T): keyof T {
  return raw !== null && Object.hasOwn(table, raw) ? (raw as keyof T) : fallback
}

export function configFromSearch(search: string): Config {
  const q = new URLSearchParams(search)
  const d = defaultConfig
  const type = pick(pieceTypes, q.get(params.type), d.type)
  return {
    type: pieceTypes[type].available ? type : d.type,
    chain: pick(chains, q.get(params.chain), d.chain),
    thickness: pick(thicknesses, q.get(params.thickness), d.thickness),
    length: Number(pick(lengths, q.get(params.length), d.length)) as LengthCm,
    metal: pick(metals, q.get(params.metal), d.metal),
    pendant: pick(pendants, q.get(params.pendant), d.pendant),
  }
}

export function configToSearch(c: Config): string {
  const q = new URLSearchParams()
  for (const key of Object.keys(params) as (keyof Config)[]) q.set(params[key], String(c[key]))
  return q.toString()
}
