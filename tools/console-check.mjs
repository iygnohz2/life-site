/**
 * 用 CDP 抓取页面控制台输出（开发期排查 hydration / 资源 404 用）
 * 用法：node tools/console-check.mjs http://localhost:3000/life/
 */
const url = process.argv[2] || 'http://localhost:3000/'
const CDP = 'http://127.0.0.1:9222'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const targets = await (await fetch(`${CDP}/json`)).json()
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('no page target')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  const logs = []
  let id = 0
  const send = (method, params = {}) => ws.send(JSON.stringify({ id: ++id, method, params }))

  await new Promise((res) => (ws.onopen = res))

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ')
      logs.push(`[${msg.params.type}] ${text}`)
    }
    if (msg.method === 'Log.entryAdded') {
      logs.push(`[${msg.params.entry.level}] ${msg.params.entry.text} ${msg.params.entry.url || ''}`)
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      logs.push(
        `[exception] ${d.text} :: ${d.exception?.description || ''}\n${(d.stackTrace?.callFrames || [])
          .slice(0, 6)
          .map((f) => `    at ${f.functionName || '?'} ${f.url}:${f.lineNumber}`)
          .join('\n')}`
      )
    }
  }

  send('Runtime.enable')
  send('Log.enable')
  send('Page.enable')
  send('Debugger.enable')
  send('Network.enable')
  send('Network.setCacheDisabled', { cacheDisabled: true })
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data)
    if (m.method === 'Debugger.scriptFailedToParse') {
      const p = m.params
      logs.push(`[parse-error] ${p.url} line ${p.startLine} :: ${p.exceptionDetails?.text}`)
    }
  })
  send('Page.navigate', { url })
  await sleep(6000)

  const uniq = [...new Set(logs)]
  console.log(uniq.length ? uniq.join('\n') : '(no console output)')
  ws.close()
}

main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
