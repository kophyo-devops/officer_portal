import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deletePreviousPdfApi,
  getDocumentApi,
  mapApiDocument,
  updateDocumentApi,
  uploadPdfToS3,
} from '../api/documents'
import { isApiConfigured } from '../config/env'
import { savePdf } from '../data/pdfStore'
import {
  getDocumentById,
  updateLocalDocument,
} from '../data/storage'
import type { CargoDocument } from '../types'

export function EditDocumentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [truckPlate, setTruckPlate] = useState('')
  const [cargoType, setCargoType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [destination, setDestination] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [currentPdfName, setCurrentPdfName] = useState('')
  const [status, setStatus] = useState<CargoDocument['status']>('issued')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!id) {
          setError('Document ID မရှိပါ')
          return
        }

        if (isApiConfigured) {
          const remote = await getDocumentApi(id)
          if (!active) return
          const doc = mapApiDocument(remote.document)
          fillForm(doc)
          return
        }

        const local = getDocumentById(id)
        if (!active) return
        if (!local) {
          setError('Document မတွေ့ပါ')
          return
        }
        fillForm(local)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'ဖတ်၍ မရပါ')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [id])

  function fillForm(doc: CargoDocument) {
    setTruckPlate(doc.truckPlate)
    setCargoType(doc.cargoType)
    setQuantity(doc.quantity)
    setDestination(doc.destination)
    setIssueDate(doc.issueDate)
    setNotes(doc.notes)
    setCurrentPdfName(doc.pdfFileName)
    setStatus(doc.status)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!id) {
      setError('Document ID မရှိပါ')
      return
    }

    if (status === 'revoked') {
      setError('ပယ်ဖျက်ထားသော စာရွက်ကို ပြင်၍ မရပါ')
      return
    }

    if (!truckPlate || !cargoType || !quantity || !destination) {
      setError('လိုအပ်သော အကွက်များ (*) ဖြည့်ပါ')
      return
    }

    if (pdfFile && pdfFile.type !== 'application/pdf') {
      setError('PDF ဖိုင်သာ တင်နိုင်သည်')
      return
    }

    setSaving(true)
    try {
      if (isApiConfigured) {
        const updated = await updateDocumentApi(id, {
          truckPlate: truckPlate.trim(),
          cargoType: cargoType.trim(),
          quantity: quantity.trim(),
          destination: destination.trim(),
          issueDate,
          notes: notes.trim(),
          replacePdf: Boolean(pdfFile),
          pdfFileName: pdfFile?.name,
          contentType: pdfFile?.type || 'application/pdf',
        })

        if (pdfFile && updated.uploadUrl) {
          await uploadPdfToS3(updated.uploadUrl, pdfFile)
          if (updated.previousPdfS3Key) {
            await deletePreviousPdfApi(id, updated.previousPdfS3Key)
          }
          await savePdf(id, pdfFile)
        }

        const mapped = mapApiDocument(updated.document)
        updateLocalDocument(mapped)
        navigate(`/verify/${mapped.id}`)
        return
      }

      const existing = getDocumentById(id)
      if (!existing) {
        setError('Document မတွေ့ပါ')
        return
      }

      const doc: CargoDocument = {
        ...existing,
        truckPlate: truckPlate.trim(),
        cargoType: cargoType.trim(),
        quantity: quantity.trim(),
        destination: destination.trim(),
        issueDate,
        notes: notes.trim(),
        pdfFileName: pdfFile?.name || existing.pdfFileName,
      }
      if (pdfFile) {
        await savePdf(id, pdfFile)
      }
      updateLocalDocument(doc)
      navigate(`/verify/${doc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'သိမ်း၍ မရပါ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="stack narrow">
        <p className="login-note">Loading .....</p>
      </section>
    )
  }

  return (
    <section className="stack narrow">
      <div className="page-header">
        <h1>ပြင်ဆင်ရန်</h1>
        <p className="login-note">
          Document ID: <code>{id}</code>
        </p>
      </div>

      {status === 'revoked' && (
        <p className="error">ဤစာရွက်ကို ပယ်ဖျက်ထားသည်။ ပြင်၍ မရပါ။</p>
      )}

      <form className="form-panel" onSubmit={onSubmit} noValidate>
        <div className="info-box">
          Metadata ပြင်နိုင်သည်။ PDF မှားတင်မိပါက အသစ်ရွေးပါ — အဟောင်းကို
          အလိုအလျောက် ဖျက်မည်။ Document ID / QR မပြောင်းပါ။
        </div>

        <div className="grid-2">
          <label className="field">
            <span className="field-label">
              <span>
                ကားနံပါတ်
                <span className="required">*</span>
              </span>
            </span>
            <input
              value={truckPlate}
              onChange={(e) => setTruckPlate(e.target.value)}
              required
              disabled={status === 'revoked'}
            />
          </label>

          <label className="field">
            <span className="field-label">
              <span>
                ကုန်အမျိုးအစား
                <span className="required">*</span>
              </span>
            </span>
            <input
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
              required
              disabled={status === 'revoked'}
            />
          </label>

          <label className="field">
            <span className="field-label">
              <span>
                ပမာဏ
                <span className="required">*</span>
              </span>
            </span>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={status === 'revoked'}
            />
          </label>

          <label className="field">
            <span className="field-label">
              <span>
                သွားမည့်နေရာ
                <span className="required">*</span>
              </span>
            </span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              disabled={status === 'revoked'}
            />
          </label>

          <label className="field">
            <span className="field-label">
              <span>
                ထုတ်ရက်
                <span className="required">*</span>
              </span>
            </span>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              disabled={status === 'revoked'}
            />
          </label>

          <label className="field">
            <span className="field-label">
              <span>Hardcopy PDF</span>
              <span className="field-hint">optional — ပြောင်းမှ ရွေးပါ</span>
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              disabled={status === 'revoked'}
            />
            <span className="file-name">
              {pdfFile
                ? `အသစ်: ${pdfFile.name}`
                : `လက်ရှိ: ${currentPdfName || '-'}`}
            </span>
          </label>
        </div>

        <label className="field">
          <span className="field-label">
            <span>မှတ်ချက်</span>
            <span className="field-hint">optional</span>
          </span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={status === 'revoked'}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="btn" type="button" onClick={() => navigate('/')}>
            Cancel
          </button>
          <Link className="btn" to={`/verify/${id}`}>
            ကြည့်ရန်
          </Link>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving || status === 'revoked'}
          >
            {saving ? 'သိမ်းနေသည်...' : 'Update'}
          </button>
        </div>
      </form>
    </section>
  )
}
