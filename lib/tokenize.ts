export const enum TokenKind {
  comment = 1,
  delimiter,
  identifier,
  string,
  text,
}

export type Token = {
  kind: TokenKind
  value: string
}

const SINGLE_DELIMITERS: Readonly<string[]> = ['<', '=']
const DOUBLE_DELIMITERS: Readonly<string[]> = ['</', '/>']

const isWhitespace = (char: string) => /\s/.test(char)
const isLetter = (char: string) => /[a-z|A-Z]/.test(char)
const isIdentifier = (char: string) => /[a-z|A-Z|0-9|_|-|:]/.test(char)
const isNotEmptyTextNode = (token: Token) => !(token.kind === TokenKind.text && !token.value.trim())

export const tokenize = (source: string[]) => {
  const source_length = source.length
  const tokens: Token[] = []
  let pos = 0

  const isNotEof = () => pos < source_length
  // const isNotEofPeek = (length: number) => pos + length < source_length

  const currentChar = () => source[pos]
  // const peekChar = () => source[pos + 1]
  const peekSlice = (length: number) => source.slice(pos, pos + length).join('')
  const nextChar = () => source[(pos += 1)]
  const nextWhen = (testFn: (char: string) => boolean) => {
    const chars: string[] = []
    for (let char = currentChar(); isNotEof() && testFn(char); char = nextChar()) chars.push(char)
    return chars.join('')
  }
  const nextSlice = (length: number) => source.slice(pos, (pos += length)).join('')
  const skipChar = (length: number) => {
    pos += length
  }
  const skipWhen = (testFn: (char: string) => boolean) => {
    while (isNotEof() && testFn(currentChar())) skipChar(1)
  }

  while (isNotEof()) {
    const char = currentChar()
    if (isWhitespace(char)) {
      skipChar(1)
      skipWhen(isWhitespace)
    } else if (peekSlice(4) === '<!--') {
      skipChar(4)
      const value = nextWhen(() => peekSlice(3) !== '-->')
      tokens.push({ kind: TokenKind.comment, value })
      skipChar(3)
    } else if (char === '"') {
      skipChar(1)
      const value = nextWhen(char => char !== '"')
      tokens.push({ kind: TokenKind.string, value })
      skipChar(1)
    } else if (char === '>') {
      skipChar(1)
      tokens.push({ kind: TokenKind.delimiter, value: char })
      const value = nextWhen(char => char !== '<')
      if (value !== '') tokens.push({ kind: TokenKind.text, value })
    } else if (DOUBLE_DELIMITERS.includes(peekSlice(2))) {
      tokens.push({ kind: TokenKind.delimiter, value: nextSlice(2) })
    } else if (SINGLE_DELIMITERS.includes(char)) {
      tokens.push({ kind: TokenKind.delimiter, value: char })
      skipChar(1)
    } else if (isLetter(char)) {
      const value = nextWhen(isIdentifier)
      tokens.push({ kind: TokenKind.identifier, value })
    }
  }

  return tokens.filter(isNotEmptyTextNode)
}

// ---tests
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest

  it.concurrent('test tokenize', () => {
    const input = `
      <!-- This is a comment -->
      <view id="root">
        Text Node
        <text style="font-size: 16px;">Hello World!</text>
        <text hidden>ok</text>
      <view>
      <!-- End -->
    `.split('')
    const output = tokenize(input)
    const expect_output = [
      { kind: TokenKind.comment, value: ' This is a comment ' },
      { kind: TokenKind.delimiter, value: '<' },
      { kind: TokenKind.identifier, value: 'view' },
      { kind: TokenKind.identifier, value: 'id' },
      { kind: TokenKind.delimiter, value: '=' },
      { kind: TokenKind.string, value: 'root' },
      { kind: TokenKind.delimiter, value: '>' },
      { kind: TokenKind.text, value: '\n        Text Node\n        ' },
      { kind: TokenKind.delimiter, value: '<' },
      { kind: TokenKind.identifier, value: 'text' },
      { kind: TokenKind.identifier, value: 'style' },
      { kind: TokenKind.delimiter, value: '=' },
      { kind: TokenKind.string, value: 'font-size: 16px;' },
      { kind: TokenKind.delimiter, value: '>' },
      { kind: TokenKind.text, value: 'Hello World!' },
      { kind: TokenKind.delimiter, value: '</' },
      { kind: TokenKind.identifier, value: 'text' },
      { kind: TokenKind.delimiter, value: '>' },
      { kind: TokenKind.delimiter, value: '<' },
      { kind: TokenKind.identifier, value: 'text' },
      { kind: TokenKind.identifier, value: 'hidden' },
      { kind: TokenKind.delimiter, value: '>' },
      { kind: TokenKind.text, value: 'ok' },
      { kind: TokenKind.delimiter, value: '</' },
      { kind: TokenKind.identifier, value: 'text' },
      { kind: TokenKind.delimiter, value: '>' },
      { kind: TokenKind.delimiter, value: '<' },
      { kind: TokenKind.identifier, value: 'view' },
      { kind: TokenKind.delimiter, value: '>' },
      { kind: TokenKind.comment, value: ' End ' },
    ]
    expect(expect_output).toStrictEqual(output)
  })
}
