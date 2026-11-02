// DOM 요소 선택
const challengeForm = document.getElementById('challenge-form');
const totalPagesInput = document.getElementById('total-pages');
const targetDaysInput = document.getElementById('target-days');
const feedbackMessage = document.getElementById('feedback-message');
const challengeResult = document.getElementById('challenge-result');

const resDays = document.getElementById('res-days');
const resPages = document.getElementById('res-pages');
const btnReset = document.getElementById('btn-reset');

// 챌린지 생성 이벤트 연결
challengeForm.addEventListener('submit', function(e) {
  e.preventDefault(); // 폼 새로고침 방지
  
  const totalPages = parseInt(totalPagesInput.value, 10);
  const targetDays = parseInt(targetDaysInput.value, 10);

  // 조건 검사 (Validation)
  if (isNaN(totalPages) || isNaN(targetDays) || totalPages <= 0 || targetDays <= 0) {
    showFeedback('❌ 올바른 숫자를 입력해주세요. 빈칸이거나 0 이하의 수는 처리할 수 없습니다.', 'error');
    challengeResult.classList.add('hidden'); // 결과창 숨김
    return;
  }

  if (targetDays > totalPages) {
    showFeedback('⚠️ 목표 기간이 총 페이지 수보다 길 수 없습니다. 기간을 줄여주세요.', 'error');
    challengeResult.classList.add('hidden');
    return;
  }

  // 성공 반응 및 결과 계산
  const pagesPerDay = Math.ceil(totalPages / targetDays);
  
  // 상태 변경 및 화면 갱신
  feedbackMessage.classList.add('hidden'); // 에러 메시지 숨김
  resDays.textContent = targetDays;
  resPages.textContent = pagesPerDay;
  challengeResult.classList.remove('hidden'); // 성공 결과 화면 표시
});

// 피드백 메시지 공통 함수
function showFeedback(text, type) {
  feedbackMessage.textContent = text;
  feedbackMessage.className = `feedback ${type}`;
  feedbackMessage.classList.remove('hidden');
}

// 다시 설정 (상태 초기화 경로)
btnReset.addEventListener('click', function() {
  challengeForm.reset();
  feedbackMessage.classList.add('hidden');
  challengeResult.classList.add('hidden');
});
