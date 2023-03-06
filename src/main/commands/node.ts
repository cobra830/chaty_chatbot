import { appConfigPath } from '../../constants/index'
import path from 'path'
import { parse as dotenvParse } from 'dotenv'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { logger } from '../../logger'
import { runChildProcess, runChildProcessSync } from '../../utils'
import { chatyDebug } from '../prepare/debug'
import { projectInstall } from 'pkg-install'
const name = 'node-service'
let cmd = 'npm'
if (/win32|win64/.test(process.platform)) {
  cmd = 'npm.cmd'
} else {
  cmd = 'npm'
}
async function getWebServiceDir () {
  const webPath = path.resolve(
    __dirname,
    '..',
    '..',
    'services',
    'node',
    'server'
  )
  return webPath
}

const exposeEnv = ['OPEN_AI_KEY', 'NODE_PORT']
async function copyEnv (from: string, to: string) {
  const fromEnv = path.resolve(from, '.env')
  const toEnv = path.resolve(to, '.env')
  const checkFrom = existsSync(fromEnv)
  chatyDebug(`copy from ${fromEnv} to ${toEnv}`)
  if (!checkFrom) {
    chatyDebug(`[Error]: cannot find .env file in ${from}!`)
    logger.fatal(` .env not exists!${fromEnv}`)
    return
  }
  const content = readFileSync(fromEnv, 'utf-8')
  const parsed = dotenvParse(content)
  let newContent = ''
  for (const prop in parsed) {
    if (exposeEnv.includes(prop)) {
      newContent += `${prop}=${parsed[prop]}\n`
    }
  }
  writeFileSync(toEnv, newContent, 'utf-8')
}

export async function runNodeService () {
  console.log('runNodeService...')

  const webDir = await getWebServiceDir()
  await copyEnv(appConfigPath, webDir)

  const buildArgs: string[] = ['run', 'build']
  const startArgs: string[] = ['run', 'start']
  const options = {
    cwd: webDir
  }
  chatyDebug('string to install pkgs for NodeJS API service...')
  await projectInstall({
    cwd: webDir
  })
  chatyDebug('string to build for NodeJS API service...')
  runChildProcessSync(`${cmd} ${buildArgs.join(' ')}`, options)

  chatyDebug('string to run start for web service...')
  runChildProcess(name, cmd, startArgs, options)
}