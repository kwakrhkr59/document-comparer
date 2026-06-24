import { useState } from 'react'
import FileUpload from './components/FileUpload'
import DiffViewer from './components/DiffViewer'
import './App.css'

export default function App() {
  const [originalText, setOriginalText] = useState('')
  const [changedText, setChangedText] = useState('')
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('split')
  const [showDiff, setShowDiff] = useState(false)

  const hasContent = originalText.trim() !== '' || changedText.trim() !== ''

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            <span>Document Comparer</span>
          </div>
          {hasContent && (
            <div className="view-toggle">
              <button
                className={viewMode === 'unified' ? 'active' : ''}
                onClick={() => setViewMode('unified')}
              >
                Unified
              </button>
              <button
                className={viewMode === 'split' ? 'active' : ''}
                onClick={() => setViewMode('split')}
              >
                Split
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {!showDiff ? (
          <div className="upload-section">
            <div className="upload-grid">
              <FileUpload
                label="원본 문서"
                badge="BASE"
                badgeColor="red"
                value={originalText}
                onChange={setOriginalText}
              />
              <FileUpload
                label="비교 문서"
                badge="HEAD"
                badgeColor="green"
                value={changedText}
                onChange={setChangedText}
              />
            </div>
            <div className="compare-action">
              <button
                className="compare-btn"
                disabled={!hasContent}
                onClick={() => setShowDiff(true)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M9.78 12.78a1 1 0 0 1-1.414 0L7 11.414l-1.366 1.366a1 1 0 0 1-1.414-1.414l1.366-1.366L4.22 8.634a1 1 0 0 1 1.414-1.414L7 8.586l1.366-1.366a1 1 0 0 1 1.414 1.414L8.414 10l1.366 1.366a1 1 0 0 1 0 1.414z"/>
                  <path d="M5 0a1 1 0 0 0-1 1v2H2a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v2H5V1a1 1 0 0 0-1-1z"/>
                </svg>
                비교하기
              </button>
            </div>
          </div>
        ) : (
          <div className="diff-section">
            <div className="diff-toolbar">
              <button className="back-btn" onClick={() => setShowDiff(false)}>
                ← 다시 입력
              </button>
              <div className="diff-stats" id="diff-stats" />
            </div>
            <DiffViewer
              oldText={originalText}
              newText={changedText}
              viewMode={viewMode}
            />
          </div>
        )}
      </main>
    </div>
  )
}
