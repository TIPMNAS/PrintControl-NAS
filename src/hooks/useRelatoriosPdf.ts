import { useQuery } from '@tanstack/react-query'
import { listarRelatoriosPdf } from '../services/relatoriosPdfService'

export function useRelatoriosPdf() {
    return useQuery({
        queryKey: ['relatorios-pdf'],
        queryFn: listarRelatoriosPdf,
        staleTime: 1000 * 60 * 5,
    })
}