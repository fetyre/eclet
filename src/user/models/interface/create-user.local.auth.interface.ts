/**
 * @interface CreateUserInterface
 * @description Интерфейс для создания нового пользователя.
 */
export interface ISignUp {
	/**
	 * @property {string} username
	 * @description Опциональное свойство, представляющее имя пользователя.
	 */
	username?: string;

	/**
	 * @property {string} email
	 * @description Свойство, представляющее электронную почту пользователя. Обязательно для заполнения.
	 */
	email: string;

	/**
	 * @property {string} password
	 * @description Свойство, представляющее пароль пользователя. Обязательно для заполнения.
	 */
	password: string;
}
