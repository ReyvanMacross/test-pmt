async function run() {
  const browserRes = await fetch('http://127.0.0.1:9222/json/version');
  const version = await browserRes.json();
  const ws = new WebSocket(version.webSocketDebuggerUrl);

  let id = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data.result);
      callbacks.delete(data.id);
    }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    callbacks.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
  await new Promise((r) => ws.onopen = r);

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const targetWs = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${target.targetId}`);
  await new Promise((r) => targetWs.onopen = r);

  let tid = 1;
  const tcallbacks = new Map();
  targetWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && tcallbacks.has(data.id)) {
      tcallbacks.get(data.id)(data.result);
      tcallbacks.delete(data.id);
    }
  };
  const tsend = (method, params = {}) => new Promise((resolve) => {
    const msgId = tid++;
    tcallbacks.set(msgId, resolve);
    targetWs.send(JSON.stringify({ id: msgId, method, params }));
  });

  await tsend('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await tsend('Network.enable');
  await tsend('Network.setCookie', {
    name: 'session',
    value: 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjAxMzQxYzNiLWU5MTktNDI0ZC05NTRlLWQ4MTcwMmFjYThhMiIsImVtYWlsIjoic3VwZXJhZG1pbkBkaXNrb21pbmZvLmdvLmlkIiwibmFtZSI6IlN1cGVyIEFkbWluIiwicm9sZSI6InN1cGVyLWFkbWluIiwiaWF0IjoxNzkxODU3OTMyLCJleHAiOjE3OTI0NjI3MzJ9.RAhzeXrdhgGu9NJffl17MEANPmkwBKx7rpk-ySXYsxE',
    domain: 'localhost',
    path: '/'
  });

  await tsend('Page.navigate', { url: 'http://localhost:3000/admin/network/1/content/hero-slider' });
  await new Promise((r) => setTimeout(r, 2500));

  const info = await tsend('Runtime.evaluate', {
    expression: `(() => {
      // Find direct children of body or elements with position absolute/fixed
      const res = [];
      document.body.childNodes.forEach(node => {
        if (node.nodeType === 1) {
          res.push({
            tag: node.tagName,
            className: (node.className || '').toString(),
            id: node.id,
            scrollHeight: node.scrollHeight,
            offsetHeight: node.offsetHeight,
            rect: node.getBoundingClientRect()
          });
        }
      });
      // Also check all elements in document that might contribute to html scrollHeight
      const allExt = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.top + window.scrollY + rect.height > 850) {
          allExt.push({
            tag: el.tagName,
            className: (el.className || '').toString().substring(0, 50),
            id: el.id,
            position: style.position,
            computedBottom: rect.bottom,
            computedTop: rect.top,
            parent: el.parentElement ? el.parentElement.tagName + '.' + (el.parentElement.className || '').substring(0, 30) : null
          });
        }
      });
      return { bodyChildren: res, allExt: allExt.slice(0, 20) };
    })()`,
    returnByValue: true
  });

  console.log('OFFENDING ELEMENTS:', JSON.stringify(info.result.value, null, 2));

  await send('Target.closeTarget', { targetId: target.targetId });
  targetWs.close();
  ws.close();
}

run().catch(console.error);
