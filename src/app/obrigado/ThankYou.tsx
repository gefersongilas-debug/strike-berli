'use client'
import { useEffect, useState } from 'react'
import { LEAD_SUMMARY_KEY } from '@/components/LeadForm'
import { WhatsAppButton } from '@/components/ui/Actions'

interface Summary {
  name?: string
  tipo?: string
  data?: string
  pessoas?: string
}

function message(s: Summary | null): string {
  if (!s) return 'Oi! Acabei de pedir uma proposta pelo site da Strike.'
  const parts = [s.tipo, s.data && s.data.split('-').reverse().join('/'), s.pessoas && `${s.pessoas} pessoas`].filter(Boolean)
  return `Oi! ${s.name ? `Aqui é ${s.name}. ` : ''}Acabei de pedir uma proposta pelo site${parts.length ? `: ${parts.join(', ')}` : ''}.`
}

/** Oferece continuar no WhatsApp com o resumo do pedido (guardado só nesta aba). */
export function ThankYou() {
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LEAD_SUMMARY_KEY)
      if (raw) setSummary(JSON.parse(raw) as Summary)
    } catch {
      // sem storage: fica a mensagem genérica
    }
  }, [])

  return (
    <>
      <p className="page-hero__lead" data-hero>
        {summary?.name ? `Valeu, ${summary.name}! ` : ''}O atendimento da Strike vai te chamar no WhatsApp com a proposta. Quer
        adiantar? Manda o resumo agora e a conversa já começa.
      </p>
      <div className="btn-row" data-hero>
        <WhatsAppButton id="obrigado" size="lg" text={message(summary)}>
          Enviar resumo no WhatsApp
        </WhatsAppButton>
      </div>
    </>
  )
}
