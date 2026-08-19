/**
 * Formata `DashboardSnapshot.calculatedAt` (ISO 8601, opcional — ver
 * types/dashboard.ts). Fixa `timeZone: 'America/Sao_Paulo'` de propósito: o
 * horário exibido precisa ser determinístico independentemente do fuso do
 * host (dev machine, CI, container Docker), não do fuso local de quem
 * avalia.
 *
 * Ausência de `calculatedAt` (janela rara de cold-start do cache no
 * backend) é um estado real da UI, não um erro — as duas funções tratam
 * isso sem lançar exceção.
 */
export function formatTimeOnly(iso?: string): string {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

/**
 * Sentença completa usada pela RefreshBar (molécula): "Dados calculados às
 * HH:mm" no caminho normal, ou "Calculando dados..." na janela rara em que
 * o backend ainda não carimbou o snapshot (cold-start do cache).
 */
export function formatCalculatedAt(iso?: string): string {
  const time = formatTimeOnly(iso);
  return time ? `Dados calculados às ${time}` : 'Calculando dados...';
}
