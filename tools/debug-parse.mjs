/** 抓取浏览器实际解析失败的那段脚本内容，定位损坏位置 */
const CDP = 'http://127.0.0.1:9222'
const targets = await (await fetch(`${CDP}/json`)).json()
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))

let id = 0
const pending = new Map()
let bad = null

ws.onmessage = async (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result)
    pending.delete(m.id)
  }
  if (m.method === 'Debugger.scriptFailedToParse' && !bad) {
    bad = m.params
    const src = await send('Debugger.getScriptSource', { scriptId: m.params.scriptId })
    const text = src.scriptSource || ''
    console.log('URL:', m.params.url)
    console.log('scriptId:', m.params.scriptId, 'length:', text.length)
    console.log('HEAD:', JSON.stringify(text.slice(0, 120)))
    console.log('TAIL:', JSON.stringify(text.slice(-160)))
    ws.close()
  }
}
const send = (method, params = {}) =>
  new Promise((res) => {
    const mid = ++id
    pending.set(mid, res)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })

await send('Debugger.enable')
await send('Page.enable')
await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('Page.navigate', { url: 'http://localhost:3000/' })

setTimeout(() => {
  if (!bad) {
    console.log('no parse error captured')
    ws.close()
  }
}, 12000)
