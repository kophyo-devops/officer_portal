import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'

interface PdfDropzoneProps {
  file: File | null
  onFileChange: (file: File | null) => void
  required?: boolean
  disabled?: boolean
  hint?: string
  /** Shown when no new file is selected (e.g. current PDF name on edit) */
  currentFileName?: string
}

function isPdfFile(file: File) {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  )
}

export function PdfDropzone({
  file,
  onFileChange,
  required = false,
  disabled = false,
  hint,
  currentFileName,
}: PdfDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  function pickFile(next: File | null) {
    setLocalError(null)
    if (!next) {
      onFileChange(null)
      return
    }
    if (!isPdfFile(next)) {
      setLocalError('PDF ဖိုင်သာ တင်နိုင်သည်')
      onFileChange(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    onFileChange(next)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setDragging(true)
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (disabled) return
    const dropped = e.dataTransfer.files?.[0] ?? null
    pickFile(dropped)
  }

  function clearFile() {
    pickFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayName = file?.name || currentFileName || null

  return (
    <div className={`field pdf-dropzone-field${disabled ? ' is-disabled' : ''}`}>
      <span className="field-label">
        <span>
          Hardcopy PDF
          {required && <span className="required">*</span>}
        </span>
        {hint && <span className="field-hint">{hint}</span>}
      </span>

      <label
        htmlFor={inputId}
        className={`pdf-dropzone${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          id={inputId}
          ref={inputRef}
          className="pdf-dropzone-input"
          type="file"
          accept="application/pdf,.pdf"
          required={required && !file && !currentFileName}
          disabled={disabled}
          onChange={onInputChange}
        />

        <span className="pdf-dropzone-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M12 18v-6" />
            <path d="M9 15l3-3 3 3" />
          </svg>
        </span>

        <span className="pdf-dropzone-copy">
          {file ? (
            <>
              <strong>{file.name}</strong>
              <span>ပြောင်းရန် နှိပ်ပါ သို့မဟုတ် ဆွဲထည့်ပါ</span>
            </>
          ) : currentFileName ? (
            <>
              <strong>လက်ရှိ: {currentFileName}</strong>
              <span>PDF အသစ် ဆွဲထည့်ပါ သို့မဟုတ် နှိပ်၍ ရွေးပါ</span>
            </>
          ) : (
            <>
              <strong>PDF ကို ဤနေရာသို့ ဆွဲထည့်ပါ</strong>
              <span>သို့မဟုတ် နှိပ်၍ ဖိုင်ရွေးပါ</span>
            </>
          )}
        </span>
      </label>

      {displayName && file && (
        <button
          type="button"
          className="pdf-dropzone-clear"
          onClick={clearFile}
          disabled={disabled}
        >
          ဖိုင်ဖယ်ရှားရန်
        </button>
      )}

      {localError && <p className="error">{localError}</p>}
    </div>
  )
}
