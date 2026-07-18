import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

const HORARIOS = ["09:00", "09:30", "10:15", "11:00"];

export function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:flex-row lg:items-center lg:pt-28 lg:pb-28">
      <div className="flex flex-1 flex-col gap-6">
        <p className="text-xs font-medium tracking-[0.14em] text-latao uppercase">
          Feito para barbearias, salões e clínicas de estética
        </p>
        <h1 className="font-display text-4xl leading-[1.1] text-marfim sm:text-5xl">
          Sua agenda cheia, sem grupo de WhatsApp lotado
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-marfim/80">
          O cliente escolhe o serviço, o horário e paga — tudo em poucos cliques, direto na sua
          página. Agenda, equipe, loja de produtos e pagamento online em um só lugar.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-md bg-latao px-6 font-medium text-carvao hover:bg-latao-escuro"
          >
            Criar conta grátis
          </Link>
          <a href="#planos" className="text-sm text-marfim/80 underline hover:text-marfim">
            Ver planos e preços
          </a>
        </div>
        <p className="text-sm text-marfim/60">
          Comece de graça. Sem cartão de crédito, sem contrato de fidelidade.
        </p>
      </div>

      <div className="flex flex-1 justify-center lg:justify-end">
        <div className="w-full max-w-sm rounded-lg border border-linha-escuro bg-carvao-2 p-5 shadow-[0_1px_2px_rgb(0_0_0_/_0.2)]">
          <div className="flex items-center justify-between border-b border-linha-escuro pb-3">
            <p className="font-display text-marfim">Hoje, quinta-feira</p>
            <span className="text-xs text-marfim/60">4 horários</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {HORARIOS.map((hora, i) => (
              <div
                key={hora}
                className="flex items-center justify-between rounded-md border border-linha-escuro bg-carvao px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-marfim">{hora} — Corte + Barba</p>
                  <p className="text-xs text-marfim/60">Jonas Ferreira</p>
                </div>
                <StatusBadge status={i === 0 ? "confirmado" : "pendente"} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md bg-latao/10 px-3 py-2">
            <p className="text-xs text-marfim/80">+ Pomada modeladora</p>
            <p className="text-xs font-medium tabular-nums text-latao">R$ 35</p>
          </div>
        </div>
      </div>
    </section>
  );
}
