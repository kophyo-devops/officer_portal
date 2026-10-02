import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getDocumentApi, mapApiDocument } from '../api/documents'
import { PdfViewer } from '../components/PdfViewer'
import { isApiConfigured } from '../config/env'
import { useAuth } from '../context/AuthContext'
import { getDocumentById } from '../data/storage'
import type { CargoDocument } from '../types'

const statusLabel: Record<CargoDocument['status'], string> = {
  issued: 'ထုတ်ပေးပြီး',
  verified: 'စစ်ဆေးပြီး',
  revoked: 'ပယ်ဖျက်',
}

function CopyLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      const input = document.createElement('textarea')
      input.value = value
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <div className="copy-link">
      <code className="copy-link-value" title={value}>
        {value}
      </code>
      <button
        type="button"
        className={`copy-link-btn${copied ? ' is-copied' : ''}`}
        onClick={() => void copyLink()}
        aria-label={copied ? 'Copied' : 'Copy link'}
        title={copied ? 'Copied' : 'Copy'}
      >
        {copied ? (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  )
}

function DetailRows({ doc }: { doc: CargoDocument }) {
  const rows = [
    { label: 'Document ID', value: doc.id },
    { label: 'ကားနံပါတ်', value: doc.truckPlate },
    { label: 'ကုန်အမျိုးအစား', value: doc.cargoType },
    { label: 'ပမာဏ', value: doc.quantity },
    { label: 'သွားမည့်နေရာ', value: doc.destination },
    { label: 'ထုတ်ရက်', value: doc.issueDate },
    { label: 'ထုတ်ပေးသူ', value: doc.officerName },
    { label: 'မှတ်ချက်', value: doc.notes || '-' },
  ]

  return (
    <>
      <div className="verify-cards">
        {rows.map((row) => (
          <div key={row.label} className="verify-card-row">
            <span className="verify-card-label">{row.label}</span>
            <span className="verify-card-value">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="verify-table-wrap">
        <table className="verify-table">
          <thead>
            <tr>
              <th>အချက်အလက်</th>
              <th>တန်ဖိုး</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function VerifyPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [doc, setDoc] = useState<CargoDocument | null>(() =>
    isApiConfigured ? null : getDocumentById(id) ?? null,
  )
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  const verifyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${id}`
      : `/verify/${id}`

  useEffect(() => {
    let active = true

    async function load() {
      if (!id) {
        setDoc(null)
        setLoading(false)
        return
      }

      if (!isApiConfigured) {
        setDoc(getDocumentById(id) ?? null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setPdfUrl(null)
      try {
        const remote = await getDocumentApi(id)
        if (!active) return
        setDoc(mapApiDocument(remote.document))
        setPdfUrl(remote.pdfUrl)
      } catch (err) {
        if (!active) return
        const local = getDocumentById(id)
        if (local) {
          setDoc(local)
        } else {
          setDoc(null)
          setError(err instanceof Error ? err.message : 'ဖတ်၍ မရပါ')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <section className="verify-page">
        <p className="login-note">Loading...</p>
      </section>
    )
  }

  if (!doc) {
    return (
      <section className="verify-page">
        <div className="form-panel">
          <h1>စာရွက် မတွေ့ပါ</h1>
          <p className="login-note">Document ID: {id || '-'}</p>
          {error && <p className="error">{error}</p>}
          <p className="login-note">
            QR Code မှားနေခြင်း သို့မဟုတ် မှတ်တမ်း မရှိခြင်း ဖြစ်နိုင်သည်။
          </p>
        </div>
      </section>
    )
  }

  const isInvalid = doc.status === 'revoked'

  return (
    <section className="verify-page">
      {user ? (
        <div className="form-panel verify-officer-bar">
          <div className="verify-officer-top">
            <div className="verify-officer-heading">
              <div>
                <h1>စစ်ဆေးရေး ရလဒ်</h1>
                <p className="login-note">{doc.id}</p>
              </div>
              <span className={`verify-status status-${doc.status}`}>
                {statusLabel[doc.status]}
              </span>
            </div>

            <div className="verify-officer-actions">
              <Link className="btn" to="/">
                စာရင်းသို့
              </Link>
              {doc.status !== 'revoked' && (
                <Link className="btn btn-primary" to={`/edit/${doc.id}`}>
                  ပြင်ရန်
                </Link>
              )}
            </div>
          </div>

          <div className="verify-officer-share">
            <div className="verify-officer-qr" aria-label="QR Code">
              <div className="qr-box qr-box-sm">
                <QRCodeSVG
                  value={verifyUrl}
                  size={112}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                />
              </div>
              <span className="verify-officer-qr-label">QR</span>
            </div>

            <div className="verify-officer-link">
              <span className="verify-officer-link-label">Verify link</span>
              <CopyLink value={verifyUrl} />
            </div>
          </div>
        </div>
      ) : (
        <div className="verify-hero">
          <div className="verify-hero-text">
            <h1>စစ်ဆေးရေး ရလဒ်</h1>
            <p className="login-note">{doc.id}</p>
          </div>
          <span className={`verify-status status-${doc.status}`}>
            {statusLabel[doc.status]}
          </span>
        </div>
      )}

      {isInvalid && (
        <p className="error">
          ဤစာရွက်ကို ပယ်ဖျက်ထားသည်။ ဖြတ်သန်းခွင့် မပေးပါနှင့်။
        </p>
      )}

      <div className="form-panel verify-section">
        <h2>ကုန်တင်အချက်အလက်</h2>
        <DetailRows doc={doc} />
      </div>

      <div className="form-panel verify-section">
        <h2>Hardcopy PDF</h2>
        <PdfViewer
          documentId={doc.id}
          fileName={doc.pdfFileName}
          pdfUrl={pdfUrl}
          seedIfMissing={!isApiConfigured}
        />
      </div>
    </section>
  )
}
