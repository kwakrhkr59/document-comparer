import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import './FileUpload.css'

interface Props {
  label: string
  badge: string
  badgeColor: 'red' | 'green'
  value: string
  onChange: (text: string) => void
}

export default function FileUpload({ label, badge, badgeColor, value, onChange }: Props) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      onChange(e.target?.result as string)
      setFileName(file.name)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  const handleClear = () => {
    onChange('')
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="file-upload">
      <div className="file-upload-header">
        <span className={`badge badge-${badgeColor}`}>{badge}</span>
        <span className="file-upload-label">{label}</span>
        {fileName && (
          <span className="file-name">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.75 1.5a.25.25 0 0 0-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V6H9.75A1.75 1.75 0 0 1 8 4.25V1.5H3.75zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06zM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25V1.75z"/>
            </svg>
            {fileName}
          </span>
        )}
        {value && (
          <button className="clear-btn" onClick={handleClear} title="초기화">
            ×
          </button>
        )}
      </div>

      <div
        className={`drop-zone ${dragging ? 'dragging' : ''} ${value ? 'has-content' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !value && fileInputRef.current?.click()}
      >
        {value ? (
          <textarea
            className="text-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="drop-prompt">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" className="drop-icon">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            <p className="drop-text">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="drop-subtext">.txt, .md, .csv, .json 등 텍스트 파일</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.json,.xml,.yaml,.yml,.log,.ts,.tsx,.js,.jsx,.py,.java,.cs,.go,.rs,.html,.css"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
    </div>
  )
}
