/**
 * Tema base do styled-components. Tokens mínimos para a fundação (F0);
 * cada etapa seguinte (F1 dashboard, F2 CRUD produtor) pode estender esta
 * paleta conforme o wireframe congelado em resources/templates/wireframes/
 * exigir, sem redecidir a estrutura do tema.
 */
export const theme = {
  colors: {
    background: '#f5f5f2',
    surface: '#ffffff',
    border: '#e0ddd6',
    text: '#1f2933',
    textMuted: '#6b7280',
    primary: '#2f6f4f',
    primaryText: '#ffffff',
    danger: '#b3261e',
    dangerBg: '#fdecea',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  fontSizes: {
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '28px',
  },
} as const;

export type AppTheme = typeof theme;
