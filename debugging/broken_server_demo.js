/**
 * Lab 3 - Debugging Exercise Reference
 * =====================================
 * This file illustrates the 4 common backend errors identified in the Lab 3 handout,
 * showing the broken code pattern vs. the corrected code pattern, along with explanations.
 */

// ============================================================================
// ERROR 1: EADDRINUSE - Port Conflict
// ============================================================================
/*
 * SYMPTOM:
 * Error: listen EADDRINUSE: address already in use :::3000
 *
 * CAUSE:
 * Another process (e.g. an earlier node server instance or another application)
 * is already listening on the hardcoded port 3000.
 *
 * BROKEN PATTERN:
 * const PORT = 3000; // Hardcoded, cannot be changed without modifying code
 * app.listen(PORT);
 *
 * HOW TO RESOLVE:
 * 1. Allow the port to be configurable via environment variable `process.env.PORT`.
 * 2. If running locally, identify and terminate the conflicting process:
 *    On Windows PowerShell:
 *      netstat -ano | findstr :3000
 *      Stop-Process -Id <PID> -Force
 *    On macOS/Linux:
 *      lsof -i :3000
 *      kill -9 <PID>
 * 3. Or pass an alternate port: PORT=3001 node server.js
 *
 * CORRECT PATTERN:
 */
const PORT = process.env.PORT || 3000;


// ============================================================================
// ERROR 2: Wrong Import Path
// ============================================================================
/*
 * SYMPTOM:
 * Error: Cannot find module './db' or 'expresss'
 *
 * CAUSE:
 * - Typo in package name (e.g. 'expresss' instead of 'express').
 * - Wrong relative path for local files (e.g. './db' instead of './database/db').
 * - Case-sensitivity mismatches between development environments.
 *
 * BROKEN PATTERN:
 * const express = require("expresss"); // Typo in npm package
 * const { open } = require("sqlite-typo"); // Non-existent module
 * const dbPath = "./database/books.db"; // Unsafe relative path that depends on cwd
 *
 * HOW TO RESOLVE:
 * 1. Verify correct package name in package.json dependencies.
 * 2. Use `path.join(__dirname, ...)` to create absolute paths regardless of cwd.
 * 3. Ensure module exports and file paths are spelled correctly.
 *
 * CORRECT PATTERN:
 */
// const express = require("express");
// const path = require("path");
// const { open } = require("sqlite");
// const sqlite3 = require("sqlite3");
// const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "books.db");


// ============================================================================
// ERROR 3: SQLite Table-Name Typo (no such table)
// ============================================================================
/*
 * SYMPTOM:
 * SqliteError: no such table: book
 * (or no such table: books, when schema created 'book')
 *
 * CAUSE:
 * Inconsistent naming: the table was created using singular 'book' in schema.sql,
 * but API routes queried plural 'books' (e.g. SELECT * FROM books).
 *
 * BROKEN PATTERN:
 * // Database initialization:
 * CREATE TABLE IF NOT EXISTS book (id INTEGER PRIMARY KEY...);
 * // Route handler:
 * const books = await db.all("SELECT * FROM books;"); // Fails: no such table: books
 *
 * HOW TO RESOLVE:
 * 1. Standardize the table name across schema, seed, and all route queries.
 * 2. In RESTful conventions, resources are plural nouns (/books), so the SQL table
 *    is uniformly named `books`.
 *
 * CORRECT PATTERN:
 * CREATE TABLE IF NOT EXISTS books (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   title TEXT NOT NULL,
 *   author TEXT NOT NULL,
 *   price INTEGER NOT NULL,
 *   pages INTEGER NOT NULL
 * );
 * SELECT * FROM books WHERE ...;
 */


// ============================================================================
// ERROR 4: Missing await in Asynchronous Operations
// ============================================================================
/*
 * SYMPTOM:
 * The API returns `{}` or empty array or `[object Promise]` to the client,
 * or crashes with "Cannot read properties of undefined".
 *
 * CAUSE:
 * Calling asynchronous methods (`db.all()`, `db.get()`, `db.run()`) without
 * `await`. This returns an unresolved Promise object synchronously.
 *
 * BROKEN PATTERN:
 * app.get("/books", (req, res) => {
 *   const books = db.all("SELECT * FROM books;"); // MISSING await! books is a Promise
 *   res.status(200).json(books); // Sends empty Promise representation "{}"
 * });
 *
 * HOW TO RESOLVE:
 * 1. Mark the route handler function as `async (req, res) => { ... }`.
 * 2. Place `await` before any asynchronous call to `db.all()`, `db.get()`, `db.run()`, etc.
 * 3. Wrap in a try-catch block to properly handle rejected promises and return 500 status.
 *
 * CORRECT PATTERN:
 * app.get("/books", async (req, res) => {
 *   try {
 *     const books = await db.all("SELECT * FROM books;");
 *     res.status(200).json(books);
 *   } catch (error) {
 *     res.status(500).json({ message: "Internal server error" });
 *   }
 * });
 */

module.exports = {
  PORT,
};
