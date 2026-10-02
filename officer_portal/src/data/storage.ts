import type { CargoDocument } from '../types'

const STORAGE_KEY = 'officer_portal_documents_v2'

const seedDocuments: CargoDocument[] = [
  {
    id: 'DOC-2026-0001',
    truckPlate: '8A/1234',
    cargoType: 'ဆန်အိတ်',
    quantity: '200 အိတ်',
    destination: 'မန္တလေး',
    issueDate: '2026-10-01',
    officerName: 'ဦးအောင်မင်း',
    notes: 'A4 hardcopy ထုတ်ပေးပြီး',
    pdfFileName: 'doc-2026-0001.pdf',
    status: 'issued',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DOC-2026-0002',
    truckPlate: '5K/5521',
    cargoType: 'ဆီဗူး',
    quantity: '50 ဗူး',
    destination: 'ရန်ကုန်',
    issueDate: '2026-09-28',
    officerName: 'ဦးအောင်မင်း',
    notes: '',
    pdfFileName: 'doc-2026-0002.pdf',
    status: 'verified',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DOC-2026-0003',
    truckPlate: '2B/7788',
    cargoType: 'ဘိလပ်မြေ',
    quantity: '100 အိတ်',
    destination: 'နေပြည်တော်',
    issueDate: '2026-09-25',
    officerName: 'ဒေါ်စုစု',
    notes: '',
    pdfFileName: 'doc-2026-0003.pdf',
    status: 'issued',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DOC-2026-0004',
    truckPlate: '7M/3344',
    cargoType: 'သကြား',
    quantity: '80 အိတ်',
    destination: 'ပုသိမ်',
    issueDate: '2026-09-20',
    officerName: 'ဦးအောင်မင်း',
    notes: '',
    pdfFileName: 'doc-2026-0004.pdf',
    status: 'issued',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DOC-2026-0005',
    truckPlate: '9C/9901',
    cargoType: 'ဆန်အိတ်',
    quantity: '150 အိတ်',
    destination: 'မော်လမြိုင်',
    issueDate: '2026-09-18',
    officerName: 'ဒေါ်စုစု',
    notes: '',
    pdfFileName: 'doc-2026-0005.pdf',
    status: 'revoked',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DOC-2026-0006',
    truckPlate: '3D/1122',
    cargoType: 'ဓာတ်မြေသြဇာ',
    quantity: '60 အိတ်',
    destination: 'တောင်ကြီး',
    issueDate: '2026-09-15',
    officerName: 'ဦးအောင်မင်း',
    notes: '',
    pdfFileName: 'doc-2026-0006.pdf',
    status: 'issued',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DOC-2026-0007',
    truckPlate: '6F/4455',
    cargoType: 'ဆီဗူး',
    quantity: '40 ဗူး',
    destination: 'မကွေး',
    issueDate: '2026-09-12',
    officerName: 'ဒေါ်စုစု',
    notes: '',
    pdfFileName: 'doc-2026-0007.pdf',
    status: 'verified',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DOC-2026-0008',
    truckPlate: '1H/6677',
    cargoType: 'ဂျုံမှုန့်',
    quantity: '120 အိတ်',
    destination: 'မြစ်ကြီးနား',
    issueDate: '2026-09-10',
    officerName: 'ဦးအောင်မင်း',
    notes: '',
    pdfFileName: 'doc-2026-0008.pdf',
    status: 'issued',
    createdAt: new Date().toISOString(),
  },
]

export function loadDocuments(): CargoDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedDocuments))
      return seedDocuments
    }
    return JSON.parse(raw) as CargoDocument[]
  } catch {
    return seedDocuments
  }
}

export function saveDocuments(docs: CargoDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

export function getDocumentById(id: string): CargoDocument | undefined {
  return loadDocuments().find((d) => d.id === id)
}

export function addDocument(doc: CargoDocument): void {
  const docs = loadDocuments()
  docs.unshift(doc)
  saveDocuments(docs)
}

export function updateLocalDocument(doc: CargoDocument): void {
  const docs = loadDocuments()
  const index = docs.findIndex((d) => d.id === doc.id)
  if (index === -1) {
    docs.unshift(doc)
  } else {
    docs[index] = doc
  }
  saveDocuments(docs)
}

export function nextDocumentId(): string {
  const year = new Date().getFullYear()
  const count = loadDocuments().length + 1
  return `DOC-${year}-${String(count).padStart(4, '0')}`
}
