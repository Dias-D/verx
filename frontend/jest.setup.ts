import { TextDecoder, TextEncoder } from 'node:util';
import '@testing-library/jest-dom';

// jsdom não expõe TextEncoder/TextDecoder globalmente (só existem no
// ambiente Node "real"); react-router-dom (via react-router) importa isso
// no nível de módulo — sem o polyfill, qualquer teste que importe
// react-router-dom quebra com "TextEncoder is not defined" antes mesmo de
// renderizar. Só usado a partir da etapa F1 (PageLayout, App, Dashboard).
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}
