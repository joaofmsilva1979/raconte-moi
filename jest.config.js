module.exports = {
  projects: [
    {
      displayName: 'native',
      preset: 'jest-expo',
      setupFilesAfterEnv: ['./jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
      testPathIgnorePatterns: ['__tests__/services/'],
    },
    {
      displayName: 'services',
      testEnvironment: 'node',
      transform: {
        '\\.[jt]sx?$': [
          'babel-jest',
          {
            presets: ['@babel/preset-typescript'],
            plugins: ['@babel/plugin-transform-modules-commonjs'],
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: ['**/__tests__/services/**/*.test.{ts,tsx}'],
    },
  ],
};
