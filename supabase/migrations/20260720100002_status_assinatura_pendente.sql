-- status_assinatura nao tinha um estado "aguardando confirmacao do 1o pagamento" (mesmo papel
-- que 'pendente' ja tem em status_agendamento). Fica em migration propria porque ALTER TYPE ...
-- ADD VALUE nao pode ser usado na mesma transacao em que o valor novo e referenciado.

alter type status_assinatura add value 'pendente';
