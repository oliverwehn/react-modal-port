import { babel } from '@rollup/plugin-babel';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import resolve from '@rollup/plugin-node-resolve';
import external from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './src/index.ts',
    output: [
      {
        file: 'dist/cjs/index.cjs',
        format: 'cjs',
      },
      {
        file: 'dist/esm/index.mjs',
        format: 'es',
        exports: 'named',
      }
    ],
    plugins: [
      external({
        includeDependencies: true
      }),
      commonjs({
        include: 'node_modules/**',
      }),
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }),
      typescript({
        verbosity: 2,
        clean: true,
        tsconfig: 'tsconfig.json',
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: { paths: {} },
        },
      }),
      babel({
        exclude: 'node_modules/**',
        extensions: [
          ...DEFAULT_EXTENSIONS,
          '.ts', '.tsx'
        ],
        babelHelpers: 'bundled',
        presets: ['@babel/preset-typescript', '@babel/preset-react']
      }),
      terser(),
    ]
  }
];