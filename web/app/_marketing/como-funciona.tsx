import { MousePointerClick, CalendarCheck, CreditCard, PartyPopper } from "lucide-react";

const PASSOS = [
  {
    icon: MousePointerClick,
    titulo: "Cliente escolhe o serviço",
    descricao: "Na sua própria página, com seus profissionais, preços e fotos.",
  },
  {
    icon: CalendarCheck,
    titulo: "Escolhe o horário livre",
    descricao: "A agenda de cada profissional atualiza sozinha, sem conflito de horário.",
  },
  {
    icon: CreditCard,
    titulo: "Paga Pix, cartão ou no dia",
    descricao: "Pagamento online é opcional — você decide o que aceitar.",
  },
  {
    icon: PartyPopper,
    titulo: "Horário confirmado",
    descricao: "Aparece na sua agenda na hora. O cliente recebe o link pra acompanhar ou remarcar.",
  },
];

export function ComoFunciona() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-xl text-center">
        <p className="fio mx-auto w-fit text-xs font-medium tracking-[0.14em] text-latao uppercase">
          Como funciona
        </p>
        <h2 className="mt-4 font-display text-3xl text-marfim">Agendamento em poucos cliques</h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {PASSOS.map((passo, i) => (
          <div key={passo.titulo} className="flex flex-col gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-linha-escuro text-latao">
              <passo.icon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-medium text-marfim/50">Passo {i + 1}</p>
            <p className="font-medium text-marfim">{passo.titulo}</p>
            <p className="text-sm leading-relaxed text-marfim/70">{passo.descricao}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
