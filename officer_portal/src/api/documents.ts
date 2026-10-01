import { fetchAuthSession } from 'aws-amplify/auth'
import { env, isApiConfigured, isCognitoConfigured } from '../config/env'
import type { CargoDocument, DocumentStatus } from '../types'

export interface ApiDocument {
  documentId: string
  truckPlate: string
  cargoType: string
  quantity: string
  destination: string
  issueDate: string
  officerName: string
  notes: string
  pdfFileName: string
  pdfS3Key: string
  status: DocumentStatus
  createdAt: string
}

export function mapApiDocument(doc: ApiDocument): CargoDocument {
  return {
    id: doc.documentId,
    truckPlate: doc.truckPlate,
    cargoType: doc.cargoType,
    quantity: doc.quantity,
    destination: doc.destination,
    issueDate: doc.issueDate,
    officerName: doc.officerName,
    notes: doc.notes,
    pdfFileName: doc.pdfFileName,
    status: doc.status,
    createdAt: doc.createdAt,
  }
}

async function authHeaders(required = true): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!isCognitoConfigured) {
    if (required) throw new Error('Cognito မပြင်ဆင်ရသေးပါ')
    return headers
  }

  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  if (!token) {
    if (required) throw new Error('Login လုပ်ရန် လိုအပ်သည်')
    return headers
  }

  headers.Authorization = `Bearer ${token}`
  return headers
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  if (!isApiConfigured) {
    throw new Error('VITE_API_BASE_URL မထည့်ရသေးပါ')
  }

  const { auth = true, ...rest } = init
  const headers = {
    ...(await authHeaders(auth)),
    ...(rest.headers || {}),
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers,
  })

  const data = (await response.json().catch(() => ({}))) as {
    message?: string
  } & T

  if (!response.ok) {
    throw new Error(data.message || `API error ${response.status}`)
  }

  return data
}

export async function listDocumentsApi() {
  const data = await apiFetch<{ items: ApiDocument[] }>('/documents', {
    method: 'GET',
    auth: true,
  })
  return data.items.map(mapApiDocument)
}

export async function createDocumentApi(input: {
  truckPlate: string
  cargoType: string
  quantity: string
  destination: string
  issueDate: string
  notes: string
  pdfFileName: string
  contentType: string
}) {
  return apiFetch<{ document: ApiDocument; uploadUrl: string }>('/documents', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(input),
  })
}

export async function getDocumentApi(documentId: string) {
  return apiFetch<{ document: ApiDocument; pdfUrl: string }>(
    `/documents/${encodeURIComponent(documentId)}`,
    {
      method: 'GET',
      auth: false,
    },
  )
}

export async function uploadPdfToS3(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/pdf',
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`S3 upload failed (${response.status})`)
  }
}
