const ALLOWED_TAGS = new Set(['p', 'div', 'span', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'h4', 'a'])
const VOID_TAGS = new Set(['br'])

function escapeText(value) {
  return value
    .replace(/&(?!(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function decodeUrlForCheck(value) {
  return value
    .replace(/&#(\d+);?/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);?/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)))
    .replace(/&colon;/gi, ':')
    .replace(/[\u0000-\u0020\u007f]/g, '')
}

function safeHref(value) {
  const href = value.trim()
  const normalized = decodeUrlForCheck(href)
  if (!/^(https?:|mailto:|tel:|\/|#|\?)/i.test(normalized)) return null
  return href.replace(/&(?!(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);)/gi, '&amp;').replace(/"/g, '&quot;')
}

export function sanitizeRichHtml(value = '') {
  let source = String(value ?? '')
  if (!/<\s*[a-z][^>]*>/i.test(source)) {
    return escapeText(source).replace(/\r\n?|\n/g, '<br>')
  }

  source = source.replace(/<(script|style|iframe|object|embed|svg|math|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
  source = source.replace(/<(script|style|iframe|object|embed|svg|math|template)\b[^>]*\/?>/gi, '')
  let output = ''
  let cursor = 0
  const tokens = /<[^>]*>/g
  let match

  while ((match = tokens.exec(source))) {
    output += escapeText(source.slice(cursor, match.index))
    cursor = tokens.lastIndex

    const tag = match[0].match(/^<\s*(\/?)\s*([a-z\d]+)\b([\s\S]*?)>$/i)
    if (!tag) continue
    const closing = Boolean(tag[1])
    const name = tag[2].toLowerCase()
    if (!ALLOWED_TAGS.has(name)) continue

    if (closing) {
      if (!VOID_TAGS.has(name)) output += `</${name}>`
      continue
    }

    if (name === 'a') {
      const hrefMatch = tag[3].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i)
      const href = hrefMatch && safeHref(hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '')
      output += href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">` : '<a>'
    } else {
      output += `<${name}>`
    }
  }

  output += escapeText(source.slice(cursor))
  return output
}
