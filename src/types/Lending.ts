export type Lending = {
    returned: any
    lendingId: string
    readerId: string
    bookId: string
    lendDate: Date
    dueDate: Date
    returnDate?: Date
    status: 'active' | 'returned' | 'overdue'
    fine: number
    notes?: string
}