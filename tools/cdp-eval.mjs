/** 在页面上下文里执行一段表达式：node tools/cdp-eval.mjs "<expr>" */
const expr = process.argv[2]
const CDP = 'http://127.0.0.1:9222'

const targets = await (await fetch(`${CDP}/json`)).json()
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))

const result = await new Promise((resolve) => {
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id === 2) resolve(m)
  }
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }))
  ws.send(
    JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: { expression: expr, awaitPromise: true, returnByValue: true },
    })
  )
})
console.log(JSON.stringify(result.result?.result?.value ?? result, null, 1))
ws.close()
