-- SQLite Database Setup Script for Lab 3
-- Combines Schema and Initial Seed Data
-- Table: books

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);

-- Initial Sample Books
INSERT INTO books (title, author, price, pages) VALUES
('JavaScript: The Good Parts', 'Douglas Crockford', 350, 176),
('Clean Code', 'Robert C. Martin', 899, 464),
('Introduction to Algorithms', 'Thomas H. Cormen', 1499, 1312),
('The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 950, 352),
('Head First Java', 'Kathy Sierra, Bert Bates', 650, 720),
('Effective Java', 'Joshua Bloch', 750, 412),
('Python Crash Course', 'Eric Matthes', 499, 544),
('Designing Data-Intensive Applications', 'Martin Kleppmann', 1199, 616),
('The Hobbit', 'J.R.R. Tolkien', 299, 310),
('To Kill a Mockingbird', 'Harper Lee', 249, 324),
('1984', 'George Orwell', 199, 328),
('The Great Gatsby', 'F. Scott Fitzgerald', 220, 180);
