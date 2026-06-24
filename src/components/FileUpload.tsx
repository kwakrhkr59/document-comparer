import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { parseFile, getFileTypeLabel } from '../utils/fileParser'
import './FileUpload.css'

interface Props {
  label: string
  badge: string
  badgeColor: 'red' | 'green'
  value: string
  onChange: (text: string) => void
}

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function FileUpload({ label, badge, badgeColor, value, onChange }: Props) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)
  const [meta, setMeta] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setFileType(getFileTypeLabel(file.name))
    setStatus('loading')
    setErrorMsg(null)
    setMeta(null)

    const result = await parseFile(file)

    if (result.error) {
      setStatus('error')
      setErrorMsg(result.error)
      onChange('')
    } else {
      setStatus('done')
      setMeta(result.meta)
      onChange(result.text)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleClear = () => {
    onChange('')
    setFileName(null)
    setFileType(null)
    setMeta(null)
    setStatus('idle')
    setErrorMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isClickable = status !== 'loading' && !value

  return (
    <div className="file-upload">
      <div className="file-upload-header">
        <span className={`badge badge-${badgeColor}`}>{badge}</span>
        <span className="file-upload-label">{label}</span>

        {fileName && (
          <span className="file-info">
            {fileType && <span className="file-type-tag">{fileType}</span>}
            <span className="file-name-text">{fileName}</span>
            {meta && <span className="file-meta">{meta}</span>}
          </span>
        )}

        {(value || status === 'error') && (
          <button className="clear-btn" onClick={handleClear} title="초기화">×</button>
        )}
      </div>

      <div
        className={[
          'drop-zone',
          dragging ? 'dragging' : '',
          value ? 'has-content' : '',
          status === 'error' ? 'has-error' : '',
        ].join(' ')}
        onDragOver={(e) => { e.preventDefault(); if (status !== 'loading') setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => isClickable && fileInputRef.current?.click()}
      >
        {status === 'loading' && (
          <div className="drop-prompt">
            <div className="spinner" />
            <p className="drop-text">파싱 중…</p>
            <p className="drop-subtext">{fileName}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="drop-prompt">
            <svg className="error-icon" width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            <p className="drop-text error-text">{errorMsg}</p>
            <p className="drop-subtext">다른 파일을 선택하려면 × 버튼을 누르세요</p>
          </div>
        )}

        {status !== 'loading' && status !== 'error' && value && (
          <textarea
            className="text-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {status === 'idle' && !value && (
          <div className="drop-prompt">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" className="drop-icon">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            <p className="drop-text">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="drop-subtext">TXT · MD · JSON · CSV · <strong>PDF</strong> · <strong>DOCX</strong> 등</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json,.xml,.yaml,.yml,.log,.ts,.tsx,.js,.jsx,.py,.java,.cs,.go,.rs,.html,.css,.pdf,.docx,.doc"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
    </div>
  )
}
