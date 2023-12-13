import { GraphQLError } from 'graphql';

export const gqlErrorHandler = (error: GraphQLError) => {
	if ('response' in error.extensions) {
		const { message, ...response } = error.extensions['response'] as {
			message: string;
			extensions: any;
		};

		return {
			message,
			extensions: {
				timestamp: new Date().toISOString(),
				...response
			}
		};
	}

	return error;
};
