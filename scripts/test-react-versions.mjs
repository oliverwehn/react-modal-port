// Runs the type check and test suite against each supported React release line.
// Usage: node scripts/test-react-versions.mjs [version ...]   (default: every 19.x minor + canary)
// Installs versions with --no-save, then restores the lockfile's versions with `npm ci`.
import { execFileSync } from 'node:child_process';

const versions = process.argv.slice(2).length ? process.argv.slice(2) : ['19.0', '19.1', '19.2', '19.3', 'canary'];
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
const results = [];

try {
  for (const version of versions) {
    const isCanary = version === 'canary';
    // Canary ships no separate types, so it is checked against the latest @types.
    const types = isCanary ? 'latest' : version;
    run('npm', [
      'install',
      '--no-save',
      '--no-audit',
      '--no-fund',
      `react@${version}`,
      `react-dom@${version}`,
      `@types/react@${types}`,
      `@types/react-dom@${types}`,
    ]);
    const installed = JSON.parse(run('node', ['-p', 'JSON.stringify(require("react/package.json").version)']));
    const steps = [
      ['typecheck', ['run', 'typecheck']],
      ['test', ['test']],
    ];
    const failed = [];
    for (const [name, args] of steps) {
      try {
        run('npm', args);
      } catch (error) {
        failed.push(name);
        console.error(`--- ${version} ${name} failed ---\n${error.stdout}\n${error.stderr}`);
      }
    }
    results.push({ version, installed, ok: failed.length === 0, failed: failed.join(', ') });
    console.log(`${failed.length ? '✗' : '✓'} React ${installed}${failed.length ? ` (${failed.join(', ')})` : ''}`);
  }
} finally {
  run('npm', ['ci', '--no-audit', '--no-fund']);
}

if (results.some((r) => !r.ok)) process.exitCode = 1;
