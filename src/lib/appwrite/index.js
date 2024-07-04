import { Client, Account, Databases, Storage } from "appwrite"
import { db } from "./databases"

export const client = new Client()

client.setEndpoint("https://cloud.appwrite.io/v1").setProject("receiptwise")

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export { ID, OAuthProvider } from "appwrite"
export { db }
