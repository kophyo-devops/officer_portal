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
      try {
        const remote = await getDocumentApi(id)
        if (!active) return
        setDoc(mapApiDocument(remote.document))
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
      <div className="verify-hero">
        <div className="verify-hero-text">
          <h1>စစ်ဆေးရေး ရလဒ်</h1>
          <p className="login-note">{doc.id}</p>
        </div>
        <span className={`badge badge-lg badge-${doc.status}`}>
          {statusLabel[doc.status]}
        </span>
      </div>

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
          seedIfMissing={!isApiConfigured}
        />
      </div>

      {user && (
        <div className="form-panel verify-section">
          <h2>QR Code (Officer)</h2>
          <div className="verify-qr">
            <div className="qr-box">
              <QRCodeSVG
                value={verifyUrl}
                size={150}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
              />
            </div>
            <div className="verify-qr-meta">
              <p className="qr-caption">{doc.id}</p>
              <code className="url-chip">{verifyUrl}</code>
              <Link className="btn" to="/">
                စာရင်းသို့
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
