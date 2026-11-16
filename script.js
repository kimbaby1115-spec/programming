const STORAGE_KEY = "booklog_items_v1";

const DEFAULT_BOOKS = [
  {
    id: 1,
    title: "모던 자바스크립트 Deep Dive",
    author: "이웅모",
    status: "reading",
    memo: "브라우저 렌더링 원리와 이벤트 루프 파트가 매우 유익하다.",
    createdAt: "2026-11-10"
  },
  {
    id: 2,
    title: "함께 자라기",
    author: "김창준",
    status: "completed",
    memo: "의도적인 수련과 피드백의 중요성을 다시 깨달았다.",
    createdAt: "2026-11-02"
  },
  {
    id: 3,
    title: "객체지향의 사실과 오해",
    author: "조영호",
    status: "completed",
    memo: "역할, 책임, 협력의 관점으로 코드를 바라보게 해주는 책.",
    createdAt: "2026-10-25"
  }
];

const STATUS_LABELS = {
  all: "전체",
  reading: "읽는 중",
  completed: "완독",
  wishlist: "읽고 싶음"
};

let books = loadBooks();
let currentFilter = "all";
let selectedBookId = null;

// DOM 요소
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const primaryNav = document.getElementById("primary-nav");
const navLinks = document.querySelectorAll("#primary-nav a[data-route]");
const views = document.querySelectorAll(".view-section");
const filterButtons = document.querySelectorAll(".filter-btn");
const bookListEl = document.getElementById("book-list");
const resultStatusEl = document.getElementById("result-status");
const emptyStateEl = document.getElementById("empty-state");
const emptyTitleEl = document.getElementById("empty-title");
const emptyDescEl = document.getElementById("empty-desc");
const emptyActionBtn = document.getElementById("empty-action-btn");
const bookForm = document.getElementById("book-form");
const resetSampleBtn = document.getElementById("reset-sample-btn");

// 모달 요소
const detailModal = document.getElementById("detail-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalDeleteBtn = document.getElementById("modal-delete-btn");

function loadBooks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
  return [...DEFAULT_BOOKS];
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

/* ==========================================
   4. 모바일 메뉴 열기·닫기 제어
========================================== */
function setMobileMenuOpen(isOpen) {
  primaryNav.classList.toggle("is-open", isOpen);
  mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
  mobileMenuBtn.textContent = isOpen ? "메뉴 닫기" : "메뉴 열기";
}

mobileMenuBtn.addEventListener("click", () => {
  const isCurrentlyOpen = mobileMenuBtn.getAttribute("aria-expanded") === "true";
  setMobileMenuOpen(!isCurrentlyOpen);
});

/* ==========================================
   1 & 2. 라우팅 및 현재 위치 표시 (aria-current)
========================================== */
function getCurrentRoute() {
  const rawHash = window.location.hash.replace("#", "");
  const validRoutes = ["/home", "/add", "/list"];
  return validRoutes.includes(rawHash) ? rawHash : "/home";
}

function syncRouteUI() {
  const currentRoute = getCurrentRoute();

  // 화면 전환
  views.forEach((section) => {
    const isMatch = section.dataset.view === currentRoute;
    section.hidden = !isMatch;
  });

  // 현재 메뉴 시각적 구분 및 aria-current 적용/제거
  navLinks.forEach((link) => {
    const isCurrent = link.dataset.route === currentRoute;
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  // 라우트별 최신 데이터 렌더링
  if (currentRoute === "/home") {
    renderHomeStats();
  } else if (currentRoute === "/list") {
    renderBookList();
  }
}

// 메뉴 선택 시 모바일 메뉴 자동 닫힘
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setMobileMenuOpen(false);
  });
});

// 뒤로 가기, 앞으로 가기, 새로고침 대응
window.addEventListener("hashchange", syncRouteUI);
window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) {
    history.replaceState(null, "", "#/home");
  }
  syncRouteUI();
});

/* ==========================================
   홈 통계 렌더링
========================================== */
function renderHomeStats() {
  document.getElementById("stat-total").textContent = `${books.length}권`;
  document.getElementById("stat-reading").textContent = `${
    books.filter((b) => b.status === "reading").length
  }권`;
  document.getElementById("stat-completed").textContent = `${
    books.filter((b) => b.status === "completed").length
  }권`;
}

/* ==========================================
   3. 목록 필터 및 결과 안내
========================================== */
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;

    filterButtons.forEach((item) => {
      const isSelected = item === btn;
      item.setAttribute("aria-pressed", String(isSelected));
    });

    renderBookList();
  });
});

function renderBookList() {
  const filteredBooks =
    currentFilter === "all"
      ? books
      : books.filter((book) => book.status === currentFilter);

  const filterName = STATUS_LABELS[currentFilter];
  resultStatusEl.textContent = `[${filterName}] 조건에 맞는 도서 ${filteredBooks.length}권이 표시됩니다.`;

  bookListEl.innerHTML = "";

  // 결과가 0건일 때: 전체 목록이 없는 경우 vs 조건에 맞는 결과만 없는 경우 구분
  if (filteredBooks.length === 0) {
    emptyStateEl.hidden = false;

    if (books.length === 0) {
      emptyTitleEl.textContent = "아직 서재에 등록된 도서가 없습니다.";
      emptyDescEl.textContent = "첫 번째 독서 기록을 추가하여 나만의 서재를 채워보세요.";
      emptyActionBtn.hidden = false;
    } else {
      emptyTitleEl.textContent = `'${filterName}' 상태에 해당하는 도서가 없습니다.`;
      emptyDescEl.textContent = "다른 필터를 선택하거나 새로운 도서를 해당 상태로 등록해 보세요.";
      emptyActionBtn.hidden = true;
    }
    return;
  }

  emptyStateEl.hidden = true;

  filteredBooks.forEach((book) => {
    const li = document.createElement("li");
    li.className = "book-item";
    li.innerHTML = `
      <div class="book-info">
        <span class="badge ${book.status}">${STATUS_LABELS[book.status]}</span>
        <h3>${escapeHtml(book.title)}</h3>
        <p class="book-meta">저자: ${escapeHtml(book.author)} · 등록일: ${book.createdAt}</p>
      </div>
      <button type="button" class="btn secondary" data-detail-id="${book.id}">상세 보기</button>
    `;
    bookListEl.appendChild(li);
  });
}

/* ==========================================
   독서 기록 추가, 상세 보기, 삭제
========================================== */
bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("book-title").value.trim();
  const author = document.getElementById("book-author").value.trim();
  const status = document.getElementById("book-status").value;
  const memo = document.getElementById("book-memo").value.trim();

  if (!title || !author) return;

  const newBook = {
    id: Date.now(),
    title,
    author,
    status,
    memo: memo || "작성된 감상평이 없습니다.",
    createdAt: new Date().toISOString().slice(0, 10)
  };

  books.unshift(newBook);
  saveBooks();
  bookForm.reset();

  // 저장 후 내 서재 목록으로 이동
  window.location.hash = "#/list";
});

bookListEl.addEventListener("click", (e) => {
  const detailBtn = e.target.closest("[data-detail-id]");
  if (!detailBtn) return;

  const id = Number(detailBtn.dataset.detailId);
  const book = books.find((b) => b.id === id);
  if (!book) return;

  selectedBookId = id;
  const badge = document.getElementById("modal-badge");
  badge.className = `badge ${book.status}`;
  badge.textContent = STATUS_LABELS[book.status];

  document.getElementById("modal-title").textContent = book.title;
  document.getElementById("modal-author").textContent = `저자: ${book.author}`;
  document.getElementById("modal-date").textContent = `등록일: ${book.createdAt}`;
  document.getElementById("modal-memo").textContent = book.memo;

  detailModal.showModal();
});

closeModalBtn.addEventListener("click", () => {
  detailModal.close();
});

modalDeleteBtn.addEventListener("click", () => {
  if (selectedBookId === null) return;
  books = books.filter((b) => b.id !== selectedBookId);
  saveBooks();
  selectedBookId = null;
  detailModal.close();
  renderBookList();
});

resetSampleBtn.addEventListener("click", () => {
  books = [...DEFAULT_BOOKS];
  saveBooks();
  renderBookList();
});

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
