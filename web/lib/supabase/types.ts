export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          assinatura_cliente_id: string | null
          cancelado_fora_do_prazo: boolean
          chegou_em: string | null
          cliente_id: string
          created_at: string
          estabelecimento_id: string
          fim: string
          id: string
          inicio: string
          observacoes: string | null
          origem: string
          preco_centavos: number
          profissional_id: string
          servico_id: string
          status: Database["public"]["Enums"]["status_agendamento"]
        }
        Insert: {
          assinatura_cliente_id?: string | null
          cancelado_fora_do_prazo?: boolean
          chegou_em?: string | null
          cliente_id: string
          created_at?: string
          estabelecimento_id: string
          fim: string
          id?: string
          inicio: string
          observacoes?: string | null
          origem?: string
          preco_centavos: number
          profissional_id: string
          servico_id: string
          status?: Database["public"]["Enums"]["status_agendamento"]
        }
        Update: {
          assinatura_cliente_id?: string | null
          cancelado_fora_do_prazo?: boolean
          chegou_em?: string | null
          cliente_id?: string
          created_at?: string
          estabelecimento_id?: string
          fim?: string
          id?: string
          inicio?: string
          observacoes?: string | null
          origem?: string
          preco_centavos?: number
          profissional_id?: string
          servico_id?: string
          status?: Database["public"]["Enums"]["status_agendamento"]
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_assinatura_cliente_id_fkey"
            columns: ["assinatura_cliente_id"]
            isOneToOne: false
            referencedRelation: "assinaturas_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_clientes: {
        Row: {
          ciclo_fim: string
          ciclo_inicio: string
          cliente_id: string
          created_at: string
          estabelecimento_id: string
          gateway_subscription_id: string | null
          id: string
          plano_id: string
          status: Database["public"]["Enums"]["status_assinatura"]
          usos_ciclo: Json
        }
        Insert: {
          ciclo_fim: string
          ciclo_inicio: string
          cliente_id: string
          created_at?: string
          estabelecimento_id: string
          gateway_subscription_id?: string | null
          id?: string
          plano_id: string
          status?: Database["public"]["Enums"]["status_assinatura"]
          usos_ciclo?: Json
        }
        Update: {
          ciclo_fim?: string
          ciclo_inicio?: string
          cliente_id?: string
          created_at?: string
          estabelecimento_id?: string
          gateway_subscription_id?: string | null
          id?: string
          plano_id?: string
          status?: Database["public"]["Enums"]["status_assinatura"]
          usos_ciclo?: Json
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_clientes_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_clientes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_estabelecimento"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_plataforma: {
        Row: {
          created_at: string
          estabelecimento_id: string
          gateway_subscription_id: string | null
          id: string
          plano_plataforma_id: string
          preco_promocional_ate: string | null
          preco_promocional_centavos: number | null
          proximo_vencimento: string | null
          status: Database["public"]["Enums"]["status_assinatura"]
        }
        Insert: {
          created_at?: string
          estabelecimento_id: string
          gateway_subscription_id?: string | null
          id?: string
          plano_plataforma_id: string
          preco_promocional_ate?: string | null
          preco_promocional_centavos?: number | null
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
        }
        Update: {
          created_at?: string
          estabelecimento_id?: string
          gateway_subscription_id?: string | null
          id?: string
          plano_plataforma_id?: string
          preco_promocional_ate?: string | null
          preco_promocional_centavos?: number | null
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_plataforma_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plataforma_plano_plataforma_id_fkey"
            columns: ["plano_plataforma_id"]
            isOneToOne: false
            referencedRelation: "planos_plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueios: {
        Row: {
          estabelecimento_id: string
          fim: string
          id: string
          inicio: string
          motivo: string | null
          profissional_id: string | null
        }
        Insert: {
          estabelecimento_id: string
          fim: string
          id?: string
          inicio: string
          motivo?: string | null
          profissional_id?: string | null
        }
        Update: {
          estabelecimento_id?: string
          fim?: string
          id?: string
          inicio?: string
          motivo?: string | null
          profissional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      cartoes_fidelidade: {
        Row: {
          cliente_id: string
          completado_em: string | null
          created_at: string
          estabelecimento_id: string
          id: string
          programa_id: string
          resgatado_em: string | null
          selos_atual: number
          status: string
        }
        Insert: {
          cliente_id: string
          completado_em?: string | null
          created_at?: string
          estabelecimento_id: string
          id?: string
          programa_id: string
          resgatado_em?: string | null
          selos_atual?: number
          status?: string
        }
        Update: {
          cliente_id?: string
          completado_em?: string | null
          created_at?: string
          estabelecimento_id?: string
          id?: string
          programa_id?: string
          resgatado_em?: string | null
          selos_atual?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartoes_fidelidade_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartoes_fidelidade_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartoes_fidelidade_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas_fidelidade"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          email: string | null
          estabelecimento_id: string
          id: string
          nome: string
          observacoes: string | null
          telefone: string
          token_acesso: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          estabelecimento_id: string
          id?: string
          nome: string
          observacoes?: string | null
          telefone: string
          token_acesso?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          estabelecimento_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string
          token_acesso?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      estabelecimento_fotos: {
        Row: {
          ativo: boolean
          created_at: string
          desativado_por_limite_plano: boolean
          estabelecimento_id: string
          id: string
          ordem: number
          url: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          desativado_por_limite_plano?: boolean
          estabelecimento_id: string
          id?: string
          ordem?: number
          url: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          desativado_por_limite_plano?: boolean
          estabelecimento_id?: string
          id?: string
          ordem?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "estabelecimento_fotos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      estabelecimento_pagamento_config: {
        Row: {
          aceita_pagamento_antecipado: boolean
          aceita_pagamento_no_dia: boolean
          asaas_api_key: string | null
          estabelecimento_id: string
          gateway_ativo: string
          mercado_pago_access_token: string | null
          mercado_pago_public_key: string | null
          mercado_pago_webhook_secret: string | null
          updated_at: string
        }
        Insert: {
          aceita_pagamento_antecipado?: boolean
          aceita_pagamento_no_dia?: boolean
          asaas_api_key?: string | null
          estabelecimento_id: string
          gateway_ativo?: string
          mercado_pago_access_token?: string | null
          mercado_pago_public_key?: string | null
          mercado_pago_webhook_secret?: string | null
          updated_at?: string
        }
        Update: {
          aceita_pagamento_antecipado?: boolean
          aceita_pagamento_no_dia?: boolean
          asaas_api_key?: string | null
          estabelecimento_id?: string
          gateway_ativo?: string
          mercado_pago_access_token?: string | null
          mercado_pago_public_key?: string | null
          mercado_pago_webhook_secret?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estabelecimento_pagamento_config_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: true
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      estabelecimento_temas_comprados: {
        Row: {
          comprado_em: string
          estabelecimento_id: string
          id: string
          pagamento_plataforma_id: string | null
          tema_plataforma_id: string
        }
        Insert: {
          comprado_em?: string
          estabelecimento_id: string
          id?: string
          pagamento_plataforma_id?: string | null
          tema_plataforma_id: string
        }
        Update: {
          comprado_em?: string
          estabelecimento_id?: string
          id?: string
          pagamento_plataforma_id?: string | null
          tema_plataforma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estabelecimento_temas_comprados_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estabelecimento_temas_comprados_pagamento_plataforma_id_fkey"
            columns: ["pagamento_plataforma_id"]
            isOneToOne: false
            referencedRelation: "pagamentos_plataforma"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estabelecimento_temas_comprados_tema_plataforma_id_fkey"
            columns: ["tema_plataforma_id"]
            isOneToOne: false
            referencedRelation: "temas_plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      estabelecimentos: {
        Row: {
          asaas_customer_id: string | null
          asaas_subconta_id: string | null
          ativacao_manual: boolean
          cnpj: string | null
          config: Json
          created_at: string
          descricao: string | null
          endereco: Json | null
          horario_texto: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          nome: string
          plano_plataforma_id: string | null
          slug: string
          sobre: string | null
          status: Database["public"]["Enums"]["status_estabelecimento"]
          telefone_whatsapp: string | null
          timezone: string
          trial_ate: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subconta_id?: string | null
          ativacao_manual?: boolean
          cnpj?: string | null
          config?: Json
          created_at?: string
          descricao?: string | null
          endereco?: Json | null
          horario_texto?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          nome: string
          plano_plataforma_id?: string | null
          slug: string
          sobre?: string | null
          status?: Database["public"]["Enums"]["status_estabelecimento"]
          telefone_whatsapp?: string | null
          timezone?: string
          trial_ate?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subconta_id?: string | null
          ativacao_manual?: boolean
          cnpj?: string | null
          config?: Json
          created_at?: string
          descricao?: string | null
          endereco?: Json | null
          horario_texto?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          nome?: string
          plano_plataforma_id?: string | null
          slug?: string
          sobre?: string | null
          status?: Database["public"]["Enums"]["status_estabelecimento"]
          telefone_whatsapp?: string | null
          timezone?: string
          trial_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estabelecimentos_plano_plataforma_id_fkey"
            columns: ["plano_plataforma_id"]
            isOneToOne: false
            referencedRelation: "planos_plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_admin: {
        Row: {
          created_at: string
          detalhes: Json
          estabelecimento_id: string | null
          id: string
          super_admin_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          detalhes?: Json
          estabelecimento_id?: string | null
          id?: string
          super_admin_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          detalhes?: Json
          estabelecimento_id?: string | null
          id?: string
          super_admin_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_admin_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_admin_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      fidelidade_selos: {
        Row: {
          agendamento_id: string
          cartao_id: string
          created_at: string
          id: string
        }
        Insert: {
          agendamento_id: string
          cartao_id: string
          created_at?: string
          id?: string
        }
        Update: {
          agendamento_id?: string
          cartao_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fidelidade_selos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: true
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fidelidade_selos_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cartoes_fidelidade"
            referencedColumns: ["id"]
          },
        ]
      }
      jornadas: {
        Row: {
          dia_semana: number
          estabelecimento_id: string
          hora_fim: string
          hora_inicio: string
          id: string
          profissional_id: string
        }
        Insert: {
          dia_semana: number
          estabelecimento_id: string
          hora_fim: string
          hora_inicio: string
          id?: string
          profissional_id: string
        }
        Update: {
          dia_semana?: number
          estabelecimento_id?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jornadas_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jornadas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      membros_estabelecimento: {
        Row: {
          ativo: boolean
          created_at: string
          desativado_por_limite_plano: boolean
          estabelecimento_id: string
          id: string
          papel: Database["public"]["Enums"]["papel_membro"]
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          desativado_por_limite_plano?: boolean
          estabelecimento_id: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          desativado_por_limite_plano?: boolean
          estabelecimento_id?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_estabelecimento_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_estabelecimento_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_whatsapp: {
        Row: {
          agendamento_id: string | null
          cliente_id: string | null
          conteudo: string | null
          created_at: string
          estabelecimento_id: string
          id: string
          status: string
          tipo: string
        }
        Insert: {
          agendamento_id?: string | null
          cliente_id?: string | null
          conteudo?: string | null
          created_at?: string
          estabelecimento_id: string
          id?: string
          status?: string
          tipo: string
        }
        Update: {
          agendamento_id?: string | null
          cliente_id?: string | null
          conteudo?: string | null
          created_at?: string
          estabelecimento_id?: string
          id?: string
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_whatsapp_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_whatsapp_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_whatsapp_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          descricao: string | null
          estabelecimento_id: string
          id: string
          lida: boolean
          payload: Json
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          estabelecimento_id: string
          id?: string
          lida?: boolean
          payload?: Json
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          estabelecimento_id?: string
          id?: string
          lida?: boolean
          payload?: Json
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          agendamento_id: string | null
          assinatura_cliente_id: string | null
          cliente_id: string | null
          created_at: string
          estabelecimento_id: string
          gateway_payment_id: string | null
          id: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          pago_em: string | null
          pedido_id: string | null
          status: Database["public"]["Enums"]["status_pagamento"]
          valor_centavos: number
        }
        Insert: {
          agendamento_id?: string | null
          assinatura_cliente_id?: string | null
          cliente_id?: string | null
          created_at?: string
          estabelecimento_id: string
          gateway_payment_id?: string | null
          id?: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          pago_em?: string | null
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          valor_centavos: number
        }
        Update: {
          agendamento_id?: string | null
          assinatura_cliente_id?: string | null
          cliente_id?: string | null
          created_at?: string
          estabelecimento_id?: string
          gateway_payment_id?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          pago_em?: string | null
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_assinatura_cliente_id_fkey"
            columns: ["assinatura_cliente_id"]
            isOneToOne: false
            referencedRelation: "assinaturas_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_plataforma: {
        Row: {
          created_at: string
          estabelecimento_id: string
          gateway_payment_id: string | null
          id: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          pago_em: string | null
          plano_plataforma_id: string | null
          status: Database["public"]["Enums"]["status_pagamento"]
          tema_plataforma_id: string | null
          valor_centavos: number
        }
        Insert: {
          created_at?: string
          estabelecimento_id: string
          gateway_payment_id?: string | null
          id?: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          pago_em?: string | null
          plano_plataforma_id?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          tema_plataforma_id?: string | null
          valor_centavos: number
        }
        Update: {
          created_at?: string
          estabelecimento_id?: string
          gateway_payment_id?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          pago_em?: string | null
          plano_plataforma_id?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          tema_plataforma_id?: string | null
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_plataforma_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_plataforma_plano_plataforma_id_fkey"
            columns: ["plano_plataforma_id"]
            isOneToOne: false
            referencedRelation: "planos_plataforma"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_plataforma_tema_plataforma_id_fkey"
            columns: ["tema_plataforma_id"]
            isOneToOne: false
            referencedRelation: "temas_plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          created_at: string
          id: string
          nome_produto: string
          pedido_id: string
          preco_unitario_centavos: number
          produto_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome_produto: string
          pedido_id: string
          preco_unitario_centavos: number
          produto_id: string
          quantidade: number
        }
        Update: {
          created_at?: string
          id?: string
          nome_produto?: string
          pedido_id?: string
          preco_unitario_centavos?: number
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          agendamento_id: string | null
          cliente_id: string
          created_at: string
          estabelecimento_id: string
          id: string
          status: Database["public"]["Enums"]["status_pedido"]
          total_centavos: number
        }
        Insert: {
          agendamento_id?: string | null
          cliente_id: string
          created_at?: string
          estabelecimento_id: string
          id?: string
          status?: Database["public"]["Enums"]["status_pedido"]
          total_centavos: number
        }
        Update: {
          agendamento_id?: string | null
          cliente_id?: string
          created_at?: string
          estabelecimento_id?: string
          id?: string
          status?: Database["public"]["Enums"]["status_pedido"]
          total_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_estabelecimento: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          estabelecimento_id: string
          id: string
          nome: string
          preco_centavos: number
          regras: Json
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          estabelecimento_id: string
          id?: string
          nome: string
          preco_centavos: number
          regras?: Json
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          estabelecimento_id?: string
          id?: string
          nome?: string
          preco_centavos?: number
          regras?: Json
        }
        Relationships: [
          {
            foreignKeyName: "planos_estabelecimento_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_plataforma: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          max_fotos: number | null
          max_produtos: number | null
          max_profissionais: number | null
          max_usuarios: number | null
          nome: string
          preco_centavos: number
          promocao_assinar_ate: string | null
          promocao_ativa: boolean
          promocao_duracao_meses: number | null
          promocao_percentual: number | null
          promocao_tipo: string | null
          promocao_titulo: string | null
          promocao_valor_centavos: number | null
          recursos: Json
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_fotos?: number | null
          max_produtos?: number | null
          max_profissionais?: number | null
          max_usuarios?: number | null
          nome: string
          preco_centavos: number
          promocao_assinar_ate?: string | null
          promocao_ativa?: boolean
          promocao_duracao_meses?: number | null
          promocao_percentual?: number | null
          promocao_tipo?: string | null
          promocao_titulo?: string | null
          promocao_valor_centavos?: number | null
          recursos?: Json
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_fotos?: number | null
          max_produtos?: number | null
          max_profissionais?: number | null
          max_usuarios?: number | null
          nome?: string
          preco_centavos?: number
          promocao_assinar_ate?: string | null
          promocao_ativa?: boolean
          promocao_duracao_meses?: number | null
          promocao_percentual?: number | null
          promocao_tipo?: string | null
          promocao_titulo?: string | null
          promocao_valor_centavos?: number | null
          recursos?: Json
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          created_at: string
          desativado_por_limite_plano: boolean
          descricao: string | null
          estabelecimento_id: string
          estoque: number
          foto_url: string | null
          id: string
          meta_descricao: string | null
          meta_titulo: string | null
          nome: string
          ordem: number
          preco_centavos: number
          slug: string
          tags: string[]
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          desativado_por_limite_plano?: boolean
          descricao?: string | null
          estabelecimento_id: string
          estoque?: number
          foto_url?: string | null
          id?: string
          meta_descricao?: string | null
          meta_titulo?: string | null
          nome: string
          ordem?: number
          preco_centavos: number
          slug: string
          tags?: string[]
        }
        Update: {
          ativo?: boolean
          created_at?: string
          desativado_por_limite_plano?: boolean
          descricao?: string | null
          estabelecimento_id?: string
          estoque?: number
          foto_url?: string | null
          id?: string
          meta_descricao?: string | null
          meta_titulo?: string | null
          nome?: string
          ordem?: number
          preco_centavos?: number
          slug?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "produtos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          ativo: boolean
          comissao_percentual: number
          created_at: string
          desativado_por_limite_plano: boolean
          estabelecimento_id: string
          foto_url: string | null
          id: string
          nome: string
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean
          comissao_percentual?: number
          created_at?: string
          desativado_por_limite_plano?: boolean
          estabelecimento_id: string
          foto_url?: string | null
          id?: string
          nome: string
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean
          comissao_percentual?: number
          created_at?: string
          desativado_por_limite_plano?: boolean
          estabelecimento_id?: string
          foto_url?: string | null
          id?: string
          nome?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissionais_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional_servicos: {
        Row: {
          profissional_id: string
          servico_id: string
        }
        Insert: {
          profissional_id: string
          servico_id: string
        }
        Update: {
          profissional_id?: string
          servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissional_servicos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      programas_fidelidade: {
        Row: {
          ativo: boolean
          brinde_produto_id: string | null
          brinde_servico_id: string | null
          brinde_tipo: string
          created_at: string
          estabelecimento_id: string
          id: string
          nome: string
          selos_necessarios: number
          servico_id: string
        }
        Insert: {
          ativo?: boolean
          brinde_produto_id?: string | null
          brinde_servico_id?: string | null
          brinde_tipo: string
          created_at?: string
          estabelecimento_id: string
          id?: string
          nome: string
          selos_necessarios: number
          servico_id: string
        }
        Update: {
          ativo?: boolean
          brinde_produto_id?: string | null
          brinde_servico_id?: string | null
          brinde_tipo?: string
          created_at?: string
          estabelecimento_id?: string
          id?: string
          nome?: string
          selos_necessarios?: number
          servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programas_fidelidade_brinde_produto_id_fkey"
            columns: ["brinde_produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_fidelidade_brinde_servico_id_fkey"
            columns: ["brinde_servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_fidelidade_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_fidelidade_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          duracao_minutos: number
          estabelecimento_id: string
          id: string
          nome: string
          preco_centavos: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos: number
          estabelecimento_id: string
          id?: string
          nome: string
          preco_centavos: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number
          estabelecimento_id?: string
          id?: string
          nome?: string
          preco_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      temas_plataforma: {
        Row: {
          ativo: boolean
          chave: string
          created_at: string
          descricao: string | null
          foto_preview_url: string | null
          gratis: boolean
          id: string
          nome: string
          preco_centavos: number
        }
        Insert: {
          ativo?: boolean
          chave: string
          created_at?: string
          descricao?: string | null
          foto_preview_url?: string | null
          gratis?: boolean
          id?: string
          nome: string
          preco_centavos: number
        }
        Update: {
          ativo?: boolean
          chave?: string
          created_at?: string
          descricao?: string | null
          foto_preview_url?: string | null
          gratis?: boolean
          id?: string
          nome?: string
          preco_centavos?: number
        }
        Relationships: []
      }
      tickets_suporte: {
        Row: {
          aberto_por: string
          assunto: string
          created_at: string
          estabelecimento_id: string
          id: string
          status: Database["public"]["Enums"]["status_ticket"]
        }
        Insert: {
          aberto_por: string
          assunto: string
          created_at?: string
          estabelecimento_id: string
          id?: string
          status?: Database["public"]["Enums"]["status_ticket"]
        }
        Update: {
          aberto_por?: string
          assunto?: string
          created_at?: string
          estabelecimento_id?: string
          id?: string
          status?: Database["public"]["Enums"]["status_ticket"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_suporte_aberto_por_fkey"
            columns: ["aberto_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_suporte_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_suporte_mensagens: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          mensagem: string
          ticket_id: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          mensagem: string
          ticket_id: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          mensagem?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_suporte_mensagens_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_suporte_mensagens_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_suporte"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          cpf: string | null
          created_at: string
          genero: Database["public"]["Enums"]["genero_usuario"] | null
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel_global"]
          telefone: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id: string
          nome: string
          papel?: Database["public"]["Enums"]["papel_global"]
          telefone?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          genero?: Database["public"]["Enums"]["genero_usuario"] | null
          id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel_global"]
          telefone?: string | null
        }
        Relationships: []
      }
      webhook_eventos: {
        Row: {
          created_at: string
          evento_id_externo: string
          id: string
          origem: string
          payload: Json
          processado_em: string | null
        }
        Insert: {
          created_at?: string
          evento_id_externo: string
          id?: string
          origem: string
          payload: Json
          processado_em?: string | null
        }
        Update: {
          created_at?: string
          evento_id_externo?: string
          id?: string
          origem?: string
          payload?: Json
          processado_em?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_criar_estabelecimento: {
        Args: { p_nome: string; p_owner_id: string; p_slug: string }
        Returns: {
          asaas_customer_id: string | null
          asaas_subconta_id: string | null
          ativacao_manual: boolean
          cnpj: string | null
          config: Json
          created_at: string
          descricao: string | null
          endereco: Json | null
          horario_texto: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          nome: string
          plano_plataforma_id: string | null
          slug: string
          sobre: string | null
          status: Database["public"]["Enums"]["status_estabelecimento"]
          telefone_whatsapp: string | null
          timezone: string
          trial_ate: string | null
        }
        SetofOptions: {
          from: "*"
          to: "estabelecimentos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      agendamento_por_token: {
        Args: { p_token: string }
        Returns: {
          agendamento_id: string
          cliente_nome: string
          estabelecimento_id: string
          estabelecimento_nome: string
          estabelecimento_slug: string
          fim: string
          inicio: string
          preco_centavos: number
          profissional_id: string
          profissional_nome: string
          servico_id: string
          servico_nome: string
          status: Database["public"]["Enums"]["status_agendamento"]
        }[]
      }
      aplicar_limites_plano: {
        Args: { p_estabelecimento_id: string }
        Returns: undefined
      }
      assinatura_disponivel_para_servico: {
        Args: { p_cliente_id: string; p_servico_id: string }
        Returns: string
      }
      atualizar_status_agendamento: {
        Args: {
          p_agendamento_id: string
          p_novo_status: Database["public"]["Enums"]["status_agendamento"]
        }
        Returns: undefined
      }
      cancelar_agendamento_via_token: {
        Args: { p_agendamento_id: string; p_token: string }
        Returns: undefined
      }
      cartao_fidelidade_por_token: {
        Args: { p_token: string }
        Returns: {
          brinde: string
          cartao_id: string
          programa_nome: string
          selos_atual: number
          selos_necessarios: number
          status: string
        }[]
      }
      cartoes_fidelidade_publico_por_telefone: {
        Args: { p_estabelecimento_id: string; p_telefone: string }
        Returns: {
          brinde: string
          cartao_id: string
          programa_nome: string
          selos_atual: number
          selos_necessarios: number
          status: string
        }[]
      }
      checkin_buscar_agendamentos_publico: {
        Args: { p_estabelecimento_id: string; p_telefone: string }
        Returns: {
          agendamento_id: string
          inicio: string
          ja_chegou: boolean
          profissional_nome: string
          servico_nome: string
        }[]
      }
      checkin_confirmar_publico: {
        Args: {
          p_agendamento_id: string
          p_estabelecimento_id: string
          p_telefone: string
        }
        Returns: undefined
      }
      criar_agendamento_publico: {
        Args: {
          p_email?: string
          p_estabelecimento_id: string
          p_inicio: string
          p_itens?: Json
          p_nome: string
          p_profissional_id: string
          p_servico_id: string
          p_telefone: string
        }
        Returns: {
          agendamento_id: string
          pedido_id: string
          token_acesso: string
        }[]
      }
      criar_agendamento_publico_pix: {
        Args: {
          p_email: string
          p_estabelecimento_id: string
          p_inicio: string
          p_itens?: Json
          p_metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          p_nome: string
          p_profissional_id: string
          p_servico_id: string
          p_telefone: string
        }
        Returns: {
          agendamento_id: string
          pagamento_id: string
          pedido_id: string
          token_acesso: string
        }[]
      }
      criar_assinatura_publica_pix: {
        Args: {
          p_email: string
          p_estabelecimento_id: string
          p_metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          p_nome: string
          p_plano_id: string
          p_telefone: string
        }
        Returns: {
          assinatura_id: string
          pagamento_id: string
          token_acesso: string
        }[]
      }
      criar_pedido_publico: {
        Args: {
          p_email?: string
          p_estabelecimento_id: string
          p_itens: Json
          p_nome: string
          p_telefone: string
        }
        Returns: {
          pedido_id: string
          token_acesso: string
        }[]
      }
      criar_pedido_publico_pix: {
        Args: {
          p_email: string
          p_estabelecimento_id: string
          p_itens: Json
          p_metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          p_nome: string
          p_telefone: string
        }
        Returns: {
          pagamento_id: string
          pedido_id: string
          token_acesso: string
        }[]
      }
      eh_super_admin: { Args: never; Returns: boolean }
      estabelecimento_permite_clube_assinatura: {
        Args: { p_estabelecimento_id: string }
        Returns: boolean
      }
      estabelecimento_permite_fidelidade: {
        Args: { p_estabelecimento_id: string }
        Returns: boolean
      }
      estabelecimento_permite_loja: {
        Args: { p_estabelecimento_id: string }
        Returns: boolean
      }
      estabelecimento_permite_pagamento_online: {
        Args: { p_estabelecimento_id: string }
        Returns: boolean
      }
      estabelecimentos_que_possuo: { Args: never; Returns: string[] }
      fidelidade_status_cliente: {
        Args: { p_cliente_id: string }
        Returns: {
          brinde: string
          cartao_id: string
          programa_nome: string
          selos_atual: number
          selos_necessarios: number
          status: string
        }[]
      }
      formas_pagamento_publico: {
        Args: { p_estabelecimento_id: string }
        Returns: {
          aceita_pagamento_antecipado: boolean
          aceita_pagamento_no_dia: boolean
          gateway_ativo: string
          mercado_pago_public_key: string
        }[]
      }
      incrementar_estoque_produto: {
        Args: { p_produto_id: string; p_quantidade: number }
        Returns: undefined
      }
      meu_profissional_id: {
        Args: { p_estabelecimento_id: string }
        Returns: string
      }
      meus_estabelecimentos: { Args: never; Returns: string[] }
      onboarding_criar_estabelecimento: {
        Args: { p_nome: string; p_slug: string }
        Returns: {
          asaas_customer_id: string | null
          asaas_subconta_id: string | null
          ativacao_manual: boolean
          cnpj: string | null
          config: Json
          created_at: string
          descricao: string | null
          endereco: Json | null
          horario_texto: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          nome: string
          plano_plataforma_id: string | null
          slug: string
          sobre: string | null
          status: Database["public"]["Enums"]["status_estabelecimento"]
          telefone_whatsapp: string | null
          timezone: string
          trial_ate: string | null
        }
        SetofOptions: {
          from: "*"
          to: "estabelecimentos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pedido_por_token: {
        Args: { p_token: string }
        Returns: {
          agendamento_id: string
          created_at: string
          itens: Json
          pedido_id: string
          status: Database["public"]["Enums"]["status_pedido"]
          total_centavos: number
        }[]
      }
      processar_itens_pedido: {
        Args: {
          p_estabelecimento_id: string
          p_itens: Json
          p_pedido_id: string
        }
        Returns: number
      }
      remarcar_agendamento_via_token: {
        Args: {
          p_agendamento_id: string
          p_novo_inicio: string
          p_token: string
        }
        Returns: undefined
      }
      resgatar_cartao_fidelidade: {
        Args: { p_cartao_id: string }
        Returns: undefined
      }
      slots_disponiveis: {
        Args: {
          p_data: string
          p_estabelecimento_id: string
          p_profissional_id: string
          p_servico_id: string
        }
        Returns: {
          fim: string
          inicio: string
        }[]
      }
      status_pagamento_publico: {
        Args: { p_pagamento_id: string; p_token: string }
        Returns: {
          status_agendamento: Database["public"]["Enums"]["status_agendamento"]
          status_assinatura: Database["public"]["Enums"]["status_assinatura"]
          status_pagamento: Database["public"]["Enums"]["status_pagamento"]
          status_pedido: Database["public"]["Enums"]["status_pedido"]
        }[]
      }
    }
    Enums: {
      genero_usuario: "masculino" | "feminino"
      metodo_pagamento:
        | "pix"
        | "cartao"
        | "dinheiro"
        | "no_local"
        | "assinatura"
      modo_cobranca: "integral" | "sinal" | "no_local"
      papel_global: "super_admin" | "usuario"
      papel_membro: "owner" | "staff"
      status_agendamento:
        | "pendente"
        | "confirmado"
        | "concluido"
        | "cancelado"
        | "no_show"
      status_assinatura:
        | "ativa"
        | "inadimplente"
        | "cancelada"
        | "pausada"
        | "pendente"
      status_estabelecimento:
        | "trial"
        | "ativa"
        | "inadimplente"
        | "suspensa"
        | "cancelada"
      status_pagamento:
        | "pendente"
        | "pago"
        | "falhou"
        | "estornado"
        | "cancelado"
      status_pedido:
        | "pendente"
        | "aguardando_retirada"
        | "retirado"
        | "cancelado"
      status_ticket: "aberto" | "em_andamento" | "resolvido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      genero_usuario: ["masculino", "feminino"],
      metodo_pagamento: ["pix", "cartao", "dinheiro", "no_local", "assinatura"],
      modo_cobranca: ["integral", "sinal", "no_local"],
      papel_global: ["super_admin", "usuario"],
      papel_membro: ["owner", "staff"],
      status_agendamento: [
        "pendente",
        "confirmado",
        "concluido",
        "cancelado",
        "no_show",
      ],
      status_assinatura: [
        "ativa",
        "inadimplente",
        "cancelada",
        "pausada",
        "pendente",
      ],
      status_estabelecimento: [
        "trial",
        "ativa",
        "inadimplente",
        "suspensa",
        "cancelada",
      ],
      status_pagamento: [
        "pendente",
        "pago",
        "falhou",
        "estornado",
        "cancelado",
      ],
      status_pedido: [
        "pendente",
        "aguardando_retirada",
        "retirado",
        "cancelado",
      ],
      status_ticket: ["aberto", "em_andamento", "resolvido"],
    },
  },
} as const
