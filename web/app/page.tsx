import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "./_marketing/landing-page";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://comptus.com.br";
const TITULO = "Comptus — Agendamento online para barbearias e salões de beleza";
const DESCRICAO =
  "Agenda, equipe, loja de produtos e pagamento online (Pix e cartão) em um só sistema. Comece de graça, sem cartão de crédito.";
const OG_IMAGE_URL = `${BASE_URL}/og-image.png`;

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: BASE_URL,
    siteName: "Comptus",
    locale: "pt_BR",
    type: "website",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: TITULO }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
    images: [OG_IMAGE_URL],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Comptus",
      url: BASE_URL,
      logo: `${BASE_URL}/brand/comptus-simbolo-fundo-claro.svg`,
    },
    {
      "@type": "SoftwareApplication",
      name: "Comptus",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: DESCRICAO,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
        description: "Plano gratuito para começar",
      },
    },
  ],
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: membro } = await supabase
      .from("membros_estabelecimento")
      .select("estabelecimento_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .maybeSingle();

    redirect(membro ? "/app" : "/onboarding");
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <LandingPage />
    </>
  );
}
