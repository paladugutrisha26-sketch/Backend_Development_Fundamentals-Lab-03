# Lab 3: REST API Development with Query Parameters, Validation, and Debugging

## Student Information

- **Name:** Trisha
- **Registration Number:** 252U1R1176
- **Section:** CSE 2D
- **Course:** Backend Development Fundamentals (Year II Term II)
- **Lab Number:** Lab 03
- **Faculty:** Sai Siva Theja
- **Module:** RESTful API development and validation
- **Repository:** [https://github.com/paladugutrisha26-sketch/Backend_Development_Fundamentals-Lab-03](https://github.com/paladugutrisha26-sketch/Backend_Development_Fundamentals-Lab-03)

---

## Objective

To advance the bookstore backend into a robust, industry-standard RESTful API featuring:
1. RESTful endpoint naming conventions using plural nouns (`/books`) and standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
2. Advanced query parameters (`search_q`, `order_by`, `order`, `limit`, `offset`, `min_price`, `max_price`) with sensible defaults and strict whitelist validation.
3. Parameterized SQL queries using SQLite to prevent SQL Injection attacks.
4. Comprehensive request body validation with clear, uniform JSON error responses (`{ "message": "..." }`).
5. Proper HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
6. Deep-dive debugging strategies resolving 4 common backend errors: `EADDRINUSE`, wrong import paths, SQLite table-name typos, and missing `await` statements.
7. End-to-end testing with an importable Postman collection and an automated 53-assertion test suite.

---

## Technologies Used

- **Runtime:** Node.js (v24+)
- **Framework:** Express.js (v5)
- **Database:** SQLite3
- **Database Drivers:** `sqlite` (Promise-based abstraction wrapper) & `sqlite3` (Core driver)
- **Process Manager:** Nodemon (automatic hot-reload during development)
- **Testing & Verification:** Native Node.js Test Suite & Postman Collection v2.1
- **Version Control:** Git & GitHub

---

## Project Structure

```text
Backend_Development_Fundamentals-Lab-03/
│
├── database/
│   ├── schema.sql              # Table definition for 'books'
│   ├── seed.sql                # 12 diverse sample book records
│   └── setup.sql               # Combined schema and seed script
│
├── debugging/
│   └── broken_server_demo.js   # Side-by-side comparison of 4 common bugs and fixes
│
├── screenshots/
│   └── .gitkeep                # Directory placeholder for screenshots
│
├── .env.example                # Configuration template (PORT, DB_PATH) without secrets
├── .gitignore                  # Excludes node_modules/, .env, and local database
├── books.db                    # SQLite database storing the 'books' table
├── package.json                # Project dependencies, scripts, and metadata
├── package-lock.json           # Exact dependency version lock
├── postman_collection.json     # Importable Postman Collection v2.1 (23 requests)
├── README.md                   # Comprehensive documentation and Viva Q&A
├── server.js                   # Main Express application with CRUD, query params & validation
└── test_api.js                 # Automated test suite (53 assertions covering all cases)
```

---

## Database Architecture & Schema

### Table: `books`

The database file `books.db` uses a standardized plural table name (`books`) to align with REST conventions and resolve the common "no such table" typo.

```sql
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);
```

### Column Specifications

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each book |
| `title` | `TEXT` | `NOT NULL` | Full title of the book |
| `author` | `TEXT` | `NOT NULL` | Author(s) of the book |
| `price` | `INTEGER` | `NOT NULL` | Book price in INR (non-negative) |
| `pages` | `INTEGER` | `NOT NULL` | Total number of pages |

### Initial Sample Records

The database is automatically pre-seeded with 12 diverse records covering varied programming and literature topics across prices ranging from ₹199 to ₹1499:
1. *JavaScript: The Good Parts* — Douglas Crockford (₹350, 176 pages)
2. *Clean Code* — Robert C. Martin (₹899, 464 pages)
3. *Introduction to Algorithms* — Thomas H. Cormen (₹1499, 1312 pages)
4. *The Pragmatic Programmer* — David Thomas, Andrew Hunt (₹950, 352 pages)
5. *Head First Java* — Kathy Sierra, Bert Bates (₹650, 720 pages)
6. *Effective Java* — Joshua Bloch (₹750, 412 pages)
7. *Python Crash Course* — Eric Matthes (₹499, 544 pages)
8. *Designing Data-Intensive Applications* — Martin Kleppmann (₹1199, 616 pages)
9. *The Hobbit* — J.R.R. Tolkien (₹299, 310 pages)
10. *To Kill a Mockingbird* — Harper Lee (₹249, 324 pages)
11. *1984* — George Orwell (₹199, 328 pages)
12. *The Great Gatsby* — F. Scott Fitzgerald (₹220, 180 pages)

---

## REST API Endpoints

| HTTP Method | Route | Description | Success Status | Failure Status |
|---|---|---|---|---|
| `GET` | `/` | API documentation and server status | `200 OK` | `500 Internal Error` |
| `GET` | `/books` | Retrieve books with filtering, sorting, and pagination | `200 OK` | `400 Bad Request`, `500` |
| `GET` | `/books/:id` | Retrieve a single book by ID | `200 OK` | `400 Bad Request`, `404 Not Found` |
| `POST` | `/books` | Create a new book with body validation | `201 Created` | `400 Bad Request`, `500` |
| `PUT` | `/books/:id` | Update an existing book by ID | `200 OK` | `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/books/:id` | Delete a book by ID | `200 OK` | `400 Bad Request`, `404 Not Found` |

---

## Query Parameters (`GET /books`)

The `GET /books` endpoint accepts 7 query parameters to support search, sorting, pagination, and price range filtering:

| Parameter | Type | Default Value | Allowed Values / Validation | Description |
|---|---|---|---|---|
| `search_q` | String | `""` | Any string | Case-insensitive partial title match via SQL `LIKE ?` (`%search_q%`) |
| `order_by` | String | `"id"` | `id`, `title`, `author`, `price`, `pages` | Column to sort by (strictly validated against whitelist) |
| `order` | String | `"ASC"` | `ASC`, `DESC` (case-insensitive) | Sorting direction |
| `limit` | Integer | `10` | Positive integer (`> 0`) | Maximum number of records to return |
| `offset` | Integer | `0` | Non-negative integer (`>= 0`) | Number of records to skip for pagination |
| `min_price` | Number | *(optional)* | Non-negative number (`>= 0`) | Minimum price threshold (`price >= ?`) |
| `max_price` | Number | *(optional)* | Non-negative number (`>= 0`) | Maximum price threshold (`price <= ?`) |

### Example Queries

#### 1. Search by Title
```http
GET /books?search_q=java
```
Returns books whose title contains the word "java" (e.g., *Head First Java*, *Effective Java*, *JavaScript: The Good Parts*).

#### 2. Sort by Price Ascending / Descending
```http
GET /books?order_by=price&order=ASC
GET /books?order_by=price&order=DESC
```

#### 3. Pagination with Limit and Offset
```http
GET /books?limit=3&offset=0   # Page 1 (first 3 books)
GET /books?limit=3&offset=3   # Page 2 (next 3 books)
GET /books?limit=3&offset=6   # Page 3
```

#### 4. Price Range Filter
```http
GET /books?min_price=300&max_price=800
```
Returns all books with price between ₹300 and ₹800.

#### 5. Combined Comprehensive Query (Lab Handout Example)
```http
GET /books?search_q=java&order_by=price&order=ASC&limit=5&offset=0&min_price=100&max_price=1000
```
Filters books containing "java" in title, with price between ₹100 and ₹1000, sorted by price ascending, returning up to 5 records starting from offset 0.

### SQL Injection Prevention

SQL Injection is strictly prevented via two complementary mechanisms:
1. **Parameterized Queries (`?` Placeholders):**
   User inputs (`search_q`, `min_price`, `max_price`, `limit`, `offset`) are passed exclusively as bound parameters to SQLite. The database engine treats them as literal values rather than executable SQL syntax.
2. **Column & Direction Whitelisting:**
   SQL identifiers (`ORDER BY column ASC/DESC`) cannot be parameterized with `?` in SQL standards. Therefore, `order_by` and `order` are checked against hardcoded whitelists (`['id', 'title', 'author', 'price', 'pages']` and `['ASC', 'DESC']`). If any invalid value is supplied, the server immediately rejects the request with HTTP 400 before querying the database.

---

## Request Validation & HTTP Status Codes

### POST /books Validation Rules

The request body must be valid JSON satisfying:
- `title`: Must not be missing, non-string, or blank/whitespace. Rejection: `400 Bad Request` with `{ "message": "Title is required and cannot be empty" }`.
- `author`: Must not be missing, non-string, or blank/whitespace. Rejection: `400 Bad Request` with `{ "message": "Author is required and cannot be empty" }`.
- `price`: Must be a valid numeric value and non-negative (`>= 0`). Rejection: `400 Bad Request` with `{ "message": "Price must be numeric and non-negative" }`.
- `pages`: Optional; if supplied, must be a positive integer (`> 0`). Defaults to 100 if omitted.

### Consistent JSON Response Format

All responses use a standardized JSON contract:
- **Success:**
  ```json
  {
    "message": "Book created successfully",
    "book": {
      "id": 13,
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "price": 850,
      "pages": 432
    }
  }
  ```
- **Error:**
  ```json
  {
    "message": "Book not found"
  }
  ```

### HTTP Status Codes Implemented

- `200 OK`: Successful `GET` (collection, single record), `PUT` (update), and `DELETE` (removal).
- `201 Created`: Successful `POST` (new book added).
- `400 Bad Request`: Client validation error (missing fields, invalid price, invalid query params, malformed ID).
- `404 Not Found`: Requested book ID does not exist in the database, or invalid endpoint URL.
- `500 Internal Server Error`: Unhandled database or server runtime exception.

---

## Debugging Exercise: 4 Common Backend Errors

The Lab 3 syllabus requires students to identify, explain, and eliminate four recurring backend errors:

### 1. `EADDRINUSE` — Port Conflict
- **What Happens:** The server crashes on startup with `Error: listen EADDRINUSE: address already in use :::3000`.
- **Root Cause:** A previously running Node.js process or another service is already bound to port 3000.
- **How We Resolved It:**
  1. Configured the port to be dynamically set via environment variable: `const PORT = process.env.PORT || 3000;`.
  2. To free a busy port on Windows PowerShell:
     ```powershell
     netstat -ano | findstr :3000
     Stop-Process -Id <PID> -Force
     ```
  3. Enabled running on an alternate port anytime: `PORT=3001 node server.js`.

### 2. Wrong Import Path
- **What Happens:** Server crashes immediately on launch with `Error: Cannot find module './db'` or `Cannot find module 'expresss'`.
- **Root Cause:** Typos in npm package names or inaccurate relative paths that fail when the current working directory changes.
- **How We Resolved It:**
  1. Used exact package names defined in `package.json` (`express`, `sqlite`, `sqlite3`).
  2. Used Node's built-in `path.join(__dirname, "books.db")` to resolve paths relative to the script directory rather than arbitrary working directories.

### 3. SQLite Table-Name Typo (`no such table`)
- **What Happens:** API requests fail with `SqliteError: no such table: books` or `no such table: book`.
- **Root Cause:** Schema created table as singular `book`, while route handlers queried plural `books` (or vice versa).
- **How We Resolved It:**
  Standardized the table name as plural `books` consistently across `database/schema.sql`, `database/seed.sql`, and all queries in `server.js` (`SELECT * FROM books...`).

### 4. Missing `await` in Asynchronous Operations
- **What Happens:** Routes return empty objects `{}` or `[object Promise]` to the client, or crash with undefined property errors.
- **Root Cause:** SQLite methods (`db.all()`, `db.get()`, `db.run()`) return Promises. Omitting `await` causes Express to send the pending Promise object before the database query finishes executing.
- **How We Resolved It:**
  1. Declared all route handlers as `async (req, res) => { ... }`.
  2. Prefixed every database call with `await`:
     ```javascript
     const books = await db.all(getBooksQuery, queryParams);
     const book = await db.get(getBookQuery, [parsedId]);
     const result = await db.run(insertBookQuery, [...]);
     ```
  3. Wrapped operations in `try / catch` blocks to gracefully catch rejections and send `500` status codes.

*(A side-by-side demonstration is available in [`debugging/broken_server_demo.js`](file:///database/../debugging/broken_server_demo.js)).*

---

## Viva Questions & Answers

### Q1: What is the difference between a query parameter and a path parameter?
- **Path Parameters (e.g., `/books/:id`):**
  - Embedded directly into the URL path.
  - Used to identify a specific, unique resource.
  - Mandatory for the endpoint to route correctly (omitting the ID targets a completely different route).
  - *Example:* `GET /books/5` identifies the specific book whose primary key is 5.
- **Query Parameters (e.g., `/books?search_q=java&limit=5`):**
  - Appended after the `?` delimiter as key-value pairs separated by `&`.
  - Used to filter, sort, paginate, or format a collection of resources without changing the identity of the endpoint.
  - Optional; the endpoint supplies sensible default values when query parameters are omitted.
  - *Example:* `GET /books?order_by=price&order=ASC` retrieves the books collection sorted by ascending price.

### Q2: What does "stateless" mean in RESTful API architecture?
- In REST architecture, **statelessness** means that each HTTP request from the client to the server must contain all the contextual information required to understand and fulfill the request.
- The server does not store any client session state or conversational history between requests.
- Each request is completely independent. If Request 1 creates a resource, Request 2 cannot rely on internal server memory from Request 1; it must provide whatever identifiers or credentials are required.
- **Benefits:**
  - High scalability: requests can be handled by any server instance behind a load balancer.
  - Reliability: server restarts do not lose client session state.
  - Simpler caching: responses can be cached based on the request URL and headers alone.

### Q3: Which HTTP status code should be used for bad input vs. a missing record?
- **Bad Input (Client Validation Failure) $\rightarrow$ `400 Bad Request`:**
  - Used when the client sends malformed JSON, omits mandatory fields (e.g., missing `title` or `author`), sends incompatible data types (e.g., string for `price`), or supplies invalid query parameters (e.g., non-whitelisted column).
  - Indicates that the client must modify the request before resubmitting.
- **Missing Record $\rightarrow$ `404 Not Found`:**
  - Used when the request syntax is valid and understood by the server, but the requested resource does not exist in the database (e.g., `GET /books/99999` where ID 99999 is not present).
  - Indicates that the endpoint or resource identifier does not point to any active data.

---

## Setup & Running Instructions

### 1. Prerequisites
- Node.js (v18 or higher; v24 recommended)
- npm (v9 or higher)

### 2. Installation
Navigate into the `lab-03` directory and install dependencies:
```bash
cd lab-03
npm install
```

### 3. Start the Server
- **Production / Normal Mode:**
  ```bash
  npm start
  ```
- **Development Mode (with auto-reload on file edits):**
  ```bash
  npm run dev
  ```

The server will launch at:
```text
http://localhost:3000/
```

### 4. Run the Automated Test Suite
To run all 53 automated tests verifying all endpoints, validations, and query parameters:
```bash
npm test
```

---

## Postman Testing Guide

The repository includes an importable Postman collection file: [`postman_collection.json`](file:///postman_collection.json).

### How to Import and Run
1. Open Postman.
2. Click **Import** (top left).
3. Select or drag-and-drop `lab-03/postman_collection.json`.
4. Ensure your server is running (`npm start` at `http://localhost:3000`).
5. Select the collection **Lab 03 - REST API Development (Query Params, Validation, Debugging)** and click **Run collection**.

### Included Test Cases (23 Requests)

#### Folder 1: CRUD Operations (Success Cases)
- `01 - GET /`: API Info, metadata, student details (`200 OK`)
- `02 - GET /books`: Retrieve all books with default params (`200 OK`)
- `03 - GET /books/1`: Retrieve book with ID 1 (`200 OK`)
- `04 - POST /books`: Create book with valid payload (`201 Created`)
- `05 - PUT /books/1`: Update book with ID 1 (`200 OK`)
- `06 - DELETE /books/12`: Delete book with ID 12 (`200 OK`)

#### Folder 2: Query Parameters & Filtering
- `07 - Search by Title`: `GET /books?search_q=java` (`200 OK`)
- `08 - Sort by Price ASC`: `GET /books?order_by=price&order=ASC` (`200 OK`)
- `09 - Sort by Price DESC`: `GET /books?order_by=price&order=DESC` (`200 OK`)
- `10 - Pagination`: `GET /books?limit=3&offset=0` (`200 OK`)
- `11 - Price Range Filter`: `GET /books?min_price=300&max_price=800` (`200 OK`)
- `12 - Combined Full Query`: `GET /books?search_q=java&order_by=price&order=ASC&limit=5&offset=0&min_price=100&max_price=1000` (`200 OK`)

#### Folder 3: Validation & Failure Cases
- `13 - POST Missing Title`: Returns `400 Bad Request`
- `14 - POST Missing Author`: Returns `400 Bad Request`
- `15 - POST Invalid Price`: Returns `400 Bad Request`
- `16 - GET Non-Existing ID`: Returns `404 Not Found`
- `17 - GET Invalid ID Format`: Returns `400 Bad Request`
- `18 - PUT Non-Existing ID`: Returns `404 Not Found`
- `19 - DELETE Non-Existing ID`: Returns `404 Not Found`
- `20 - GET Invalid order_by Column`: Returns `400 Bad Request`
- `21 - GET Invalid order Direction`: Returns `400 Bad Request`
- `22 - GET Invalid Price Range (min > max)`: Returns `400 Bad Request`
- `23 - Route Not Found Fallback`: Returns `404 Not Found`

---

## Lab 3 Requirements Compliance Checklist

- [x] **Noun Endpoints & HTTP Verbs:** `/books` used with `GET`, `POST`, `PUT`, `DELETE`.
- [x] **Query Parameter `search_q`:** Partial title matching via SQL `LIKE ?`.
- [x] **Query Parameter `order_by`:** Whitelist validation (`id`, `title`, `author`, `price`, `pages`) with default `id`.
- [x] **Query Parameter `order`:** Whitelist validation (`ASC`, `DESC`) with default `ASC`.
- [x] **Query Parameter `limit` & `offset`:** Pagination with defaults (`10` and `0`).
- [x] **Query Parameters `min_price` & `max_price`:** Price filtering with validation (`min_price <= max_price`).
- [x] **Default Values:** Implemented for all query parameters.
- [x] **SQL Injection Prevention:** 100% parameterized queries for data and whitelisting for identifiers.
- [x] **POST Validation:** Rejects missing title, missing author, and non-numeric price with `400`.
- [x] **HTTP Status Codes:** `200`, `201`, `400`, `404`, and `500` accurately returned.
- [x] **Consistent Error Format:** `{ "message": "..." }` used across all endpoints.
- [x] **Debugging Solutions Documented:** `EADDRINUSE`, wrong import path, table-name typo, missing `await`.
- [x] **SQLite Database & Schema:** Pre-seeded `books` table with 12 records.
- [x] **Postman Collection:** Complete 23-test collection JSON included.
- [x] **Automated Test Suite:** `npm test` runs 53 assertions with 100% pass rate.
- [x] **GitHub Submission:** Complete project prepared with `.gitignore` and pushed to GitHub repository.
