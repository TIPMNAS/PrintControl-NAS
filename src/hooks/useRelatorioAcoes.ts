import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    aprovarRelatorioConferencia,
    rejeitarRelatorioConferencia,
} from '../services/relatorioAcoesService'

export function useAprovarRelatorio() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            relatorioId,
            observacoes,
        }: {
            relatorioId: string
            observacoes?: string
        }) => aprovarRelatorioConferencia(relatorioId, observacoes),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ['relatorio-detalhe', variables.relatorioId],
            })

            await queryClient.invalidateQueries({
                queryKey: ['relatorios-pdf'],
            })

            await queryClient.invalidateQueries({
                queryKey: ['dashboard-inicial'],
            })
        },
    })
}

export function useRejeitarRelatorio() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            relatorioId,
            motivo,
        }: {
            relatorioId: string
            motivo: string
        }) => rejeitarRelatorioConferencia(relatorioId, motivo),
        onSuccess: async (_data, variables) => {
            await queryClient.invalidateQueries({
                queryKey: ['relatorio-detalhe', variables.relatorioId],
            })

            await queryClient.invalidateQueries({
                queryKey: ['relatorios-pdf'],
            })

            await queryClient.invalidateQueries({
                queryKey: ['dashboard-inicial'],
            })
        },
    })
}