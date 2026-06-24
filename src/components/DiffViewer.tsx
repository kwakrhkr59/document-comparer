import { useMemo } from 'react'
import { diffLines, Change } from 'diff'
import './DiffViewer.css'

interface Props {
  oldText: string
  newText: string
  viewMode: 'unified' | 'split'
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  oldNum?: number
  newNum?: number
}

interface SplitRow {
  left: { num: number; content: string; type: 'removed' | 'unchanged' } | null
  right: { num: number; content: string; type: 'added' | 'unchanged' } | null
}

function buildUnifiedLines(changes: Change[]): DiffLine[] {
  const lines: DiffLine[] = []
  let oldNum = 1
  let newNum = 1

  for (const change of changes) {
    const parts = change.value.split('\n')
    if (parts[parts.length - 1] === '') parts.pop()

    for (const content of parts) {
      if (change.added) {
        lines.push({ type: 'added', content, newNum: newNum++ })
      } else if (change.removed) {
        lines.push({ type: 'removed', content, oldNum: oldNum++ })
      } else {
        lines.push({ type: 'unchanged', content, oldNum: oldNum++, newNum: newNum++ })
      }
    }
  }

  return lines
}

function buildSplitRows(unifiedLines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let i = 0

  while (i < unifiedLines.length) {
    const line = unifiedLines[i]

    if (line.type === 'unchanged') {
      rows.push({
        left: { num: line.oldNum!, content: line.content, type: 'unchanged' },
        right: { num: line.newNum!, content: line.content, type: 'unchanged' },
      })
      i++
    } else {
      // Collect consecutive removed / added block
      const removed: DiffLine[] = []
      const added: DiffLine[] = []

      while (i < unifiedLines.length && unifiedLines[i].type === 'removed') {
        removed.push(unifiedLines[i++])
      }
      while (i < unifiedLines.length && unifiedLines[i].type === 'added') {
        added.push(unifiedLines[i++])
      }

      const maxLen = Math.max(removed.length, added.length)
      for (let j = 0; j < maxLen; j++) {
        const r = removed[j]
        const a = added[j]
        rows.push({
          left: r ? { num: r.oldNum!, content: r.content, type: 'removed' } : null,
          right: a ? { num: a.newNum!, content: a.content, type: 'added' } : null,
        })
      }
    }
  }

  return rows
}

function countChanges(lines: DiffLine[]) {
  let added = 0
  let removed = 0
  for (const l of lines) {
    if (l.type === 'added') added++
    else if (l.type === 'removed') removed++
  }
  return { added, removed }
}

// Group lines into hunks (show only N context lines around changes)
const CONTEXT = 3

function groupIntoHunks(lines: DiffLine[]): DiffLine[][] {
  const changed = new Set<number>()
  lines.forEach((l, i) => { if (l.type !== 'unchanged') changed.add(i) })

  const visible = new Set<number>()
  changed.forEach((idx) => {
    for (let d = -CONTEXT; d <= CONTEXT; d++) {
      const t = idx + d
      if (t >= 0 && t < lines.length) visible.add(t)
    }
  })

  const hunks: DiffLine[][] = []
  let hunk: DiffLine[] | null = null

  for (let i = 0; i < lines.length; i++) {
    if (visible.has(i)) {
      if (!hunk) { hunk = []; hunks.push(hunk) }
      hunk.push(lines[i])
    } else {
      hunk = null
    }
  }

  return hunks
}

function groupSplitIntoHunks(rows: SplitRow[]): SplitRow[][] {
  const changed = new Set<number>()
  rows.forEach((r, i) => {
    if (r.left?.type === 'removed' || r.right?.type === 'added') changed.add(i)
  })

  const visible = new Set<number>()
  changed.forEach((idx) => {
    for (let d = -CONTEXT; d <= CONTEXT; d++) {
      const t = idx + d
      if (t >= 0 && t < rows.length) visible.add(t)
    }
  })

  const hunks: SplitRow[][] = []
  let hunk: SplitRow[] | null = null

  for (let i = 0; i < rows.length; i++) {
    if (visible.has(i)) {
      if (!hunk) { hunk = []; hunks.push(hunk) }
      hunk.push(rows[i])
    } else {
      hunk = null
    }
  }

  return hunks
}

function HunkHeader({ label }: { label: string }) {
  return (
    <tr className="hunk-header">
      <td colSpan={4}>
        <span className="hunk-label">{label}</span>
      </td>
    </tr>
  )
}

function makeHunkLabel(hunk: DiffLine[]): string {
  const oldStart = hunk.find(l => l.oldNum != null)?.oldNum ?? 0
  const newStart = hunk.find(l => l.newNum != null)?.newNum ?? 0
  const oldCount = hunk.filter(l => l.oldNum != null).length
  const newCount = hunk.filter(l => l.newNum != null).length
  return `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`
}

function makeSplitHunkLabel(hunk: SplitRow[]): string {
  const oldStart = hunk.find(r => r.left?.num != null)?.left?.num ?? 0
  const newStart = hunk.find(r => r.right?.num != null)?.right?.num ?? 0
  return `@@ -${oldStart} +${newStart} @@`
}

export default function DiffViewer({ oldText, newText, viewMode }: Props) {
  const { unifiedLines, splitRows, stats, noChanges } = useMemo(() => {
    const changes = diffLines(oldText, newText)
    const unified = buildUnifiedLines(changes)
    const split = buildSplitRows(unified)
    const stats = countChanges(unified)
    const noChanges = stats.added === 0 && stats.removed === 0
    return { unifiedLines: unified, splitRows: split, stats, noChanges }
  }, [oldText, newText])

  if (noChanges) {
    return (
      <div className="no-diff">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
        </svg>
        두 문서가 동일합니다.
      </div>
    )
  }

  return (
    <div className="diff-viewer">
      <div className="diff-file-header">
        <span className="diff-file-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.75 1.5a.25.25 0 0 0-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V6H9.75A1.75 1.75 0 0 1 8 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25V1.75z"/>
          </svg>
        </span>
        <span className="diff-file-name">문서 비교 결과</span>
        <span className="stat-added">+{stats.added}</span>
        <span className="stat-removed">-{stats.removed}</span>
        <div className="stat-bar">
          {Array.from({ length: Math.min(stats.added + stats.removed, 5) }, (_, i) => (
            <div
              key={i}
              className={i < Math.round((stats.added / (stats.added + stats.removed)) * 5)
                ? 'bar-added' : 'bar-removed'}
            />
          ))}
        </div>
      </div>

      <div className="diff-table-wrap">
        {viewMode === 'unified'
          ? <UnifiedView lines={unifiedLines} />
          : <SplitView rows={splitRows} />
        }
      </div>
    </div>
  )
}

function UnifiedView({ lines }: { lines: DiffLine[] }) {
  const hunks = groupIntoHunks(lines)

  if (hunks.length === 0) return null

  return (
    <table className="diff-table unified">
      <tbody>
        {hunks.map((hunk, hi) => (
          <>
            <HunkHeader key={`h-${hi}`} label={makeHunkLabel(hunk)} />
            {hunk.map((line, li) => (
              <tr key={`${hi}-${li}`} className={`diff-row row-${line.type}`}>
                <td className="line-num old">{line.oldNum ?? ''}</td>
                <td className="line-num new">{line.newNum ?? ''}</td>
                <td className="line-sign">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </td>
                <td className="line-content">
                  <pre>{line.content || ' '}</pre>
                </td>
              </tr>
            ))}
          </>
        ))}
      </tbody>
    </table>
  )
}

function SplitView({ rows }: { rows: SplitRow[] }) {
  const hunks = groupSplitIntoHunks(rows)

  if (hunks.length === 0) return null

  return (
    <table className="diff-table split">
      <tbody>
        {hunks.map((hunk, hi) => (
          <>
            <HunkHeader key={`h-${hi}`} label={makeSplitHunkLabel(hunk)} />
            {hunk.map((row, ri) => (
              <tr key={`${hi}-${ri}`} className="diff-row">
                <td className={`line-num old ${row.left?.type ?? 'empty'}`}>{row.left?.num ?? ''}</td>
                <td className={`line-content ${row.left?.type ?? 'empty'}`}>
                  {row.left ? (
                    <>
                      <span className="line-sign">{row.left.type === 'removed' ? '-' : ' '}</span>
                      <pre>{row.left.content || ' '}</pre>
                    </>
                  ) : null}
                </td>
                <td className="split-divider" />
                <td className={`line-num new ${row.right?.type ?? 'empty'}`}>{row.right?.num ?? ''}</td>
                <td className={`line-content ${row.right?.type ?? 'empty'}`}>
                  {row.right ? (
                    <>
                      <span className="line-sign">{row.right.type === 'added' ? '+' : ' '}</span>
                      <pre>{row.right.content || ' '}</pre>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </>
        ))}
      </tbody>
    </table>
  )
}
