document.addEventListener('DOMContentLoaded', () => {
  // 1. DOM 요소 취득
  const goalButtons = document.querySelectorAll('.select-box');
  const plannerForm = document.getElementById('planner-form');
  const targetWeightInput = document.getElementById('target-weight');
  const targetDaysInput = document.getElementById('target-days');
  const errorFeedback = document.getElementById('error-feedback');
  const resultSection = document.getElementById('result-section');
  
  // 결과 데이터 노드
  const resDays = document.getElementById('res-days');
  const resWeight = document.getElementById('res-weight');
  const resCalories = document.getElementById('res-calories');
  const resDesc = document.getElementById('res-desc');
  const btnReset = document.getElementById('btn-reset');

  // 활성화된 상태 관리 변수 (기본값: diet)
  let currentGoal = 'diet';

  // 2. [7주차 기능 연동] 목적 선택 이벤트 리스너
  goalButtons.forEach(button => {
    button.addEventListener('click', () => {
      goalButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentGoal = button.getAttribute('data-goal');
      
      // 유저 피드백: 선택 상태가 바뀔 때 마다 기존 결과창이 열려있다면 은근히 갱신을 유도하기 위해 리셋 처리
      resultSection.classList.add('hidden');
    });
  });

  // 3. [중간고사 새 기능] 플랜 계산 및 조건 검사 이벤트
  plannerForm.addEventListener('submit', (e) => {
    e.preventDefault(); // 폼 전송 기본 동작 방지

    // 입력값 파싱
    const weightValue = parseFloat(targetWeightInput.value);
    const daysValue = parseInt(targetDaysInput.value, 10);

    // 🛑 예외 조건 검사 1: 공백 및 양수 유효성 검사
    if (isNaN(weightValue) || isNaN(daysValue) || weightValue <= 0 || daysValue <= 0) {
      showError('❌ 모든 필드에 0보다 큰 올바른 값을 숫자로 입력해주세요.');
      return;
    }

    // 🛑 예외 조건 검사 2: 비현실적인 단기 다이어트/증량 방지 (의학적 UX 가이드라인 적용)
    // 예: 하루에 2kg 이상 감량하게 되는 극단적 수치 제어
    if ((weightValue / daysValue) > 0.5) {
      showError(`⚠️ 설정하신 기간(${daysValue}일) 대비 목표 체중(${weightValue}kg)이 너무 무리합니다! 기한을 더 늘리거나 목표 체중을 조절해 주세요.`);
      return;
    }

    // 🛑 예외 조건 검사 3: 너무 장기 플랜 제한 (90일 제한)
    if (daysValue > 90) {
      showError('⚠️ 프로토타입 버전에서는 최대 90일 이하의 플랜만 생성 가능합니다.');
      return;
    }

    // 4. [성공 케이스 처리] 칼로리 연산 법칙 적용 (지방 1kg = 약 7,700kcal 기준)
    errorFeedback.classList.add('hidden'); // 에러 숨김
    
    const totalNeededCalories = weightValue * 7700;
    const dailyCalorieAdjustment = Math.round(totalNeededCalories / daysValue);

    // 목적(7주차 데이터)에 맞춘 커스텀 결과 반영
    let calorieResultText = '';
    let descriptionText = '';

    if (currentGoal === 'diet') {
      calorieResultText = `-${dailyCalorieAdjustment}`;
      descriptionText = `현재 기초대사량에서 매일 이만큼의 칼로리를 **덜 섭취하거나 운동으로 소모**하셔야 성공합니다.`;
    } else if (currentGoal === 'muscle') {
      calorieResultText = `+${dailyCalorieAdjustment}`;
      descriptionText = `안전한 근육량 증량을 위해 매일 단백질 위주로 이만큼의 칼로리를 **더 섭취**해 주세요.`;
    } else {
      // 건강 유지 목적일 때
      calorieResultText = `±${Math.round(dailyCalorieAdjustment * 0.3)}`;
      descriptionText = `건강 유지를 위해 식단 균형을 유지하며 활동량을 소폭 조정하는 플랜입니다.`;
    }

    // UI 상태 동적 갱신
    resDays.textContent = daysValue;
    resWeight.textContent = weightValue;
    resCalories.textContent = calorieResultText;
    resDesc.innerHTML = descriptionText;

    // 결과 섹션 표시 및 스크롤 이동
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
  });

  // 5. [초기화 경로 처리] 다시 설정 기능
  btnReset.addEventListener('click', () => {
    plannerForm.reset();
    errorFeedback.classList.add('hidden');
    resultSection.classList.add('hidden');
  });

  // 에러 공통 함수
  function showError(message) {
    errorFeedback.textContent = message;
    errorFeedback.classList.remove('hidden');
    resultSection.classList.add('hidden');
  }
});
