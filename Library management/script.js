
const STORAGE_KEY = "bookshelf-library-books";

const sampleBooks = [
  {
    id: 1,
    title: "The Alchemist",
    author: "Paulo Coelho",
    isbn: "9780061122415",
    category: "Fiction",
    copies: 5
  },
  {
    id: 2,
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    category: "Technology",
    copies: 3
  },
  {
    id: 3,
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "9780553380163",
    category: "Science",
    copies: 4
  },
  {
    id: 4,
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    category: "Education",
    copies: 2
  }
];

const bookList = document.getElementById("book-list");
const searchInput = document.getElementById("search-input");
const bookForm = document.getElementById("book-form");
const formMessage = document.getElementById("form-message");
const emptyMessage = document.getElementById("empty-message");
const resultCount = document.getElementById("result-count");

const totalBooks = document.getElementById("total-books");
const availableBooks = document.getElementById("available-books");
const uniqueBooks = document.getElementById("unique-books");

let books = loadBooks();

function loadBooks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Could not load saved books:", error);
  }

  return sampleBooks.map(book => ({ ...book }));
}

function saveBooks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    return true;
  } catch (error) {
    console.error("Could not save books:", error);
    showMessage(
      "Could not save changes in browser storage.",
      true
    );
    return false;
  }
}

function renderBooks() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredBooks = books.filter(book => {
    return [
      book.title,
      book.author,
      book.isbn,
      book.category
    ].some(value =>
      String(value).toLowerCase().includes(query)
    );
  });

  bookList.replaceChildren();

  filteredBooks.forEach(book => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    const title = document.createElement("div");
    title.className = "book-title";
    title.textContent = book.title;

    const subtitle = document.createElement("span");
    subtitle.className = "book-subtitle";
    subtitle.textContent = "Book ID: " + book.id;

    title.appendChild(subtitle);
    titleCell.appendChild(title);

    const authorCell = createCell(book.author);
    const isbnCell = createCell(book.isbn);

    const categoryCell = document.createElement("td");
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "category-badge";
    categoryBadge.textContent = book.category;
    categoryCell.appendChild(categoryBadge);

    const copiesCell = createCell(book.copies);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
      "aria-label",
      "Delete " + book.title
    );

    deleteButton.addEventListener("click", () => {
      deleteBook(book.id);
    });

    actionCell.appendChild(deleteButton);

    [
      titleCell,
      authorCell,
      isbnCell,
      categoryCell,
      copiesCell,
      actionCell
    ].forEach(cell => row.appendChild(cell));

    bookList.appendChild(row);
  });

  emptyMessage.hidden = filteredBooks.length !== 0;

  resultCount.textContent =
    `Showing ${filteredBooks.length} of ${books.length} books`;

  updateStatistics();
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = String(value);
  return cell;
}

function updateStatistics() {
  // Total copies across all book titles.
  const totalCopies = books.reduce(
    (sum, book) => sum + Number(book.copies || 0),
    0
  );

  totalBooks.textContent = totalCopies;
  availableBooks.textContent = totalCopies;
  uniqueBooks.textContent = books.length;
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

function normalizeISBN(value) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function deleteBook(id) {
  const book = books.find(item => item.id === id);

  if (!book) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete "${book.title}"?`
  );

  if (!confirmed) return;

  const previousBooks = books;
  books = books.filter(item => item.id !== id);

  if (!saveBooks()) {
    books = previousBooks;
    return;
  }

  renderBooks();
  showMessage(`"${book.title}" was deleted successfully.`);
}

bookForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const isbn = normalizeISBN(
    document.getElementById("isbn").value.trim()
  );
  const category = document.getElementById("category").value;
  const copiesValue = document.getElementById("copies").value;
  const copies = Number(copiesValue);

  if (!title || !author || !isbn || !category) {
    showMessage("Please fill in all required fields.", true);
    return;
  }

  if (!/^[A-Z0-9]{5,20}$/.test(isbn)) {
    showMessage(
      "ISBN must contain 5–20 letters or numbers. Spaces and hyphens are allowed.",
      true
    );
    return;
  }

  if (
    !Number.isSafeInteger(copies) ||
    copies < 1 ||
    copies > 10000
  ) {
    showMessage(
      "Enter a whole number of copies between 1 and 10000.",
      true
    );
    return;
  }

  const duplicate = books.some(
    book => normalizeISBN(book.isbn) === isbn
  );

  if (duplicate) {
    showMessage(
      "A book with this ISBN already exists.",
      true
    );
    return;
  }

  const newBook = {
    id: Date.now(),
    title,
    author,
    isbn,
    category,
    copies
  };

  books.push(newBook);

  if (!saveBooks()) {
    books.pop();
    return;
  }

  bookForm.reset();
  document.getElementById("copies").value = "1";

  searchInput.value = "";
  renderBooks();
  showMessage(`"${title}" was added successfully.`);

  document.getElementById("inventory").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

searchInput.addEventListener("input", renderBooks);

document.getElementById("open-form").addEventListener("click", () => {
  document.getElementById("add-book").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  document.getElementById("title").focus();
});

bookForm.addEventListener("reset", () => {
  showMessage("");
});

renderBooks();
