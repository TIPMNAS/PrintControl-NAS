export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            contratos: {
                Row: {
                    id: string
                    numero_contrato: string
                    fornecedor: string
                    cnpj_fornecedor: string | null
                    vigencia_inicio: string | null
                    vigencia_fim: string | null
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    numero_contrato: string
                    fornecedor: string
                    cnpj_fornecedor?: string | null
                    vigencia_inicio?: string | null
                    vigencia_fim?: string | null
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    numero_contrato?: string
                    fornecedor?: string
                    cnpj_fornecedor?: string | null
                    vigencia_inicio?: string | null
                    vigencia_fim?: string | null
                    status?: string
                    created_at?: string
                }
            }

            relatorios_pdf: {
                Row: {
                    id: string
                    contrato_id: string | null
                    mes_referencia: string
                    classificacao_af: string | null
                    valor_bruto_pdf: number | null
                    desconto_pdf: number | null
                    caucao_pdf: number | null
                    retencao_pdf: number | null
                    valor_total_pdf: number | null
                    valor_total_calculado: number | null
                    arquivo_path: string | null
                    status: string
                    json_extraido: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    contrato_id?: string | null
                    mes_referencia: string
                    classificacao_af?: string | null
                    valor_bruto_pdf?: number | null
                    desconto_pdf?: number | null
                    caucao_pdf?: number | null
                    retencao_pdf?: number | null
                    valor_total_pdf?: number | null
                    valor_total_calculado?: number | null
                    arquivo_path?: string | null
                    status?: string
                    json_extraido?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    contrato_id?: string | null
                    mes_referencia?: string
                    classificacao_af?: string | null
                    valor_bruto_pdf?: number | null
                    desconto_pdf?: number | null
                    caucao_pdf?: number | null
                    retencao_pdf?: number | null
                    valor_total_pdf?: number | null
                    valor_total_calculado?: number | null
                    arquivo_path?: string | null
                    status?: string
                    json_extraido?: Json | null
                    created_at?: string
                }
            }

            leituras_mensais: {
                Row: {
                    id: string
                    relatorio_id: string
                    equipamento_id: string | null
                    modelo_texto_pdf: string | null
                    serie_texto_pdf: string | null
                    site_texto_pdf: string | null
                    depto_texto_pdf: string | null
                    ant_pb: number | null
                    atu_pb: number | null
                    saldo_pb: number | null
                    ant_cor: number | null
                    atu_cor: number | null
                    saldo_cor: number | null
                    total_geral_pdf: number | null
                    total_calculado: number | null
                    divergente: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    relatorio_id: string
                    equipamento_id?: string | null
                    modelo_texto_pdf?: string | null
                    serie_texto_pdf?: string | null
                    site_texto_pdf?: string | null
                    depto_texto_pdf?: string | null
                    ant_pb?: number | null
                    atu_pb?: number | null
                    saldo_pb?: number | null
                    ant_cor?: number | null
                    atu_cor?: number | null
                    saldo_cor?: number | null
                    total_geral_pdf?: number | null
                    total_calculado?: number | null
                    divergente?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    relatorio_id?: string
                    equipamento_id?: string | null
                    modelo_texto_pdf?: string | null
                    serie_texto_pdf?: string | null
                    site_texto_pdf?: string | null
                    depto_texto_pdf?: string | null
                    ant_pb?: number | null
                    atu_pb?: number | null
                    saldo_pb?: number | null
                    ant_cor?: number | null
                    atu_cor?: number | null
                    saldo_cor?: number | null
                    total_geral_pdf?: number | null
                    total_calculado?: number | null
                    divergente?: boolean
                    created_at?: string
                }
            }
        }

        Views: Record<string, never>

        Functions: {
            rpc_status_importacao_mensal: {
                Args: {
                    p_contrato_id?: string | null
                    p_mes_referencia?: string | null
                }
                Returns: Json
            }
        }
    }
}