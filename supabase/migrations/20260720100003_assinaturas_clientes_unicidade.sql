-- Um cliente tem no maximo uma linha por plano em assinaturas_clientes -- o estado
-- (pendente/ativa/inadimplente/cancelada/pausada) transiciona na mesma linha ao longo do tempo;
-- o historico de cobrancas ja vive em pagamentos, nao precisa de linha nova a cada ciclo/renovacao.
-- Isso tambem habilita "on conflict (cliente_id, plano_id)" na RPC publica de assinatura.

alter table assinaturas_clientes
  add constraint assinaturas_clientes_cliente_plano_unico unique (cliente_id, plano_id);
