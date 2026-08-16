// Validador customizado de class-validator para a regra de área — usa o
// utilitário já testado em area-rule.ts, mas enxerga o DTO inteiro (via
// `args.object`) porque a regra é entre campos, não de um campo isolado.
//
// Se algum dos três campos ainda não chegou (ex.: PATCH parcial), a
// validação de forma não reporta erro aqui — o Service é quem revalida a
// regra mesclando o payload parcial com o estado persistido (ver
// praticas.md#onde-cada-regra-de-negócio-vive).

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { validateAreas } from './area-rule';

interface AreaFields {
  totalAreaHectares?: unknown;
  arableAreaHectares?: unknown;
  vegetationAreaHectares?: unknown;
}

export function IsValidArea(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      name: 'isValidArea',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments): boolean {
          const dto = args.object as AreaFields;
          const {
            totalAreaHectares,
            arableAreaHectares,
            vegetationAreaHectares,
          } = dto;
          if (
            typeof totalAreaHectares !== 'number' ||
            typeof arableAreaHectares !== 'number' ||
            typeof vegetationAreaHectares !== 'number'
          ) {
            return true;
          }
          return validateAreas(
            totalAreaHectares,
            arableAreaHectares,
            vegetationAreaHectares,
          );
        },
        defaultMessage(): string {
          return 'a soma de arableAreaHectares e vegetationAreaHectares não pode ultrapassar totalAreaHectares';
        },
      },
    });
  };
}
