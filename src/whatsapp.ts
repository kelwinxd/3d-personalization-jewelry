import { chains, lengths, metals, pendants, pieceTypes, thicknesses } from './catalog'
import { formatBRL, priceOf, type Config } from './config'

// Número da loja no formato internacional, só dígitos (ex.: 5511999999999).
// Vazio = o WhatsApp pede para o usuário escolher o contato.
const STORE_NUMBER: string = import.meta.env.VITE_WHATSAPP_NUMBER ?? ''

export function orderMessage(c: Config, shareUrl: string): string {
  const lines = [
    'Olá! Montei minha semijoia no personalizador:',
    '',
    `• Peça: ${pieceTypes[c.type].label}`,
    `• Corrente: ${chains[c.chain].label} (${thicknesses[c.thickness].label.toLowerCase()})`,
    `• Comprimento: ${c.length} cm (${lengths[c.length]})`,
    `• Banho: ${metals[c.metal].label}`,
    `• Pingente: ${pendants[c.pendant].label}`,
    '',
    `Valor estimado: ${formatBRL(priceOf(c))}`,
    `Ver em 3D: ${shareUrl}`,
  ]
  return lines.join('\n')
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${STORE_NUMBER}?text=${encodeURIComponent(message)}`
}
