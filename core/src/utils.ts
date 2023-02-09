import * as Fs from 'node:fs/promises'
import * as fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { IcnError, IcnErrorCode } from './errors'
import { IncomingWebhook } from '@slack/webhook'
import Hook from 'console-hook'
import { SLACK_WEBHOOK_URL } from './settings'
import urlExist from 'url-exist'
export async function loadJson(filepath) {
  const json = await Fs.readFile(filepath, 'utf8')
  return JSON.parse(json)
}

// https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d
export const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x)

/**
 * Access data in JSON based on given path.
 *
 * Example
 * let json = {
 *     RAW: { ETH: { USD: { PRICE: 123 } } },
 *     DISPLAY: { ETH: { USD: [Object] } }
 * }
 * readFromJson(json, ['RAW', 'ETH', 'USD', 'PRICE']) // return 123
 */
export function readFromJson(json, path: string[]) {
  let v = json

  for (const p of path) {
    if (p in v) v = v[p]
    else throw new IcnError(IcnErrorCode.MissingKeyInJson)
  }

  return v
}

export function remove0x(s) {
  if (s.substring(0, 2) == '0x') {
    return s.substring(2)
  }
}

export function add0x(s) {
  if (s.substring(0, 2) == '0x') {
    return s
  } else {
    return '0x' + s
  }
}

export function pad32Bytes(data) {
  data = remove0x(data)
  let s = String(data)
  while (s.length < (64 || 2)) {
    s = '0' + s
  }
  return s
}

export function mkdir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export async function readTextFile(filepath: string) {
  return await Fs.readFile(filepath, 'utf8')
}

export async function writeTextFile(filepath: string, content: string) {
  await Fs.writeFile(filepath, content)
}

export function mkTmpFile({ fileName }: { fileName: string }): string {
  const appPrefix = 'orakl'
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix))
  const tmpFilePath = path.join(tmpDir, fileName)
  return tmpFilePath
}

async function sendToSlack(error) {
  const exists = await urlExist(SLACK_WEBHOOK_URL)
  if (exists) {
    const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL)
    const text = ` :fire: _An error has occurred at_ \`${os.hostname()}\`\n \`\`\`${JSON.stringify(
      error
    )} \`\`\`\n>*System information*\n>*memory*: ${os.freemem()}/${os.totalmem()}\n>*machine*: ${os.machine()}\n>*platform*: ${os.platform()}\n>*upTime*: ${os.uptime()}\n>*version*: ${os.version()}
   `
    try {
      await webhook.send({ text })
    } catch (e) {
      console.log('utils:sendToSlack', `${e}`)
    }
  }
}

export function hookConsoleError(logger) {
  const consoleHook = Hook(logger).attach((method, args) => {
    if (method == 'error') {
      sendToSlack(args)
    }
  })
  consoleHook.detach
}
