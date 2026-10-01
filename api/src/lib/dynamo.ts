import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb'
import type { CargoDocumentRecord } from './shared'
import { getEnv } from './shared'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export async function putDocument(doc: CargoDocumentRecord) {
  const { tableName } = getEnv()
  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: doc,
      ConditionExpression: 'attribute_not_exists(documentId)',
    }),
  )
}

export async function getDocument(documentId: string) {
  const { tableName } = getEnv()
  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { documentId },
    }),
  )
  return (result.Item as CargoDocumentRecord | undefined) ?? null
}

export async function listDocuments() {
  const { tableName } = getEnv()
  const result = await ddb.send(
    new ScanCommand({
      TableName: tableName,
    }),
  )
  const items = (result.Items as CargoDocumentRecord[] | undefined) ?? []
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
