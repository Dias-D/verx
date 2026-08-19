import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Text } from './Text';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Text (átomo)', () => {
  it('renderiza os filhos', () => {
    renderWithTheme(<Text>128</Text>);

    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('renderiza como span quando as="span"', () => {
    renderWithTheme(<Text as="span">128</Text>);

    expect(screen.getByText('128').tagName).toBe('SPAN');
  });
});
