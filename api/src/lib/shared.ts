export type DocumentStatus = 'issued' | 'verified' | 'revoked'

export interface CargoDocumentRecord {
  documentId: string
  truckPlate: string
  cargoType: string
  quantity: string
  destination: string
  issueDate: string
  officerName: string
  officerSub?: string
  notes: string
  pdfFileName: string
  pdfS3Key: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
}

export function json(statusCode: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

export function getEnv() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-1'
  const tableName = process.env.DOCUMENTS_TABLE
  const bucketName = process.env.S3_BUCKET_NAME
  const uploadUrlTtl = Number(process.env.UPLOAD_URL_TTL_SECONDS || 300)
  const downloadUrlTtl = Number(process.env.DOWNLOAD_URL_TTL_SECONDS || 300)

  if (!tableName || !bucketName) {
    throw new Error('DOCUMENTS_TABLE and S3_BUCKET_NAME are required')
  }

  return { region, tableName, bucketName, uploadUrlTtl, downloadUrlTtl }
}
