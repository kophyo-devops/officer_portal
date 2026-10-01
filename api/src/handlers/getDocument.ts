import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { getDocument } from '../lib/dynamo'
import { createDownloadUrl } from '../lib/s3'
import { json } from '../lib/shared'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (event.requestContext.http.method === 'OPTIONS') {
    return json(200, { ok: true })
  }

  try {
    const documentId = event.pathParameters?.id
    if (!documentId) {
      return json(400, { message: 'document id required' })
    }

    const doc = await getDocument(documentId)
    if (!doc) {
      return json(404, { message: 'Document not found' })
    }

    const pdfUrl = await createDownloadUrl(doc.pdfS3Key)

    return json(200, {
      document: doc,
      pdfUrl,
    })
  } catch (error) {
    console.error(error)
    return json(500, { message: 'Internal server error' })
  }
}
