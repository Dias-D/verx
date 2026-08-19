import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Teste de fumaça da etapa F0 — não há regra de negócio ainda para cobrir
 * (isso começa em F1). Este teste só prova que a fundação inteira (React +
 * Redux Provider + ThemeProvider do styled-components) sobe sem quebrar.
 */
describe('App', () => {
  it('renderiza sem quebrar, com Redux e styled-components conectados', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /brain agriculture/i }),
    ).toBeInTheDocument();
  });
});
