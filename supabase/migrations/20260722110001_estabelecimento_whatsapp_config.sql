-- WhatsApp Cloud API (Meta) configuravel por estabelecimento, credenciais proprias -- mesmo
-- padrao ja usado em estabelecimento_pagamento_config (nao e conta/numero gerenciado pela
-- plataforma). Acesso restrito a owner por ser credencial sensivel.
--
-- nome_template_lembrete/idioma_template existem porque WhatsApp Business Platform so permite
-- enviar mensagem pra um cliente fora da janela de atendimento de 24h usando um "template"
-- pre-aprovado pela Meta -- cada estabelecimento cria e aprova o proprio template no Meta
-- Business Manager, entao o nome pode variar por estabelecimento.
create table estabelecimento_whatsapp_config (
  estabelecimento_id uuid primary key references estabelecimentos(id) on delete cascade,
  ativo boolean not null default false,
  phone_number_id text,
  access_token text,
  nome_template_lembrete text not null default 'lembrete_renovacao',
  idioma_template text not null default 'pt_BR',
  updated_at timestamptz not null default now()
);

alter table estabelecimento_whatsapp_config enable row level security;

create policy "owner le config de whatsapp" on estabelecimento_whatsapp_config for select
  using (
    estabelecimento_id in (
      select estabelecimento_id from membros_estabelecimento
      where usuario_id = auth.uid() and papel = 'owner'
    ) or eh_super_admin()
  );

create policy "owner escreve config de whatsapp" on estabelecimento_whatsapp_config for all
  using (
    estabelecimento_id in (
      select estabelecimento_id from membros_estabelecimento
      where usuario_id = auth.uid() and papel = 'owner'
    ) or eh_super_admin()
  )
  with check (
    estabelecimento_id in (
      select estabelecimento_id from membros_estabelecimento
      where usuario_id = auth.uid() and papel = 'owner'
    ) or eh_super_admin()
  );
