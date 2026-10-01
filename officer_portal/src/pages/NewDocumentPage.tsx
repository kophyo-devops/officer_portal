import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDocumentApi, mapApiDocument, uploadPdfToS3 } from '../api/documents'
import { isApiConfigured } from '../config/env'
import { useAuth } from '../context/AuthContext'
import { savePdf } from '../data/pdfStore'
import { addDocument, nextDocumentId } from '../data/storage'
import type { CargoDocument } from '../types'

export function NewDocumentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [truckPlate, setTruckPlate] = useState('')
  const [cargoType, setCargoType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [destination, setDestination] = useState('')
  const [issueDate, setIssueDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [notes, setNotes] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!truckPlate || !cargoType || !quantity || !destination || !pdfFile) {
      setError('လိုအပ်သော အကွက်များ (*) နှင့် PDF ဖိုင် ထည့်ပါ')
      return
    }

    if (pdfFile.type !== 'application/pdf') {
      setError('PDF ဖိုင်သာ တင်နိုင်သည်')
      return
    }

    setSaving(true)

    try {
      if (isApiConfigured) {
        const created = await createDocumentApi({
          truckPlate: truckPlate.trim(),
          cargoType: cargoType.trim(),
          quantity: quantity.trim(),
          destination: destination.trim(),
          issueDate,
          notes: notes.trim(),
          pdfFileName: pdfFile.name,
          contentType: pdfFile.type || 'application/pdf',
        })

        await uploadPdfToS3(created.uploadUrl, pdfFile)
        const mapped = mapApiDocument(created.document)
        // keep a local copy for offline-ish verify fallback
        await savePdf(mapped.id, pdfFile)
        addDocument(mapped)
        navigate(`/verify/${mapped.id}`)
        return
      }

      const doc: CargoDocument = {
        id: nextDocumentId(),
        truckPlate: truckPlate.trim(),
        cargoType: cargoType.trim(),
        quantity: quantity.trim(),
        destination: destination.trim(),
        issueDate,
        officerName: user?.displayName ?? 'Officer',
        notes: notes.trim(),
        pdfFileName: pdfFile.name,
        status: 'issued',
        createdAt: new Date().toISOString(),
      }

      await savePdf(doc.id, pdfFile)
      addDocument(doc)
      navigate(`/verify/${doc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'သိမ်း၍ မရပါ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="stack narrow">
      <div className="page-header">
        <h1>အသစ်တင်ရန်</h1>
      </div>

      <form className="form-panel" onSubmit={onSubmit} noValidate>
        <div className="info-box">
          <span className="required">*</span> ပါသော အကွက်များ မဖြစ်မနေ ဖြည့်ရမည်။
          {isApiConfigured
            ? ' PDF ကို Amazon S3 သို့ တင်မည်။'
            : ' (Local demo — VITE_API_BASE_URL မထည့်ရသေးပါ)'}
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
              placeholder="ဥပမာ - 8A/1234"
              required
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
              placeholder="ဥပမာ - ဆန်အိတ်"
              required
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
              placeholder="ဥပမာ - 200 အိတ်"
              required
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
              placeholder="ဥပမာ - မန္တလေး"
              required
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
            />
          </label>

          <label className="field">
            <span className="field-label">
              <span>
                Hardcopy PDF
                <span className="required">*</span>
              </span>
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              required
            />
            {pdfFile && <span className="file-name">{pdfFile.name}</span>}
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
            placeholder="အပိုမှတ်ချက် ရှိပါက ရေးပါ"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="btn" type="button" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'သိမ်းနေသည်...' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  )
}
