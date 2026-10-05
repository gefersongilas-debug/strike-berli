import type { Metadata } from 'next'
import Link from 'next/link'
import { ThankYou } from './ThankYou'

export const metadata: Metadata = { title: 'Pedido recebido', robots: { index: false } }

// O Lead já foi disparado no envio do formulário — esta página NÃO dispara conversão,
// para não contar em dobro quando alguém recarrega ou volta nela.
export default function Obrigado() {
  return (
    <section className="thanks" data-testid="thank-you">
      <div className="container thanks__inner">
        <p className="eyebrow" data-hero>
          Pedido recebido
        </p>
        <h1 className="page-hero__title" data-hero="title">
          Strike! Recebemos seu <span className="accent">pedido.</span>
        </h1>
        <ThankYou />
        <p className="thanks__back" data-hero>
          <Link href="/">Voltar para o início</Link>
        </p>
      </div>
    </section>
  )
}
