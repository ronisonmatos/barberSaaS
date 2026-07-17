import type { LucideIcon } from "lucide-react";
import { UserRound, Images, QrCode, CreditCard, Users, LifeBuoy, Sparkles } from "lucide-react";

export type SecaoConfiguracao = {
  href: string;
  label: string;
  descricao: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
};

export const SECOES_CONFIGURACAO: SecaoConfiguracao[] = [
  {
    href: "/app/configuracoes/perfil",
    label: "Perfil",
    descricao: "Nome, logo, endereço e dados públicos.",
    icon: UserRound,
  },
  {
    href: "/app/configuracoes/fotos",
    label: "Fotos",
    descricao: "Galeria exibida na página pública.",
    icon: Images,
  },
  {
    href: "/app/configuracoes/plano",
    label: "Plano",
    descricao: "Vencimento, vantagens e troca de plano.",
    icon: Sparkles,
  },
  {
    href: "/app/configuracoes/checkin",
    label: "Check-in por QR Code",
    descricao: "QR Code para o cliente confirmar chegada sozinho.",
    icon: QrCode,
  },
  {
    href: "/app/configuracoes/pagamentos",
    label: "Pagamentos",
    descricao: "Gateway, Pix e cartão.",
    icon: CreditCard,
    ownerOnly: true,
  },
  {
    href: "/app/configuracoes/equipe",
    label: "Equipe",
    descricao: "Membros com acesso ao painel.",
    icon: Users,
    ownerOnly: true,
  },
  {
    href: "/app/suporte",
    label: "Suporte",
    descricao: "Veja ou abra um chamado.",
    icon: LifeBuoy,
  },
];
