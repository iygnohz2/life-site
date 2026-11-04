/**
 * 稳定截图：禁用缓存、等待水合、支持亮/暗色、整页截取。
 * 用法：node tools/shot.mjs <url> <out.png> [light|dark] [width]
 */
import { writeFileSync } from 'node:fs'

const [url, out, scheme = 'dark', widthArg, script] = process.argv.slice(2)
const width = Number(widthArg || 1440)
const CDP = 'http://127.0.0.1:9222'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const targets = await (await fetch(`${CDP}/json`)).json()
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))

let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result)
    pending.delete(m.id)
  }
}
const send = (method, params = {}) =>
  new Promise((res) => {
    const mid = ++id
    pending.set(mid, res)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })

await send('Page.enable')
await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
})
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-color-scheme', value: scheme }],
})

await send('Page.navigate', { url })
await sleep(4500)

if (script) {
  await send('Runtime.evaluate', { expression: script })
  await sleep(1200)
}

const shot = await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: !script,
})
writeFileSync(out, Buffer.from(shot.data, 'base64'))
console.log('saved', out)
ws.close()
