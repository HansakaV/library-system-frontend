import type { Reader } from "../types"
import apiClient from "./apiClient"

export const getAllReaders = async (): Promise<Reader[]> => {
  const response = await apiClient.get("/readers")
  return response.data.map((reader: any) => ({
    id: reader._id, // Map _id from backend to id for your Reader type
    name: reader.name,
    email: reader.email,
    phone: reader.phone,
    address: reader.address,
    _id: reader._id, // Keep _id as well for use in OrdersPage dropdowns
  }))
}

export const deleteReader = async (_id: string): Promise<void> => {
  await apiClient.delete(`/customers/${_id}`)
}

export const addReader = async (customerData: Omit<Reader, "id">): Promise<Reader> => {
    console.log("Adding reader with data:", customerData)
  const response = await apiClient.post("/readers", customerData)
  console.log("Response from adding reader:", response.data)

  return response.data
}

export const updateReader = async (_id: string, readerData: Omit<Reader, "id">) => {
  const response = await apiClient.put(`/readers/${_id}`, readerData)
  return response.data
}
