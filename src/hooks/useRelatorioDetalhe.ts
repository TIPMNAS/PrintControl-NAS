import { useQuery } from '@tanstack/react-query'
import { buscarRelatorioDetalhe } from '../services/relatorioDetalheService'

export function useRelatorioDetalhe(relatorioId: string | undefined) {
  return useQuery({
    queryKey: ['relatorio-detalhe', relatorioId],
    queryFn: () => {
      if (!relatorioId) {
        throw new Error('ID do relatório não informado.')
      }

      return buscarRelatorioDetalhe(relatorioId)
    },
    enabled: Boolean(relatorioId),
    staleTime: 1000 * 60 * 5,
  })
}
