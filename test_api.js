/**
 * Lab 3: Automated Test Suite
 * Tests all REST API routes, query parameters, validations, and status codes.
 *
 * Can be run via: npm test
 */

const { app, initializeDBAndServer, closeServer } = require("./server.js");

const TEST_PORT = 3099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// ANSI Color helper for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

let passedCount = 0;
let failedCount = 0;

const assert = (condition, description) => {
  if (condition) {
    console.log(`  ${colors.green}✓ PASS:${colors.reset} ${description}`);
    passedCount++;
  } else {
    console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${description}`);
    failedCount++;
  }
};

const runTests = async () => {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  LAB 3: REST API AUTOMATED TEST SUITE EXECUTION   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  // Start test server
  await initializeDBAndServer(TEST_PORT);

  try {
    // ------------------------------------------------------------------------
    console.log(`${colors.yellow}[1. Root Documentation Endpoint]${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    const dataRoot = await resRoot.json();
    assert(resRoot.status === 200, "GET / returns HTTP 200");
    assert(dataRoot.message && dataRoot.endpoints.length === 5, "GET / returns welcome message and 5 endpoints list");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[2. GET /books - Default Query Parameters]${colors.reset}`);
    const resBooks = await fetch(`${BASE_URL}/books`);
    const dataBooks = await resBooks.json();
    assert(resBooks.status === 200, "GET /books returns HTTP 200");
    assert(Array.isArray(dataBooks), "GET /books returns array of books");
    assert(dataBooks.length <= 10, "Default limit is 10 records");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[3. GET /books/:id - Valid, Invalid, and Not Found]${colors.reset}`);
    const resBook1 = await fetch(`${BASE_URL}/books/1`);
    const dataBook1 = await resBook1.json();
    assert(resBook1.status === 200, "GET /books/1 returns HTTP 200");
    assert(dataBook1.id === 1 && typeof dataBook1.title === "string", "GET /books/1 returns book object with ID 1");

    const resBook404 = await fetch(`${BASE_URL}/books/99999`);
    const dataBook404 = await resBook404.json();
    assert(resBook404.status === 404, "GET /books/99999 returns HTTP 404");
    assert(dataBook404.message === "Book not found", "HTTP 404 contains { message: 'Book not found' }");

    const resBook400 = await fetch(`${BASE_URL}/books/invalid-id`);
    const dataBook400 = await resBook400.json();
    assert(resBook400.status === 400, "GET /books/invalid-id returns HTTP 400");
    assert(dataBook400.message.includes("Invalid book ID"), "HTTP 400 contains clear error message");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[4. POST /books - Validation & Creation]${colors.reset}`);
    // 4.1 Missing title
    const resPostNoTitle = await fetch(`${BASE_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: "Test Author", price: 299, pages: 120 }),
    });
    const dataPostNoTitle = await resPostNoTitle.json();
    assert(resPostNoTitle.status === 400, "POST /books without title returns HTTP 400");
    assert(dataPostNoTitle.message === "Title is required and cannot be empty", "Rejects missing title");

    // 4.2 Empty title
    const resPostEmptyTitle = await fetch(`${BASE_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   ", author: "Test Author", price: 299 }),
    });
    assert(resPostEmptyTitle.status === 400, "POST /books with blank title returns HTTP 400");

    // 4.3 Missing author
    const resPostNoAuthor = await fetch(`${BASE_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Valid Title", price: 299 }),
    });
    const dataPostNoAuthor = await resPostNoAuthor.json();
    assert(resPostNoAuthor.status === 400, "POST /books without author returns HTTP 400");
    assert(dataPostNoAuthor.message === "Author is required and cannot be empty", "Rejects missing author");

    // 4.4 Non-numeric price
    const resPostBadPrice = await fetch(`${BASE_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Valid Title", author: "Valid Author", price: "free" }),
    });
    const dataPostBadPrice = await resPostBadPrice.json();
    assert(resPostBadPrice.status === 400, "POST /books with non-numeric price returns HTTP 400");
    assert(dataPostBadPrice.message.includes("numeric"), "Rejects non-numeric price");

    // 4.5 Negative price
    const resPostNegPrice = await fetch(`${BASE_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Valid Title", author: "Valid Author", price: -50 }),
    });
    assert(resPostNegPrice.status === 400, "POST /books with negative price returns HTTP 400");

    // 4.6 Successful creation
    const resPostSuccess = await fetch(`${BASE_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Node.js Design Patterns",
        author: "Mario Casciaro",
        price: 850,
        pages: 660,
      }),
    });
    const dataPostSuccess = await resPostSuccess.json();
    assert(resPostSuccess.status === 201, "POST /books returns HTTP 201 Created");
    assert(dataPostSuccess.message === "Book created successfully", "Contains success message");
    const createdBookId = dataPostSuccess.book.id;
    assert(typeof createdBookId === "number", `Returns created book ID: ${createdBookId}`);

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[5. PUT /books/:id - Update Operations]${colors.reset}`);
    const resPutSuccess = await fetch(`${BASE_URL}/books/${createdBookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Node.js Design Patterns (3rd Edition)",
        author: "Mario Casciaro & Luciano Mammino",
        price: 920,
        pages: 680,
      }),
    });
    const dataPutSuccess = await resPutSuccess.json();
    assert(resPutSuccess.status === 200, `PUT /books/${createdBookId} returns HTTP 200 OK`);
    assert(dataPutSuccess.message === "Book updated successfully", "Contains updated success message");
    assert(dataPutSuccess.book.price === 920, "Updated book reflects new price");

    // Update non-existing book
    const resPut404 = await fetch(`${BASE_URL}/books/99999`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Any", author: "Any", price: 100 }),
    });
    assert(resPut404.status === 404, "PUT /books/99999 returns HTTP 404 for non-existent book");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[6. DELETE /books/:id - Delete Operations]${colors.reset}`);
    const resDeleteSuccess = await fetch(`${BASE_URL}/books/${createdBookId}`, {
      method: "DELETE",
    });
    const dataDeleteSuccess = await resDeleteSuccess.json();
    assert(resDeleteSuccess.status === 200, `DELETE /books/${createdBookId} returns HTTP 200 OK`);
    assert(dataDeleteSuccess.message === "Book deleted successfully", "Contains deleted success message");

    // Verify it is actually deleted
    const resGetDeleted = await fetch(`${BASE_URL}/books/${createdBookId}`);
    assert(resGetDeleted.status === 404, "Verified deleted book now returns HTTP 404");

    // Delete non-existing book
    const resDelete404 = await fetch(`${BASE_URL}/books/99999`, {
      method: "DELETE",
    });
    assert(resDelete404.status === 404, "DELETE /books/99999 returns HTTP 404 for non-existent book");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[7. Query Parameters - Search by Title (search_q)]${colors.reset}`);
    const resSearchJava = await fetch(`${BASE_URL}/books?search_q=java`);
    const dataSearchJava = await resSearchJava.json();
    assert(resSearchJava.status === 200, "GET /books?search_q=java returns HTTP 200");
    assert(
      dataSearchJava.length > 0 &&
        dataSearchJava.every((b) => b.title.toLowerCase().includes("java")),
      `search_q=java returned ${dataSearchJava.length} books, all matching 'java'`
    );

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[8. Query Parameters - Sorting (order_by & order)]${colors.reset}`);
    // Price ASC
    const resOrderAsc = await fetch(`${BASE_URL}/books?order_by=price&order=ASC&limit=5`);
    const dataOrderAsc = await resOrderAsc.json();
    assert(resOrderAsc.status === 200, "GET /books?order_by=price&order=ASC returns HTTP 200");
    const isAscSorted = dataOrderAsc.every(
      (val, i, arr) => !i || arr[i - 1].price <= val.price
    );
    assert(isAscSorted, "Books sorted by price in ASC order correctly");

    // Price DESC
    const resOrderDesc = await fetch(`${BASE_URL}/books?order_by=price&order=DESC&limit=5`);
    const dataOrderDesc = await resOrderDesc.json();
    assert(resOrderDesc.status === 200, "GET /books?order_by=price&order=DESC returns HTTP 200");
    const isDescSorted = dataOrderDesc.every(
      (val, i, arr) => !i || arr[i - 1].price >= val.price
    );
    assert(isDescSorted, "Books sorted by price in DESC order correctly");

    // Title ASC
    const resTitleAsc = await fetch(`${BASE_URL}/books?order_by=title&order=ASC&limit=5`);
    const dataTitleAsc = await resTitleAsc.json();
    assert(resTitleAsc.status === 200, "GET /books?order_by=title&order=ASC returns HTTP 200");
    const isTitleSorted = dataTitleAsc.every(
      (val, i, arr) => !i || arr[i - 1].title.localeCompare(val.title) <= 0
    );
    assert(isTitleSorted, "Books sorted by title in ASC order correctly");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[9. Query Parameters - Pagination (limit & offset)]${colors.reset}`);
    const resLimit3 = await fetch(`${BASE_URL}/books?limit=3&offset=0`);
    const dataLimit3 = await resLimit3.json();
    assert(resLimit3.status === 200, "GET /books?limit=3&offset=0 returns HTTP 200");
    assert(dataLimit3.length === 3, `Returned exactly 3 records for limit=3`);

    const resOffset3 = await fetch(`${BASE_URL}/books?limit=3&offset=3`);
    const dataOffset3 = await resOffset3.json();
    assert(resOffset3.status === 200, "GET /books?limit=3&offset=3 returns HTTP 200");
    assert(dataOffset3.length === 3, `Returned exactly 3 records for offset=3`);
    assert(dataLimit3[0].id !== dataOffset3[0].id, "Offset skipped the first 3 records properly");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[10. Query Parameters - Price Range Filter (min_price & max_price)]${colors.reset}`);
    const resPriceRange = await fetch(`${BASE_URL}/books?min_price=300&max_price=800`);
    const dataPriceRange = await resPriceRange.json();
    assert(resPriceRange.status === 200, "GET /books?min_price=300&max_price=800 returns HTTP 200");
    const isWithinRange = dataPriceRange.every(
      (b) => b.price >= 300 && b.price <= 800
    );
    assert(isWithinRange, `All ${dataPriceRange.length} returned books have prices between 300 and 800`);

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[11. Query Parameters - Combined Full Query (Lab 3 Prompt Example)]${colors.reset}`);
    // Example from lab prompt: GET /books?search_q=java&order_by=price&order=ASC&limit=5&offset=0&min_price=100&max_price=1000
    const resCombined = await fetch(
      `${BASE_URL}/books?search_q=java&order_by=price&order=ASC&limit=5&offset=0&min_price=100&max_price=1000`
    );
    const dataCombined = await resCombined.json();
    assert(resCombined.status === 200, "Combined query parameters return HTTP 200");
    assert(Array.isArray(dataCombined), "Combined query returns an array");
    const matchesAll = dataCombined.every(
      (b) =>
        b.title.toLowerCase().includes("java") &&
        b.price >= 100 &&
        b.price <= 1000
    );
    assert(matchesAll, "All records satisfy search_q AND min_price AND max_price");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[12. Query Parameters - Invalid Parameters Validation]${colors.reset}`);
    // Invalid order_by
    const resBadOrderBy = await fetch(`${BASE_URL}/books?order_by=password`);
    assert(resBadOrderBy.status === 400, "Invalid order_by column returns HTTP 400");

    // Invalid order direction
    const resBadOrder = await fetch(`${BASE_URL}/books?order=SIDEWAYS`);
    assert(resBadOrder.status === 400, "Invalid order direction returns HTTP 400");

    // min_price > max_price
    const resMinGtMax = await fetch(`${BASE_URL}/books?min_price=1000&max_price=200`);
    assert(resMinGtMax.status === 400, "min_price > max_price returns HTTP 400");

    // Invalid limit
    const resBadLimit = await fetch(`${BASE_URL}/books?limit=-5`);
    assert(resBadLimit.status === 400, "Negative limit returns HTTP 400");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[13. Route Not Found Fallback]${colors.reset}`);
    const resUnknown = await fetch(`${BASE_URL}/non-existent-route`);
    assert(resUnknown.status === 404, "GET /non-existent-route returns HTTP 404");

    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
    console.log(`${colors.bold}TEST RESULTS SUMMARY:${colors.reset}`);
    console.log(`  Total Passed: ${colors.green}${passedCount}${colors.reset}`);
    console.log(`  Total Failed: ${colors.red}${failedCount}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  } catch (err) {
    console.error("Test execution error:", err);
    failedCount++;
  } finally {
    await closeServer();
    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runTests();
