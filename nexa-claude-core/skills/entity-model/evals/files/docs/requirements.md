# Requirements — Community Library

## Vision

A small community library wants a system to manage its book collection and member
borrowing. The collection is organised by book; the library holds several physical
copies of each book, and members borrow individual copies.

## Functional Requirements

- **FR-1** A member registers with a full name and a unique email address.
- **FR-2** Each book records a title, ISBN, and publication year. Every book is written
  by exactly one author; an author may write many books.
- **FR-3** The library holds one or more physical copies of each book. Each copy has a
  shelf code and a condition (New, Good, Worn).
- **FR-4** A member borrows a copy. Each loan records the borrow date and the due date.
  A copy can be on loan to at most one member at a time; a member may hold many loans.
- **FR-5** When a copy is returned, the loan records the return date.

## Non-Functional Requirements

- **NFR-1** Email addresses must be validated as well-formed.
- **NFR-2** Due date must be on or after the borrow date.

## Constraints

- **C-1** ISBN must be unique across the collection.
