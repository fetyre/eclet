module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: [
		'**/__tests__/**/*.test.[jt]s?(x)',
		'**/?(*.)+(spec|test).[tj]s?(x)'
	],
	rootDir: './',
	moduleDirectories: ['node_modules', 'src'],
	moduleFileExtensions: ['js', 'ts', 'json'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1'
	},
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
		'^.+\\.js$': 'babel-jest'
	}
};

// module.exports = {
// 	preset: 'ts-jest',
// 	testEnvironment: 'node',
// 	testMatch: [
// 		'**/__tests__/**/*.test.[jt]s?(x)',
// 		'**/?(*.)+(spec|test).[tj]s?(x)'
// 	],
// 	moduleFileExtensions: ['js', 'ts', 'json'],
// 	moduleNameMapper: {
// 		'^@/(.*)$': '<rootDir>/src/$1',
// 		'^src/(.*)$': '<rootDir>/src/$1'
// 	  },
// 	transform: {
// 		'^.+\\.tsx?$': 'ts-jest',
// 		'^.+\\.js$': 'babel-jest'
// 	}
// };
