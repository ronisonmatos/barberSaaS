-- Feedback do usuario: um plano pode permitir o mesmo servico mais de uma vez por mes (ex:
-- "2x Corte Classico/mes"). Ate aqui so dava pra configurar 1 horario fixo por assinatura inteira
-- (unique(assinatura_cliente_id)) -- se o plano cobre 2x, o cliente so teria 1 das 2 visitas
-- garantidas automaticamente, tendo que agendar a outra na mao (o oposto do que "horario fixo"
-- deveria resolver). Remove a restricao de 1-por-assinatura; a validacao de nao ultrapassar a
-- cota do plano (quantidade_mes) passa a ser feita em codigo, contando quantos horarios fixos
-- ativos ja existem pra aquele (assinatura, servico) antes de permitir adicionar mais um -- ver
-- web/lib/horario-fixo.ts.
alter table assinatura_horarios_fixos drop constraint assinatura_horarios_fixos_assinatura_cliente_id_key;
