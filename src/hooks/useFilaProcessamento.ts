import { useQuery } from '@tanstack/react-query'
import { listarFilaProcessamento } from '../services/filaProcessamentoService'

export function useFilaProcessamento() {
    return useQuery({
        queryKey: ['fila-processamento-pdfs'],
        queryFn: listarFilaProcessamento,
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 60,
    })
}