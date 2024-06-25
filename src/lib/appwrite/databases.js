import { ID } from "appwrite"
import { databases } from "./index.js"

export const db = {}

const collections = [
  {
    dbId: "receiptwise",
    id: "receipts",
    name: "receipts",
  },
]

const createCollectionMethods = (dbId, colId) => {
  return {
    get: (id) => databases.getDocument(dbId, colId, id),
    list: (queries) => databases.listDocuments(dbId, colId, queries),
    create: (payload, permissions, id = ID.unique()) =>
      databases.createDocument(dbId, colId, id, payload, permissions),
    update: (id, payload, permissions) =>
      databases.updateDocument(dbId, colId, id, payload, permissions),
    delete: (id) => databases.deleteDocument(dbId, colId, id),
  }
}

collections.forEach((col) => {
  db[col.name] = createCollectionMethods(col.dbId, col.id)
})
