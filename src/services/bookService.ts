import type { Book } from "../types"
import apiClient from "./apiClient"

export const getAllBooks = async (): Promise<Book[]> => {
  const response = await apiClient.get("/books")
  return response.data
}

export const deleteBook = async (_id: string): Promise<void> => {
  await apiClient.delete(`/customers/${_id}`)
}

export const addBook = async (bookData: Omit<Book, "id">): Promise<Book> => {
    console.log("Adding book with data:", bookData)
  const response = await apiClient.post("/books", bookData)
  console.log("Response from adding book:", response.data)

  return response.data
}

export const updateBook = async (_id: string, bookData: Omit<Book, "id">) => {
  const response = await apiClient.put(`/books/${_id}`, bookData)
  return response.data
}
