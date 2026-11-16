document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "booklog_records_v1";

  // 초기 예시 데이터
  const SAMPLE_BOOKS = [
    {
      id: "book-1",
      title: "원씽 (The One Thing)",
      author: "게리 켈러",
      status: "completed",
      rating: "5",
      memo: "남다른 성과를 내기 위해서는 모든 일을 다 잘하려 하지 말고, 가장 중요한 단 하나의 일에 파고들어야 한다.",
      createdAt: "2026-11-10"
    },
    {
      id: "book-2",
      title: "물고기는 존재하지 않는다",
      author: "룰루 밀러",
      status: "reading",
      rating: "5",
      memo: "혼돈 속에서 질서를 찾으려 했던 한 과학자의 집념과, 우리가 당연하게 믿던 분류 체계에 대한 질문을 던지는 책.",
      createdAt: "2026-11-14"
    },
    {
      id: "book-3",
      title: "사피엔스",
      author: "유발 하라리",
      status: "wishlist",
      rating: "4",
      memo: "인류가 어떻게 허구를 믿는 능력을 통해 지구의 지배자가 되었는지 역사와 생물학의 관점에서 읽어보고 싶다.",
      createdAt: "2026-11-16"
    }
  ];

  // 상태 관리
  let books = loadBooks();
  let currentFilter = "all";
  let selectedBookId = null;

  // DOM 요소 참조
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const primaryNav = document.getElementById("primary-nav");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".page-section");

  const bookForm = document.getElementById("book-form");
  const resetSampleBtn = document.getElementById("reset-sample-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");

  const filterBtns = document.querySelectorAll(".filter-btn");
  const resultCountEl = document.getElementById("result-count");
  const emptyMessageEl = document.getElementById("empty-message");
  const bookListEl = document.getElementById("book-list");

  const statTotalEl = document.getElementById("stat-total");
  const statCompletedEl = document.getElementById("stat-completed");
  const statReadingEl = document.getElementById("stat-reading");
  const statWishlistEl = document.getElementById("stat-wishlist");

  const detailModal = document.getElementById("detail-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");
  const modalDeleteBtn = document.getElementById("modal-delete-btn");

  // 1. 로컬 스토리지 로드 및 저장
  function loadBooks() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [...SAMPLE_BOOKS];
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_BOOKS));
    return [...SAMPLE_BOOKS];
  }

  function saveBooks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }

  // 2. 현재 위치(aria-current) 업데이트 함수
  function setActiveMenu(targetId) {
    const validIds = ["record-section", "list-section", "stats-section"];
    const activeId = validIds.includes(targetId) ? targetId : "record-section";

    navLinks.forEach((link) => {
      if (link.dataset.target === activeId) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  // URL 해시 기반 위치 동기화 (새로고침, 뒤로 가기 대응)
  function syncLocationFromHash() {
    const hashId = window.location.hash.replace("#", "");
    if (hashId) {
      setActiveMenu(hashId);
      const targetSection = document.getElementById(hashId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      setActiveMenu("record-section");
    }
  }

  // 3. 모바일 메뉴 열기/닫기 제어
  function setMobileMenuState(isOpen) {
    primaryNav.classList.toggle("is-open", isOpen);
    mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    mobileMenuBtn.textContent = isOpen ? "메뉴 닫기" : "메뉴 열기";
  }

  mobileMenuBtn.addEventListener("click", () => {
    const isCurrentlyOpen = mobileMenuBtn.getAttribute("aria-expanded") === "true";
    setMobileMenuState(!isCurrentlyOpen);
  });

  // 화면 크기가 넓어지면 모바일 메뉴 상태 초기화
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      setMobileMenuState(false);
    }
  });

  // 내비게이션 메뉴 클릭 처리
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        // 브라우저 히스토리에 기록하여 뒤로 가기 지원
        history.pushState(null, "", `#${targetId}`);
        setActiveMenu(targetId);
        targetSection.scrollIntoView({ behavior: "smooth" });
      }

      // 모바일 화면에서 목적지 선택 시 메뉴 자동 닫기
      if (window.innerWidth <= 768) {
        setMobileMenuState(false);
      }
    });
  });

  // 브라우저 뒤로 가기 / 앞으로 가기 / 해시 변경 감지
  window.addEventListener("popstate", syncLocationFromHash);
  window.addEventListener("hashchange", syncLocationFromHash);

  // 스크롤 시 화면에 보이는 섹션에 맞춰 현재 위치 자동 갱신
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveMenu(entry.target.id);
        }
      });
    },
    {
      rootMargin: "-25% 0px -60% 0px",
      threshold: 0
    }
  );
  sections.forEach((sec) => observer.observe(sec));

  // 4. 필터 선택 처리 (aria-pressed 및 목록 갱신)
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;

      filterBtns.forEach((b) => {
        const isSelected = b === btn;
        b.classList.toggle("active", isSelected);
        b.setAttribute("aria-pressed", String(isSelected));
      });

      renderBooks();
    });
  });

  // 상태 라벨 변환 도우미
  function getStatusLabel(status) {
    const map = {
      reading: "읽는 중",
      completed: "완독",
      wishlist: "읽고 싶은 책"
    };
    return map[status] || "기타";
  }

  // 5. 목록 및 통계 렌더링 (결과 수 안내 & 빈 상태 분기 안내)
  function renderBooks() {
    const filteredBooks =
      currentFilter === "all"
        ? books
        : books.filter((book) => book.status === currentFilter);

    // 현재 표시되는 항목 수 안내
    resultCountEl.textContent = `현재 ${filteredBooks.length}건의 독서 기록이 표시됩니다. (전체 ${books.length}건)`;

    // 통계 업데이트
    statTotalEl.textContent = `${books.length}권`;
    statCompletedEl.textContent = `${books.filter((b) => b.status === "completed").length}권`;
    statReadingEl.textContent = `${books.filter((b) => b.status === "reading").length}권`;
    statWishlistEl.textContent = `${books.filter((b) => b.status === "wishlist").length}권`;

    bookListEl.innerHTML = "";

    // 빈 목록 분기 처리
    if (books.length === 0) {
      emptyMessageEl.hidden = false;
      emptyMessageEl.innerHTML = `
        <strong>아직 등록된 독서 기록이 없습니다.</strong>
        <p>상단의 '독서 기록 작성' 메뉴에서 첫 번째 책 기록을 남겨보세요.</p>
      `;
      return;
    }

    if (filteredBooks.length === 0) {
      emptyMessageEl.hidden = false;
      emptyMessageEl.innerHTML = `
        <strong>선택한 '${getStatusLabel(currentFilter)}' 조건에 맞는 기록이 없습니다.</strong>
        <p>다른 상태 필터를 선택하거나 새로운 독서 기록을 추가해 보세요.</p>
      `;
      return;
    }

    emptyMessageEl.hidden = true;

    filteredBooks.forEach((book) => {
      const li = document.createElement("li");
      li.className = "book-card";

      const stars = "⭐".repeat(Number(book.rating));

      li.innerHTML = `
        <div>
          <div class="card-top">
            <span class="badge badge-${book.status}">${getStatusLabel(book.status)}</span>
            <span class="card-rating" aria-label="평점 ${book.rating}점">${stars}</span>
          </div>
          <h3 class="card-title">${escapeHtml(book.title)}</h3>
          <p class="card-author">${escapeHtml(book.author)} · ${book.createdAt}</p>
          <p class="card-memo">${escapeHtml(book.memo)}</p>
        </div>
        <div class="card-actions">
          <button type="button" class="btn-detail" data-id="${book.id}">상세 보기</button>
        </div>
      `;

      bookListEl.appendChild(li);
    });
  }

  // XSS 방지용 HTML 이스케이프
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 6. 새 독서 기록 입력 및 저장
  bookForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("book-title").value.trim();
    const author = document.getElementById("book-author").value.trim();
    const status = document.getElementById("book-status").value;
    const rating = document.getElementById("book-rating").value;
    const memo = document.getElementById("book-memo").value.trim();

    if (!title || !author || !memo) return;

    const today = new Date().toISOString().split("T")[0];
    const newBook = {
      id: `book-${Date.now()}`,
      title,
      author,
      status,
      rating,
      memo,
      createdAt: today
    };

    books.unshift(newBook);
    saveBooks();
    renderBooks();
    bookForm.reset();

    // 저장 후 목록 섹션으로 자연스럽게 이동
    history.pushState(null, "", "#list-section");
    setActiveMenu("list-section");
    document.getElementById("list-section").scrollIntoView({ behavior: "smooth" });
  });

  // 예시 데이터 복원 및 전체 비우기 (빈 목록 테스트용)
  resetSampleBtn.addEventListener("click", () => {
    books = [...SAMPLE_BOOKS];
    saveBooks();
    renderBooks();
  });

  clearAllBtn.addEventListener("click", () => {
    if (books.length === 0) return;
    books = [];
    saveBooks();
    renderBooks();
  });

  // 7. 상세 보기 모달 열기/닫기/삭제
  bookListEl.addEventListener("click", (e) => {
    const detailBtn = e.target.closest(".btn-detail");
    if (!detailBtn) return;

    const book = books.find((b) => b.id === detailBtn.dataset.id);
    if (!book) return;

    selectedBookId = book.id;

    const badgeEl = document.getElementById("modal-badge");
    badgeEl.className = `badge badge-${book.status}`;
    badgeEl.textContent = getStatusLabel(book.status);

    document.getElementById("modal-title").textContent = book.title;
    document.getElementById("modal-meta").textContent = `저자: ${book.author} | 평점: ${"⭐".repeat(Number(book.rating))} (${book.rating}점) | 기록일: ${book.createdAt}`;
