import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const ID_SINGLETON = "00000000-0000-0000-0000-000000000001";

/**
 * Le a configuracao de gateway de pagamento da plataforma com as credenciais completas
 * (access token, webhook secret). So deve ser chamado a partir de codigo que roda no servidor
 * (route handler, server action) -- nunca exposto ao client. Para o que o client pode saber
 * (public key, "esta configurado?"), use as RPCs mercado_pago_platform_public_key()/
 * pagamento_plataforma_configurado() via o client normal (RLS restringe a leitura da tabela em
 * si a super_admin).
 */
export async function getConfiguracaoPlataforma() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("configuracao_plataforma")
    .select("*")
    .eq("id", ID_SINGLETON)
    .single();
  return data;
}
