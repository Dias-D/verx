import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { createEmptyFarmDraft } from '../../types/farmDraft';
import { PropriedadesFieldset } from './PropriedadesFieldset';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PropriedadesFieldset (organismo)', () => {
  it('renderiza um fieldset "Fazenda 1" para o rascunho recebido', () => {
    renderWithTheme(
      <PropriedadesFieldset farms={[createEmptyFarmDraft()]} onChange={() => {}} onAdd={() => {}} />,
    );

    expect(screen.getByText('Fazenda 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da fazenda')).toBeInTheDocument();
    expect(screen.getByLabelText('Cidade')).toBeInTheDocument();
    expect(screen.getByLabelText('Estado')).toBeInTheDocument();
    expect(screen.getByLabelText('Área total (ha)')).toBeInTheDocument();
    expect(screen.getByLabelText('Área agricultável (ha)')).toBeInTheDocument();
    expect(screen.getByLabelText('Área de vegetação (ha)')).toBeInTheDocument();
  });

  it('dispara onChange(index, patch) ao editar um campo', () => {
    const onChange = jest.fn();
    renderWithTheme(
      <PropriedadesFieldset farms={[createEmptyFarmDraft()]} onChange={onChange} onAdd={() => {}} />,
    );

    fireEvent.change(screen.getByLabelText('Nome da fazenda'), {
      target: { value: 'Fazenda Santa Rita' },
    });

    expect(onChange).toHaveBeenCalledWith(0, { name: 'Fazenda Santa Rita' });
  });

  it('dispara onAdd ao clicar em "+ Adicionar fazenda"', () => {
    const onAdd = jest.fn();
    renderWithTheme(
      <PropriedadesFieldset farms={[createEmptyFarmDraft()]} onChange={() => {}} onAdd={onAdd} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Adicionar fazenda' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('renderiza um fieldset por fazenda, numerado em ordem', () => {
    renderWithTheme(
      <PropriedadesFieldset
        farms={[createEmptyFarmDraft(), createEmptyFarmDraft()]}
        onChange={() => {}}
        onAdd={() => {}}
      />,
    );

    expect(screen.getByText('Fazenda 1')).toBeInTheDocument();
    expect(screen.getByText('Fazenda 2')).toBeInTheDocument();
  });

  it('exibe o erro de área da fazenda correspondente, quando presente em errors', () => {
    renderWithTheme(
      <PropriedadesFieldset
        farms={[createEmptyFarmDraft()]}
        onChange={() => {}}
        onAdd={() => {}}
        errors={{
          0: 'A soma das áreas agricultável e de vegetação (1.200 ha) não pode ultrapassar a área total (1.000 ha).',
        }}
      />,
    );

    expect(screen.getByText(/não pode ultrapassar a área total/)).toBeInTheDocument();
  });
});
