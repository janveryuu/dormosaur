import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

// Compile only this pure-logic suite, without a new test-runner dependency.
const tempRoot = resolve(tmpdir())
const output = mkdtempSync(join(tempRoot, 'dormosaur-copilot-tests-'))
const suite = process.argv.includes('--live') ? 'copilot-live.test' : 'copilot.test'
try {
  const compiled = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc',
    `tests/${suite}.ts`, '--outDir', output, '--rootDir', '.', '--module', 'commonjs',
    '--target', 'es2022', '--moduleResolution', 'node', '--esModuleInterop', '--strict',
    '--skipLibCheck', '--types', 'node'], { stdio: 'inherit' })
  if (compiled.status !== 0) process.exitCode = compiled.status ?? 1
  else process.exitCode = spawnSync(process.execPath, ['--test', join(output, `tests/${suite}.js`)],
    { stdio: 'inherit' }).status ?? 1
} finally {
  if (dirname(resolve(output)) !== tempRoot) throw new Error('Unexpected test output path')
  rmSync(output, { recursive: true, force: true })
}
