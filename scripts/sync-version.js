const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const versionFile = path.join(rootDir, 'version.txt')
const generatedDir = path.join(rootDir, 'src', 'generated')
const generatedFile = path.join(generatedDir, 'buildMeta.js')
const publicBuildInfoFile = path.join(rootDir, 'public', 'build-info.json')

function getTimestampVersion() {
  return new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14)
}

function getNextVersion() {
  const nextVersion = getTimestampVersion()

  if (!fs.existsSync(versionFile)) {
    return nextVersion
  }

  const currentVersion = fs.readFileSync(versionFile, 'utf8').trim()
  if (!/^\d+$/.test(currentVersion)) {
    return nextVersion
  }

  return Number(nextVersion) > Number(currentVersion)
    ? nextVersion
    : String(Number(currentVersion) + 1)
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

const version = getNextVersion()
const builtAt = new Date().toISOString()

writeFile(versionFile, `${version}\n`)

writeFile(
  generatedFile,
  `export const buildMeta = ${JSON.stringify(
    {
      version,
      builtAt
    },
    null,
    2
  )}\n`
)

writeFile(
  publicBuildInfoFile,
  `${JSON.stringify(
    {
      version,
      builtAt
    },
    null,
    2
  )}\n`
)

console.log(`[version] ${version}`)
