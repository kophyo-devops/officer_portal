import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { getDocumentApi } from '../api/documents'
import { isApiConfigured } from '../config/env'
import { ensureSamplePdf, getPdf } from '../data/pdfStore'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PdfViewerProps {
  documentId: string
  fileName: string
  /** When provided, skip a second API call (parent already fetched). */
  pdfUrl?: string | null
  seedIfMissing?: boolean
}

export function PdfViewer({
  documentId,
  fileName,
  pdfUrl: pdfUrlProp = null,
  seedIfMissing = false,
}: PdfViewerProps) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [containerWidth, setContainerWidth] = useState(320)

  useEffect(() => {
    const node = shellRef.current
    if (!node) return

    const updateWidth = () => {
      setContainerWidth(Math.max(260, node.clientWidth - 24))
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    async function load() {
      setLoading(true)
      setError(null)
      setPageNumber(1)
      setNumPages(0)

      try {
        // Prefer URL from parent to avoid duplicate GET /documents/{id}
        let remoteUrl = pdfUrlProp

        if (!remoteUrl && isApiConfigured) {
          const remote = await getDocumentApi(documentId)
          if (!active) return
          remoteUrl = remote.pdfUrl
        }

        if (remoteUrl) {
          // Fetch once as blob — fewer range round-trips, faster page flips
          const response = await fetch(remoteUrl)
          if (!response.ok) {
            throw new Error(`PDF download failed (${response.status})`)
          }
          const blob = await response.blob()
          if (!active) return
          objectUrl = URL.createObjectURL(blob)
          setFileUrl(objectUrl)
          setLoading(false)
          return
        }

        if (seedIfMissing) {
          await ensureSamplePdf(documentId, documentId)
        }

        const blob = await getPdf(documentId)
        if (!active) return

        if (!blob) {
          setFileUrl(null)
          setError(
            'PDF ဖိုင် မရှိသေးပါ။ Officer portal မှ PDF တင်ပြီးမှ ကြည့်နိုင်ပါသည်။',
          )
          setLoading(false)
          return
        }

        objectUrl = URL.createObjectURL(blob)
        setFileUrl(objectUrl)
        setLoading(false)
      } catch (err) {
        if (!active) return

        try {
          const blob = await getPdf(documentId)
          if (!active) return
          if (blob) {
            objectUrl = URL.createObjectURL(blob)
            setFileUrl(objectUrl)
            setLoading(false)
            return
          }
        } catch {
          // ignore
        }

        setError(err instanceof Error ? err.message : 'PDF ဖွင့်၍ မရပါ')
        setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documentId, pdfUrlProp, seedIfMissing])

  const fileSource = useMemo(() => fileUrl, [fileUrl])

  return (
    <div ref={shellRef} className="pdf-viewer">
      {loading && <p className="login-note">PDF ဖွင့်နေသည်...</p>}

      {!loading && (error || !fileSource) && (
        <p className="error">{error ?? 'PDF မရှိပါ'}</p>
      )}

      {!loading && fileSource && (
        <>
          <div className="pdf-toolbar">
            <span className="login-note pdf-filename">{fileName}</span>
            <div className="pdf-pager">
              <a className="btn" href={fileSource} download={fileName}>
                Download
              </a>
              <button
                type="button"
                className="btn"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="login-note">
                {pageNumber} / {Math.max(numPages, 1)}
              </span>
              <button
                type="button"
                className="btn"
                disabled={pageNumber >= numPages || numPages === 0}
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>

          <div className="pdf-canvas-wrap">
            <Document
              file={fileSource}
              loading={<p className="login-note">Rendering...</p>}
              error={<p className="error">PDF ပြသ၍ မရပါ</p>}
              onLoadSuccess={({ numPages: total }) => setNumPages(total)}
            >
              <Page
                pageNumber={pageNumber}
                width={containerWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
          </div>
        </>
      )}
    </div>
  )
}
