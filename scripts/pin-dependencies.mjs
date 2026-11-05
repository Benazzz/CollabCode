// Keep package.json aligned with the exact, reviewed versions in package-lock.json.
import { readFileSync, writeFileSync } from 'node:fs'
const manifestPath = new URL('../web/package.json', import.meta.url)
const lockPath = new URL('../web/package-lock.json', import.meta.url)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const lock = JSON.parse(readFileSync(lockPath, 'utf8'))
for (const group of ['dependencies', 'devDependencies']) {
  for (const name of Object.keys(manifest[group])) {
    const version = lock.packages[`node_modules/${name}`]?.version
    if (!version) throw new Error(`Missing locked version for ${name}`)
    manifest[group][name] = version
  }
  lock.packages[''][group] = { ...manifest[group] }
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n')
console.log('Package versions pinned to the lockfile.')
