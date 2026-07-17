"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "./app-nav";
import { ConfiguracoesNav } from "./configuracoes/configuracoes-nav";

export function SidebarNav({ papel }: { papel: "owner" | "staff" }) {
  const pathname = usePathname();

  if (pathname.startsWith("/app/configuracoes")) {
    return <ConfiguracoesNav papel={papel} />;
  }

  return <AppNav />;
}
