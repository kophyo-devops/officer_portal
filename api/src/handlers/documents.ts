import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyHandlerV2WithJWTAuthorizer,
} from 'aws-lambda'
import { randomUUID } from 'node:crypto'
import { putDocument, listDocuments } from '../lib/dynamo'
import { buildPdfKey, createUploadUrl } from '../lib/s3'
import { json, type CargoDocumentRecord } from '../lib/shared'

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
  event,
) => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return json(200, { ok: true })
  }

  try {
    if (event.requestContext.http.method === 'GET') {
      const docs = await listDocuments()
      return json(200, { items: docs })
    }

    if (event.requestContext.http.method !== 'POST') {
      return json(405, { message: 'Method not allowed' })
    }

    const body = JSON.parse(event.body || '{}') as {
      truckPlate?: string
      cargoType?: string
      quantity?: string
      destination?: string
      issueDate?: string
      notes?: string
      pdfFileName?: string
      contentType?: string
    }

    const required = [
      body.truckPlate,
      body.cargoType,
      body.quantity,
      body.destination,
      body.issueDate,
      body.pdfFileName,
    ]
    if (required.some((v) => !v || !String(v).trim())) {
      return json(400, { message: 'Missing required fields' })
    }

    const jwtEvent = event as APIGatewayProxyEventV2WithJWTAuthorizer
    const claims = jwtEvent.requestContext.authorizer?.jwt?.claims
    const officerName = String(
      claims?.['cognito:username'] || claims?.email || claims?.sub || 'Officer',
    )
    const officerSub = claims?.sub ? String(claims.sub) : undefined

    const now = new Date().toISOString()
    const year = now.slice(0, 4)
    const documentId = `DOC-${year}-${randomUUID().slice(0, 8).toUpperCase()}`
    const pdfFileName = String(body.pdfFileName)
    const pdfS3Key = buildPdfKey(documentId, pdfFileName)

    const doc: CargoDocumentRecord = {
      documentId,
      truckPlate: String(body.truckPlate).trim(),
      cargoType: String(body.cargoType).trim(),
      quantity: String(body.quantity).trim(),
      destination: String(body.destination).trim(),
      issueDate: String(body.issueDate).trim(),
      officerName,
      officerSub,
      notes: String(body.notes || '').trim(),
      pdfFileName,
      pdfS3Key,
      status: 'issued',
      createdAt: now,
      updatedAt: now,
    }

    await putDocument(doc)
    const uploadUrl = await createUploadUrl(
      pdfS3Key,
      body.contentType || 'application/pdf',
    )

    return json(201, {
      document: doc,
      uploadUrl,
    })
  } catch (error) {
    console.error(error)
    return json(500, { message: 'Internal server error' })
  }
}
