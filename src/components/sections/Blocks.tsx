/**
 * Blocos de página (server components). As animações vêm dos atributos
 * data-* lidos pelo <Motion> — ver src/components/motion/Motion.tsx.
 */
import { ArrowRight, Briefcase, Cake, Clock, MapPin, Star, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { STRUCTURE } from '@/content/attractions'
import type { Faq } from '@/content/faq'
import { RULES, SITE, WHATSAPP_TEXT, type WhatsAppContext } from '@/content/site'
import { DirectionsButton, PhoneLink, ReserveButton, WhatsAppButton } from '@/components/ui/Actions'
import { InstagramIcon, PinIcon } from '@/components/ui/BrandIcons'
import { UntilDate } from '@/components/ui/UntilDate'

// ---------------------------------------------------------------------------

export function PageHero({
  eyebrow,
  title,
  accent,
  lead,
  photo,
  context = 'default',
  badge,
  children,
}: {
  eyebrow: string
  title: string
  /** Palavra/trecho final do título em destaque amarelo. */
  accent?: string
  lead: string
  photo: { src: string; alt: string }
  context?: WhatsAppContext
  badge?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="page-hero">
      <div className="page-hero__media" aria-hidden="true">
        <div className="page-hero__img" data-parallax="0.18">
          <Image src="/img/pistas-neon.jpg" alt="" fill priority sizes="100vw" />
        </div>
        <div className="page-hero__shade" />
      </div>
      <div className="container page-hero__grid">
        <div className="page-hero__inner">
          {badge && (
            <div className="page-hero__badge" data-hero>
              {badge}
            </div>
          )}
          <p className="eyebrow" data-hero>
            {eyebrow}
          </p>
          <h1 className="page-hero__title" data-hero="title">
            {title} {accent && <span className="accent">{accent}</span>}
          </h1>
          <p className="page-hero__lead" data-hero>
            {lead}
          </p>
          <div className="btn-row" data-hero>
            {children ?? (
              <>
                <ReserveButton id="page-hero" size="lg" />
                <WhatsAppButton id="page-hero" size="lg" variant="ghost" context={context} />
              </>
            )}
          </div>
        </div>
        <div className="page-hero__card" data-hero>
          <div className="page-hero__frame">
            <div className="page-hero__photo" data-parallax="0.14">
              <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 1000px) 420px, 70vw" />
            </div>
          </div>
          <span className="page-hero__sticker" aria-hidden="true">
            <PinIcon size={34} />
          </span>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

export function SectionHead({
  eyebrow,
  title,
  lead,
  dark = false,
  center = false,
}: {
  eyebrow: string
  title: string
  lead?: string
  dark?: boolean
  center?: boolean
}) {
  return (
    <header className={`section-head${center ? ' section-head--center' : ''}`}>
      <p className={`eyebrow${dark ? ' eyebrow--dark' : ''}`}>{eyebrow}</p>
      <h2 className={`display${dark ? ' display--dark' : ''}`} data-split>
        {title}
      </h2>
      {lead && (
        <p className={dark ? 'lead-dark' : 'lead-light'} data-reveal>
          {lead}
        </p>
      )}
    </header>
  )
}

// ---------------------------------------------------------------------------

const TURMAS = [
  {
    href: '/aniversario',
    icon: Cake,
    tag: 'Festa infantil',
    title: 'Aniversário',
    text: 'Combo com salgados, doces e refri, canaleta pra criançada e gastrobar pros adultos.',
    tone: 'yellow',
  },
  {
    href: '/empresas',
    icon: Briefcase,
    tag: 'Nota fiscal',
    title: 'Empresas',
    text: 'Confraternização e happy hour com chefe e estagiário no mesmo time.',
    tone: 'red',
  },
  {
    href: '/confraternizacao',
    icon: Users,
    tag: 'Grupos grandes',
    title: 'Confraternização',
    text: 'Turma, família grande ou a firma inteira: 4 pistas, sinuca, karaokê e gastrobar.',
    tone: 'blue',
  },
  {
    href: '/pacotes',
    icon: Star,
    tag: 'Seg a qui',
    title: 'Família',
    text: 'De segunda a quinta a pista é mais tranquila e o pacote sai mais em conta.',
    tone: 'cream',
  },
] as const

export function EventTypes() {
  return (
    <section className="section section--cream" aria-labelledby="turmas-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <p className="eyebrow eyebrow--dark">Pra cada turma</p>
            <h2 id="turmas-title" className="display display--dark" data-split>
              Tem formato certo pro seu grupo.
            </h2>
          </div>
          <p className="lead-dark" data-reveal>
            Dois casais, a firma inteira ou a festa de 8 anos: a gente monta o pacote e você só aparece.
          </p>
        </header>
        <div className="turmas" data-stagger>
          {TURMAS.map(({ href, icon: Icon, tag, title, text, tone }) => (
            <Link key={title} href={href} className={`turma turma--${tone}`}>
              <span className="turma__tag">{tag}</span>
              <Icon size={34} aria-hidden="true" className="turma__icon" />
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="turma__go" aria-hidden="true">
                <ArrowRight size={20} />
              </span>
              {title === 'Aniversário' && (
                <UntilDate end="2026-10-31">
                  <span className="turma__season">Outubro é Mês da Criança</span>
                </UntilDate>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

export function Proof() {
  return (
    <section className="proof" aria-label="Números da casa">
      <div className="container">
        <ul className="proof__stats" data-stagger>
          <li>
            <strong>
              <span data-count={SITE.rating.value} data-decimals="1">
                {SITE.rating.value.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
              </span>
              <Star size={30} aria-hidden="true" className="proof__star" />
            </strong>
            <span>nota no Google</span>
          </li>
          <li>
            <strong>
              <span data-count={SITE.rating.count} data-prefix="+">
                +{SITE.rating.count.toLocaleString('pt-BR')}
              </span>
            </strong>
            <span>avaliações de quem já veio</span>
          </li>
          <li>
            <strong>
              <span data-count="4">4</span>
            </strong>
            <span>pistas com telão interativo</span>
          </li>
          <li>
            <strong>
              <span data-count="5">5</span>
            </strong>
            <span>mesas de sinuca</span>
          </li>
        </ul>
        <ul className="proof__chips" data-stagger>
          {STRUCTURE.map((s) => (
            <li key={s}>
              <PinIcon size={14} /> {s}
            </li>
          ))}
        </ul>
        <p className="proof__link" data-reveal>
          <a href={SITE.reviewsUrl} target="_blank" rel="noopener noreferrer">
            Ler as avaliações no Google <ArrowRight size={16} aria-hidden="true" />
          </a>
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

const GALLERY = [
  { src: '/img/pistas-neon.jpg', alt: 'Pistas de boliche em neon com o letreiro Strike Berlin', cls: 'g-a', speed: 0.12 },
  { src: '/img/bolas-coloridas.jpg', alt: 'Bolas de boliche coloridas no retorno', cls: 'g-b', speed: 0.22 },
  { src: '/img/coracao-neon.jpg', alt: 'Painel de coração em neon com o nome Strike Berlin', cls: 'g-c', speed: 0.3 },
  { src: '/img/fachada.jpg', alt: 'Fachada do Strike Berlin na Av. João Corrêa, com pinos de boliche gigantes', cls: 'g-d', speed: 0.16 },
  { src: '/img/pelucias.jpg', alt: 'Máquina de pelúcia iluminada no fliperama', cls: 'g-e', speed: 0.26 },
  { src: '/img/air-hockey.jpg', alt: 'Air hockey iluminado no fliperama', cls: 'g-f', speed: 0.2 },
]

export function Gallery() {
  return (
    <section className="section section--night gallery" aria-labelledby="galeria-title">
      <div className="container">
        <SectionHead eyebrow="Galeria" title="Dá um rolê pela casa." />
        <div className="gallery__grid">
          {GALLERY.map((g) => (
            <figure key={g.src} className={`gallery__item ${g.cls}`}>
              <div className="gallery__img" data-parallax={g.speed}>
                <Image src={g.src} alt={g.alt} fill sizes="(min-width: 1024px) 33vw, 50vw" />
              </div>
            </figure>
          ))}
        </div>
        <p className="gallery__more" data-reveal>
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--md">
            <InstagramIcon size={18} /> <span>Mais no {SITE.instagramHandle}</span>
          </a>
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

export function FaqSection({ items, title = 'O que todo mundo pergunta.', id = 'faq' }: { items: Faq[]; title?: string; id?: string }) {
  return (
    <section className="section section--white" id={id} aria-labelledby={`${id}-title`}>
      <div className="container faq">
        <div className="faq__head">
          <p className="eyebrow eyebrow--dark">Dúvidas</p>
          <h2 id={`${id}-title`} className="display display--dark" data-split>
            {title}
          </h2>
          <p className="lead-dark" data-reveal>
            Não achou sua resposta?
          </p>
          <div data-reveal>
            <WhatsAppButton id={`${id}-duvida`} context="duvida" variant="dark">
              Perguntar no WhatsApp
            </WhatsAppButton>
          </div>
        </div>
        <div className="faq__list" data-stagger>
          {items.map((f) => (
            <details key={f.q} className="faq__item">
              <summary>
                <span>{f.q}</span>
                <span className="faq__plus" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }),
        }}
      />
    </section>
  )
}

// ---------------------------------------------------------------------------

export function Visit() {
  return (
    <section className="section section--night visit" id="onde" aria-labelledby="visit-title">
      <div className="container visit__grid">
        <div>
          <p className="eyebrow">Onde fica</p>
          <h2 id="visit-title" className="display" data-split>
            No Centro de São Leopoldo.
          </h2>
          <p className="lead-light" data-reveal>
            Pertinho de Novo Hamburgo, Sapucaia, Esteio e Canoas. Procura pela fachada com os pinos gigantes.
          </p>
          <ul className="visit__info" data-stagger>
            <li>
              <MapPin size={20} aria-hidden="true" />
              <span>
                {SITE.address.street} · {SITE.address.district}
                <br />
                {SITE.address.city}/{SITE.address.state} · CEP {SITE.address.zip}
              </span>
            </li>
            <li>
              <Clock size={20} aria-hidden="true" />
              {SITE.hours.length ? (
                <span>
                  {SITE.hours.map((h) => (
                    <span key={h.days} className="visit__hour">
                      <strong>{h.days}</strong> {h.hours}
                    </span>
                  ))}
                </span>
              ) : (
                <span>Horários e feriados: confirme no WhatsApp antes de vir.</span>
              )}
            </li>
            <li>
              <PhoneLink id="visit" />
            </li>
            <li>
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="link-inline">
                <InstagramIcon size={18} /> {SITE.instagramHandle}
              </a>
            </li>
          </ul>
          <div className="btn-row" data-reveal>
            <DirectionsButton id="visit" variant="primary" />
            <WhatsAppButton id="visit" variant="ghost" />
          </div>
        </div>
        <div className="visit__map" data-reveal>
          <iframe
            title="Mapa: Strike Berlin, Av. João Corrêa, 1008, São Leopoldo"
            src={SITE.mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

export function CtaBand({
  title = 'Bora tirar do grupo do Whats e trazer pra pista?',
  context = 'default',
}: {
  title?: string
  context?: WhatsAppContext
}) {
  return (
    <section className="cta-band" aria-labelledby="cta-title">
      <div className="cta-band__pins" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <PinIcon key={i} size={64} />
        ))}
      </div>
      <div className="container cta-band__inner">
        <h2 id="cta-title" className="cta-band__title" data-split>
          {title}
        </h2>
        <div className="btn-row btn-row--center" data-reveal>
          <ReserveButton id="cta-final" size="lg" variant="dark" />
          <WhatsAppButton id="cta-final" size="lg" variant="ghost-dark" context={context} />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------

/**
 * Onde antes ficava o formulário de proposta: o pedido vai direto pelo WhatsApp,
 * com a mensagem pronta da página ("Vim pelo site e quero reservar…"), ou a
 * pessoa reserva a pista online. Mantém o id "proposta" dos botões que apontam
 * para cá.
 */
export function WhatsAppSection({
  id = 'proposta',
  eyebrow = 'Evento em grupo',
  title = 'Vai juntar a galera? A gente monta a proposta.',
  lead = 'Conta o que você está pensando e o atendimento responde pelo WhatsApp com pacote, horário e valor.',
  context = 'default',
  bullets = ['Proposta personalizada, sem compromisso', 'Pacotes por pessoa ou por pista', 'Nota fiscal para empresa', 'Atendimento de gente, pelo WhatsApp'],
}: {
  id?: string
  eyebrow?: string
  title?: string
  lead?: string
  context?: WhatsAppContext
  bullets?: string[]
}) {
  return (
    <section className="section section--cream lead-sec" id={id} aria-labelledby={`${id}-title`}>
      <div className="container lead-sec__grid">
        <div className="lead-sec__copy">
          <p className="eyebrow eyebrow--dark">{eyebrow}</p>
          <h2 id={`${id}-title`} className="display display--dark" data-split>
            {title}
          </h2>
          <p className="lead-dark" data-reveal>
            {lead}
          </p>
          <ul className="ticks" data-stagger>
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <div className="lead-sec__card wa-card" data-reveal>
          <p className="wa-card__label">Mensagem pronta</p>
          <p className="wa-card__bubble">{WHATSAPP_TEXT[context]}</p>
          <WhatsAppButton id="secao-whatsapp" size="lg" context={context} className="wa-card__btn">
            Reservar pelo WhatsApp
          </WhatsAppButton>
          <p className="wa-card__fine">Abre o WhatsApp da Strike com essa mensagem. É só enviar e contar o dia e quantas pessoas vêm.</p>
          <p className="wa-card__or">
            <span>ou</span>
          </p>
          <ReserveButton id="secao-reserva" variant="secondary" className="wa-card__btn">
            Reservar a pista online
          </ReserveButton>
          <p className="wa-card__fine">{RULES.onlineFreeEntry}</p>
        </div>
      </div>
    </section>
  )
}
