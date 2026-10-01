// Packs the library, installs the tarball into a throwaway consumer and checks that
// both module formats load, render a modal, and ship only what they should.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const work = mkdtempSync(join(tmpdir(), 'rmp-smoke-'));
const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};

try {
  const [pack] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', work], { cwd: root, encoding: 'utf8' }),
  );
  const files = pack.files.map((f) => f.path).sort();
  const allowed = /^(dist\/index\.(js|cjs|d\.ts|d\.cts)(\.map)?|package\.json|readme\.md|README\.md|LICENSE|CHANGELOG\.md|MIGRATION\.md)$/;
  const unexpected = files.filter((f) => !allowed.test(f));
  if (unexpected.length) fail(`unexpected files in tarball: ${unexpected.join(', ')}`);
  for (const required of ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'dist/index.d.cts', 'LICENSE']) {
    if (!files.includes(required)) fail(`missing from tarball: ${required}`);
  }

  const consumer = join(work, 'consumer');
  const pkgDir = join(consumer, 'node_modules', 'react-modal-port');
  mkdirSync(pkgDir, { recursive: true });
  execFileSync('tar', ['-xzf', join(work, pack.filename), '-C', pkgDir, '--strip-components=1']);
  for (const dep of ['react', 'react-dom']) {
    symlinkSync(join(root, 'node_modules', dep), join(consumer, 'node_modules', dep), 'dir');
  }

  for (const file of ['dist/index.js', 'dist/index.cjs']) {
    if (!readFileSync(join(pkgDir, file), 'utf8').startsWith('"use client";')) {
      fail(`${file} does not start with "use client"`);
    }
  }

  const check = (lib) => `
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const lib = ${lib};
    const expected = ['ModalProvider', 'ModalContextProvider', 'ModalPort', 'useModal', 'useModalStack', 'useModalState', 'useModalContext'];
    for (const name of expected) if (typeof lib[name] !== 'function') throw new Error('missing export ' + name);
    const html = renderToStaticMarkup(React.createElement(lib.ModalProvider, null, React.createElement(lib.ModalPort)));
    if (html !== '') throw new Error('unexpected markup: ' + html);
  `;
  writeFileSync(join(consumer, 'cjs.cjs'), check(`require('react-modal-port')`));
  writeFileSync(
    join(consumer, 'esm.mjs'),
    `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);\n` +
      check(`await import('react-modal-port')`),
  );
  for (const entry of ['cjs.cjs', 'esm.mjs']) {
    try {
      execFileSync(process.execPath, [entry], { cwd: consumer, stdio: 'pipe' });
      console.log(`✓ ${entry} loads and renders`);
    } catch (error) {
      fail(`${entry} failed:\n${error.stderr}`);
    }
  }
  if (!process.exitCode) console.log(`✓ tarball contents ok (${files.length} files)`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
