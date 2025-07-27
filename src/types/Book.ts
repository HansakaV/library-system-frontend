export  type Book = {
    isbn: string
    title: string
    author: string
    genre: string
    publisher: string
    publishedYear: number
    totalCopies: number
    availableCopies: number
    description?: string
    status: 'available' | 'unavailable'
}