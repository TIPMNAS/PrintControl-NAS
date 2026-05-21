/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_PRINTCONTROL_CONTRATO_NUMERO: string
    readonly VITE_PRINTCONTROL_MES_PADRAO: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}