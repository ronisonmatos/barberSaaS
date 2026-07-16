import { getSuperAdmin } from "@/lib/admin-guard";
import { Heading } from "@/components/ui/heading";
import { NovoEstabelecimentoForm } from "./novo-estabelecimento-form";

export default async function NovoEstabelecimentoPage() {
  await getSuperAdmin();

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Heading>Cadastrar estabelecimento manualmente</Heading>
      <p className="text-sm text-cinza-600">
        Cria o estabelecimento e manda um convite por e-mail para o dono definir a própria senha.
      </p>
      <NovoEstabelecimentoForm />
    </div>
  );
}
