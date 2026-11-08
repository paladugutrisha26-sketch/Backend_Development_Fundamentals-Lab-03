/**
 * Lab 3: REST API Development with Query Parameters, Validation, and Debugging
 * Course: Backend Development Fundamentals (Year II Term II)
 * Faculty: Joel Prashanth D
 * Student: Trisha
 * Registration Number: 252U1R1176
 * Section: CSE 2D
 *
 * Technologies: Node.js, Express.js, SQLite (sqlite & sqlite3)
 */

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server port configuration (configurable via environment variable to prevent EADDRINUSE)
const PORT = process.env.PORT || 3000;

// Path to SQLite database file
const dbPath = process.env.DB_PATH || path.join(__dirname, "books.db");
let db = null;
let serverInstance = null;

/**
 * Initializes the SQLite database connection, ensures the 'books' table exists,
 * seeds initial sample data if empty, and starts the Express HTTP server.
 */
const initializeDBAndServer = async (customPort = PORT) => {
  try {
    // 1. Open SQLite database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log(`Connected to SQLite database at: ${dbPath}`);

    // 2. Create the 'books' table if it does not exist (consistent plural table name)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    // 3. Seed initial sample books if the table is currently empty
    const countResult = await db.get("SELECT COUNT(*) AS total FROM books;");
    if (countResult.total === 0) {
      console.log("Database table 'books' is empty. Inserting initial sample records...");
      await db.exec(`
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
      `);
      console.log("12 initial sample books inserted successfully.");
    }

    // 4. Start listening on the specified port
    return new Promise((resolve) => {
      serverInstance = app.listen(customPort, () => {
        console.log(`Server is running at http://localhost:${customPort}/`);
        resolve(serverInstance);
      });
    });
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    process.exit(1);
  }
};

// ============================================================================
// REST API ROUTES
// ============================================================================

/**
 * Root Route: Welcome & API documentation overview
 * Method: GET
 * Route: /
 */
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Bookstore REST API - Lab 3",
    student: {
      name: "Trisha",
      regNo: "252U1R1176",
      section: "CSE 2D",
    },
    course: "Backend Development Fundamentals - Lab 03",
    endpoints: [
      {
        method: "GET",
        path: "/books",
        description: "Retrieve all books with query parameters (search_q, order_by, order, limit, offset, min_price, max_price)",
      },
      {
        method: "GET",
        path: "/books/:id",
        description: "Retrieve a specific book by ID",
      },
      {
        method: "POST",
        path: "/books",
        description: "Add a new book with body validation (title, author, price, pages)",
      },
      {
        method: "PUT",
        path: "/books/:id",
        description: "Update an existing book by ID with validation",
      },
      {
        method: "DELETE",
        path: "/books/:id",
        description: "Delete an existing book by ID",
      },
    ],
  });
});

/**
 * Route 1: Retrieve all books with query parameters
 * Method: GET
 * Route: /books or /books/
 *
 * Query Parameters:
 *  - search_q: Partial title match using SQL LIKE %search_q%
 *  - order_by: Column to sort by (allowed: id, title, author, price, pages). Default: id
 *  - order: Sort direction (allowed: ASC, DESC). Default: ASC
 *  - limit: Maximum number of records to return. Default: 10
 *  - offset: Number of records to skip. Default: 0
 *  - min_price: Minimum price filter (price >= min_price)
 *  - max_price: Maximum price filter (price <= max_price)
 */
app.get(["/books", "/books/"], async (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = "10",
      offset = "0",
      min_price,
      max_price,
    } = req.query;

    // --- Validation 1: order_by whitelist ---
    const allowedColumns = ["id", "title", "author", "price", "pages"];
    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!allowedColumns.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Invalid order_by column '${order_by}'. Allowed columns: ${allowedColumns.join(", ")}`,
      });
    }

    // --- Validation 2: order direction whitelist ---
    const normalizedOrder = String(order).toUpperCase();
    if (normalizedOrder !== "ASC" && normalizedOrder !== "DESC") {
      return res.status(400).json({
        message: "Invalid order parameter. Allowed values: ASC, DESC",
      });
    }

    // --- Validation 3: limit pagination ---
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: "Invalid limit parameter. Must be a positive integer",
      });
    }

    // --- Validation 4: offset pagination ---
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: "Invalid offset parameter. Must be a non-negative integer",
      });
    }

    // Build parameterized WHERE clause
    const conditions = [];
    const queryParams = [];

    // Filter by search_q (partial title match using LIKE)
    if (search_q && String(search_q).trim() !== "") {
      conditions.push("title LIKE ?");
      queryParams.push(`%${String(search_q).trim()}%`);
    }

    // Filter by min_price
    let parsedMinPrice = null;
    if (min_price !== undefined && min_price !== "") {
      parsedMinPrice = Number(min_price);
      if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({
          message: "Invalid min_price parameter. Must be a non-negative number",
        });
      }
      conditions.push("price >= ?");
      queryParams.push(parsedMinPrice);
    }

    // Filter by max_price
    let parsedMaxPrice = null;
    if (max_price !== undefined && max_price !== "") {
      parsedMaxPrice = Number(max_price);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({
          message: "Invalid max_price parameter. Must be a non-negative number",
        });
      }
      conditions.push("price <= ?");
      queryParams.push(parsedMaxPrice);
    }

    // Cross-validation: min_price cannot exceed max_price
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({
        message: "min_price cannot be greater than max_price",
      });
    }

    // Construct SQL query safely with parameterized placeholders for user inputs
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const getBooksQuery = `
      SELECT *
      FROM books
      ${whereClause}
      ORDER BY ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?;
    `;
    queryParams.push(parsedLimit, parsedOffset);

    // Execute parameterized query asynchronously with await
    const books = await db.all(getBooksQuery, queryParams);
    res.status(200).json(books);
  } catch (error) {
    console.error("Error retrieving books:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Route 2: Retrieve a single book by ID
 * Method: GET
 * Route: /books/:id or /books/:id/
 */
app.get(["/books/:id", "/books/:id/"], async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  // Validate that id is a positive integer
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      message: "Invalid book ID. Must be a positive integer",
    });
  }

  try {
    // Parameterized SQL query prevents SQL injection
    const getBookQuery = `SELECT * FROM books WHERE id = ?;`;
    const book = await db.get(getBookQuery, [parsedId]);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error(`Error retrieving book ID ${id}:`, error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Route 3: Add a new book
 * Method: POST
 * Route: /books or /books/
 *
 * Validation:
 *  - Title must not be missing or empty.
 *  - Author must not be missing or empty.
 *  - Price must be numeric and non-negative.
 */
app.post(["/books", "/books/"], async (req, res) => {
  // Validate request body existence
  if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: "Request body is missing or empty. JSON body is required",
    });
  }

  const { title, author, price, pages } = req.body;

  // 1. Validate title: must not be missing, non-string, or empty/whitespace
  if (title === undefined || title === null || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      message: "Title is required and cannot be empty",
    });
  }

  // 2. Validate author: must not be missing, non-string, or empty/whitespace
  if (author === undefined || author === null || typeof author !== "string" || author.trim() === "") {
    return res.status(400).json({
      message: "Author is required and cannot be empty",
    });
  }

  // 3. Validate price: must be present and a valid non-negative number
  if (price === undefined || price === null || price === "") {
    return res.status(400).json({
      message: "Price is required and must be numeric",
    });
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || !isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({
      message: "Price must be numeric and non-negative",
    });
  }

  // 4. Validate pages: default to 100 if omitted, or validate positive integer if provided
  let numericPages = 100;
  if (pages !== undefined && pages !== null && pages !== "") {
    numericPages = Number(pages);
    if (isNaN(numericPages) || numericPages <= 0 || !Number.isInteger(numericPages)) {
      return res.status(400).json({
        message: "Pages must be a positive integer",
      });
    }
  }

  try {
    // Parameterized INSERT query
    const insertBookQuery = `
      INSERT INTO books (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(insertBookQuery, [
      title.trim(),
      author.trim(),
      numericPrice,
      numericPages,
    ]);

    const createdBook = {
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: numericPrice,
      pages: numericPages,
    };

    res.status(201).json({
      message: "Book created successfully",
      book: createdBook,
    });
  } catch (error) {
    console.error("Error creating book:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Route 4: Update an existing book by ID
 * Method: PUT
 * Route: /books/:id or /books/:id/
 */
app.put(["/books/:id", "/books/:id/"], async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  // Validate ID
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      message: "Invalid book ID. Must be a positive integer",
    });
  }

  // Validate request body
  if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: "Request body is missing or empty. JSON body is required",
    });
  }

  const { title, author, price, pages } = req.body;

  // Validate title
  if (title === undefined || title === null || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      message: "Title is required and cannot be empty",
    });
  }

  // Validate author
  if (author === undefined || author === null || typeof author !== "string" || author.trim() === "") {
    return res.status(400).json({
      message: "Author is required and cannot be empty",
    });
  }

  // Validate price
  if (price === undefined || price === null || price === "") {
    return res.status(400).json({
      message: "Price is required and must be numeric",
    });
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || !isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({
      message: "Price must be numeric and non-negative",
    });
  }

  // Validate pages
  let numericPages = 100;
  if (pages !== undefined && pages !== null && pages !== "") {
    numericPages = Number(pages);
    if (isNaN(numericPages) || numericPages <= 0 || !Number.isInteger(numericPages)) {
      return res.status(400).json({
        message: "Pages must be a positive integer",
      });
    }
  }

  try {
    // Check if the book exists
    const checkQuery = `SELECT * FROM books WHERE id = ?;`;
    const existingBook = await db.get(checkQuery, [parsedId]);

    if (!existingBook) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    // Parameterized UPDATE query
    const updateBookQuery = `
      UPDATE books
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      numericPrice,
      numericPages,
      parsedId,
    ]);

    res.status(200).json({
      message: "Book updated successfully",
      book: {
        id: parsedId,
        title: title.trim(),
        author: author.trim(),
        price: numericPrice,
        pages: numericPages,
      },
    });
  } catch (error) {
    console.error(`Error updating book ID ${id}:`, error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Route 5: Delete a book by ID
 * Method: DELETE
 * Route: /books/:id or /books/:id/
 */
app.delete(["/books/:id", "/books/:id/"], async (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  // Validate ID
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      message: "Invalid book ID. Must be a positive integer",
    });
  }

  try {
    // Check if the book exists
    const checkQuery = `SELECT * FROM books WHERE id = ?;`;
    const existingBook = await db.get(checkQuery, [parsedId]);

    if (!existingBook) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    // Parameterized DELETE query
    const deleteBookQuery = `DELETE FROM books WHERE id = ?;`;
    await db.run(deleteBookQuery, [parsedId]);

    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting book ID ${id}:`, error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fallback Route: Handle unknown / non-existing routes with 404
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
  });
});

// Helper function to close server (useful in tests)
const closeServer = async () => {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
  if (db) {
    await db.close();
  }
};

// Start the server if executed directly
if (require.main === module) {
  initializeDBAndServer();
}

module.exports = {
  app,
  initializeDBAndServer,
  closeServer,
};
