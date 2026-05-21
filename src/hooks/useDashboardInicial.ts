import { useQuery } from '@tanstack/react-query'
import { getDashboardInicial } from '../services/dashboardService'

export function useDashboardInicial() {
    return useQuery({
        queryKey: ['dashboard-inicial'],
        queryFn: getDashboardInicial,
        staleTime: 1000 * 60 * 5,
    })
}