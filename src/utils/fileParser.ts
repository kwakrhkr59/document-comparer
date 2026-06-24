import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Use Vite's module URL resolution to locate the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export type ParseResult = {
  text: string
  meta: string | null
  error: string | null
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  try {
    if (ext === 'pdf') return await parsePdf(file)
    if (ext === 'docx' || ext === 'doc') return await parseDocx(file)
    return await parseText(file)
  } catch (e) {
    return {
      text: '',
      meta: null,
      error: e instanceof Error ? e.message : '파일을 읽는 중 오류가 발생했습니다.',
    }
  }
}

async function parsePdf(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdf = await loadingTask.promise

  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    let pageText = ''
    for (const item of content.items) {
      if ('str' in item) {
        pageText += item.str
        if (item.hasEOL) pageText += '\n'
      }
    }
    pages.push(pageText.trim())
  }

  const text = pages.join('\n\n')

  if (!text.trim()) {
    return {
      text: '',
      meta: null,
      error: `이 PDF는 이미지 기반(스캔본)이라 텍스트를 추출할 수 없습니다. (${pdf.numPages}페이지)`,
    }
  }

  return { text, meta: `${pdf.numPages}페이지`, error: null }
}

async function parseDocx(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawValue({ arrayBuffer })

  if (result.messages.length > 0) {
    const warnings = result.messages
      .filter(m => m.type === 'warning')
      .map(m => m.message)
    if (warnings.length > 0) {
      console.warn('[mammoth warnings]', warnings)
    }
  }

  const text = result.value
  const lineCount = text.split('\n').filter(l => l.trim() !== '').length

  return { text, meta: `${lineCount}줄`, error: null }
}

async function parseText(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      resolve({ text, meta: null, error: null })
    }
    reader.onerror = () => {
      resolve({ text: '', meta: null, error: '파일을 읽을 수 없습니다.' })
    }
    reader.readAsText(file, 'utf-8')
  })
}

export function getFileTypeLabel(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: 'PDF',
    docx: 'DOCX',
    doc: 'DOC',
    md: 'MD',
    txt: 'TXT',
    json: 'JSON',
    csv: 'CSV',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
  }
  return map[ext] ?? ext.toUpperCase()
}
