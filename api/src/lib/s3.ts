import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getEnv } from './shared'

const s3 = new S3Client({})

export function buildPdfKey(documentId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.\-()+\s]/g, '_').slice(0, 120)
  return `documents/${documentId}/${safeName}`
}

export async function createUploadUrl(key: string, contentType: string) {
  const { bucketName, uploadUrlTtl } = getEnv()
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType || 'application/pdf',
  })
  return getSignedUrl(s3, command, { expiresIn: uploadUrlTtl })
}

export async function createDownloadUrl(key: string) {
  const { bucketName, downloadUrlTtl } = getEnv()
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })
  return getSignedUrl(s3, command, { expiresIn: downloadUrlTtl })
}
