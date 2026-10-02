import { createHash, randomBytes, X509Certificate } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const android = join(root, 'android')
const signing = join(root, '.android-signing')
const properties = join(signing, 'signing.properties')
const keystore = join(signing, 'dormosaur-release.jks')
const javaBin = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin') : ''
const keytool = javaBin ? join(javaBin, process.platform === 'win32' ? 'keytool.exe' : 'keytool') : 'keytool'

if (!existsSync(properties) || !existsSync(keystore)) {
  if (!process.argv.includes('--init-signing')) {
    throw new Error('Release signing is missing. See docs/android.md. Never replace an existing release key.')
  }
  if (existsSync(properties) || existsSync(keystore)) {
    throw new Error('Incomplete signing setup. Restore the original key and properties; refusing to replace them.')
  }
  mkdirSync(signing, { recursive: true })
  const password = randomBytes(32).toString('hex')
  const signingEnv = { ...process.env, DORMOSAUR_KEY_PASSWORD: password }
  execFileSync(keytool, [
    '-genkeypair', '-keystore', keystore, '-storetype', 'JKS',
    '-alias', 'dormosaur', '-keyalg', 'RSA', '-keysize', '3072',
    '-sigalg', 'SHA256withRSA', '-validity', '10000',
    '-storepass:env', 'DORMOSAUR_KEY_PASSWORD', '-keypass:env', 'DORMOSAUR_KEY_PASSWORD',
    '-dname', 'CN=Dormosaur, O=Dormosaur, C=PH', '-noprompt',
  ], { env: signingEnv, stdio: ['ignore', 'ignore', 'pipe'] })
  writeFileSync(properties, `storePassword=${password}\nkeyPassword=${password}\nkeyAlias=dormosaur\n`, { mode: 0o600 })
  console.log('Created private release signing files in .android-signing/. Back up this directory securely.')
}

const stored = Object.fromEntries(readFileSync(properties, 'utf8').trim().split(/\r?\n/).map(line => {
  const index = line.indexOf('=')
  return [line.slice(0, index), line.slice(index + 1)]
}))
const certificate = execFileSync(keytool, [
  '-exportcert', '-keystore', keystore, '-alias', stored.keyAlias,
  '-storepass:env', 'DORMOSAUR_KEY_PASSWORD',
], { env: { ...process.env, DORMOSAUR_KEY_PASSWORD: stored.storePassword }, stdio: ['ignore', 'pipe', 'pipe'] })
const fingerprint = new X509Certificate(certificate).fingerprint256
const assetlinks = join(root, 'public', '.well-known', 'assetlinks.json')
mkdirSync(dirname(assetlinks), { recursive: true })
writeFileSync(assetlinks, JSON.stringify([{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app', package_name: 'com.dormly.dormosaur',
    sha256_cert_fingerprints: [fingerprint],
  },
}], null, 2) + '\n')

// Match the website favicon. Android applies the adaptive icon mask itself.
const icons = join(android, 'app', 'src', 'main', 'res', 'mipmap-nodpi')
mkdirSync(icons, { recursive: true })
copyFileSync(join(root, 'public', 'android-chrome-512x512.png'), join(icons, 'launcher_foreground.png'))

if (process.platform === 'win32') {
  // cmd executes only the fixed wrapper filename; no user text is interpolated.
  execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'gradlew.bat', 'assembleRelease', 'lintRelease', '--console', 'plain'], {
    cwd: android, env: process.env, stdio: 'inherit',
  })
} else {
  execFileSync(join(android, 'gradlew'), ['assembleRelease', 'lintRelease', '--console', 'plain'], {
    cwd: android, env: process.env, stdio: 'inherit',
  })
}
const output = join(root, 'dormosaur.apk')
copyFileSync(join(android, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'), output)
const checksum = createHash('sha256').update(readFileSync(output)).digest('hex')
writeFileSync(join(root, 'dormosaur.apk.sha256'), `${checksum}  dormosaur.apk\n`)
console.log(`Release APK: ${output}\nSHA-256: ${checksum}\nSigning certificate: ${fingerprint}`)
