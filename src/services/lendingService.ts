import type { LendingTransaction } from "../types"
import apiClient from "./apiClient"

export const getAllLendingTransactions = async (): Promise<LendingTransaction[]> => {
  const response = await apiClient.get("/lendings")
  return response.data
}

export const deleteLendingTransaction = async (_id: string): Promise<void> => {
  await apiClient.delete(`/lendings/${_id}`)
}

export const addLendingTransaction = async (transactionData: Omit<LendingTransaction, "id" | "_id">): Promise<LendingTransaction> => {
  console.log("Adding lending transaction with data:", transactionData)
  const response = await apiClient.post("/lendings", transactionData)
  console.log("Response from adding lending transaction:", response.data)
  return response.data
}

export const updateLendingTransaction = async (_id: string, transactionData: Omit<LendingTransaction, "id" | "_id">) => {
  const response = await apiClient.put(`/lendings/${_id}`, transactionData)
  return response.data
}