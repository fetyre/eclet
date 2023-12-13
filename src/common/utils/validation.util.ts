export const isUndefined = (value: unknown): value is undefined =>
	typeof value === 'undefined';
export const isNull = (value: unknown): value is null => value === null;
// используем для проверки на undefined и null, что бы избежать ошибок связанных с использованием неопределенных или нулевых значений, и обеспечить более безопасную работу с данными
