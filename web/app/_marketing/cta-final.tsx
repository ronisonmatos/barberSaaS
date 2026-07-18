import Link from "next/link";

export function CtaFinal() {
  return (
    <section className="border-t border-linha-escuro">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl text-marfim sm:text-4xl">
          Sua agenda organizada ainda hoje
        </h2>
        <p className="max-w-md text-marfim/70">
          Crie sua conta grátis e comece a receber agendamentos online em poucos minutos.
        </p>
        <Link
          href="/signup"
          className="inline-flex h-12 items-center justify-center rounded-md bg-latao px-8 font-medium text-carvao hover:bg-latao-escuro"
        >
          Criar conta grátis
        </Link>
      </div>
    </section>
  );
}
