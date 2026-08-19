import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Input } from './Input';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Input (átomo)', () => {
  it('renderiza o valor recebido e dispara onChange ao digitar', () => {
    const onChange = jest.fn();
    renderWithTheme(<Input aria-label="Nome" value="José" onChange={onChange} />);

    const input = screen.getByLabelText('Nome') as HTMLInputElement;
    expect(input.value).toBe('José');

    fireEvent.change(input, { target: { value: 'José Aparecido' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('não conhece o domínio: aceita qualquer placeholder/type genérico', () => {
    renderWithTheme(<Input aria-label="Área total" type="number" placeholder="0" value="" onChange={() => {}} />);

    const input = screen.getByLabelText('Área total') as HTMLInputElement;
    expect(input.type).toBe('number');
    expect(input.placeholder).toBe('0');
  });
});
