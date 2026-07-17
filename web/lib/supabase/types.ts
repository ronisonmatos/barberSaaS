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
          proximo_vencimento: string | null
          status: Database["public"]["Enums"]["status_assinatura"]
        }
        Insert: {
          created_at?: string
          estabelecimento_id: string
          gateway_subscription_id?: string | null
          id?: string
          plano_plataforma_id: string
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
        }
        Update: {
          created_at?: string
          estabelecimento_id?: string
          gateway_subscription_id?: string | null
          id?: string
          plano_plataforma_id?: string
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
          created_at: string
          estabelecimento_id: string
          id: string
          ordem: number
          url: string
        }
        Insert: {
          created_at?: string
          estabelecimento_id: string
          id?: string
          ordem?: number
          url: string
        }
        Update: {
          created_at?: string
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
      estabelecimentos: {
        Row: {
          asaas_customer_id: string | null
          asaas_subconta_id: string | null
          ativacao_manual: boolean
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
          estabelecimento_id: string
          id: string
          papel: Database["public"]["Enums"]["papel_membro"]
          usuario_id: string
        }
        Insert: {
          estabelecimento_id: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          usuario_id: string
        }
        Update: {
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
          plano_plataforma_id: string
          status: Database["public"]["Enums"]["status_pagamento"]
          valor_centavos: number
        }
        Insert: {
          created_at?: string
          estabelecimento_id: string
          gateway_payment_id?: string | null
          id?: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          pago_em?: string | null
          plano_plataforma_id: string
          status?: Database["public"]["Enums"]["status_pagamento"]
          valor_centavos: number
        }
        Update: {
          created_at?: string
          estabelecimento_id?: string
          gateway_payment_id?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          pago_em?: string | null
          plano_plataforma_id?: string
          status?: Database["public"]["Enums"]["status_pagamento"]
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
          max_profissionais: number | null
          max_usuarios: number | null
          nome: string
          preco_centavos: number
          recursos: Json
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_fotos?: number | null
          max_profissionais?: number | null
          max_usuarios?: number | null
          nome: string
          preco_centavos: number
          recursos?: Json
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_fotos?: number | null
          max_profissionais?: number | null
          max_usuarios?: number | null
          nome?: string
          preco_centavos?: number
          recursos?: Json
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          ativo: boolean
          comissao_percentual: number
          created_at: string
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
          created_at: string
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel_global"]
          telefone: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
          papel?: Database["public"]["Enums"]["papel_global"]
          telefone?: string | null
        }
        Update: {
          created_at?: string
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
          estabelecimento_nome: string
          estabelecimento_slug: string
          fim: string
          inicio: string
          preco_centavos: number
          profissional_nome: string
          servico_nome: string
          status: Database["public"]["Enums"]["status_agendamento"]
        }[]
      }
      cancelar_agendamento_via_token: {
        Args: { p_agendamento_id: string; p_token: string }
        Returns: undefined
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
          p_nome: string
          p_profissional_id: string
          p_servico_id: string
          p_telefone: string
        }
        Returns: {
          agendamento_id: string
          token_acesso: string
        }[]
      }
      criar_agendamento_publico_pix: {
        Args: {
          p_email: string
          p_estabelecimento_id: string
          p_inicio: string
          p_metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          p_nome: string
          p_profissional_id: string
          p_servico_id: string
          p_telefone: string
        }
        Returns: {
          agendamento_id: string
          pagamento_id: string
          token_acesso: string
        }[]
      }
      eh_super_admin: { Args: never; Returns: boolean }
      estabelecimentos_que_possuo: { Args: never; Returns: string[] }
      formas_pagamento_publico: {
        Args: { p_estabelecimento_id: string }
        Returns: {
          aceita_pagamento_antecipado: boolean
          aceita_pagamento_no_dia: boolean
          gateway_ativo: string
          mercado_pago_public_key: string
        }[]
      }
      meus_estabelecimentos: { Args: never; Returns: string[] }
      onboarding_criar_estabelecimento: {
        Args: { p_nome: string; p_slug: string }
        Returns: {
          asaas_customer_id: string | null
          asaas_subconta_id: string | null
          ativacao_manual: boolean
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
          status_pagamento: Database["public"]["Enums"]["status_pagamento"]
        }[]
      }
    }
    Enums: {
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
      status_assinatura: "ativa" | "inadimplente" | "cancelada" | "pausada"
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
      status_assinatura: ["ativa", "inadimplente", "cancelada", "pausada"],
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
      status_ticket: ["aberto", "em_andamento", "resolvido"],
    },
  },
} as const
