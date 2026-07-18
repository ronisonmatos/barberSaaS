import {
  CalendarRange,
  Users2,
  ShoppingBag,
  Wallet,
  LineChart,
  QrCode,
  ShieldCheck,
  Palette,
} from "lucide-react";

const RECURSOS = [
  {
    icon: CalendarRange,
    titulo: "Agenda multi-profissional",
    descricao: "Visão por dia e semana, uma coluna por profissional, sem conflito de horário.",
  },
  {
    icon: Wallet,
    titulo: "Pagamento online",
    descricao: "Pix e cartão de crédito direto no agendamento, via Mercado Pago.",
  },
  {
    icon: ShoppingBag,
    titulo: "Loja de produtos",
    descricao: "Venda produtos avulsos ou junto com o agendamento, com controle de estoque.",
  },
  {
    icon: LineChart,
    titulo: "Painel de receita",
    descricao: "Atendidos, cancelados, volume e faturamento — sem precisar de planilha.",
  },
  {
    icon: QrCode,
    titulo: "Check-in por QR Code",
    descricao: "O cliente confirma a chegada sozinho, sem precisar de recepção.",
  },
  {
    icon: Users2,
    titulo: "Equipe com controle de acesso",
    descricao: "Cada profissional vê a própria agenda; o dono vê tudo.",
  },
  {
    icon: Palette,
    titulo: "Página pública personalizável",
    descricao: "Seu nome, fotos, cores e horário de funcionamento — sua cara, seu domínio.",
  },
  {
    icon: ShieldCheck,
    titulo: "Dados isolados por estabelecimento",
    descricao: "Cada barbearia ou salão só enxerga os próprios clientes e agendamentos.",
  },
];

export function Recursos() {
  return (
    <section id="recursos" className="border-t border-linha-escuro bg-carvao-2/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="fio mx-auto w-fit text-xs font-medium tracking-[0.14em] text-latao uppercase">
            Recursos
          </p>
          <h2 className="mt-4 font-display text-3xl text-marfim">Tudo que o seu negócio precisa</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="flex flex-col gap-3">
              <r.icon className="h-6 w-6 text-latao" strokeWidth={1.5} />
              <p className="font-medium text-marfim">{r.titulo}</p>
              <p className="text-sm leading-relaxed text-marfim/70">{r.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
