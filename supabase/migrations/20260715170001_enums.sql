-- Fase 0: tipos enumerados usados no schema (ORIENTACAO-BARBERSAAS.md secao 5.1)

create type papel_global as enum ('super_admin', 'usuario');
create type papel_membro as enum ('owner', 'staff');
create type status_barbearia as enum ('trial', 'ativa', 'inadimplente', 'suspensa', 'cancelada');
create type status_agendamento as enum ('pendente', 'confirmado', 'concluido', 'cancelado', 'no_show');
create type status_pagamento as enum ('pendente', 'pago', 'falhou', 'estornado', 'cancelado');
create type metodo_pagamento as enum ('pix', 'cartao', 'dinheiro', 'no_local', 'assinatura');
create type modo_cobranca as enum ('integral', 'sinal', 'no_local');
create type status_assinatura as enum ('ativa', 'inadimplente', 'cancelada', 'pausada');
