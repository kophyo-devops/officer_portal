const DB_NAME = 'officer_portal_pdfs'
const STORE_NAME = 'pdfs'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

export async function savePdf(documentId: string, file: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(file, documentId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('PDF save failed'))
  })
  db.close()
}

export async function getPdf(documentId: string): Promise<Blob | null> {
  const db = await openDb()
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(documentId)
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error('PDF read failed'))
  })
  db.close()
  return blob
}

/** Tiny valid sample PDF for demo seed documents */
export function createSamplePdfBlob(title: string): Blob {
  // Known-good minimal PDF; title kept in filename metadata only for demo.
  void title
  const base64 =
    'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwog' +
    'IC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogCiUlIHBhZ2UgdHJlZQo8PAogIC9U' +
    'eXBlIC9QYWdlcwogIC9LaWRzIFszIDAgUl0KICAvQ291bnQgMQogIC9NZWRpYUJveCBbMCAw' +
    'IDMwMCAxNDRdCj4+CmVuZG9iagoKMyAwIG9iagogICUlIHBhZ2UgMQo8PAogICAvVHlwZSAv' +
    'UGFnZQogICAvUGFyZW50IDIgMCBSCiAgIC9SZXNvdXJjZXMgPDwKICAgICAvRm9udCA8PAog' +
    'ICAgICAgL0YxIDQgMCBSIAogICAgICA+PgogICA+PgogICAvQ29udGVudHMgNSAwIFIKPj4K' +
    'ZW5kb2JqCgo0IDAgb2JqIAogICUlIGZvbnQKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBl' +
    'IC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAl' +
    'IHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9G' +
    'MSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRUQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgow' +
    'IDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkg' +
    'MDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAw' +
    'MDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+Pgpz' +
    'dGFydHhyZWYKNDkyCiUlRU9G'

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: 'application/pdf' })
}

export async function ensureSamplePdf(documentId: string, title: string): Promise<void> {
  const existing = await getPdf(documentId)
  if (existing) return
  await savePdf(documentId, createSamplePdfBlob(title))
}
