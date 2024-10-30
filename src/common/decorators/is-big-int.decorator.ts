import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsBigInt(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBigInt',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'bigint' ||
            (typeof value === 'string' && /^-?\d+$/.test(value))
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a BigInt`;
        },
      },
    });
  };
}
