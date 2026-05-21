export function formatCurrency(value: number | null | undefined): string {
    const safeValue = Number(value ?? 0)

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(safeValue)
}

export function formatNumber(value: number | null | undefined): string {
    const safeValue = Number(value ?? 0)

    return new Intl.NumberFormat('pt-BR').format(safeValue)
}

export function formatDecimal(value: number | null | undefined, digits = 2): string {
    const safeValue = Number(value ?? 0)

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(safeValue)
}