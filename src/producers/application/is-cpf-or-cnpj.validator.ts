// Validador customizado de class-validator para o campo `document` — aceita
// CPF ou CNPJ (numérico ou alfanumérico), usando o utilitário já testado em
// document.validator.ts.

import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidDocument } from './document.validator';

export function IsCpfOrCnpj(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      name: 'isCpfOrCnpj',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isValidDocument(value);
        },
        defaultMessage(): string {
          return 'document deve ser um CPF ou CNPJ válido';
        },
      },
    });
  };
}
