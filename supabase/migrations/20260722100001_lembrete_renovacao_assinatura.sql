-- Aviso automatico de renovacao do clube de assinatura (e-mail agora, WhatsApp quando a API da
-- Meta estiver configurada -- fica pra uma leva futura). Controla se ja avisamos o cliente nesse
-- ciclo pra nao mandar o mesmo lembrete todo dia ate o ciclo vencer de verdade; zera sempre que o
-- ciclo renova (mesmo lugar que ja zera usos_ciclo/ciclo_inicio/ciclo_fim ao confirmar pagamento).
alter table assinaturas_clientes add column lembrete_renovacao_enviado_em timestamptz;
