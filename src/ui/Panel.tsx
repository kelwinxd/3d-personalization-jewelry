import { useState, type CSSProperties, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  chains,
  lengths,
  metals,
  pendants,
  pieceTypes,
  thicknesses,
  type LengthCm,
  type PendantModel,
} from '../catalog'
import { formatBRL, priceOf } from '../config'
import { selectConfig, useConfig } from '../store'
import { orderMessage, whatsappLink } from '../whatsapp'

const steps = ['Corrente', 'Banho', 'Pingente', 'Tamanho'] as const
type Step = (typeof steps)[number]

const entries = <T extends object>(o: T) => Object.entries(o) as [Extract<keyof T, string>, T[keyof T]][]

function Option({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className="option" aria-pressed={active} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}

export function Panel() {
  const config = useConfig(useShallow(selectConfig))
  const set = useConfig((s) => s.set)
  const [step, setStep] = useState<Step>('Corrente')
  const [copied, setCopied] = useState(false)

  const shareUrl = window.location.href
  const credit = (pendants[config.pendant] as { model?: PendantModel }).model?.credit

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copie o link:', window.location.href)
    }
  }

  return (
    <aside className="panel">
      <header className="panel-head">
        <p className="eyebrow">Personalize</p>
        <h1>Monte sua semijoia</h1>
        <div className="types" role="group" aria-label="Tipo de peça">
          {entries(pieceTypes).map(([id, t]) => (
            <Option key={id} active={config.type === id} disabled={!t.available} onClick={() => set('type', id)}>
              {t.label}
              {!t.available && <small>em breve</small>}
            </Option>
          ))}
        </div>
      </header>

      <nav className="steps" role="tablist">
        {steps.map((s) => (
          <button key={s} role="tab" aria-selected={step === s} onClick={() => setStep(s)}>
            {s}
          </button>
        ))}
      </nav>

      <section className="step-body" role="tabpanel">
        {step === 'Corrente' && (
          <>
            <div className="grid">
              {entries(chains).map(([id, c]) => (
                <Option key={id} active={config.chain === id} onClick={() => set('chain', id)}>
                  <strong>{c.label}</strong>
                  <small>{c.hint}</small>
                </Option>
              ))}
            </div>
            <h3>Espessura</h3>
            <div className="row">
              {entries(thicknesses).map(([id, t]) => (
                <Option key={id} active={config.thickness === id} onClick={() => set('thickness', id)}>
                  {t.label}
                </Option>
              ))}
            </div>
          </>
        )}

        {step === 'Banho' && (
          <div className="grid">
            {entries(metals).map(([id, m]) => (
              <Option key={id} active={config.metal === id} onClick={() => set('metal', id)}>
                <span className="swatch" style={{ '--swatch': m.color } as CSSProperties} />
                <strong>{m.label}</strong>
                <small>{m.hint}</small>
              </Option>
            ))}
          </div>
        )}

        {step === 'Pingente' && (
          <>
            <div className="grid">
              {entries(pendants).map(([id, p]) => (
                <Option key={id} active={config.pendant === id} onClick={() => set('pendant', id)}>
                  <strong>{p.label}</strong>
                  <small>{p.price ? `+ ${formatBRL(p.price)}` : '—'}</small>
                </Option>
              ))}
            </div>
            {credit && <p className="credit">Modelo 3D: {credit}</p>}
          </>
        )}

        {step === 'Tamanho' && (
          <div className="grid">
            {entries(lengths).map(([cm, name]) => (
              <Option
                key={cm}
                active={config.length === Number(cm)}
                onClick={() => set('length', Number(cm) as LengthCm)}
              >
                <strong>{cm} cm</strong>
                <small>{name}</small>
              </Option>
            ))}
          </div>
        )}
      </section>

      <footer className="checkout">
        <div className="price">
          <small>Valor estimado</small>
          <strong>{formatBRL(priceOf(config))}</strong>
        </div>
        <button type="button" className="ghost" onClick={copyLink}>
          {copied ? (
            'Copiado!'
          ) : (
            <>
              Copiar<span className="long"> link</span>
            </>
          )}
        </button>
        <a className="whatsapp" href={whatsappLink(orderMessage(config, shareUrl))} target="_blank" rel="noreferrer">
          <span className="long">Pedir pelo </span>WhatsApp
        </a>
      </footer>
    </aside>
  )
}
