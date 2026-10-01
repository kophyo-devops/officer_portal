import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { listDocumentsApi } from '../api/documents'
import { isApiConfigured } from '../config/env'
import { loadDocuments } from '../data/storage'
import type { CargoDocument } from '../types'

const statusLabel: Record<CargoDocument['status'], string> = {
  issued: 'ထုတ်ပေးပြီး',
  verified: 'စစ်ဆေးပြီး',
  revoked: 'ပယ်ဖျက်',
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const

export function DocumentsPage() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)
  const [documents, setDocuments] = useState<CargoDocument[]>(() =>
    isApiConfigured ? [] : loadDocuments(),
  )
  const [loading, setLoading] = useState(isApiConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured) return

    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const items = await listDocumentsApi()
        if (active) setDocuments(items)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'စာရင်း ဖတ်၍ မရပါ')
          setDocuments(loadDocuments())
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return documents
    return documents.filter(
      (doc) =>
        doc.id.toLowerCase().includes(q) ||
        doc.truckPlate.toLowerCase().includes(q) ||
        doc.cargoType.toLowerCase().includes(q),
    )
  }, [documents, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const pageItems = filtered.slice(startIndex, startIndex + pageSize)
  const from = filtered.length === 0 ? 0 : startIndex + 1
  const to = Math.min(startIndex + pageSize, filtered.length)

  function onSearchChange(value: string) {
    setQuery(value)
    setPage(1)
  }

  function onPageSizeChange(value: number) {
    setPageSize(value as (typeof PAGE_SIZE_OPTIONS)[number])
    setPage(1)
  }

  return (
    <section className="stack">
      <div className="page-header">
        <h1>စာရင်း</h1>
        <Link className="btn btn-primary" to="/new">
          အသစ်တင်ရန်
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="login-note">Loading...</p>}

      <div className="toolbar">
        <label>
          ရှာရန်
          <input
            className="search"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Document ID / ကားနံပါတ် / ကုန်အမျိုးအစား"
          />
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document ID</th>
              <th>ကားနံပါတ်</th>
              <th>ကုန်အမျိုးအစား</th>
              <th>ပမာဏ</th>
              <th>ထုတ်ရက်</th>
              <th>အခြေအနေ</th>
              <th>လုပ်ဆောင်ချက်</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  မှတ်တမ်း မရှိပါ
                </td>
              </tr>
            )}
            {pageItems.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <code>{doc.id}</code>
                </td>
                <td>{doc.truckPlate}</td>
                <td>{doc.cargoType}</td>
                <td>{doc.quantity}</td>
                <td>{doc.issueDate}</td>
                <td>
                  <span className={`badge badge-${doc.status}`}>
                    {statusLabel[doc.status]}
                  </span>
                </td>
                <td>
                  <Link to={`/verify/${doc.id}`}>ကြည့်ရန်</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-info">
          {from}-{to} / {filtered.length}
        </div>

        <label className="page-size">
          Page size
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="pagination-controls">
          <button
            type="button"
            className="btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="page-indicator">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
