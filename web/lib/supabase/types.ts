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
          barbearia_id: string
          cliente_id: string
          created_at: string
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
          barbearia_id: string
          cliente_id: string
          created_at?: string
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
          barbearia_id?: string
          cliente_id?: string
          created_at?: string
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
            foreignKeyName: "agendamentos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
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
          barbearia_id: string
          ciclo_fim: string
          ciclo_inicio: string
          cliente_id: string
          created_at: string
          gateway_subscription_id: string | null
          id: string
          plano_id: string
          status: Database["public"]["Enums"]["status_assinatura"]
          usos_ciclo: Json
        }
        Insert: {
          barbearia_id: string
          ciclo_fim: string
          ciclo_inicio: string
          cliente_id: string
          created_at?: string
          gateway_subscription_id?: string | null
          id?: string
          plano_id: string
          status?: Database["public"]["Enums"]["status_assinatura"]
          usos_ciclo?: Json
        }
        Update: {
          barbearia_id?: string
          ciclo_fim?: string
          ciclo_inicio?: string
          cliente_id?: string
          created_at?: string
          gateway_subscription_id?: string | null
          id?: string
          plano_id?: string
          status?: Database["public"]["Enums"]["status_assinatura"]
          usos_ciclo?: Json
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_clientes_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_clientes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_barbearia"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_plataforma: {
        Row: {
          barbearia_id: string
          created_at: string
          gateway_subscription_id: string | null
          id: string
          plano_plataforma_id: string
          proximo_vencimento: string | null
          status: Database["public"]["Enums"]["status_assinatura"]
        }
        Insert: {
          barbearia_id: string
          created_at?: string
          gateway_subscription_id?: string | null
          id?: string
          plano_plataforma_id: string
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
        }
        Update: {
          barbearia_id?: string
          created_at?: string
          gateway_subscription_id?: string | null
          id?: string
          plano_plataforma_id?: string
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_plataforma_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
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
      barbearias: {
        Row: {
          asaas_customer_id: string | null
          asaas_subconta_id: string | null
          ativacao_manual: boolean
          config: Json
          created_at: string
          descricao: string | null
          endereco: Json | null
          id: string
          logo_url: string | null
          nome: string
          plano_plataforma_id: string | null
          slug: string
          status: Database["public"]["Enums"]["status_barbearia"]
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
          id?: string
          logo_url?: string | null
          nome: string
          plano_plataforma_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["status_barbearia"]
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
          id?: string
          logo_url?: string | null
          nome?: string
          plano_plataforma_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["status_barbearia"]
          telefone_whatsapp?: string | null
          timezone?: string
          trial_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbearias_plano_plataforma_id_fkey"
            columns: ["plano_plataforma_id"]
            isOneToOne: false
            referencedRelation: "planos_plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueios: {
        Row: {
          barbearia_id: string
          fim: string
          id: string
          inicio: string
          motivo: string | null
          profissional_id: string | null
        }
        Insert: {
          barbearia_id: string
          fim: string
          id?: string
          inicio: string
          motivo?: string | null
          profissional_id?: string | null
        }
        Update: {
          barbearia_id?: string
          fim?: string
          id?: string
          inicio?: string
          motivo?: string | null
          profissional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
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
          barbearia_id: string
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string
          token_acesso: string
          user_id: string | null
        }
        Insert: {
          barbearia_id: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone: string
          token_acesso?: string
          user_id?: string | null
        }
        Update: {
          barbearia_id?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string
          token_acesso?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
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
      jornadas: {
        Row: {
          barbearia_id: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
          profissional_id: string
        }
        Insert: {
          barbearia_id: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: string
          profissional_id: string
        }
        Update: {
          barbearia_id?: string
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jornadas_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
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
      membros_barbearia: {
        Row: {
          barbearia_id: string
          id: string
          papel: Database["public"]["Enums"]["papel_membro"]
          usuario_id: string
        }
        Insert: {
          barbearia_id: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          usuario_id: string
        }
        Update: {
          barbearia_id?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_barbearia_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_barbearia_usuario_id_fkey"
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
          barbearia_id: string
          cliente_id: string | null
          conteudo: string | null
          created_at: string
          id: string
          status: string
          tipo: string
        }
        Insert: {
          agendamento_id?: string | null
          barbearia_id: string
          cliente_id?: string | null
          conteudo?: string | null
          created_at?: string
          id?: string
          status?: string
          tipo: string
        }
        Update: {
          agendamento_id?: string | null
          barbearia_id?: string
          cliente_id?: string | null
          conteudo?: string | null
          created_at?: string
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
            foreignKeyName: "mensagens_whatsapp_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_whatsapp_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          agendamento_id: string | null
          assinatura_cliente_id: string | null
          barbearia_id: string
          cliente_id: string | null
          created_at: string
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
          barbearia_id: string
          cliente_id?: string | null
          created_at?: string
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
          barbearia_id?: string
          cliente_id?: string | null
          created_at?: string
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
            foreignKeyName: "pagamentos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_barbearia: {
        Row: {
          ativo: boolean
          barbearia_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_centavos: number
          regras: Json
        }
        Insert: {
          ativo?: boolean
          barbearia_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_centavos: number
          regras?: Json
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_centavos?: number
          regras?: Json
        }
        Relationships: [
          {
            foreignKeyName: "planos_barbearia_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_plataforma: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          max_profissionais: number | null
          nome: string
          preco_centavos: number
          recursos: Json
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_profissionais?: number | null
          nome: string
          preco_centavos: number
          recursos?: Json
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_profissionais?: number | null
          nome?: string
          preco_centavos?: number
          recursos?: Json
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          ativo: boolean
          barbearia_id: string
          comissao_percentual: number
          created_at: string
          foto_url: string | null
          id: string
          nome: string
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean
          barbearia_id: string
          comissao_percentual?: number
          created_at?: string
          foto_url?: string | null
          id?: string
          nome: string
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          comissao_percentual?: number
          created_at?: string
          foto_url?: string | null
          id?: string
          nome?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
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
          barbearia_id: string
          categoria: string | null
          created_at: string
          descricao: string | null
          duracao_minutos: number
          id: string
          nome: string
          preco_centavos: number
        }
        Insert: {
          ativo?: boolean
          barbearia_id: string
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos: number
          id?: string
          nome: string
          preco_centavos: number
        }
        Update: {
          ativo?: boolean
          barbearia_id?: string
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number
          id?: string
          nome?: string
          preco_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_barbearia_id_fkey"
            columns: ["barbearia_id"]
            isOneToOne: false
            referencedRelation: "barbearias"
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
      agendamento_por_token: {
        Args: { p_token: string }
        Returns: {
          agendamento_id: string
          barbearia_nome: string
          barbearia_slug: string
          cliente_nome: string
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
      criar_agendamento_publico: {
        Args: {
          p_barbearia_id: string
          p_email?: string
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
      eh_super_admin: { Args: never; Returns: boolean }
      minhas_barbearias: { Args: never; Returns: string[] }
      onboarding_criar_barbearia: {
        Args: { p_nome: string; p_slug: string }
        Returns: {
          asaas_customer_id: string | null
          asaas_subconta_id: string | null
          ativacao_manual: boolean
          config: Json
          created_at: string
          descricao: string | null
          endereco: Json | null
          id: string
          logo_url: string | null
          nome: string
          plano_plataforma_id: string | null
          slug: string
          status: Database["public"]["Enums"]["status_barbearia"]
          telefone_whatsapp: string | null
          timezone: string
          trial_ate: string | null
        }
        SetofOptions: {
          from: "*"
          to: "barbearias"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      slots_disponiveis: {
        Args: {
          p_barbearia_id: string
          p_data: string
          p_profissional_id: string
          p_servico_id: string
        }
        Returns: {
          fim: string
          inicio: string
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
      status_barbearia:
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
      status_barbearia: [
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
    },
  },
} as const
