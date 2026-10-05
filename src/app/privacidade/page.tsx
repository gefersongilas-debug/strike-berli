import type { Metadata } from "next";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Política de privacidade e cookies",
  alternates: { canonical: "/privacidade" },
};

export default function Privacidade() {
  return (
    <section className="section section--white legal">
      <div className="container legal__inner">
        <p className="eyebrow eyebrow--dark">Privacidade</p>
        <h1 className="display display--dark">
          Política de privacidade e cookies
        </h1>
        <p>
          Este site é da {SITE.legalName} (CNPJ {SITE.cnpj}),{" "}
          {SITE.address.street}, {SITE.address.district}, {SITE.address.city}/
          {SITE.address.state}. Aqui explicamos quais dados coletamos e para
          quê, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>

        <h2>Dados que você envia</h2>
        <p>
          Quando você pede uma proposta, recebemos nome, WhatsApp, e-mail (se
          informado), o tipo de evento, a data e o número de pessoas. Usamos
          esses dados para responder ao seu pedido e montar a proposta. Se você
          marcar a opção de novidades, também podemos mandar promoções da casa —
          e você pode pedir para parar a qualquer momento.
        </p>

        <h2>Reservas</h2>
        <p>
          A reserva online é feita no site da Eleven Tickets, que tem a própria
          política de privacidade. Ao clicar em “Reservar”, levamos para lá a
          origem da sua visita (por exemplo, o anúncio ou a campanha que te
          trouxe), para sabermos quais canais funcionam.
        </p>

        <h2>Cookies e medição</h2>
        <p>
          Usamos cookies próprios e ferramentas da Meta (Facebook e Instagram) e
          do Google (Google Analytics e Google Ads) para medir visitas, entender
          quais anúncios trazem reservas e mostrar anúncios mais relevantes. Os
          dados de contato enviados a essas plataformas vão criptografados
          (hash), nunca em texto aberto. Para melhorar o site, usamos também o
          Microsoft Clarity, que registra como as páginas são navegadas (cliques
          e rolagem), sem o que é digitado nos campos. Você pode limpar os
          cookies no seu navegador a qualquer momento.
        </p>

        <h2>Seus direitos</h2>
        <p>
          Você pode pedir acesso, correção ou exclusão dos seus dados, ou
          revogar o consentimento, pelo WhatsApp {SITE.phoneDisplay}.
        </p>
      </div>
    </section>
  );
}
