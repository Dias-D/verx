import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Select } from './Select';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Select (átomo)', () => {
  it('renderiza as opções recebidas e dispara onChange ao selecionar', () => {
    const onChange = jest.fn();
    renderWithTheme(
      <Select
        aria-label="Estado"
        value="MT"
        onChange={onChange}
        options={[
          { value: 'MT', label: 'MT' },
          { value: 'GO', label: 'GO' },
        ]}
      />,
    );

    const select = screen.getByLabelText('Estado') as HTMLSelectElement;
    expect(select.value).toBe('MT');
    expect(screen.getByRole('option', { name: 'GO' })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'GO' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
