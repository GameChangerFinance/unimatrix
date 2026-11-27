const fs = require('fs')
const path = require('path')

const targets = ['cjs', 'esm', 'umd', 'types']

function rejectSymlinks(target) {
  let stat
  try { stat = fs.lstatSync(target) } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  if (stat.isSymbolicLink()) throw new Error('Refusing symlinked cleanup path')
  if (fs.statSync(target).isDirectory()) {
    for (const entry of fs.readdirSync(target)) rejectSymlinks(path.join(target, entry))
  }
}

function main(...args) {
  if (args.length > 1 || (args.length && !targets.includes(args[0]))) {
    throw new Error('Usage: node tools/cleanup.js [cjs|esm|umd|types]')
  }
  const root = path.resolve(__dirname, '..')
  const dist = path.join(root, 'dist')
  if (fs.realpathSync(root) !== root) throw new Error('Refusing symlinked project path')
  let distStat
  try { distStat = fs.lstatSync(dist) } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  if (distStat.isSymbolicLink()) throw new Error('Refusing symlinked dist path')
  const paths = (args.length ? args : targets).map(name => path.join(dist, name))
  // Validate every target before deleting any output.
  paths.forEach(rejectSymlinks)
  paths.forEach(target => fs.rmSync(target, { recursive: true, force: true }))
}

module.exports = { main }
if (require.main === module) {
  try { main(...process.argv.slice(2)) } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
