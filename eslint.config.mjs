import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

const config = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'example/generated/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration',
          message: 'Use const name = () => {}. Function declarations are not allowed.',
        },
        {
          selector: 'FunctionExpression',
          message: 'Use an arrow function. function () {} is not allowed.',
        },
        {
          selector: 'Property[method=true]',
          message: 'Use { key: () => {} }. Object methods are not allowed.',
        },
      ],
    },
  },
)

export default config
