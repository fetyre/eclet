import {
	registerDecorator,
	ValidationOptions,
	ValidationArguments
} from 'class-validator';

export function IsEnglishOrRussian(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: 'isEnglishOrRussian',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					return (
						typeof value === 'string' && /^[A-Za-zА-Яа-яЁё\s]*$/i.test(value)
					);
				}
			}
		});
	};
}
