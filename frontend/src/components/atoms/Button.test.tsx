import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Button, DangerButton, SecondaryButton } from './Button';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Button (átomo)', () => {
  it('renderiza o texto e dispara onClick ao ser clicado', () => {
    const onClick = jest.fn();
    renderWithTheme(<Button onClick={onClick}>Atualizar</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('não dispara onClick quando disabled', () => {
    const onClick = jest.fn();
    renderWithTheme(
      <Button onClick={onClick} disabled>
        Atualizar
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('SecondaryButton (átomo, variante de Button — espelha .btn-secondary do wireframe)', () => {
  it('renderiza o texto e dispara onClick, igual ao Button base', () => {
    const onClick = jest.fn();
    renderWithTheme(<SecondaryButton onClick={onClick}>Cancelar</SecondaryButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('DangerButton (átomo, variante de Button — espelha .btn-danger do wireframe)', () => {
  it('renderiza o texto e dispara onClick, igual ao Button base', () => {
    const onClick = jest.fn();
    renderWithTheme(<DangerButton onClick={onClick}>Excluir</DangerButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
