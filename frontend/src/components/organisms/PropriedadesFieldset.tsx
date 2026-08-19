import styled from 'styled-components';
import { FormField } from '../atoms/FormField';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { SecondaryButton } from '../atoms/Button';
import { BRAZILIAN_STATES } from '../../types/farm';
import type { FarmDraft } from '../../types/farmDraft';

const Fieldset = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Legend = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: #24573f;
`;

const Row3 = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Row3Areas = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const FieldsetError = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 12px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const AddFarmButton = styled(SecondaryButton)`
  background: none;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  width: 100%;
  justify-content: center;
`;

const STATE_OPTIONS = BRAZILIAN_STATES.map((state) => ({ value: state, label: state }));

export interface PropriedadesFieldsetProps {
  farms: FarmDraft[];
  onChange: (index: number, patch: Partial<FarmDraft>) => void;
  onAdd: () => void;
  errors?: Record<number, string>;
}

/**
 * Organismo: seção com significado de domínio (as propriedades de um
 * produtor), compõe átomos de formulário (FormField, Input, Select). Espelha
 * `.fieldset` do wireframe congelado — um bloco por fazenda, mais o botão
 * "+ Adicionar fazenda". Não fala com a API nem com a store: recebe o
 * array de rascunhos e devolve mudanças por callback, quem orquestra o
 * envio é a página (ver pages/Produtores.tsx).
 */
export function PropriedadesFieldset({ farms, onChange, onAdd, errors }: PropriedadesFieldsetProps) {
  return (
    <div>
      {farms.map((farm, index) => (
        <Fieldset key={farm.id ?? `new-${index}`}>
          <Legend>Fazenda {index + 1}</Legend>
          <Row3>
            <FormField label="Nome da fazenda" htmlFor={`farm-${index}-name`}>
              <Input
                id={`farm-${index}-name`}
                placeholder="Ex.: Fazenda Santa Rita"
                value={farm.name}
                onChange={(event) => onChange(index, { name: event.target.value })}
              />
            </FormField>
            <FormField label="Cidade" htmlFor={`farm-${index}-city`}>
              <Input
                id={`farm-${index}-city`}
                placeholder="Ex.: Sorriso"
                value={farm.city}
                onChange={(event) => onChange(index, { city: event.target.value })}
              />
            </FormField>
            <FormField label="Estado" htmlFor={`farm-${index}-state`}>
              <Select
                id={`farm-${index}-state`}
                options={STATE_OPTIONS}
                value={farm.state}
                onChange={(event) =>
                  onChange(index, { state: event.target.value as FarmDraft['state'] })
                }
              />
            </FormField>
          </Row3>
          <Row3Areas>
            <FormField label="Área total (ha)" htmlFor={`farm-${index}-total`}>
              <Input
                id={`farm-${index}-total`}
                type="number"
                placeholder="0"
                value={farm.totalAreaHectares}
                onChange={(event) => onChange(index, { totalAreaHectares: event.target.value })}
              />
            </FormField>
            <FormField label="Área agricultável (ha)" htmlFor={`farm-${index}-arable`}>
              <Input
                id={`farm-${index}-arable`}
                type="number"
                placeholder="0"
                value={farm.arableAreaHectares}
                onChange={(event) => onChange(index, { arableAreaHectares: event.target.value })}
              />
            </FormField>
            <FormField label="Área de vegetação (ha)" htmlFor={`farm-${index}-vegetation`}>
              <Input
                id={`farm-${index}-vegetation`}
                type="number"
                placeholder="0"
                value={farm.vegetationAreaHectares}
                onChange={(event) =>
                  onChange(index, { vegetationAreaHectares: event.target.value })
                }
              />
            </FormField>
          </Row3Areas>
          {errors?.[index] ? <FieldsetError role="alert">{errors[index]}</FieldsetError> : null}
        </Fieldset>
      ))}
      <AddFarmButton type="button" onClick={onAdd}>
        + Adicionar fazenda
      </AddFarmButton>
    </div>
  );
}
