import 'styled-components';
import type { AppTheme } from './theme';

// Estende o DefaultTheme do styled-components com os tokens reais do projeto,
// para o `props => props.theme` ficar tipado em qualquer componente.
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
