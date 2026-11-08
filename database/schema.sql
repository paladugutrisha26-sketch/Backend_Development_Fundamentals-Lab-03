-- SQLite Database Schema for Lab 3
-- Table: books
-- Description: Books table definition with primary key, title, author, price, and pages

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);
