-- Token de webhook da Asaas, por estabelecimento (mesmo papel de mercado_pago_webhook_secret):
-- a Asaas nao usa HMAC como a Mercado Pago, e sim um token estatico configurado no painel dela e
-- ecoado de volta no header "asaas-access-token" em toda notificacao.

alter table estabelecimento_pagamento_config add column asaas_webhook_token text;
