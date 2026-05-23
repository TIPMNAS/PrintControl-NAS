import { useQuery } from '@tanstack/react-query'
import { getDashboardInicial } from '../services/dashboardService'
import type { DashboardFiltros, DashboardInicial } from '../types/dashboard'

export function useDashboardInicial(filtros?: DashboardFiltros) {
    return useQuery<DashboardInicial>({
        queryKey: ['dashboard-inicial', filtros],
        queryFn: () => getDashboardInicial(filtros),
        staleTime: 1000 * 60 * 5,
    })
}
