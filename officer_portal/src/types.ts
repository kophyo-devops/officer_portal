export type DocumentStatus = 'issued' | 'verified' | 'revoked'

export interface CargoDocument {
  id: string
  truckPlate: string
  cargoType: string
  quantity: string
  destination: string
  issueDate: string
  officerName: string
  notes: string
  pdfFileName: string
  status: DocumentStatus
  createdAt: string
}
