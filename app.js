console.log('app loaded');

// Dev flag: set true to skip onboarding and jump straight to the app

// ══════════════════════════════════════════════════════════════
// 설정 · 전역 상태
// 개발 플래그와 앱 전역에서 공유하는 상태
// ══════════════════════════════════════════════════════════════

const SKIP_ONBOARDING = false;

// Dev flag: set true to disable session/onboarding persistence across
// reloads. Supabase normally keeps the auth session in localStorage, so a
// completed onboarding stays completed after a refresh; with this on,
// every page load signs out and starts fresh at onboarding-0 instead.
// Set back to false to restore normal persistence.
const DISABLE_PERSISTENCE = false;
let myAnswers = window.myAnswers || window.currentUser?.answers || {};
let dailyProfiles = [];
let browseQueue = [];
let pagedSet = new Set();
let passedSet = new Set();
let savedBooks = [];
// p.Qurated는 v2로 연기됐다. 코드는 전부 남겨두되 유저에게 닿는 진입점만 막는다.
// 재활성화: true로 바꾸면 내 프로필의 신청 카드와 발견 탭 소진 화면의 프로모
// 카드가 다시 렌더되고, 그 둘이 p.Qurated 페이지로 가는 유일한 경로다.
const P_QURATED_ENABLED = false; // v2로 연기, 재활성화 시 true로 변경
window.P_QURATED_ENABLED = P_QURATED_ENABLED;

window.isQurated = false;



// ── 유틸 — 나이 계산 · 연도 라벨 ──────────────────────
function getAge(birthInput) {
  if (!birthInput) return '';
  const today = new Date();
  // If only a year is provided (e.g. 1992), convert to a date
  let birth;
  if (typeof birthInput === 'number' || (typeof birthInput === 'string' && birthInput.length === 4)) {
    birth = new Date(birthInput, 0, 1);
  } else {
    birth = new Date(birthInput);
  }

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  // Korean age calculation is traditional but let's stick to the user's provided logic
  return age;
}

window.getYearLabel = function (year) {
  if (!year) return '';
  return (year % 100).toString().padStart(2, '0');
};

// ══════════════════════════════════════════════════════════════
// 데이터 정의
// 프로필북 문항 · 더미 프로필 / 모임 / 매칭 / 채팅
// ══════════════════════════════════════════════════════════════

const QUESTIONS = [
  // Chapter 1 · 나
  { id: 1, chapter: 1, text: "상대를 설레게 하는 나의 매력", type: "text" },
  {
    id: 2, chapter: 1, text: "나의 하루 그리고 나의 휴일", type: "compound",
    axis: "에너지 회복", isCoreAxis: true,
    subQuestions: [
      { id: "2-1", text: "에너지", type: "ab-choice", options: ["혼자 충전이 필요한 편", "사람들 속에서 힘을 얻는 편"], required: true },
      { id: "2-2", text: "내가 하루 또는 주말에 꼭 지키는 루틴은?", type: "text", required: false, placeholder: "편안하게 당신의 이야기를 들려주세요" }
    ]
  },
  { id: 3, chapter: 1, text: "나의 소울 푸드", type: "text" },
  { id: 4, chapter: 1, text: "나의 힐링 스팟", type: "text" },
  {
    id: 5, chapter: 1, text: "내가 세상을 대하는 관점", type: "compound",
    axis: "세계관", isCoreAxis: true,
    subQuestions: [
      { id: "5-1", text: "나는…", type: "ab-choice", options: ["목소리를 내는 사람", "개인 영역에 집중하는 사람"], required: true },
      { id: "5-2", text: "나는…", type: "ab-choice", options: ["옳고 그름이 명확한 사람", "맥락에 따라 다른 사람"], required: true }
    ]
  },
  { id: 6, chapter: 1, text: "내가 사랑하는 영화/드라마와 그 속의 한 장면", type: "text" },
  { id: 7, chapter: 1, text: "연인에게 들려주고 싶은 나의 플레이리스트", type: "text" },
  { id: 8, chapter: 1, text: "어린시절, 가장 행복했던 기억의 한 장면", type: "text" },
  {
    id: 9, chapter: 1, text: "내가 미래를 대하는 태도", type: "compound",
    axis: "목표 및 성취", isCoreAxis: true,
    subQuestions: [
      { id: "9-1", text: "나는…", type: "ab-choice", options: ["성장 지향적인 사람", "안정 지향적인 사람"], required: true },
      { id: "9-2", text: "나는…", type: "ab-choice", options: ["목표가 이끄는 사람", "흐름을 따르는 사람"], required: true },
      { id: "9-3", text: "5년 뒤, 내가 그리는 나의 모습", type: "text", required: false }
    ]
  },

  // Chapter 2 · 사랑
  { id: 10, chapter: 2, text: "나를 설레게 하는 상대의 매력", type: "text" },
  { id: 11, chapter: 2, text: "나만 아는 나의 플러팅 스킬", type: "text" },
  {
    id: 12, chapter: 2, text: "연애 성향 체크", type: "compound",
    subQuestions: [
      { id: "12-1", text: "하루 연락 빈도는?", type: "choice", options: ["짧은 통화 1번", "메시지 5번 이하, 잠들기 전 통화 1번", "이동할 때마다 메시지나 통화", "메시지만 자주", "영상통화로 일상 공유"] },
      { id: "12-2", text: "만남 빈도는?", type: "choice", options: ["주말 중 1회", "주말 이틀 함께", "주중 1~2회, 주말 1회", "주말 포함 4회 이상", "가능한 매일"] }
    ]
  },
  {
    id: 13, chapter: 2, text: "연애 가치관 체크", type: "compound",
    subQuestions: [
      { id: "13-1", text: "내가 원하는 애정 표현 방식은?", type: "multiple-choice", options: ["스킨십", "인정하는 말", "함께하는 시간", "선물", "봉사"], limit: 2, required: true }
    ]
  },
  { id: 14, chapter: 2, text: "내가 사랑하고 있다고 느끼는 순간 & 사랑받고 있다고 느끼는 순간", type: "text" },
  {
    id: 15, chapter: 2, text: "연애 안정기, 우리 관계의 필수 요소 3가지", type: "multiple-choice",
    options: ["설렘", "스킨십", "성의 있는 데이트", "편안함", "신뢰감", "속 깊은 대화", "미래에 대한 약속", "서로를 위한 배려"],
    limit: 3
  },
  {
    id: 16, chapter: 2, text: "다투었을 때 나의 해결 방식", type: "compound",
    axis: "갈등 해결", isCoreAxis: true,
    subQuestions: [
      { id: "16-1", text: "", type: "ab-choice", options: ["바로 풀어야 해", "시간이 필요해"], required: true },
      { id: "16-2", text: "", type: "ab-choice", options: ["말로 푸는 편", "행동으로 푸는 편"], required: true },
      { id: "16-3", text: "", type: "text", required: false, placeholder: "편안하게 당신의 이야기를 더 들려주세요" }
    ]
  },
  { id: 17, chapter: 2, text: "이 사람과 헤어질 수도 있겠다고 느끼는 순간", type: "text" },
  { id: 18, chapter: 2, text: "이 사람과 함께하는 미래를 떠올리게 되는 순간", type: "text" },

  // Chapter 3 · 관계
  { id: 19, chapter: 3, text: "파트너로서 나의 매력", type: "text" },
  { id: 20, chapter: 3, text: "내가 파트너에게 원하는 3가지", type: "text" },
  {
    id: 21, chapter: 3, text: "내가 추구하는 인간관계", type: "compound",
    axis: "세계관", isCoreAxis: true,
    subQuestions: [
      { id: "21-1", text: "", type: "ab-choice", options: ["깊게 소수의 사람과", "넓게 다양한 사람과"], required: true },
      { id: "21-2", text: "", type: "text", required: false, placeholder: "편안하게 당신의 이야기를 더 들려주세요" }
    ]
  },
  {
    id: 22, chapter: 3, text: "함께하는 삶", type: "compound",
    subQuestions: [
      { id: "22-1", text: "같이 살 집은?", type: "choice", options: ["빚 안고 자가", "빚 없이 전세"] },
      { id: "22-2", text: "경제 관리는?", type: "choice", options: ["각자 벌어서 각자 관리", "생활비만 각출", "모든 수입 공개, 함께 관리"] },
      { id: "22-3", text: "수면 형태는?", type: "choice", options: ["같은 방 한 침대", "같은 방 침대 따로", "각자 방에서 숙면"] },
      { id: "22-4", text: "반려동물은?", type: "choice", options: ["없다", "반려견", "반려묘", "둘 다", "기타"] },
      { id: "22-5", text: "아이를 원하나요? 원한다면 계획은? 어떤 부모가 되고 싶어요?", type: "text", placeholder: "편안하게 당신의 이야기를 들려주세요" }
    ]
  },
  { id: 23, chapter: 3, text: "살고 싶은 동네는?", type: "text" },
  {
    id: 24, chapter: 3, text: "파트너를 위해 소비하는 방식", type: "compound",
    axis: "경제관", isCoreAxis: true,
    subQuestions: [
      { id: "24-1", text: "선물", type: "ab-choice", options: ["의미있는 선물", "실속있는 선물"], required: true },
      { id: "24-2", text: "이벤트", type: "ab-choice", options: ["평소에 소소하게 챙기기", "기념일에 특별하게 챙기기"], required: true }
    ]
  },
  { id: 25, chapter: 3, text: "내가 원하는 집안일 분담", type: "text" },
  { id: 26, chapter: 3, text: "파트너와 꼭 함께하고 싶은 일상의 한 장면", type: "text" },
  { id: 27, chapter: 3, text: "내가 생각하는 함께하는 삶이란", type: "text" }
];

// ── 더미 데이터 — 프로필 · 아바타 ──────────────────────
const MOCK_PROFILES = [
  {
    id: 1, name: "Heej", birthYear: 2001, role: 'GT', score: "98% 매칭", tags: ["영화", "와인", "자연"],
    coords: { lat: 37.5563, lng: 126.9236 }, // 마포 홍대
    bio: "프로젝트 헤일메리 10번 봤어요 🎬",
    image: "https://images.unsplash.com/photo-1704731267944-c93c8d059cdc?w=400",
    photos: [
      "https://images.unsplash.com/photo-1704731267944-c93c8d059cdc?w=400",
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"
    ],
    photoPrivate: false,
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "단발 차분 165", ideal: "현명함. 같이 배우고 즐기는 관계", drink: "비음주", smoke: "비흡연", mbti: "INFJ", saju: "갑자일주" },
    chapterProgress: { c1: 80, c2: 40, c3: 20 },
    answers: {
      1: { text: "눈웃음이요. 모르는 척하다가 터지는 웃음" },
      2: { text: "출근 전 커피 한 잔은 필수예요. 휴일엔 늦잠 자고 브런치 🥐" },
      3: { text: "엄마표 된장찌개. 냄새만 맡아도 집 생각나요" },
      6: { text: "타오르는 여인의 초상. 눈이 마주치는 장면에서 멈췄어요 🎬", polaroid: "https://www.artinsight.co.kr/data/tmp/2405/20240528195507_qhlhtydd.jpg" },
      8: { text: "할머니 댁 마당에서 혼자 놀던 여름 오후" },
      9: { text: "지금보다 덜 바쁘고, 더 나다운 사람" },
      10: { text: "나를 오래 바라보는 사람" },
      12: { text: { "12-1": "이동할 때마다 메시지나 통화", "12-2": "주중 1~2회, 주말 1회" } },
      15: { text: ["편안함", "신뢰감", "속 깊은 대화"] },
      16: { text: "서로 마음이 풀릴 때까지 이야기한다" },
      19: { text: "솔직한 것. 불편해도 말할 수 있는 사람" },
      26: { text: "아침에 각자 커피 내려서 같이 마시는 것" }
    }
  },
  {
    id: 2, name: "s", birthYear: 1992, role: 'T', score: "91% 매칭", tags: ["자연", "여행", "맛집"],
    coords: { lat: 37.5443, lng: 127.0557 }, // 성동 성수
    bio: "주말마다 산 타요. 강아지도 같이 가요 🐕",
    image: "https://images.unsplash.com/photo-1566139884643-d6c62cc13b49?w=400",
    photos: [
      "https://images.unsplash.com/photo-1566139884643-d6c62cc13b49?w=400",
      "https://images.unsplash.com/photo-1455793220612-0e9af5a1b7f3?w=600",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600"
    ],
    photoPrivate: false,
    intent: "친구가 생겼으면 해요 👋",
    aboutMe: { style: "캐주얼 운동복 172", ideal: "건강한 에너지. 같이 운동할 수 있는 분", drink: "가끔", smoke: "비흡연", mbti: "ENFP", saju: "임오일주" },
    chapterProgress: { c1: 60, c2: 30, c3: 10 },
    answers: {
      1: { text: "잘 듣는 것. 기억했다가 나중에 꺼내주는 것" },
      2: { text: "출근 전 15분 일찍 나와서 혼자 걷는 시간" },
      4: { text: "등산로 정상에서 내려다볼 때요. 그 맑은 공기가 최고예요 🏔️" },
      6: { text: "콜 미 바이 유어 네임. 복숭아 먹는 장면" },
      8: { text: "쉬는 날엔 강아지랑 한강 자전거 코스 달려요 🚴" },
      9: { text: "더 작고 조용한 삶. 식물 많은 집" },
      12: { text: "연락은 하루 한두 번이면 충분. 만남은 주 1회" },
      17: { text: "나를 바꾸려 할 때" },
      20: { text: "서로 배려하고 존중하는 태도요. 말 한마디에도 느껴져요." },
      22: { text: "같이 살더라도 각자 공간은 필요해요" },
      27: { text: "각자의 삶이 있고, 그 사이에 우리가 있는 것" }
    }
  },
  {
    id: 3, name: "달", birthYear: 1995, role: 'GT', score: "87% 매칭", tags: ["독서", "카페", "여행"],
    coords: { lat: 37.5735, lng: 126.9788 }, // 종로
    bio: "북클럽 운영 중이에요. 같이 읽어요 📚",
    image: "https://images.unsplash.com/photo-1708533296070-b3e49fbdb08e?w=400",
    photos: [
      "https://images.unsplash.com/photo-1708533296070-b3e49fbdb08e?w=400",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
      "https://images.unsplash.com/photo-1574158622682-e029e651d63a?w=600",
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600"
    ],
    photoPrivate: false,
    intent: "친구, 연애 둘 다 열려 있어요 ✨",
    aboutMe: { style: "셔츠 슬랙스 160", ideal: "대화가 잘 통하는 사람. 책 읽는 시간 존중", drink: "와인 한정", smoke: "비흡연", mbti: "INTJ", saju: "을해일주" },
    chapterProgress: { c1: 90, c2: 50, c3: 30 },
    answers: {
      1: { text: "저도 모르는 표정들이 있대요" },
      2: { text: "유독 긴 점심시간을 좋아해요" },
      3: { text: "비 오는 날 먹는 김치전이요 🌧️" },
      4: { text: "아무도 없는 미술관 구석 벤치" },
      7: { text: "Mitski, 새소년, 혁오 — 드라이브할 때 틀어줄게요", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600" },
      9: { text: "뭔가를 가르치는 사람이 되고 싶어요" },
      10: { text: "별거 아닌 것도 재밌어하는 사람" },
      13: { text: "표현은 자주, 만남은 천천히" },
      18: { text: "별것 아닌 일상을 같이 기억하고 싶을 때요" },
      19: { text: "같이 있어도 조용할 수 있는 것" },
      26: { text: "마트 같이 가는 것. 진짜로요" }
    }
  },
  {
    id: 4, name: "bora", birthYear: 1998, role: 'G', score: "83% 매칭", tags: ["아트", "영화", "독서"],
    coords: { lat: 37.4979, lng: 127.0276 }, // 강남
    bio: "갤러리 큐레이터예요. 전시 같이 가실 분 ☕",
    image: "https://images.unsplash.com/photo-1602421110952-01a3057d8987?w=400",
    photos: [
      "https://images.unsplash.com/photo-1602421110952-01a3057d8987?w=400",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600"
    ],
    photoPrivate: false,
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "안경 차분한 정장", ideal: "예술적 감수성. 영감을 주는 관계", drink: "맥주 500", smoke: "비흡연", mbti: "INFP", saju: "정묘일주" },
    chapterProgress: { c1: 75, c2: 45, c3: 15 },
    answers: {
      1: { text: "생각지도 못한 타이밍에 웃겨줄 때" },
      2: { text: "큐레이팅 준비로 시작해서 전시 동선 짜다 끝나요. 좋아하는 일을 합니다 🎨" },
      3: { text: "순두부찌개. 속 안 좋을 때도 좋을 때도" },
      5: { text: "상대방 기분을 먼저 알아채는 능력" },
      6: { text: "벌새. 혜원이 창밖을 보는 장면" },
      8: { text: "초등학교 때 친구랑 자전거 타던 골목" },
      9: { text: "지금 하는 일이 조금 더 단단해진 나" },
      10: { text: "목소리가 좋은 사람" },
      13: { text: "단 한 작품 앞에서 오래 머무는 사람이 좋아요" },
      14: { text: "피곤한데도 내 얘기 들어줄 때" },
      20: { text: "정직함, 유머, 나만의 취향" },
      26: { text: "잔잔한 재즈를 틀어놓고 커피를 마시는 아침." }
    }
  },
  {
    id: 5, name: "밍", birthYear: 2002, role: 'GT', score: "79% 매칭", tags: ["음악", "아트", "카페"],
    coords: { lat: 37.5791, lng: 126.9368 }, // 서대문
    bio: "재즈바 투어 중입니다 🎵",
    image: "https://images.unsplash.com/photo-1719306625386-3e610c3dd5ae?w=400",
    photos: [
      "https://images.unsplash.com/photo-1719306625386-3e610c3dd5ae?w=400",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600"
    ],
    photoPrivate: false,
    intent: "친구가 생겼으면 해요 👋",
    aboutMe: { style: "스트릿 힙한 스타일", ideal: "음악 취향 소울메이트. 자유로운 영혼", drink: "소주 1병", smoke: "흡연", mbti: "ENTP", saju: "경술일주" },
    chapterProgress: { c1: 50, c2: 20, c3: 5 },
    answers: {
      1: { text: "처음엔 낯가리는데 알고 보면 많이 웃겨요" },
      3: { text: "떡볶이. 어떤 기분일 때도 정답" },
      4: { text: "한강 서래섬 산책로" },
      5: { text: "이태원에 재즈바 세 곳 추천해줄 수 있어요. 언제든 연락해요 🎷" },
      7: { text: "새소년, Cigarettes After Sex, 혁오" },
      9: { text: "취향이 담긴 공간을 만드는 사람" },
      10: { text: "자기 일에 진심인 사람" },
      12: { text: "전화 연락보다는 가끔 주고받는 톡이 좋아요." },
      13: { text: "연락 자주 하는 편. 만남도 자주가 좋아요" },
      18: { text: "별것 아닌 일상을 같이 기억하게 될 때" },
      26: { text: "퇴근 후 편의점 들러서 야식 고르기" }
    }
  },
  {
    id: 6, name: "jj", birthYear: 1998, role: 'GT', score: "76% 매칭", tags: ["독서", "와인바", "아트갤러리"],
    coords: { lat: 37.5326, lng: 126.9905 }, // 용산
    bio: "책과 와인이 있는 금요일 🍷",
    image: "https://images.unsplash.com/photo-1713751429134-3d049a83b694?w=400",
    photos: [
      "https://images.unsplash.com/photo-1713751429134-3d049a83b694?w=400",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600"
    ],
    photoPrivate: false,
    intent: "친구, 연애 둘 다 열려 있어요 ✨",
    aboutMe: { style: "오버핏 미니멀", ideal: "취향이 있는 사람. 혼자만의 시간도 존중하는 분", drink: "와인", smoke: "비흡연", mbti: "ISFJ", saju: "기묘일주" },
    chapterProgress: { c1: 65, c2: 35, c3: 10 },
    answers: {
      1: { text: "책 취향 맞을 때 눈빛이 달라진대요" },
      2: { text: "카페에서 책 읽다 끝나는 날이 제일 좋아요. 휴일엔 와인바 한 곳 ☕🍷" },
      3: { text: "치즈 플레이트에 레드와인. 혼자도 완벽한 금요일 밤이에요" },
      4: { text: "와인 한 잔 마실 수 있는 조용한 바" },
      8: { text: "도서관에서 혼자 책 읽던 방학 오전" },
      9: { text: "글 쓰는 사람이 되고 싶어요. 작게라도" },
      10: { text: "취향이 확실한 사람" },
      13: { text: "연락은 적당히. 만남의 질이 더 중요" },
      19: { text: "분위기 맞춰주는 것. 말 안 해도 아는 것" },
      22: { text: "각자 책장 하나씩은 있어야 해요" },
      26: { text: "좋아하는 책 각자 들고 같은 카페 구석에 앉아 있는 오후" }
    }
  },
  {
    id: 7, name: "milk", birthYear: 1995, role: 'T', score: "74% 매칭", tags: ["카페", "사진", "빈티지"],
    coords: { lat: 37.5403, lng: 127.0695 }, // 광진 건대
    bio: "성수동 카페 투어 중 ☕",
    image: "https://images.unsplash.com/photo-1653196709875-427673568d12?w=400",
    photos: [
      "https://images.unsplash.com/photo-1653196709875-427673568d12?w=400",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"
    ],
    photoPrivate: false,
    intent: "친구가 생겼으면 해요 👋",
    aboutMe: { style: "빈티지 페미닌 163", ideal: "대화가 재미있는 사람. 카페 같이 갈 수 있는 분", drink: "아이스 아메리카노", smoke: "비흡연", mbti: "ESFJ", saju: "갑오일주" },
    chapterProgress: { c1: 55, c2: 25, c3: 8 },
    answers: {
      1: { text: "카페 고르는 안목이요. 진짜로요" },
      2: { text: "출근 전 아메리카노 한 잔이 시작이에요. 없으면 반쪽짜리 아침이에요 ☀️" },
      3: { text: "에그 베네딕트. 브런치는 종교예요" },
      4: { text: "성수 골목 어딘가. 처음 가는 카페 발견할 때 기분이 최고예요" },
      7: { text: "재지팩트, 검정치마, The xx" },
      8: { text: "엄마 자전거 뒷자리에서 본 저녁 노을" },
      9: { text: "내 이름 걸린 작은 스튜디오" },
      10: { text: "사소한 걸 예쁘게 보는 사람" },
      17: { text: "내 취향을 틀렸다고 할 때" },
      26: { text: "좋아하는 카페 같이 가서 각자 할 일 하기" }
    }
  },
  {
    id: 8, name: "서연", birthYear: 2000, role: 'G', score: "72% 매칭", tags: ["운동", "음악", "요리"],
    coords: { lat: 37.5124, lng: 126.9393 }, // 동작
    bio: "헬스 후 맥주 한 잔 🍺",
    image: "https://images.unsplash.com/photo-1632242219460-938944e38947?w=400",
    photos: [
      "https://images.unsplash.com/photo-1632242219460-938944e38947?w=400",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600"
    ],
    photoPrivate: false,
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "운동복 쇼츠 169", ideal: "에너지 맞는 사람. 같이 땀 흘릴 수 있는 분", drink: "맥주", smoke: "비흡연", mbti: "ESTP", saju: "경자일주" },
    chapterProgress: { c1: 70, c2: 30, c3: 12 },
    answers: {
      1: { text: "운동 같이 하면 알 수 있어요" },
      2: { text: "운동 안 하면 하루가 찝찝해요. 몸이 먼저 알아요 💪" },
      3: { text: "삼겹살. 운동 후에 먹는 게 진짜" },
      4: { text: "헬스장 끝나고 혼자 걷는 한강" },
      7: { text: "콜드플레이, 방탄, 잔나비" },
      8: { text: "동생이랑 새벽에 몰래 라면 끓여 먹던 기억" },
      9: { text: "체력 좋은 40대" },
      13: { text: "연락 자주. 만남도 자주. 에너지 넘치는 연애" },
      17: { text: "운동을 시간낭비라고 할 때" },
      19: { text: "같이 무언가 해낸 기분. 옆에 있어줄 수 있는 사람이에요" },
      20: { text: "체력, 유머, 솔직함" }
    }
  },
  {
    id: 9, name: "🐶", birthYear: 1997, role: 'T', score: "70% 매칭", tags: ["재즈", "칵테일", "영화"],
    coords: { lat: 37.6027, lng: 126.9291 }, // 은평
    bio: "재즈바에서 만나요 🎷",
    image: "https://images.unsplash.com/photo-1599314785151-49a35a619b1b?w=400",
    photos: [
      "https://images.unsplash.com/photo-1599314785151-49a35a619b1b?w=400",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600",
      "https://images.unsplash.com/photo-1474698235945-cd4b836b3e96?w=600"
    ],
    photoPrivate: false,
    intent: "친구가 생겼으면 해요 👋",
    aboutMe: { style: "자연스러운 캐주얼 164", ideal: "분위기 맞는 사람. 같이 조용히 앉아 있을 수 있는 분", drink: "칵테일", smoke: "가끔", mbti: "ISFP", saju: "무오일주" },
    chapterProgress: { c1: 45, c2: 20, c3: 5 },
    answers: {
      1: { text: "처음 만나도 오래된 친구 같은 느낌" },
      2: { text: "퇴근 후 이태원 한 바퀴 돌고 마음에 드는 바에 들어가요 🥂" },
      3: { text: "순대국밥. 해장도 야식도 이게 답" },
      6: { text: "비포 선라이즈. 밤새 걸으면서 이야기하는 장면이요" },
      8: { text: "아버지 LP판 앞에서 처음 재즈 들은 날" },
      9: { text: "좋아하는 바에 단골이 되는 삶" },
      10: { text: "음악 취향이 통하는 사람" },
      13: { text: "연락 많이는 부담. 만나면 오래 있는 스타일" },
      14: { text: "분위기 맞는 바에 앉아서 말 없이 같은 음악 듣고 있을 때요" },
      19: { text: "분위기 있는 것. 말보다 눈빛" },
      26: { text: "늦은 밤 바에서 칵테일 한 잔" }
    }
  },
  {
    id: 10, name: "ssol", birthYear: 1993, role: 'GT', score: "68% 매칭", tags: ["전시", "클래식", "뜨개질"],
    coords: { lat: 37.6542, lng: 127.0568 }, // 노원
    bio: "조용한 사람, 시끄러운 취향 🎻",
    image: "https://images.unsplash.com/photo-1570441102939-ca93df98ffdb?w=400",
    photos: [
      "https://images.unsplash.com/photo-1570441102939-ca93df98ffdb?w=400",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"
    ],
    photoPrivate: false,
    intent: "친구, 연애 둘 다 열려 있어요 ✨",
    aboutMe: { style: "차분한 중성적 스타일 167", ideal: "취향이 깊은 사람. 같이 침묵할 수 있는 분", drink: "와인 가끔", smoke: "비흡연", mbti: "INTJ", saju: "임진일주" },
    chapterProgress: { c1: 85, c2: 55, c3: 25 },
    answers: {
      1: { text: "오래 볼수록 생기는 매력이래요" },
      2: { text: "점심시간에 근처 미술관 들르는 게 루틴이에요 🖼️" },
      3: { text: "리조또. 혼자 만들어 먹어요" },
      6: { text: "아무르. 조용한 아파트와 두 사람" },
      7: { text: "Erik Satie, Nils Frahm, 조용한 피아노 위주예요. 드라이브보다 산책할 때" },
      9: { text: "작은 공방 하나 갖는 게 꿈이에요. 취향대로 채워진 공간" },
      10: { text: "취향이 깊은 사람" },
      13: { text: "연락 많이 안 해도 괜찮아요. 만남의 밀도가 중요" },
      17: { text: "대화가 안 될 때" },
      22: { text: "각자 방 있는 집. 같이 살아도 혼자만의 공간 필수" }
    }
  },
  {
    id: 11, name: "하늘", birthYear: 1999, role: 'G', score: "66% 매칭", tags: ["고양이", "게임", "만화"],
    coords: { lat: 37.5509, lng: 126.8495 }, // 강서
    bio: "고양이 두 마리와 삽니다 🐱🐱",
    image: "https://images.unsplash.com/photo-1679628751127-7706cced9819?w=400",
    photos: [
      "https://images.unsplash.com/photo-1679628751127-7706cced9819?w=400",
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600",
      "https://images.unsplash.com/photo-1574158622682-e029e651d63a?w=600"
    ],
    photoPrivate: false,
    intent: "친구가 생겼으면 해요 👋",
    aboutMe: { style: "후디 편한 옷 170", ideal: "집순이도 이해하는 사람. 고양이 좋아하면 플러스", drink: "맥주 조금", smoke: "비흡연", mbti: "INFP", saju: "신사일주" },
    chapterProgress: { c1: 40, c2: 15, c3: 5 },
    answers: {
      2: { text: "고양이 밥 챙기는 것부터 시작해요. 그게 하루 첫 번째 임무 🐾" },
      8: { text: "어릴 때 만화책 빌려다 이불 속에서 읽던 날이요. 지금도 그렇게 살고 싶어요" },
      22: { text: "반려동물 필수예요. 고양이 두 마리 이미 있어요. 나머지는 협의 가능해요" },
      1: { text: "의외로 집중력이 좋아서 게임할 때 몰입해요" },
      3: { text: "치킨. 게임하면서 먹으면 최고죠" }
    }
  },
  {
    id: 12, name: "ryo", birthYear: 1996, role: 'T', score: "64% 매칭", tags: ["맛집", "드라마", "쇼핑"],
    coords: { lat: 37.5145, lng: 127.1059 }, // 송파
    bio: "건대 앞 단골 가게 세 개 🍜",
    image: "https://images.unsplash.com/photo-1737041315827-5d9ceda7f27e?w=400",
    photos: [
      "https://images.unsplash.com/photo-1737041315827-5d9ceda7f27e?w=400",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"
    ],
    photoPrivate: false,
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "걸리쉬 캐주얼 161", ideal: "같이 맛집 다닐 수 있는 분. 드라마 추천 교환하는 관계", drink: "소주 살짝", smoke: "비흡연", mbti: "ESFP", saju: "계사일주" },
    chapterProgress: { c1: 50, c2: 20, c3: 8 },
    answers: {
      2: { text: "점심 뭐 먹을지가 하루 중 제일 중요한 결정이에요 🍱" },
      3: { text: "건대 앞 순대국. 혼자도 자주 가는 진짜 단골이에요" },
      12: { text: "매일 연락은 부담스럽고, 보고 싶을 때 먼저 연락할 수 있는 사이가 좋아요" },
      1: { text: "잘 웃고 리액션이 좋은 게 제 장점이에요" },
      4: { text: "가로수길 카페 테라스석. 사람 구경하는 재미가 있어요" }
    }
  },
  {
    id: 13, name: "🌙", birthYear: 2001, role: 'GT', score: "62% 매칭", tags: ["역사", "한복", "사진"],
    coords: { lat: 37.5638, lng: 126.9975 }, // 중구
    bio: "경복궁 근처에서 산책 중 🏯",
    image: "https://images.unsplash.com/photo-1704731268191-e744c6d96b26?w=400",
    photos: [
      "https://images.unsplash.com/photo-1704731268191-e744c6d96b26?w=400",
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"
    ],
    photoPrivate: false,
    intent: "친구가 생겼으면 해요 👋",
    aboutMe: { style: "한복 혼합 전통 미니멀 158", ideal: "같이 걷는 사람. 골목에서 뭔가를 발견하는 걸 좋아하는 분", drink: "전통주", smoke: "비흡연", mbti: "ISFJ", saju: "을미일주" },
    chapterProgress: { c1: 60, c2: 30, c3: 10 },
    answers: {
      2: { text: "인사동 골목 걷는 게 힐링이에요. 혼자도 좋고 같이면 더 좋아요 🚶" },
      4: { text: "경복궁 돌담길요. 걸을 때마다 다른 느낌이에요" },
      23: { text: "북촌 아니면 서촌. 오래된 골목이 있는 동네요" },
      1: { text: "조용조용한 분위기가 저랑 잘 맞나 봐요" },
      6: { text: "리틀 포레스트. 요리하는 소리가 기분 좋게 들려요" }
    }
  },
  {
    id: 14, name: "비", birthYear: 1994, role: 'T', score: "60% 매칭", tags: ["러닝", "요가", "건강식"],
    coords: { lat: 37.4784, lng: 126.9516 }, // 관악
    bio: "잠실 러너 클럽 멤버 🏃",
    image: "https://images.unsplash.com/photo-1691068013523-0f653e498f10?w=400",
    photos: [
      "https://images.unsplash.com/photo-1691068013523-0f653e498f10?w=400",
      "https://images.unsplash.com/photo-1455793220612-0e9af5a1b7f3?w=600",
      "https://images.unsplash.com/photo-1474698235945-cd4b836b3e96?w=600"
    ],
    photoPrivate: false,
    intent: "친구가 생겼으면 해요 👋",
    aboutMe: { style: "스포티 간결 168", ideal: "건강하게 사는 걸 쑥스러워하지 않는 사람", drink: "비음주", smoke: "비흡연", mbti: "ENFJ", saju: "갑신일주" },
    chapterProgress: { c1: 75, c2: 40, c3: 15 },
    answers: {
      2: { text: "아침 6시 러닝으로 하루 시작해요. 달리면 머리가 맑아져요 🌅" },
      4: { text: "한강이요. 어느 코스든 달리다 보면 생각이 정리돼요 🌊" },
      20: { text: "건강한 생활 방식, 솔직함, 그리고 나를 응원해주는 마음" },
      1: { text: "운동복이 잘 어울린다는 소리를 종종 들어요" },
      3: { text: "요거트 볼. 가볍지만 든든하게 먹는 걸 좋아해요" }
    }
  },
  {
    id: 15, name: "peach🍑", birthYear: 1998, role: 'G', score: "58% 매칭", tags: ["음악", "라이브 공연", "맥주"],
    coords: { lat: 37.5264, lng: 126.8962 }, // 영등포
    bio: "밴드 보컬, 기타도 조금 🎸",
    image: "https://images.unsplash.com/photo-1669026481679-268f2fd919bf?w=400",
    photos: [
      "https://images.unsplash.com/photo-1669026481679-268f2fd919bf?w=400",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600"
    ],
    photoPrivate: false,
    intent: "친구가 생겼으면 해요 👋",
    aboutMe: { style: "빈티지 락 166", ideal: "라이브 공연 같이 갈 수 있는 분. 음악이 언어인 사람", drink: "맥주 클래식", smoke: "가끔", mbti: "ENTP", saju: "병자일주" },
    chapterProgress: { c1: 45, c2: 18, c3: 5 },
    answers: {
      2: { text: "퇴근 후 합주실로 직행해요. 그게 진짜 퇴근 🎤" },
      7: { text: "장르 섞여 있어요 — 너바나부터 혁오까지. 공연 전날 꼭 트는 플레이리스트 있어요" },
      5: { text: "공연 중 음정 나가도 분위기로 커버할 수 있어요. 그게 초능력이죠" },
      1: { text: "무대 위에서 에너지가 좋다는 얘기를 들어요" },
      3: { text: "공연 끝나고 마시는 시원한 생맥주" }
    }
  },
  {
    id: 16, name: "zoe", birthYear: 1997, role: 'T', score: "94% 매칭", tags: ["와인", "카페", "여행"],
    coords: { lat: 37.5894, lng: 127.0167 }, // 성북
    bio: "홍대 앞 단골 와인바 있어요",
    image: "https://images.unsplash.com/photo-1565150860083-2257da1fbf23?w=400",
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "차분한 세련된 무드", ideal: "취향이 뚜렷한 사람", drink: "와인 애호가", smoke: "비흡연", mbti: "ENFJ", saju: "임진일주" },
    answers: {
      4: { text: "단골 와인바 구석자리요. 사장님이 제 취향을 알아서 추천해주시는 와인 마실 때요." },
      7: { text: "검정치마, 혁오, 그리고 이름 모를 프렌치 팝들. 와인이랑 잘 어울려요." },
      26: { text: "퇴근길에 들러서 딱 한 잔만 하고 집에 가는 노을 지는 저녁." }
    }
  },
  {
    id: 17, name: "하람", birthYear: 2000, role: 'GT', score: "92% 매칭", tags: ["독서", "영화", "자연"],
    coords: { lat: 37.4106, lng: 126.6784 }, // 인천 연수
    bio: "책 읽다 잠드는 게 루틴",
    image: "https://images.unsplash.com/photo-1572288236082-e363d5121568?w=400",
    intent: "친구, 연애 둘 다 열려 있어요 ✨",
    aboutMe: { style: "편안하고 내추럴한 스타일", ideal: "다정한 사람", drink: "비음주", smoke: "비흡연", mbti: "INFP", saju: "을해일주" },
    answers: {
      2: { text: "휴일엔 침대에서 책 보다가 깜빡 잠드는 게 제일 큰 사치예요." },
      6: { text: "'리틀 포레스트'요. 마음이 복잡할 때 보면 요리하는 소리에 차분해져요." },
      8: { text: "여름 방학 때 할머니 댁 마루에서 수박 먹으며 동화책 보던 오후." }
    }
  },
  {
    id: 18, name: "kira", birthYear: 1995, role: 'G', score: "89% 매칭", tags: ["여행", "맛집", "음악"],
    coords: { lat: 37.2636, lng: 127.0286 }, // 경기 수원
    bio: "이태원 골목을 제일 잘 알아요",
    image: "https://images.unsplash.com/photo-1698252980771-4bbf18c4439a?w=400",
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "도시적이고 힙한 스타일", ideal: "에너지 넘치는 사람", drink: "가끔", smoke: "비흡연", mbti: "ENTP", saju: "경오일주" },
    answers: {
      4: { text: "이태원 해방촌의 루프탑 바. 남산타워가 보이면 마음이 뻥 뚫려요." },
      5: { text: "한 번 가본 골목은 절대 안 잊어버리는 인간 네비게이터 능력!" },
      19: { text: "길 잃어도 당황하지 않고 새로운 곳을 발견하는 재미를 아는 것." }
    }
  },
  {
    id: 19, name: "🌿", birthYear: 1998, role: 'T', score: "86% 매칭", tags: ["반려동물", "식물", "집순이"],
    coords: { lat: 35.8693, lng: 128.6062 }, // 대구 중구
    bio: "고양이 한 마리, 식물 열 개",
    image: "https://images.unsplash.com/photo-1762954419103-43708f0cf893?w=400",
    intent: "친구, 연애 둘 다 열려 있어요 ✨",
    aboutMe: { style: "청초하고 맑은 느낌", ideal: "섬세하고 배려심 깊은 사람", drink: "차 한 잔", smoke: "비흡연", mbti: "ISFJ", saju: "갑인일주" },
    answers: {
      2: { text: "식물 물 주고 고양이 털 빗겨주다 보면 휴일이 다 가요. 평화로워요." },
      22: { text: { "22-1": "빚 없이 전세", "22-2": "각자 벌어서 각자 관리", "22-3": "같은 방 한 침대", "22-4": "반려묘", "22-5": "아이는 없어도 괜찮아요. 고양이랑 식물들이면 충분해요." } },
      4: { text: "창가에 화분들 모아둔 저만의 작은 정원." }
    }
  },
  {
    id: 20, name: "luna", birthYear: 1993, role: 'GT', score: "83% 매칭", tags: ["운동", "수영", "자연"],
    coords: { lat: 35.1631, lng: 129.1635 }, // 부산 해운대
    bio: "주말엔 무조건 수영",
    image: "https://images.unsplash.com/photo-1620216977705-df5ba73ca1a1?w=400",
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "건강하고 활동적인 스타일", ideal: "자신감 있는 사람", drink: "비음주", smoke: "비흡연", mbti: "ESTJ", saju: "무오일주" },
    answers: {
      2: { text: "토요일 아침 일찍 수영장 가서 1km 돌고 오면 한 주 스트레스가 다 풀려요." },
      5: { text: "물속에서만큼은 중력을 잊고 자유로울 수 있는 능력." },
      9: { text: "바다 근처에 살면서 매일 아침 수영으로 시작하는 삶." }
    }
  },
  {
    id: 21, name: "은유", birthYear: 1999, role: 'T', score: "81% 매칭", tags: ["카페", "디저트", "독서"],
    bio: "조용한 카페 맛집 수집 중",
    image: "https://images.unsplash.com/photo-1523177311887-ad300abe97cc?w=400",
    intent: "친구, 연애 둘 다 열려 있어요 ✨",
    aboutMe: { style: "단아하고 정돈된 스타일", ideal: "말이 잘 통하는 사람", drink: "커피 한 잔", smoke: "비흡연", mbti: "INFJ", saju: "을사일주" },
    answers: {
      3: { text: "갓 구운 따뜻한 스콘에 클로티드 크림과 잼." },
      4: { text: "아직 유명해지지 않은, 골목 깊숙이 숨어있는 조용한 카페." },
      14: { text: "말하지 않아도 제 컨디션을 알아채고 따뜻한 차 한 잔 내어줄 때." }
    }
  },
  {
    id: 22, name: "tori", birthYear: 1996, role: 'G', score: "78% 매칭", tags: ["전시", "카페", "사진"],
    bio: "을지로 구석구석 탐험가",
    image: "https://images.unsplash.com/photo-1739010577139-6f904e57fe41?w=400",
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "자유롭고 개성 있는 스타일", ideal: "감수성이 풍부한 사람", drink: "맥주 500", smoke: "비흡연", mbti: "ISFP", saju: "신미일주" },
    answers: {
      4: { text: "을지로의 낡은 건물 옥상. 시끄러운 도시 위에서 혼자 조용한 시간." },
      8: { text: "아빠 손 잡고 시장 골목 구경하며 떡볶이 먹던 주말." },
      26: { text: "우연히 발견한 좁은 골목 끝에서 노을을 마주하는 순간." }
    }
  },
  {
    id: 23, name: "솔아", birthYear: 2001, role: 'GT', score: "75% 매칭", tags: ["음악", "악기", "공연"],
    bio: "악기 셋, 음악 취향 하나",
    image: "https://images.unsplash.com/photo-1565050831300-833bcdc08d3b?w=400",
    intent: "친구, 연애 둘 다 열려 있어요 ✨",
    aboutMe: { style: "예술적이고 몽환적인 스타일", ideal: "음악을 사랑하는 사람", drink: "비음주", smoke: "비흡연", mbti: "INFP", saju: "정유일주" },
    answers: {
      6: { text: "'위플래쉬'요. 무언가에 미칠 듯이 몰입하는 에너지가 전해져서 좋아해요." },
      7: { text: "쇼팽부터 최신 인디 밴드까지. 악기 소리가 잘 들리는 음악들이요." },
      5: { text: "어떤 곡이든 한 번 들으면 피아노로 바로 연주할 수 있는 절대음감." }
    }
  },
  {
    id: 24, name: "nara", birthYear: 1994, role: 'T', score: "72% 매칭", tags: ["요리", "맛집", "영화"],
    bio: "요리 잘한다는 말 자주 들어요",
    image: "https://images.unsplash.com/photo-1543204607-75cad6df85c3?w=400",
    intent: "연애를 기대해요 ❤️",
    aboutMe: { style: "세련되고 지적인 무드", ideal: "정직하고 따뜻한 사람", drink: "와인 조금", smoke: "비흡연", mbti: "ESTJ", saju: "계묘일주" },
    answers: {
      3: { text: "제가 정성껏 끓인 해물 파스타. 화이트 와인이랑 같이요." },
      26: { text: "파트너가 제가 만든 요리를 맛있게 먹어주는 주말 저녁의 식탁." },
      2: { text: "휴일엔 시장 가서 제철 식재료 장 보는 걸로 시작해요. 요리하는 게 명상 같아요." }
    }
  }
];

const users = MOCK_PROFILES;

users.forEach(user => {
  if (!user.answers || Object.keys(user.answers).length < 5) {
    console.warn(`Insufficient answers for ${user.name} (User ID: ${user.id}). Found ${Object.keys(user.answers || {}).length} answers.`);
  }
});

const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1704731267944-c93c8d059cdc?w=200",
  "https://images.unsplash.com/photo-1566139884643-d6c62cc13b49?w=200",
  "https://images.unsplash.com/photo-1708533296070-b3e49fbdb08e?w=200",
  "https://images.unsplash.com/photo-1602421110952-01a3057d8987?w=200",
  "https://images.unsplash.com/photo-1719306625386-3e610c3dd5ae?w=200"
];

// ── 더미 데이터 — 모임 ────────────────────────────────────
const MOCK_MEETUPS = [
  {
    id: 101,
    type: "🏘️ 커뮤니티",
    secondaryType: "📚 스터디",
    title: "레즈비언 독서 모임 \"달빛책방\"",
    shortLocation: "마포구 (홍대)",
    fullAddress: "마포구 (홍대)",
    date: "매달 셋째 주 토요일",
    timestamp: "2026-05-16T15:00:00",
    desc: "매달 한 권의 책을 함께 읽어요. 퀴어 문학 중심.",
    maxCap: 8,
    currentCap: 7,
    fee: "없음",
    ageRange: "30대 초반 ~ 40대 초반",
    tags: ["#정기모임"],
    rules: "신규 멤버 1자리 오픈",
    isRecommended: false,
    hostName: "달",
    hostBio: "책과 사람을 좋아합니다.",
    hostPublic: false,
    hostType: "개인",
    hostImage: MOCK_PROFILES[16].image,
    organizers: [MOCK_PROFILES[16].image],
    isSaved: false,
    hasRSVPd: false,
    kakaoLink: 'https://open.kakao.com/o/test',
    participants: []
  },
  {
    id: 102,
    type: "🏘️ 커뮤니티",
    secondaryType: false,
    title: "우리들이 바라는 세상 \"우바세\"",
    shortLocation: "수도권",
    fullAddress: "수도권",
    location: "수도권",
    date: "상시",
    timestamp: "2026-05-16T15:00:00",
    desc: `🌈우바세🌈

우리가 바라는 세상 . 우바세에 오신것을 환영합니다.

우바세는 솔탈이 근본 목적이지만 친목활동으로 엘 타운 같은 방이 되고자 하는게 목표입니다

취미/여가/관심사 활동을 함께하기도 하고, 서로 가지고 있는 다양한 지식/인맥을 통해 정보교류나 도움도 줄 수 있고, 나아가서 메타 마을이긴 하나 우리만의 쉼터가 생겼으면 해서 만들었습니다.

평생 함께하고 싶은 지인과 만들었으니 그만큼 좋은 분들만 들어왔으면 좋겠습니다.

기본적인 조건은 수도권에 사는 / 97년생~82년생 / 단발이상 / 솔로입니다.

내향적인 분들도 용기내셔서 많은 관심 부탁드립니다

요건에 충족 되시는 분들은 두 팔 벌려 환영합니다🤗`,
    maxCap: 50,
    currentCap: 31,
    fee: "없음",
    ageRange: "30대 초반 ~ 40대 중반",
    tags: ["#단톡", "#친목&솔탈", "#솔로", "#일스only", "#82-97"],
    links: [
      { type: "메인", url: "https://open.kakao.com/o/gA9SXDVh" },
      { type: "인증", url: "https://open.kakao.com/o/gj4d0JIh" }
    ],
    externalUrl: "",
    isRecommended: false,
    hostName: "익명",
    hostImage: MOCK_PROFILES[3].image,
    hostPublic: false,
    hostType: "개인",
    isSaved: false,
    hasRSVPd: false,
    kakaoLink: 'https://open.kakao.com/o/test',
    participants: []
  },
  {
    id: 1, title: "선데이 필름나이트", date: "일요일 저녁 7시", timestamp: "2026-09-06T19:00:00",
    desc: "'타오르는 여인의 초상' 감상 후 와인 한 잔 🍷", type: "🎬 문화생활", maxCap: 6, currentCap: 6,
    hostName: "bora", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "영화와 와인을 사랑하는 큐레이터 보라입니다.",
    styleTrait: "무관", fee: "1만 5천원 (와인/간식)", tags: [],
    ageRange: "20대 후반 ~ 30대 후반",
    rules: "주류가 포함된 모임으로 과도한 음주는 자제해주세요.",
    isRecommended: true, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "마포구 (홍대)", fullAddress: "서울 마포구 와우산로 29길 26, 2층 씨네라운지",
    participants: [MOCK_PROFILES[0].image, MOCK_PROFILES[1].image, MOCK_PROFILES[2].image, MOCK_PROFILES[3].image, MOCK_PROFILES[4].image]
  },
  {
    id: 2, title: "남산 나이트 하이크", date: "금요일 저녁 8시", timestamp: "2026-09-11T20:00:00",
    desc: "초보 환영, 강아지 환영 🐾", type: "🏃 액티비티", maxCap: 10, currentCap: 7,
    hostName: "s", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "",
    styleTrait: "무관", fee: "무료", tags: [],
    ageRange: "30대 초반 ~ 40대 초반",
    rules: "편한 운동화 and 개인 생수를 지참해주세요.",
    isRecommended: false, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "용산구 (남산)", fullAddress: "서울 용산구 남산공원길 105, 북측 주차장 앞",
    participants: [MOCK_PROFILES[6].image, MOCK_PROFILES[7].image, MOCK_PROFILES[8].image, MOCK_PROFILES[9].image, MOCK_PROFILES[10].image, MOCK_PROFILES[11].image]
  },
  {
    id: 3, title: "퀴어 문학 읽기 모임", date: "9/14 월요일 오후 3시", timestamp: "2026-09-14T15:00:00",
    desc: "이번 달 책: 버지니아 울프 '올랜도' 📖", type: "📚 스터디", maxCap: 8, currentCap: 5,
    hostName: "무지개 북스", hostType: "단체", hostIsPublic: false, hostLogo: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100",
    hostBio: "다양한 목소리를 담는 독립 서점, 무지개 북스입니다.",
    styleTrait: "무관", fee: "5천원 (공간 대여료)", tags: ["정기모임"],
    ageRange: "20대 중반 ~ 30대 후반",
    rules: "읽어올 분량을 꼭 읽어와주세요. 서로의 의견을 존중합니다.",
    reviews: [
      { nickname: "민트", date: "2026.03.15", text: "정말 깊이 있는 대화를 나눌 수 있었어요. 다음에도 꼭 참여하고 싶습니다." },
      { nickname: "바다", date: "2026.03.01", text: "공간도 예쁘고 호스트분들도 친절하셔서 편하게 이야기했습니다." }
    ],
    isRecommended: true, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "성동구 (성수)", fullAddress: "서울 성동구 서울숲2길 32-14, 북라운지",
    participants: [MOCK_PROFILES[12].image, MOCK_PROFILES[13].image, MOCK_PROFILES[14].image, MOCK_PROFILES[15].image, MOCK_PROFILES[16].image]
  },
  {
    id: 8,
    type: "🎟️ 행사",
    title: "스펙트로신테시스 서울",
    shortLocation: "아트선재센터",
    fullAddress: "서울 종로구 율곡로3길 144 아트선재센터",
    date: "03/27 (금) ~ 06/22 (월)", startDate: '2026-03-27', endDate: '2026-06-22',
    image: "images/art-exhibition-spectro.jpg",
    fee: "무료",
    maxCap: 500,
    currentCap: 0,
    isRecommended: false,
    desc: `스펙트로신테시스(Spectrosynthesis)는 아시아 최대 규모의 LGBTQ+ 미술 전시로, 퀴어 예술과 기술의 교차점을 탐구합니다. 서울 아트선재센터에서 열리는 이번 전시는 아시아 전역의 퀴어 아티스트들의 작품을 한자리에서 만날 수 있는 특별한 기회입니다.

전시는 회화, 설치, 영상, 퍼포먼스 등 다양한 매체를 통해 정체성, 몸, 욕망, 커뮤니티에 대한 이야기를 담아냅니다.`,
    tags: ["#전시", "#퀴어아트", "#공식행사"],
    ageRange: "연령 무관",
    links: [
      { type: "메인", url: "https://artsonje.org/exhibition/spectrosynthesis" },
      { type: "소셜", platform: "인스타그램", handle: "artsonje_center", url: "https://www.instagram.com/artsonje_center/" }
    ],
    isAd: true,
    linkType: "internal",
    showTextInfo: true,
    showParticipants: false,
    disableRSVP: true,
    images: [
      "images/art-exhibition-spectro-di/art-exhibition-spectro-di-01.jpg",
      "images/art-exhibition-spectro-di/art-exhibition-spectro-di-02.jpg",
      "images/art-exhibition-spectro-di/art-exhibition-spectro-di-03.jpg",
      "images/art-exhibition-spectro-di/art-exhibition-spectro-di-04.jpg",
      "images/art-exhibition-spectro-di/art-exhibition-spectro-di-05.jpg"
    ],
    participants: [],
    rules: "매너 있는 관람 부탁드립니다.",
    isSaved: false,
    hasRSVPd: false
  },
  {
    id: 4, title: "성수동 카페 브런치", date: "일요일 오전 11시", timestamp: "2026-09-06T11:00:00",
    desc: "새로 생긴 카페 같이 가요 ☕", type: "🍽️ 식도락", maxCap: 6, currentCap: 4,
    hostName: "밍", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "카페 투어가 취미인 밍입니다. 맛있는 브런치 먹어요!",
    styleTrait: "무관", fee: "1/N", tags: ["#일스"],
    ageRange: "20대 후반 ~ 30대 초반",
    rules: "예약 후 방문하므로 노쇼는 절대 금지입니다.",
    isRecommended: true, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "성동구 (성수)", fullAddress: "서울 성동구 연무장길 11, 카페 모노",
    participants: [MOCK_PROFILES[18].image, MOCK_PROFILES[19].image, MOCK_PROFILES[20].image]
  },
  {
    id: 5, title: "이쪽 바에서 칵테일 한 잔 🍸", date: "9/19 토요일 저녁 9시", timestamp: "2026-09-19T21:00:00",
    desc: "프라이빗한 공간에서 편하게 한 잔 해요", type: "✨ 소셜", maxCap: 8, currentCap: 5,
    hostName: "mina", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "",
    styleTrait: '<span style="background: linear-gradient(transparent 60%, rgba(200,159,219,0.6) 60%); padding: 0 3px;">일스</span>', fee: "1/N", tags: ["#티부환영"],
    ageRange: "30대 초반 ~ 40대 초반",
    rules: "과도한 음주는 자제해주세요.",
    isRecommended: false, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "중구 (대구)", fullAddress: "대구광역시 중구 국채보상로 643, B1\n그레이 (GREY)",
    participants: [MOCK_PROFILES[0].image, MOCK_PROFILES[4].image, MOCK_PROFILES[8].image, MOCK_PROFILES[12].image]
  },
  {
    id: 6, title: "퀴어 법률 토크 — 우리가 알아야 할 권리", date: "다음주 토요일 오후 2시", timestamp: "2026-05-02T14:00:00",
    desc: "동성 파트너십, 법적 보호, 의료 결정권 등 실생활에서 꼭 알아야 할 법률 정보를 함께 나눠요. 질문 환영합니다.",
    type: "🎟️ 행사", maxCap: 20, currentCap: 12,
    host: {
      name: "퀴어법률네트워크",
      bio: "성소수자 법률 지원 및 권리 증진을 위한 단체입니다.",
      isPublic: true
    },
    hostName: "레즈비언인권위원회", hostType: "단체", hostIsPublic: false, hostLogo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=100",
    hostBio: "성소수자 권리 증진을 위해 활동하는 단체입니다",
    styleTrait: "무관", fee: "무료", tags: [],
    ageRange: "연령 무관",
    rules: "녹화 및 촬영은 금지입니다.",
    reviews: [
      { nickname: "", date: "2주 전", text: "몰랐던 내용을 많이 알게 됐어요. 다음에도 꼭 참석할게요." },
      { nickname: "", date: "1달 전", text: "실용적인 정보가 많았어요. 강추합니다!" }
    ],
    isRecommended: true, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "종로구 (혜화)", fullAddress: "서울 종로구 대학로 116, 혜화 세미나실",
    participants: [MOCK_PROFILES[4].image, MOCK_PROFILES[6].image, MOCK_PROFILES[8].image, MOCK_PROFILES[10].image, MOCK_PROFILES[12].image, MOCK_PROFILES[14].image, MOCK_PROFILES[0].image, MOCK_PROFILES[2].image, MOCK_PROFILES[5].image, MOCK_PROFILES[7].image, MOCK_PROFILES[9].image, MOCK_PROFILES[11].image]
  },
  {
    id: 999,
    type: "🎟️ 행사",
    title: "2026 서울 프라이드 엑스포",
    shortLocation: "동대문 DDP 디자인랩 2-3층",
    fullAddress: "서울 중구 을지로 281 동대문디자인플라자 디자인랩 2-3층",
    date: "5월 30일 토 — 5월 31일 일", startDate: '2026-05-30', endDate: '2026-05-31',
    image: "images/pride-expo-2026.jpg",
    externalUrl: "",
    fee: "무료",
    maxCap: 1000,
    currentCap: 0,
    isRecommended: false,
    isAd: true,
    linkType: "internal",
    links: [{ type: "공식 사이트", url: "https://seoulpride.kr/" }],
    showTextInfo: false,
    showParticipants: false,
    disableRSVP: true,
    tags: ["#공식행사", "#프라이드", "#전시"],
    ageRange: "연령 무관",
    participants: [],
    rules: "매너 있는 참여 부탁드립니다.",
    desc: "제12회 서울프라이드엑스포"
  },
  {
    id: 7, title: "FC빠세 🌈 주말 풋살", date: "토요일 오전 10시", timestamp: "2026-09-05T10:00:00",
    desc: "실력 무관, 처음이어도 환영해요! 함께 뛰고 땀 흘리고 밥 먹어요 ⚽ 운동화와 긍정 에너지만 챙겨오세요.",
    type: "🏃 액티비티", maxCap: 12, currentCap: 8,
    hostName: "FC빠세", hostType: "단체", hostIsPublic: false, hostLogo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100",
    hostBio: "레즈비언 & 퀴어 여성 풋살 클럽",
    styleTrait: "무관", fee: "1/N (구장 대관료)", tags: ["#스타일무관"],
    ageRange: "20대 후반 ~ 30대 중반",
    rules: "운동화 필참. cleats(축구화)는 착용 불가합니다.",
    isRecommended: false, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "마포구 (상암)", fullAddress: "서울 마포구 성산동 상암월드컵경기장 풋살구장",
    participants: [MOCK_PROFILES[1].image, MOCK_PROFILES[3].image, MOCK_PROFILES[5].image, MOCK_PROFILES[7].image, MOCK_PROFILES[9].image, MOCK_PROFILES[11].image, MOCK_PROFILES[13].image, MOCK_PROFILES[2].image]
  },
  {
    id: 9, title: "금요일 밤, 성수 와인 한 잔 🍷", date: "9/11 금요일 저녁 8시", timestamp: "2026-09-11T20:00:00",
    desc: "한 주 끝내고 가볍게 한 잔. 처음 오셔도 어색하지 않게 자리를 잡아둘게요.", type: "✨ 소셜", maxCap: 8, currentCap: 4,
    hostName: "ssol", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "",
    fee: "1/N", tags: ["#티부환영", "#첫참여환영"],
    ageRange: "30대 중반 ~ 30대 후반",
    rules: "노쇼는 다음 참여가 어려워요.",
    isRecommended: false, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test',
    shortLocation: "성동구 (성수)", fullAddress: "서울특별시 성동구 연무장길 일대",
    participants: [MOCK_PROFILES[9].image, MOCK_PROFILES[2].image, MOCK_PROFILES[16].image]
  },
  {
    id: 10, title: "보드게임하며 인사해요 🎲", date: "9/13 일요일 오후 2시", timestamp: "2026-09-13T14:00:00",
    desc: "말수 적어도 괜찮은 모임. 게임 하다 보면 자연스럽게 친해져요.", type: "✨ 소셜", maxCap: 10, currentCap: 6,
    hostName: "하람", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "",
    fee: "카페 이용료", tags: ["#조용한모임", "#첫참여환영"],
    ageRange: "20대 초반 ~ 30대 초반",
    rules: "게임 룰은 현장에서 알려드려요.",
    isRecommended: false, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test',
    shortLocation: "마포구 (합정)", fullAddress: "서울특별시 마포구 양화로 일대",
    participants: [MOCK_PROFILES[16].image, MOCK_PROFILES[5].image, MOCK_PROFILES[11].image, MOCK_PROFILES[19].image, MOCK_PROFILES[7].image]
  },
  {
    id: 11, title: "느긋한 일요일 티타임 🍵", date: "9/20 일요일 오후 3시", timestamp: "2026-09-20T15:00:00",
    desc: "술 없이 차 마시며 이야기하는 자리예요. 비음주도 편하게 오세요.", type: "✨ 소셜", maxCap: 6, currentCap: 2,
    hostName: "달", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "",
    fee: "1/N", tags: ["#비음주", "#조용한모임"],
    ageRange: "30대 중반 ~ 40대 중반",
    rules: "",
    isRecommended: false, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test',
    shortLocation: "종로구 (익선동)", fullAddress: "서울특별시 종로구 수표로28길 일대",
    participants: [MOCK_PROFILES[2].image, MOCK_PROFILES[13].image]
  }
];

// Single source of truth for matched users — both messages tab and grid page reference this

// ── 더미 데이터 — 매칭 · 채팅 ──────────────────────────
const MATCHED_USER_ANSWERS = {
  4: ["같이 있어도 조용할 수 있는 것", "재즈바에서 혼자 술 한 잔", "느린 아침을 좋아해요"],
  5: ["바람 부는 날 드라이브", "책 한 권과 카페 구석 자리", "말보다 눈빛으로 통하는 것"],
  6: ["일몰 직전의 하늘색", "함께여도 각자의 시간", "좋아하는 음악 공유하기"],
  7: ["오래된 필름 사진 같은 하루", "조용한 골목 산책", "취향이 맞는 사람"],
};
const MATCHED_USERS = [4, 5, 6, 7].map((id, i) => {
  const p = MOCK_PROFILES.find(pr => pr.id === id);
  const answers = MATCHED_USER_ANSWERS[id] || [];
  return { id, name: p.name, birthYear: p.birthYear, image: p.image, isNew: i === 0, answers };
});
const MATCHED_PROFILES = MATCHED_USERS.map(({ id, name, image, isNew, answers }) => ({ id, name, image, isNew, answers }));

const MOCK_CHATS = [
  {
    id: 1, name: "Heej", image: MOCK_PROFILES[0].image, source: "발견 매치", score: "98% 매칭", preview: "혹시 다음 필름나이트 가세요? 😊", time: "방금 전", isUnread: true,
    messages: [
      { text: "안녕하세요! 저도 반가워요. 프로필 보니까 영화 좋아하시는 것 같네요!", type: "received" },
      { text: "안녕하세요! 매치돼서 반가워요 😊", type: "sent" },
      { text: "네! 혹시 최근에 영화 모임 가신 적 있나요?", type: "sent" },
      { text: "혹시 다음 필름나이트 가세요? 😊", type: "received" }
    ]
  },
  {
    id: 2, name: "달", image: MOCK_PROFILES[2].image, source: "북클럽", score: "87% 매칭", preview: "북클럽 같이 가요! 📚", time: "1시간 전", isUnread: false,
    messages: [
      { text: "북클럽 같이 가요! 📚", type: "received" }
    ]
  },
  {
    id: 3, name: "bora", image: MOCK_PROFILES[3].image, source: "발견 매치", score: "83% 매칭", preview: "재즈바 추천해줄 수 있어요? 🎵", time: "어제", isUnread: false,
    messages: [
      { text: "재즈바 투어 하시는 거 너무 멋져요!", type: "sent" },
      { text: "감사해요 ㅎㅎ 혹시 음악 듣는 거 좋아하세요?", type: "received" },
      { text: "네 완전 좋아하죠!", type: "sent" },
      { text: "재즈바 추천해줄 수 있어요? 🎵", type: "received" }
    ]
  }
];

// ── 온보딩 입력 상태 — 닉네임 · 생년 · 성향 · 선호 조건 ────
const appContainer = document.getElementById('app-container');

// State Variables
let userName = '';
let userBirthDate = { year: 1990, month: 1, day: 1 };
const DECADE_POINTS = ['20대 초반', '20대 중반', '20대 후반', '30대 초반', '30대 중반', '30대 후반', '40대 초반', '40대 중반', '40대 후반', '50대 이상'];
let targetDecadeRange = { min: 2, max: 4 };

let userRole = null; // 'G' | 'T' | 'GT'

// 연애 상태 — 저장 필드 relationship_status
const RELATIONSHIP_STATUSES = [
  { key: 'single', label: '싱글' },
  { key: 'dating', label: '연애중' },
  { key: 'married', label: '기혼' },
];
let userRelationshipStatus = null; // 'single' | 'dating' | 'married'

// 연애 중·기혼인 사람의 프로필에 먼저 붙는 배지. 의도 배지 왼쪽에 선다.
const RELATIONSHIP_BADGE_LABELS = {
  dating: '연애 중 💑',
  married: '결혼했어요 💍',
};

// 닉네임은 3개월에 한 번만 바꿀 수 있다. 서로를 알아보는 이름이 자주 바뀌면
// 같은 사람인지 확인할 방법이 없다.
const NICKNAME_COOLDOWN_DAYS = 90;
let userNicknameChangedAt = null; // epoch ms

function isPartnered() {
  return userRelationshipStatus === 'dating' || userRelationshipStatus === 'married';
}
window.isPartnered = isPartnered;

// 연애 중·기혼이면 "연애할 사람을 찾고 있어요"가 성립하지 않는다. 남는 선택지가
// 하나뿐이라 질문 자체를 묻지 않고 community로 고정한다.
function applyRelationshipConstraints() {
  if (isPartnered() && userSeekingIntent !== 'community') {
    userSeekingIntent = 'community';
    return true;
  }
  return false;
}
window.applyRelationshipConstraints = applyRelationshipConstraints;

function getRelationshipBadgeLabel() {
  return RELATIONSHIP_BADGE_LABELS[userRelationshipStatus] || '';
}
window.getRelationshipBadgeLabel = getRelationshipBadgeLabel;

function nicknameUnlockAt() {
  if (!userNicknameChangedAt) return null;
  return userNicknameChangedAt + NICKNAME_COOLDOWN_DAYS * 86400000;
}

window.canChangeNickname = function () {
  const at = nicknameUnlockAt();
  return at === null || Date.now() >= at;
};

window.nicknameUnlockText = function () {
  const at = nicknameUnlockAt();
  if (at === null) return '';
  const d = new Date(at);
  return `닉네임은 ${d.getMonth() + 1}월 ${d.getDate()}일부터 다시 바꿀 수 있어요`;
};

// p.2에서 무엇을 찾고 있는지 — 저장 필드 seeking_intent.
// label은 온보딩에서 고를 때 누르는 버튼의 문구다.
const SEEKING_INTENTS = [
  { key: 'dating', label: '연애할 사람을 찾고 있어요' },
  { key: 'community', label: '친구나 커뮤니티를 찾고 있어요' },
  { key: 'both', label: '둘 다 열려있어요' },
];

// 프로필북 표지·프로필 화면의 의도 배지 문구. 온보딩 버튼과 일부러 다르다 —
// 고를 때는 내가 하는 행동을 서술하고, 남에게 보일 때는 기대를 말한다.
// MOCK_PROFILES의 intent 문자열도 이 표와 같은 문구를 쓴다.
const INTENT_BADGE_LABELS = {
  dating: '연애를 기대해요 ❤️',
  community: '친구/네트워크가 생겼으면 해요 👋',
  both: '친구, 연애 둘 다 열려 있어요 ✨',
};
let userSeekingIntent = null; // 'dating' | 'community' | 'both'
const DEFAULT_BIO = '새로운 시작을 기대하며!';
let userBio = '';             // 한마디 코멘트. 비어 있으면 DEFAULT_BIO를 쓴다.

// 관심사 선택지. 온보딩과 프로필 편집이 같은 목록을 본다.
const INTEREST_CATEGORIES = [
  { name: '문화/예술', tags: ['영화', '드라마', '음악', '아트', '전시', '공연', '사진', '독서'] },
  { name: '음식/음료', tags: ['맛집', '카페', '와인', '칵테일', '요리', '베이킹', '비건'] },
  { name: '액티비티', tags: ['자연', '여행', '운동', '등산', '러닝', '요가', '수영', '테니스', '풋살', '사이클'] },
  { name: '라이프', tags: ['반려동물', '식물', '인테리어', '패션', '뷰티', '게임'] },
  { name: '배움', tags: ['언어', '자기계발', '재테크', '글쓰기', '명상'] },
];
const MAX_TAGS = 5;

// ── 이스케이프 ─────────────────────────────────────────
// 닉네임·한마디는 유저가 쓴 값이고 innerHTML로 들어간다. 따옴표 하나가
// value 속성을 닫아버리면 입력 필드가 통째로 깨진다.
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}
const escapeAttr = escapeHTML;
window.escapeHTML = escapeHTML;

// ── 로컬 저장 키 목록 ──────────────────────────────────
// 키가 sp_* (초기)와 p2_* (이후) 두 계열로 나뉘어 있어서, 리셋할 때마다
// 한두 개가 빠졌다. 새 키를 만들면 반드시 여기에 함께 등록한다.
const P2_STORAGE_KEYS = {
  // 주간 배달 사이클
  weekStart: 'sp_week_start',
  viewedThisWeek: 'sp_viewed_this_week',   // ← 발견 탭 "이번 주 다시보기"
  // 사용자가 남긴 판단
  closedBooks: 'p2_closed_books',
  // 온보딩·프로필
  onboardingChoices: 'p2_onboarding_choices',
  myAnswers: 'p2_my_answers',
  userLocation: 'p2_user_location',
  profileBookDone: 'p2_profile_book_complete',
  // 1회성 안내
  introModalShown: 'p2_intro_modal_shown',
  reactionsIntroShown: 'p2_reactions_intro_shown',
  // 모임 참여 — 내 신청 상태 · 호스트가 받은 신청자 목록
  meetupJoins: 'p2_meetup_joins',
  meetupApplicants: 'p2_meetup_applicants',
  myMeetups: 'p2_my_meetups',
  // 차단 — 내가 건 쪽과 상대가 건 쪽을 따로 둔다 (아래 주석 참고)
  blockedUsers: 'p2_blocked_users',
  blockedByUsers: 'p2_blocked_by_users',
};
window.P2_STORAGE_KEYS = P2_STORAGE_KEYS;

// 개발·테스트용 전체 초기화. 콘솔에서 resetLocalState() 한 번이면
// 첫 진입과 같은 상태가 된다. sessionStorage의 초대 코드까지 함께 지운다.
window.resetLocalState = function ({ reload = true } = {}) {
  const cleared = Object.values(P2_STORAGE_KEYS);
  cleared.forEach(k => {
    try { window.localStorage.removeItem(k); } catch (e) { /* storage unavailable */ }
  });
  try { window.sessionStorage.removeItem('sp_pending_invite'); } catch (e) { /* ignore */ }
  if (reload) window.location.reload();
  return cleared;
};

// 온보딩 선택값 저장.
//
// 지금 Supabase로 실제로 나가는 온보딩 값은 users.nickname 하나뿐이고,
// userRole·userTags 같은 나머지는 전부 메모리에만 있어서 새로고침하면 사라진다.
// relationship_status / seeking_intent 도 같은 처지가 되지 않게 localStorage에
// 남긴다. DB 쓰기는 아래 syncOnboardingChoicesToDB()에 준비만 해두고 기본은 꺼둔다
// — users 테이블에 두 컬럼이 실재하는지 확인할 방법이 리포에 없고, 없는 컬럼에
// update를 걸면 온보딩 단계마다 실패 에러가 쌓인다.
const ONBOARDING_CHOICES_KEY = 'p2_onboarding_choices';
window.__P2_SYNC_ONBOARDING_TO_DB = window.__P2_SYNC_ONBOARDING_TO_DB === true;

// 27문항 답변. 값이 문자열/배열/객체(compound) 셋 다 나오므로 통째로
// JSON으로 넣고 뺀다 — 구조를 평탄화하면 compound가 깨진다.
function persistMyAnswers() {
  try { window.localStorage.setItem(P2_STORAGE_KEYS.myAnswers, JSON.stringify(myAnswers)); }
  catch (e) { /* private mode / quota */ }
}
window.persistMyAnswers = persistMyAnswers;

function restoreMyAnswers() {
  let saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(P2_STORAGE_KEYS.myAnswers) || 'null'); }
  catch (e) { saved = null; }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
  // 저장본이 진실이다. 목업 초기값 위에 덮어쓰지 않고 통째로 교체한다.
  Object.keys(myAnswers).forEach(k => delete myAnswers[k]);
  Object.entries(saved).forEach(([k, v]) => { myAnswers[k] = v; });
}
window.restoreMyAnswers = restoreMyAnswers;

function persistOnboardingChoices() {
  try {
    window.localStorage.setItem(ONBOARDING_CHOICES_KEY, JSON.stringify({
      role: userRole,
      relationship_status: userRelationshipStatus,
      seeking_intent: userSeekingIntent,
      name: userName,
      birth: userBirthDate,
      tags: userTags,
      bio: userBio,
      nickname_changed_at: userNicknameChangedAt,
      about: ABOUT_ME_FIELDS.reduce((acc, f) => {
        acc[f.key] = getAboutMeValue(f.key);
        return acc;
      }, {}),
    }));
  } catch (e) { /* private mode / quota — 화면 흐름을 막지 않는다 */ }
  syncOnboardingChoicesToDB();
}
window.persistOnboardingChoices = persistOnboardingChoices;

function restoreOnboardingChoices() {
  let saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(ONBOARDING_CHOICES_KEY) || 'null'); }
  catch (e) { saved = null; }
  if (!saved || typeof saved !== 'object') return;
  if (getRoleCode(saved.role)) userRole = getRoleCode(saved.role);
  if (RELATIONSHIP_STATUSES.some(o => o.key === saved.relationship_status)) {
    userRelationshipStatus = saved.relationship_status;
  }
  if (SEEKING_INTENTS.some(o => o.key === saved.seeking_intent)) {
    userSeekingIntent = saved.seeking_intent;
  }
  if (typeof saved.name === 'string' && saved.name.trim()) userName = saved.name;
  if (saved.birth && Number.isFinite(saved.birth.year)) {
    userBirthDate = {
      year: saved.birth.year,
      month: saved.birth.month || 1,
      day: saved.birth.day || 1,
    };
  }
  if (Array.isArray(saved.tags)) userTags = saved.tags.filter(t => typeof t === 'string').slice(0, MAX_TAGS);
  if (typeof saved.bio === 'string') userBio = saved.bio;
  if (Number.isFinite(saved.nickname_changed_at)) userNicknameChangedAt = saved.nickname_changed_at;
  if (saved.about && typeof saved.about === 'object') {
    ABOUT_ME_FIELDS.forEach(f => {
      const v = saved.about[f.key];
      if (typeof v === 'string') window.updateAboutMeFieldSilently(f.key, v);
    });
  }
}

// 복원 중에는 저장을 되부르지 않는다 (루프·불필요한 쓰기 방지).
window.updateAboutMeFieldSilently = function (key, value) {
  switch (key) {
    case 'style': userStyle = value; break;
    case 'ideal': userIdeal = value; break;
    case 'drink': userDrink = value; break;
    case 'smoke': userSmoke = value; break;
    case 'mbti': userMBTI = value; break;
    case 'saju': userSaju = value; break;
    case 'religion': userReligion = value; break;
    case 'job': userJob = value; break;
  }
};
window.restoreOnboardingChoices = restoreOnboardingChoices;

// users 테이블에 role / relationship_status / seeking_intent 컬럼을 추가한 뒤
// window.__P2_SYNC_ONBOARDING_TO_DB = true 한 줄로 켜면 된다.
async function syncOnboardingChoicesToDB() {
  if (!window.__P2_SYNC_ONBOARDING_TO_DB) return;
  const sb = window.supabaseClient;
  if (!sb || !window.currentAuthUser) return;
  const patch = {};
  if (userRole) patch.role = userRole;
  if (userRelationshipStatus) patch.relationship_status = userRelationshipStatus;
  if (userSeekingIntent) patch.seeking_intent = userSeekingIntent;
  if (!Object.keys(patch).length) return;

  const { error } = await sb.from('users').update(patch).eq('id', window.currentAuthUser.id);
  if (error) {
    console.error('onboarding choices update failed', error);
    return;
  }
  if (window.currentUserRow) Object.assign(window.currentUserRow, patch);
}
window.syncOnboardingChoicesToDB = syncOnboardingChoicesToDB;

function getIntentBadgeLabel(key) {
  return INTENT_BADGE_LABELS[key || userSeekingIntent] || '';
}
window.getIntentBadgeLabel = getIntentBadgeLabel;
let userTags = [];
let targetAgeRange = { min: 20, max: 35 };
let targetRoles = []; // ['G', 'T', 'GT']
let hasShownCTA = false;
let selectedQuizOpt = null;

// Profile Setup State — profileComplete is the in-session half of
// isProfileBookComplete(); nothing else may gate on its own flag.
window.profileComplete = false;
let userProfilePhoto = null;
window.myPhotos = [
  'https://images.unsplash.com/photo-1704731267944-c93c8d059cdc?w=400',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
];
window._photoGridEditMode = false;
window._photoGridDragSrc = null;
let userStyle = '';
let userIdeal = '';
let userDrink = '';
let userSmoke = '';
// 위치. 온보딩에서 권한을 받으면 좌표와 광역 지역 라벨이 함께 채워진다.
// 기본값은 '미설정'이다 — 예전처럼 '서울'로 가정하면, 권한을 거부한 부산 유저가
// 서울 모임만 받게 된다.
let userLocation = '';           // 광역 라벨. '' = 미설정
let userCoords = null;           // { lat, lng }. null = 미설정
let userLocationStatus = 'unset'; // 'unset' | 'granted' | 'denied'
let userMBTI = '';
let userSaju = '';
let userReligion = '';
let userJob = '';
let currentTab = 'discover';
let MY_ANSWERS = myAnswers;
Object.assign(MY_ANSWERS, {
  1: { text: "눈웃음이요. 모르는 척하다가 터지는 웃음" },
  2: { text: "출근 전 커피 한 잔은 필수예요. 휴일엔 늦잠 자고 브런치 🥐" },
  3: { text: "엄마표 된장찌개. 냄새만 맡아도 집 생각나요" },
  6: { text: "타오르는 여인의 초상. 눈이 마주치는 장면에서 멈췄어요 🎬", polaroid: "https://www.artinsight.co.kr/data/tmp/2405/20240528195507_qhlhtydd.jpg" },
  8: { text: "할머니 댁 마당에서 혼자 놀던 여름 오후" },
  9: { text: "지금보다 덜 바쁘고, 더 나다운 사람" },
  14: { text: "같이 걷다가 손 잡아줄 때요 🤍" },
  18: { text: "별것 아닌 일상을 같이 기억하고 싶을 때요" },
  26: { text: "아침에 각자 커피 내려서 같이 마시는 것" }
});

// ── ♥ 페이지 상태 · 카드 인터랙션 ──────────────────────
window.likedPages = window.likedPages || {};
const chapterColors = { 1: '#E8FF90', 2: '#FFD5BD', 3: '#D3B2E2' };

window.discoverFilterType = '전체';
window.showLikedCollection = false;
window.showSavedMeetups = false;
window.bookmarkedMoims = {};
window.currentTab = 'discover';
window.isDiscoverInitialized = false;

window.getCurrentPageId = function () { return window.__activePageId || null; };
window.getCurrentChapter = function () { return window.__activeChapter || 1; };

function handleLike(pageId, chapterNum) {
  if (!pageId) return;
  window.likedPages[pageId] = !window.likedPages[pageId];
  const isLiked = window.likedPages[pageId];

  // Update UI without re-rendering
  updateHeartOnly(pageId, isLiked, chapterNum);

  const btn = document.getElementById('like-btn-' + pageId);
  if (btn) {
    btn.style.transform = 'scale(1.4)';
    setTimeout(() => { btn.style.transform = 'scale(1)'; }, 150);
  }
}

window.bindCardInteractions = function () {
  document.querySelectorAll('[data-page-id]').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      openCard(el.dataset.pageId);
    };
  });
  document.querySelectorAll('[data-profile-id]').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      openProfileModal(parseInt(el.dataset.profileId));
    };
  });
};

window.openCard = function (pageId) {
  const parts = pageId.split('_Q');
  const profileIdRaw = parts[0].replace('user', '');
  const profileId = profileIdRaw === 'myProfile' ? 'myProfile' : parseInt(profileIdRaw);
  const qId = parseInt(parts[1]);
  openAnswerRevealModal(profileId, qId);
};

// Delegated event listener for all profile and answer card interactions
document.addEventListener('click', (e) => {
  // 1. Answer Reveal (data-page-id)
  const pageCard = e.target.closest('[data-page-id]');
  if (pageCard) {
    e.stopPropagation();
    const parts = pageCard.dataset.pageId.split('_Q');
    const profileIdRaw = parts[0].replace('user', '');
    const profileId = profileIdRaw === 'myProfile' ? 'myProfile' : parseInt(profileIdRaw);
    const qId = parseInt(parts[1]);
    // 내 프로필 탭의 감상용 그리드는 profileId가 'preview'다. 남의 책이 아니므로
    // 게이트를 태우면 안 되고, parseInt('preview')는 NaN이라 MOCK_PROFILES 조회도
    // 실패한다. 'myProfile'로 넘기면 열람 모달이 MOCK_PROFILES를 건너뛰고
    // MY_ANSWERS에서 직접 질문+답변을 읽는다 — 편집이 아니라 읽기 전용 열람.
    if (profileIdRaw === 'preview') {
      openAnswerRevealModal('myProfile', qId);
      return;
    }
    // Someone else's answer card is a detail entry and gets gated; the user's
    // own cards never are — that's how the profile book gets written.
    if (profileId !== 'myProfile' && window.blockedByProfileGate()) return;
    openAnswerRevealModal(profileId, qId);
    return;
  }

  // 2. Question Input (data-input-qid)
  const inputCard = e.target.closest('[data-input-qid]');
  if (inputCard) {
    e.stopPropagation();
    openInputModal(parseInt(inputCard.dataset.inputQid));
    return;
  }

  // 3. Profile Card In Discover (data-profile-id)
  const profCard = e.target.closest('[data-profile-id]');
  if (profCard) {
    // Only if it doesn't also have data-page-id (handled above)
    if (!profCard.dataset.pageId) {
      e.stopPropagation();
      if (window.blockedByProfileGate()) return;
      openProfileModal(parseInt(profCard.dataset.profileId));
    }
  }
});

// Mocking bindCardInteractions to no-op since we use delegation
window.bindCardInteractions = function () { };

// Age formatting: List -> "Name 26", Detail -> "26세 (01년생)"
function formatUserHeader(p, context) {
  const birthYear = p.birthYear || (2026 - (p.age || 28) + 1);
  const age = getAge(birthYear);
  const yearShort = getYearLabel(birthYear);
  if (context === 'list') {
    return `${p.name} <span class="card-age" style="font-size:16px; font-weight:400; color:var(--text-muted);">${age}</span>`;
  }
  return `${p.name} <span class="card-age" style="font-size:16px; font-weight:400; color:var(--text-muted);">${age}세 (${yearShort}년생)</span>`;
}



// ══════════════════════════════════════════════════════════════
// 화면 셸 & 네비게이션
// 스크린 생성, 탭 헤더, 진행바, 화면 전환
// ══════════════════════════════════════════════════════════════

let meetupFilterLocation = '전체';
let meetupFilterCategory = '전체';

// ── 스크린 생성 · 진행바 · 탭 헤더 ────────────────────
function createScreen(id, contentHTML) {
  const div = document.createElement('div');
  div.className = 'screen hidden-right fade-in';
  div.id = id;
  div.innerHTML = contentHTML;
  return div;
}

function getProgressBarHTML(step) {
  const pct = (step / 5) * 100;
  return `
    <div class="onboarding-progress-container">
      <div class="onboarding-progress-bar">
        <div class="onboarding-progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="onboarding-step-text">step ${step} of 5</div>
    </div>
  `;
}

function getTabWatermarkHTML() {
  return `<div class="tab-watermark">p<svg viewBox="0 0 24 24" width="9" height="9" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:baseline;position:relative;top:1px;left:-1px;transform:rotate(45deg);margin:0 1px;"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#9B72CC"/></svg>2</div>`;
}

// Single source of truth for the title/subtitle/icons row on every
// main tab. All 5 tabs render this exact markup — same classes,
// same h2, same row — so they can never drift apart in
// padding/margin/font again. Each tab wraps the result in whatever
// outer container it already needs (which supplies the 10px-top /
// 24px-side spacing); this function never adds its own outer padding.
function getTabHeaderHTML(title, subtitle, iconsHTML) {
  return `
    <div class="tab-header-row">
      <h2>${title}</h2>
      <div class="tab-header-icons">${iconsHTML || ''}</div>
    </div>
    ${subtitle ? `<p class="tab-header-subtitle">${subtitle}</p>` : ''}
  `;
}

function getProfileSetupProgressBarHTML(step) {
  const pct = (step / 6) * 100;
  return `
    <div class="onboarding-progress-container">
      <div class="onboarding-progress-bar">
        <div class="profile-setup-progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="onboarding-step-text">step ${step} / 6</div>
    </div>
  `;
}

// window.confirmIdentity is defined later, in the auth/gate section, where
// it calls supabase.auth.signInAnonymously() (falling back to this same
// cosmetic-only behavior when no Supabase client is configured).

window.selectRole = function (role, btn) {
  userRole = role;
  selectPillInGroup(btn);
  persistOnboardingChoices();
}

window.selectRelationshipStatus = function (status, btn) {
  userRelationshipStatus = status;
  selectPillInGroup(btn);
  // 싱글 → 연애중/기혼이면 seeking_intent가 community로 바뀌고,
  // 반대로 돌아오면 값은 그대로 두되 다시 고를 수 있게 된다.
  applyRelationshipConstraints();
  persistOnboardingChoices();
  // 진입점(수정 아이콘) 노출 여부가 달라지므로 편집 화면을 다시 그린다.
  if (document.getElementById('profile-edit-modal')) window.renderProfileEditBody();
  if (document.querySelector('.settings-basics')) window.renderBasicsForm();
}

// 같은 스텝 안에 pill 그룹이 둘 이상 있으므로, 해제는 누른 pill이 속한
// 그룹 안에서만 한다. 문서 전체를 훑으면 옆 그룹의 선택까지 지워진다.
function selectPillInGroup(btn) {
  if (!btn) return;
  const group = btn.closest('.role-pills, .role-pills-multi') || document;
  group.querySelectorAll('.role-pill').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
}




// ── 네비게이션 · 화면 렌더링 ──────────────────────────────
function navigateTo(screenId) {
  const currentElem = document.querySelector('.screen.active');
  const newElem = document.getElementById(screenId);

  if (currentElem) {
    currentElem.classList.remove('active');
    if (currentElem.id === 'splash') {
      currentElem.style.transition = 'opacity 0.5s ease';
      currentElem.style.opacity = '0';
      setTimeout(() => currentElem.remove(), 500);
    } else {
      currentElem.classList.add('hidden-left');
      setTimeout(() => currentElem.remove(), 500);
    }
  }

  if (newElem) {
    newElem.classList.remove('hidden-right');
    newElem.classList.remove('hidden-left');
    setTimeout(() => newElem.classList.add('active'), 20);
  } else {
    renderScreen(screenId);
  }
}

function renderScreen(screenId) {
  let screenElem;

  if (screenId === 'onboarding-invite') {
    // Always starts empty. The code never travels in the URL, so there is
    // nothing to prefill and nothing to auto-submit — the person types or
    // pastes it, then taps 확인 themselves.
    screenElem = createScreen('onboarding-invite', `
      <div class="content-padding scroll-y">
        <h1 style="margin-top: 40px;">초대코드를 입력해주세요</h1>
        <p style="margin-bottom: 40px;">p.2는 초대를 받은 분만 가입할 수 있어요.</p>

        <input type="text" class="input-field" id="invite-code-input" value=""
               placeholder="코드 입력 또는 메시지 전체 붙여넣기" autocomplete="off" autocapitalize="characters"
               spellcheck="false" oninput="window.clearInviteCodeError()"
               onpaste="window.handleInviteCodePaste(event)" />

        <div id="invite-code-error" style="display:none; margin-top:12px; font-size:13px; color:#E05B5B; line-height:1.5;"></div>
        <div id="invite-code-success" style="display:none; margin-top:12px; text-align:center; font-size:14px; font-weight:600; color:#9B72CC; line-height:1.5;"></div>

        <div style="margin-top:24px; text-align:center; color:var(--text-muted); font-size:13px; line-height:1.6;">
          받은 메시지를 그대로 붙여넣어도<br/>코드만 알아서 입력돼요 💜
        </div>
      </div>
      <div class="bottom-action-bar">
        <button class="btn-primary" id="invite-submit-btn" onclick="submitInviteCode()">확인 →</button>
      </div>
    `);
  }
  else if (screenId === 'onboarding-0') {
    screenElem = createScreen('onboarding-0', `
      <div class="content-padding scroll-y">
        <h1 style="margin-top: 40px;">본인 인증이 필요해요</h1>
        <p style="margin-bottom: 48px;">20세 이상 여성 회원만 가입할 수 있어요.</p>
        
        <button class="telecom-btn" onclick="confirmIdentity(this)">SKT 인증하기</button>
        <button class="telecom-btn" onclick="confirmIdentity(this)">KT 인증하기</button>
        <button class="telecom-btn" onclick="confirmIdentity(this)">LG U+ 인증하기</button>
        
        <div style="margin-top: 32px; text-align: center; color: var(--text-muted); font-size: 13px; line-height:1.6;">
          PASS 앱을 통해 안전하게 인증돼요 🔒<br/>
          개인정보는 인증 외 목적으로 사용되지 않아요.
        </div>
      </div>
    `);
  }
  else if (screenId === 'onboarding-1') {
    screenElem = createScreen('onboarding-1', `
      ${getProgressBarHTML(1)}
      <div class="content-padding scroll-y">
        <h1 style="margin-top: 20px;">어떻게 불러드릴까요?</h1>
        <p style="margin-bottom: 48px;">실명이 아니어도 괜찮아요.</p>
        <input type="text" class="input-field" id="name-input" placeholder="닉네임" oninput="userName=this.value" />
      </div>
      <div class="bottom-action-bar">
        <button class="btn-primary" onclick="confirmNickname()">다음 →</button>
      </div>
    `);
  }
  else if (screenId === 'onboarding-2') {
    screenElem = createScreen('onboarding-2', `
      ${getProgressBarHTML(2)}
      <div class="app-header" style="background:transparent; padding: 10px 24px;">
        <div onclick="navigateTo('onboarding-1')" style="color: var(--text-muted); font-weight: 500; cursor: pointer;">← 이전</div>
      </div>
      <div class="content-padding scroll-y" style="padding-top: 10px;">
        <h1>나에 대해 알려주세요</h1>
        
        <h3>생년월일</h3>
        <div class="date-selects">
          <div class="date-select-col">
            <div class="date-select-label">년</div>
            <select id="year-select" onchange="userBirthDate.year = +this.value">
              ${Array.from({ length: 41 }, (_, i) => 1966 + i).map(y => `<option value="${y}" ${y === 1990 ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
          <div class="date-select-col">
            <div class="date-select-label">월</div>
            <select id="month-select" onchange="userBirthDate.month = +this.value">
              ${Array.from({ length: 12 }, (_, i) => i + 1).map(m => `<option value="${m}" ${m === 1 ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>
          <div class="date-select-col">
            <div class="date-select-label">일</div>
            <select id="day-select" onchange="userBirthDate.day = +this.value">
              ${Array.from({ length: 31 }, (_, i) => i + 1).map(d => `<option value="${d}" ${d === 1 ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
        </div>


        <h3 style="margin-top: 32px;">성향</h3>
        <div class="role-pills">
          ${ROLE_CODES.map(c => `
            <div class="role-pill${userRole === c ? ' active' : ''}" onclick="selectRole('${c}', this)">${ROLE_LABELS[c]}</div>
          `).join('')}
        </div>

        <h3 style="margin-top: 32px;">연애 상태</h3>
        <div class="role-pills">
          ${RELATIONSHIP_STATUSES.map(o => `
            <div class="role-pill${userRelationshipStatus === o.key ? ' active' : ''}" onclick="selectRelationshipStatus('${o.key}', this)">${o.label}</div>
          `).join('')}
        </div>

        <h3 style="margin-top: 32px;">위치</h3>
        <div id="location-section">${getLocationSectionHTML()}</div>
      </div>

      <div class="bottom-action-bar">
        <button class="btn-primary" onclick="window.goAfterAboutMe()">다음 →</button>
      </div>
    `);
  }
  else if (screenId === 'onboarding-3') {
    screenElem = createScreen('onboarding-3', `
      ${getProgressBarHTML(3)}
      <div class="app-header" style="background:transparent; padding: 10px 24px;">
        <div onclick="navigateTo('onboarding-2')" style="color: var(--text-muted); font-weight: 500; cursor: pointer;">← 이전</div>
      </div>
      <div class="content-padding scroll-y" style="padding-top: 10px;">
        <h1>p.2에서 무엇을 찾고 계신가요?</h1>
        <p style="margin-bottom: 48px;">지금 마음에 가까운 쪽으로 골라주세요.</p>

        ${SEEKING_INTENTS.map(o => `
          <div class="intent-option${userSeekingIntent === o.key ? ' selected' : ''}" onclick="selectSeekingIntent(this, '${o.key}')">${o.label}</div>
        `).join('')}
      </div>
      <div class="bottom-action-bar">
        <button class="btn-primary" onclick="navigateTo('onboarding-4')">다음 →</button>
      </div>
    `);
  }
  else if (screenId === 'onboarding-4') {
    const categories = INTEREST_CATEGORIES;

    screenElem = createScreen('onboarding-4', `
      ${getProgressBarHTML(4)}
      <div class="app-header" style="background:transparent; padding: 10px 24px;">
        <div onclick="window.goBackFromInterests()" style="color: var(--text-muted); font-weight: 500; cursor: pointer;">← 이전</div>
      </div>
      <div class="content-padding scroll-y" style="padding-top: 10px; padding-bottom: 200px;">
        <h1>관심사를 3~5개 골라주세요</h1>
        <div id="tag-counter" class="interest-counter ${userTags.length >= 3 ? 'ready' : ''}" style="margin-top: 24px;">${userTags.length}/5개 선택됨</div>
        
        ${categories.map(cat => `
          <div class="tag-category">
            <span class="tag-category-title">${cat.name}</span>
            <div class="tags-container">
              ${cat.tags.map(tag => `
                <div class="tag-pill ${userTags.includes(tag) ? 'selected' : ''}" onclick="toggleTag(this, '${tag}')">${tag}</div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="bottom-action-bar">
        <button id="tag-next-btn" class="btn-primary disabled" disabled onclick="navigateTo('onboarding-5')">다음 →</button>
      </div>
    `);
    updateTagUI();
  }

  else if (screenId === 'profile-setup-1') {
    screenElem = createScreen('profile-setup-1', `
      ${getProfileSetupProgressBarHTML(1)}
      <div class="content-padding scroll-y">
        <h1 style="margin-top: 20px;">프로필 사진</h1>
        <div class="setup-photo-circle" onclick="alert('사진 선택 기능은 다음 단계에서 구현됩니다.')">
          <i data-lucide="camera" style="width:40px; color:#aaa;"></i>
          <div class="setup-photo-label">프로필 사진을 추가해주세요</div>
        </div>
      </div>
      <div class="bottom-action-bar">
        <button class="btn-setup-primary" onclick="navigateTo('profile-setup-2')">다음</button>
        <div class="setup-skip-link" onclick="skipSetupToDiscover()">다음에 하기</div>
      </div>
    `);
  }
  else if (screenId === 'profile-setup-2') {
    screenElem = createScreen('profile-setup-2', `
      ${getProfileSetupProgressBarHTML(2)}
      <div class="content-padding scroll-y" style="padding-bottom: 200px;">
        <h1 style="margin-top: 20px; margin-bottom: 32px;">내 스타일 + 이상형</h1>
        
        <p class="setup-hint">나를 표현해주세요</p>
        <textarea class="setup-textarea" style="margin-top:8px; height:100px;" placeholder="165, 슬림탄탄, 발랄함" oninput="userStyle=this.value"></textarea>
        <p class="setup-hint" style="margin-bottom:24px;">키, 체형, 외모 특징, 성격 등 자유롭게</p>

        <p class="setup-hint">어떤 사람이 끌리나요?</p>
        <textarea class="setup-textarea" style="margin-top:8px; height:100px;" placeholder="현명하고 유머있는 사람" oninput="userIdeal=this.value"></textarea>
      </div>
      <div class="bottom-action-bar">
        <button class="btn-setup-primary" onclick="navigateTo('profile-setup-3')">다음</button>
        <div class="setup-skip-link" onclick="skipSetupToDiscover()">다음에 하기</div>
      </div>
    `);
  }
  else if (screenId === 'profile-setup-3') {
    screenElem = createScreen('profile-setup-3', `
      ${getProfileSetupProgressBarHTML(3)}
      <div class="content-padding scroll-y">
        <h1 style="margin-top: 20px; margin-bottom: 32px;">주량 + 흡연 여부</h1>
        
        <p class="setup-hint">주량이 어떻게 되세요?</p>
        <input type="text" class="setup-input" style="margin-top:8px; margin-bottom:24px;" placeholder="맥주 두 캔, 비음주 등" oninput="userDrink=this.value" />

        <p class="setup-hint">흡연 여부</p>
        <input type="text" class="setup-input" style="margin-top:8px;" placeholder="비흡연, 가끔 등" oninput="userSmoke=this.value" />
      </div>
      <div class="bottom-action-bar">
        <button class="btn-setup-primary" onclick="navigateTo('profile-setup-4')">다음</button>
        <div class="setup-skip-link" onclick="skipSetupToDiscover()">다음에 하기</div>
      </div>
    `);
  }
  else if (screenId === 'profile-setup-4') {
    screenElem = createScreen('profile-setup-4', `
      ${getProfileSetupProgressBarHTML(4)}
      <div class="content-padding" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; height:60%;">
        <div style="font-size:32px; margin-bottom:16px;">😊</div>
        <h1 style="margin-bottom:12px;">조금 더 나를 소개해볼까요?</h1>
        <p style="color:#858082; line-height:1.6; margin-bottom:40px;">
          다음 항목들은 선택이에요.<br/>
          입력하면 프로필이 더 풍성해져요.
        </p>
      </div>
      <div class="bottom-action-bar">
        <button class="btn-setup-primary" onclick="navigateTo('profile-setup-5')">입력하기</button>
        <div class="setup-skip-link" onclick="finalizeProfile()">건너뛰기</div>
      </div>
    `);
  }
  else if (screenId === 'profile-setup-5') {
    screenElem = createScreen('profile-setup-5', `
      ${getProfileSetupProgressBarHTML(5)}
      <div class="content-padding scroll-y">
        <h1 style="margin-top: 20px; margin-bottom: 32px;">선택 정보 (1/2)</h1>
        
        <p class="setup-hint">MBTI</p>
        <input type="text" class="setup-input" style="margin-top:8px; margin-bottom:24px;" placeholder="INFJ, ENFP 등" oninput="userMBTI=this.value" />

        <p class="setup-hint">사주 일주</p>
        <input type="text" class="setup-input" style="margin-top:8px;" placeholder="갑자일주 등" oninput="userSaju=this.value" />
      </div>
      <div class="bottom-action-bar">
        <button class="btn-setup-primary" onclick="navigateTo('profile-setup-6')">다음</button>
        <div class="setup-skip-link" onclick="navigateTo('profile-setup-6')">건너뛰기</div>
      </div>
    `);
  }
  else if (screenId === 'profile-setup-6') {
    screenElem = createScreen('profile-setup-6', `
      ${getProfileSetupProgressBarHTML(6)}
      <div class="content-padding scroll-y">
        <h1 style="margin-top: 20px; margin-bottom: 32px;">선택 정보 (2/2)</h1>
        
        <p class="setup-hint">종교</p>
        <input type="text" class="setup-input" style="margin-top:8px; margin-bottom:24px;" placeholder="무교, 기독교 등" oninput="userReligion=this.value" />

        <p class="setup-hint">직업군</p>
        <input type="text" class="setup-input" style="margin-top:8px;" placeholder="디자이너, 개발자 등" oninput="userJob=this.value" />
      </div>
      <div class="bottom-action-bar">
        <button class="btn-setup-primary" onclick="finalizeProfile()">완성!</button>
        <div class="setup-skip-link" onclick="finalizeProfile()">건너뛰기</div>
      </div>
    `);
  }

  else if (screenId === 'onboarding-5') {
    const userAge = 2026 - userBirthDate.year + 1;
    let userPoint = 0;
    if (userAge < 23) userPoint = 0;
    else if (userAge < 27) userPoint = 1;
    else if (userAge < 30) userPoint = 2;
    else if (userAge < 33) userPoint = 3;
    else if (userAge < 37) userPoint = 4;
    else if (userAge < 40) userPoint = 5;
    else if (userAge < 43) userPoint = 6;
    else if (userAge < 47) userPoint = 7;
    else if (userAge < 50) userPoint = 8;
    else userPoint = 9;

    targetDecadeRange.min = Math.max(0, userPoint - 1);
    targetDecadeRange.max = Math.min(9, userPoint + 1);

    screenElem = createScreen('onboarding-5', `
      ${getProgressBarHTML(5)}
      <div class="app-header" style="background:transparent; padding: 10px 24px;">
        <div onclick="navigateTo('onboarding-4')" style="color: var(--text-muted); font-weight: 500; cursor: pointer;">← 이전</div>
      </div>
      <div class="content-padding scroll-y">
        <h1 style="margin-top: 10px;">어떤 사람을 찾고 있나요?</h1>
        <p style="margin-bottom: 40px;">관심 있는 상대를 알려주세요.</p>
        
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 12px;">
           <h3 style="margin:0;">선호 나이대</h3>
           <div id="decade-val-display" style="font-size:16px; font-weight:700; color:var(--primary);">${DECADE_POINTS[targetDecadeRange.min]} ~ ${DECADE_POINTS[targetDecadeRange.max]}</div>
        </div>

        <div class="decade-slider-container">
          <div class="decade-track-box" id="decade-track">
            <div class="decade-track-fill" id="decade-fill"></div>
            <div class="decade-track-marker" id="user-marker" style="display:none;"></div>
            <div class="decade-handle" id="handle-min" style="left: 0%;"></div>
            <div class="decade-handle" id="handle-max" style="left: 100%;"></div>
          </div>

        </div>


        <h3 style="margin-top: 60px;">선호 성향</h3>
        <div class="role-choice-grid">
          ${ROLE_CODES.map(c => `
            <div class="role-pill-multi${targetRoles.includes(c) ? ' active' : ''}" onclick="toggleTargetRole(this, '${c}')">${ROLE_LABELS[c]}</div>
          `).join('')}
          <div class="role-pill-multi" onclick="toggleTargetRole(this, 'none')">상관없음</div>
        </div>

      </div>
      <div class="bottom-action-bar">
        <button class="btn-primary" onclick="initMainApp()">내 사람 찾기 ✨</button>
      </div>
    `);

    setTimeout(() => setupDecadeSlider(userPoint), 100);
  }


  else if (screenId === 'main') {
    screenElem = createScreen('main', `
      <div id="main-content" style="flex: 1; position: relative;"></div>
      <div class="bottom-nav">
        <div class="bottom-nav-row">
          <div class="nav-item active" data-tab="discover" onclick="switchTab('discover')"><i data-lucide="book-open" class="nav-icon"></i></div>
          <div class="nav-item" data-tab="meetups" onclick="switchTab('meetups')"><i data-lucide="calendar" class="nav-icon"></i></div>
          <div class="nav-item" data-tab="messages" onclick="switchTab('messages')"><i data-lucide="message-circle" class="nav-icon"></i></div>
          <div class="nav-item" data-tab="notifications" onclick="switchTab('notifications')"><i data-lucide="bell" class="nav-icon"></i></div>
          <div class="nav-item" data-tab="profile" onclick="switchTab('profile')"><i data-lucide="user" class="nav-icon"></i></div>
        </div>
      </div>
      <!-- Fixed Modals Container -->
      <div id="modal-container"></div>
    `);
  }

  if (screenElem && appContainer) {
    appContainer.appendChild(screenElem);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => {
      const currentElem = document.querySelector('.screen.active');
      if (currentElem) {
        currentElem.classList.remove('active');
        currentElem.classList.add('hidden-left');
      }
      screenElem.classList.remove('hidden-right');
      screenElem.classList.add('active');
    }, 20);
  }
}

// ── Invite gate (first onboarding step) ──────────────────────────────

// ── 초대코드 — 입력 · 검증 · 에러 표시 ──────────────
window.clearInviteCodeError = function () {
  const box = document.getElementById('invite-code-error');
  if (box) { box.style.display = 'none'; box.textContent = ''; }
};

// Codes are 8 uppercase hex characters.
const INVITE_CODE_PATTERN = /[A-F0-9]{8}/;

function flashInviteInput(input) {
  input.classList.remove('invite-code-autofilled');
  void input.offsetWidth; // reflow so the animation restarts on a repeated paste
  input.classList.add('invite-code-autofilled');
  setTimeout(() => input.classList.remove('invite-code-autofilled'), 900);
}

// People paste the whole KakaoTalk message, not just the code. Pull the code
// out of it and keep only that; anything without a recognisable code pastes
// through untouched so hand-typed or hand-trimmed input still works.
// This fills the field and stops there — it is an input aid, never a submit.
window.handleInviteCodePaste = function (e) {
  const input = e?.target;
  if (!input) return;

  const clipboard = e.clipboardData || window.clipboardData;
  const pasted = clipboard ? clipboard.getData('text') : '';
  const match = String(pasted || '').toUpperCase().match(INVITE_CODE_PATTERN);
  if (!match) return; // let the browser handle it normally

  e.preventDefault();
  input.value = match[0];
  window.clearInviteCodeError();
  flashInviteInput(input);
};

function showInviteCodeError(msg) {
  const box = document.getElementById('invite-code-error');
  if (!box) return;
  box.textContent = msg;
  box.style.display = 'block';
}

function showInviteCodeSuccess(msg) {
  const box = document.getElementById('invite-code-success');
  if (!box) return;
  box.textContent = msg;
  box.style.display = 'block';
}

// How long the "확인되었습니다 💜" beat holds before PASS 인증. Long enough to
// read as a completed step rather than a screen that flicked past.
const INVITE_SUCCESS_HOLD_MS = 1200;

// Validates whatever the user typed or pasted, and only lets a real, live code
// through to PASS 인증. Only ever runs from a deliberate tap on 확인 — nothing
// on this screen submits on the user's behalf.
window.submitInviteCode = async function () {
  const input = document.getElementById('invite-code-input');
  const btn = document.getElementById('invite-submit-btn');
  if (!input) return;

  const code = window.normalizeInviteCode(input.value);
  if (!code) {
    showInviteCodeError('초대코드를 입력해주세요');
    return;
  }

  window.clearInviteCodeError();
  const originalLabel = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '확인 중…'; }

  const result = await window.validateInviteCode(code);

  if (btn) { btn.disabled = false; btn.innerHTML = originalLabel; }

  if (result.reason === 'no-client') {
    // Our fault, not theirs — don't let a broken deployment read as a bad code.
    console.error('[invite] cannot verify code: Supabase client unavailable — check env-config.js deployment.');
    showFatalError('서비스에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
    return;
  }

  if (!result.valid) {
    // Wrong, already used, expired, or never activated — all the same to the
    // person typing, and we deliberately don't say which.
    showInviteCodeError('유효하지 않거나 만료된 코드예요');
    input.value = '';
    input.focus();
    return;
  }

  rememberPendingInvite({ code, ownerUserId: result.ownerUserId });

  // Confirm the step visibly before moving on. The button stays disabled for
  // the hold so a second tap can't fire a second navigation.
  showInviteCodeSuccess('확인되었습니다 💜');
  input.disabled = true;
  if (btn) { btn.disabled = true; btn.innerHTML = '확인됨'; }
  setTimeout(() => navigateTo('onboarding-0'), INVITE_SUCCESS_HOLD_MS);
};

// Simple logic handlers

// ── 온보딩 — 인텐트 · 태그 · 선호 성향 선택 ────────
// 연애 중·기혼이면 "p.2에서 무엇을 찾고 계신가요?"를 묻지 않고 지나간다.
// 남는 선택지가 하나뿐인 질문을 보여주는 건 시간을 뺏는 일이다.
window.goAfterAboutMe = function () {
  if (isPartnered()) {
    applyRelationshipConstraints();
    persistOnboardingChoices();
    navigateTo('onboarding-4');
    return;
  }
  navigateTo('onboarding-3');
};

// 관심사 단계에서 뒤로 갈 때도 같은 규칙을 따라야 한다.
window.goBackFromInterests = function () {
  navigateTo(isPartnered() ? 'onboarding-2' : 'onboarding-3');
};

window.selectSeekingIntent = function (el, intent) {
  userSeekingIntent = intent;
  document.querySelectorAll('.intent-option').forEach(opt => opt.classList.remove('selected'));
  if (el) el.classList.add('selected');
  persistOnboardingChoices();
}

window.toggleTag = function (el, tagName) {
  const isSelected = userTags.includes(tagName);

  if (isSelected) {
    userTags = userTags.filter(t => t !== tagName);
  } else if (userTags.length < 5) {
    userTags.push(tagName);
  } else {
    return; // Limit reached
  }

  updateTagUI();
  persistOnboardingChoices();
}

window.updateTagUI = function () {
  document.querySelectorAll('.tag-pill').forEach(pill => {
    const tag = pill.innerText;
    pill.classList.toggle('selected', userTags.includes(tag));

    if (userTags.length >= 5 && !userTags.includes(tag)) {
      pill.classList.add('disabled');
    } else {
      pill.classList.remove('disabled');
    }
  });

  const counter = document.getElementById('tag-counter');
  const nextBtn = document.getElementById('tag-next-btn');

  if (counter) {
    counter.innerText = `${userTags.length}/5개 선택됨`;
    counter.style.color = userTags.length >= 3 ? 'var(--primary)' : 'var(--text-muted)';
  }

  if (nextBtn) {
    if (userTags.length >= 3) {
      nextBtn.classList.remove('disabled');
      nextBtn.disabled = false;
    } else {
      nextBtn.classList.add('disabled');
      nextBtn.disabled = true;
    }
  }
}

window.toggleTargetRole = function (el, role) {
  if (role === 'none') {
    targetRoles = ['none'];
    document.querySelectorAll('.role-pill-multi').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
  } else {
    // If none was selected, clear it
    targetRoles = targetRoles.filter(r => r !== 'none');
    document.querySelectorAll('.role-pill-multi').forEach(p => {
      if (p.innerText.includes('상관없음')) p.classList.remove('active');
    });

    if (targetRoles.includes(role)) {
      targetRoles = targetRoles.filter(r => r !== role);
      el.classList.remove('active');
    } else {
      targetRoles.push(role);
      el.classList.add('active');
    }
  }
}

// ── Highlight helper ────────────────────────────────────────────
// Wraps 1-3 key words per answer in highlight spans.
// Cycles: yellow → sage → lavender

// ══════════════════════════════════════════════════════════════
// 프로필북 — 열람 · 작성
// 답변 렌더링, 공개 모달, 프로필 상세, 온보딩 게이트
// ══════════════════════════════════════════════════════════════

function formatAnswerText(ansText, q) {
  if (typeof ansText === 'string') return ansText;
  if (Array.isArray(ansText)) return ansText.join(', ');
  if (ansText && typeof ansText === 'object') {
    if (q && q.subQuestions) {
      const choiceVals = [];
      let textVal = '';
      q.subQuestions.forEach(sq => {
        const v = ansText[sq.id];
        if (v === null || v === undefined) return;
        if (sq.type === 'multiple-choice') {
          if (Array.isArray(v) && v.length > 0) choiceVals.push(v.join(', '));
        } else if (sq.type === 'ab-choice' || sq.type === 'choice') {
          if (typeof v === 'string' && v) choiceVals.push(v);
        } else if (sq.type === 'text') {
          if (typeof v === 'string' && v) textVal = v;
        }
      });
      const choicePart = choiceVals.length ? choiceVals.join(', ') : '';
      if (choicePart && textVal) return `${choicePart}.\n${textVal}`;
      if (choicePart) return `${choicePart}.`;
      return textVal;
    }
    return Object.values(ansText).filter(v => v && typeof v === 'string').join(', ');
  }
  return '';
}

function applyHighlights(text) {
  if (text && typeof text === 'object') text = formatAnswerText(text);
  if (!text) return text;
  const colors = ['highlight-yellow', 'highlight-sage', 'highlight-lavender'];
  // Keyword patterns to highlight (emotionally meaningful words/phrases)
  const patterns = [
    /손 잡아줄/,
    /멈췄어요/,
    /눈이 마주치는/,
    /늦잠/,
    /브런치/,
    /필수예요/,
    /정상에서/,
    /배려하고/,
    /존중하는/,
    /기억하고 싶을/,
    /일상을 같이/,
    /소울메이트/,
    /자유로운/,
    /재즈/,
    /김치전/,
    /비 오는 날/,
    /드라이브할 때/,
    /커피를 마시는/,
    /잔잔한/,
    /북클럽/,
    /미술관/,
    /전시를/,
    /기대하며/,
  ];
  let result = text;
  let colorIdx = 0;
  let replaced = 0;
  for (const pat of patterns) {
    if (replaced >= 3) break;
    if (pat.test(result)) {
      result = result.replace(pat, m =>
        `<span class="${colors[colorIdx % 3]}">${m}</span>`
      );
      colorIdx++;
      replaced++;
    }
  }
  return result;
}

// ── Notification system ─────────────────────────────────────────

// ── 더미 데이터 — 알림 ────────────────────────────────────
const DUMMY_NOTIFICATIONS = [
  { icon: '📚', text: '새로운 프로필북이 도착했어요 📚', time: '월요일 오전 7시', unread: true },
  { icon: '♥', text: 'zoe님이 나를 paged 했어요 ♥', time: '3시간 전', unread: true },
  { icon: '📅', text: "레즈비언 독서 모임 '달빛책방'이 곧 시작돼요", time: '어제', unread: true },
  { icon: '💌', text: '이번 주 프로필북을 아직 안 열어봤어요. 확인해볼까요?', time: '수요일 오후 8시', unread: false },
  { icon: '🎁', text: '프로필을 더 채워보세요! 챕터 완료 시 프로필북 +1권 🎁', time: '지난주', unread: false },
];

// ── 답변 공개 모달 — 열기 · 닫기 · 제스처 ──────────
window.openAnswerRevealModal = function (profileId, qId) {
  const isMyProfile = profileId === 'myProfile';
  const p = isMyProfile ?
    { name: userName || '나나', answers: MY_ANSWERS } :
    MOCK_PROFILES.find(x => x.id === profileId);

  if (!p) return;
  window.__lastAnswerProfileId = profileId;
  window.currentOpenProfileId = profileId;

  let amc = document.getElementById('answer-modal-container');
  if (!amc) {
    amc = document.createElement('div');
    amc.id = 'answer-modal-container';
    // Higher z-index than main modal (which is 1000)
    amc.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:2000; pointer-events:auto;';
    document.body.appendChild(amc);
  }
  amc.style.display = 'block';

  let pages = [];
  const answeredQIds = Object.keys(p.answers || {}).map(Number).sort((a, b) => a - b);
  let currentChap = -1;

  answeredQIds.forEach(qid => {
    const q = QUESTIONS.find(x => x.id === qid);
    if (q && q.chapter !== currentChap) {
      pages.push({ type: 'cover', chapter: q.chapter });
      currentChap = q.chapter;
    }
    pages.push({ type: 'answer', qId: qid });
  });

  const startIndex = pages.findIndex(pg => pg.qId === qId);
  let currentPage = startIndex !== -1 ? startIndex : 0;
  const totalPages = pages.length;

  const buildCover = (ch, clr) => {
    const titles = { 1: '내가 생각하는 나', 2: '내가 생각하는 사랑', 3: '내가 생각하는 우리의 미래' };
    return `
      <div class="nb-cover-page" style="padding: 48px 28px; background: transparent; display: flex; flex-direction: column; align-items: flex-start; text-align: left;">
        <div style="font-family: 'Noto Serif KR', serif; font-weight: 400; font-size: 16px; color: #2C2C2A;">Chapter ${ch}</div>
        <div style="font-family: 'Noto Serif KR', serif; font-weight: 400; font-size: 20px; color: #2C2C2A;">${titles[ch]}</div>
        <div style="width: 32px; height: 1.5px; background: ${clr}; margin-top: 14px;"></div>
      </div>
    `;
  };

  const buildAnswer = (qid, pageIdx) => {
    const q = QUESTIONS.find(x => x.id === qid);
    const ans = p.answers[qid];
    const chapLabel = q.chapter === 1 ? '나' : (q.chapter === 2 ? '사랑' : '관계');
    return `
      <div class="nb-answer-page">
        <div class="book-page-chapter">CHAPTER ${q.chapter} &middot; ${chapLabel}</div>
        <div class="book-page-question">${q.text}</div>
        <div class="book-page-answer">${applyHighlights(formatAnswerText(ans.text, q))}</div>
        ${ans.polaroid ? `
          <div style="display:flex;justify-content:center;margin-top:32px;">
            <div style="background:#FFF;padding:8px 8px 28px 8px;box-shadow:2px 4px 14px rgba(0,0,0,0.11);transform:rotate(-1.5deg);width:160px;">
              <img src="${ans.polaroid}" style="width:100%;height:144px;object-fit:cover;display:block;"/>
            </div>
          </div>` : ''}
        ${ans.image && !ans.polaroid ? `
          <div style="margin:24px 0 0;">
            <img src="${ans.image}" style="width:100%;border-radius:10px;box-shadow:0 3px 12px rgba(0,0,0,0.07);"/>
          </div>` : ''}
      </div>
    `;
  };

  const renderPage = (pageIdx) => {
    currentPage = pageIdx;
    const pg = pages[pageIdx];
    const isCover = pg.type === 'cover';
    const isAnswer = pg.type === 'answer';

    const chapterNum = isCover ? pg.chapter : QUESTIONS.find(q => q.id === pg.qId).chapter;
    const chapColors = { 1: '#E8FF90', 2: '#FFD5BD', 3: '#D3B2E2' };
    const decorColor = chapColors[chapterNum];

    const pidStr = (profileId === 'myProfile' || profileId === 1) ? 'myProfile' : profileId;
    const pageId = isAnswer ? `user${pidStr}_Q${pg.qId}` : null;
    const isLiked = isAnswer ? (window.likedPages && window.likedPages[pageId]) : false;

    window.__activePageId = pageId;
    window.__activeChapter = chapterNum;

    // Count only answer pages for indicator
    const answerPages = pages.filter(p => p.type === 'answer');
    const answerIdx = isAnswer ? answerPages.findIndex(ap => ap.qId === pg.qId) : -1;
    const indicatorHTML = isAnswer
      ? `<div style="position:absolute;bottom:24px;right:24px;font-size:11px;color:#ccc;letter-spacing:0.06em;z-index:10;pointer-events:none;">${answerIdx + 1} / ${answerPages.length}</div>`
      : '';

    const gradients = {
      cover: {
        1: 'linear-gradient(to right, #E8FF90 0%, #f5ffd6 25%, #ffffff 55%)',
        2: 'linear-gradient(to right, #FFD5BD 0%, #ffede0 25%, #ffffff 55%)',
        3: 'linear-gradient(to right, #D3B2E2 0%, #ecdff5 25%, #ffffff 55%)'
      },
      answer: {
        1: 'linear-gradient(to right, #E8FF90 0%, #f8ffe0 8%, #ffffff 25%)',
        2: 'linear-gradient(to right, #FFD5BD 0%, #fff3ea 8%, #ffffff 25%)',
        3: 'linear-gradient(to right, #D3B2E2 0%, #f5eefa 8%, #ffffff 25%)'
      }
    };
    const bgGradient = isCover ? gradients.cover[chapterNum] : gradients.answer[chapterNum];

    const likeBtn = isAnswer && !isMyProfile ? `
      <button id="like-btn-${pageId}">
        <svg viewBox="0 0 32 32" width="28" height="28">
          <path id="heart-${pageId}"
            d="M16 28S2 20 2 11a7 7 0 0 1 14 0 7 7 0 0 1 14 0c0 9-14 17-14 17z"
            fill="${isLiked ? decorColor : 'none'}"
            stroke="${isLiked ? 'none' : '#ccc'}"
            stroke-width="2"/>
        </svg>
      </button>
    ` : '';

    amc.innerHTML = `
      <div id="nb-modal" class="book-page-modal" style="background: ${bgGradient}; touch-action: pan-y;">
        <!-- Header -->
        <div class="book-page-header">
          <button class="answer-card-close" style="background:none;border:none;cursor:pointer;padding:4px;color:#bbb;display:flex;align-items:center;z-index:9999;pointer-events:auto;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style="flex:1;"></div>
          ${!isCover ? `<div style="font-size:13px;color:#aaa;font-weight:400;letter-spacing:0.02em;font-family: 'Noto Serif KR', serif;">${p.name}'s</div>` : ''}
        </div>

        <!-- Page content -->
        <div id="nb-scroll" class="book-page-content">
          ${isCover ? buildCover(pg.chapter, decorColor) : buildAnswer(pg.qId, pageIdx)}
          <div style="height:80px;"></div>
        </div>

        <!-- Tap zones -->
        ${pageIdx > 0 ? `<div onclick="nbNav(${pageIdx - 1})" style="position:absolute;left:0;top:60px;width:32px;height:50%;z-index:10;cursor:pointer;"></div>` : ''}
        ${pageIdx < totalPages - 1 ? `<div onclick="nbNav(${pageIdx + 1})" style="position:absolute;right:0;top:60px;width:32px;height:50%;z-index:10;cursor:pointer;"></div>` : ''}

        ${indicatorHTML}
        ${likeBtn}
      </div>
    `;

    const scroll = document.getElementById('nb-scroll');
    if (scroll) scroll.scrollTop = 0;

    const modal = document.getElementById('nb-modal');
    let tsX = 0, tsY = 0;
    modal.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; tsY = e.touches[0].clientY; }, { passive: true });

    // Swipe navigation
    modal.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tsX;
      const dy = e.changedTouches[0].clientY - tsY;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
      if (dx < 0 && currentPage < totalPages - 1) nbNav(currentPage + 1);
      if (dx > 0 && currentPage > 0) nbNav(currentPage - 1);
    }, { passive: true });

    // Direct button tap
    const b = document.getElementById('like-btn-' + pageId);
    if (b) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        handleLike(pageId, chapterNum);
      });
    }

    // Attach interaction listeners ONCE after render
    setTimeout(() => {
      const closeBtn = modal.querySelector('.answer-card-close');

      // X button
      closeBtn?.addEventListener('click', () => {
        console.log('X button clicked');
        console.log('closeAnswerCard exists:', typeof closeAnswerCard === 'function');
        closeAnswerCard();
      });

      // Pull down gesture
      modal.addEventListener('touchstart', (e) => {
        answerCardTouchStartY = e.touches[0].clientY;
      }, { passive: true });

      modal.addEventListener('touchmove', (e) => {
        const dy = e.touches[0].clientY - answerCardTouchStartY;
        if (dy > 0) {
          modal.style.transform = `translateY(${dy}px)`;
        }
      }, { passive: true });

      modal.addEventListener('touchend', (e) => {
        const deltaY = e.changedTouches[0].clientY - answerCardTouchStartY;
        if (deltaY > 80) {
          closeAnswerCard();
        } else {
          modal.style.transform = '';
          modal.style.transition = 'transform 0.2s ease-out';
          setTimeout(() => { modal.style.transition = ''; }, 200);
        }
      }, { passive: true });
    }, 50);
  };

  window.nbNav = function (newPage) { renderPage(newPage); };
  renderPage(currentPage);
};

// --- Answer Card System (Rewrite) ---
let answerCardCloseHandler = null;
let answerCardTouchStartY = 0;

window.closeAnswerCard = function () {
  console.log('closeAnswerCard initiated (layered approach)');
  const amc = document.getElementById('answer-modal-container');
  if (amc) {
    // Hide or remove to reveal the profile modal underneath
    amc.style.display = 'none';
    amc.innerHTML = '';
    console.log('Answer modal hidden, revealing layer below');
  }
};

// ── 프로필 상세 · ♥ 토글 · 더블탭 ────────────────────
window.showProfileDetail = function (profileId) {
  console.log('showProfileDetail called for:', profileId);
  const mc = getModalContainer();
  if (mc) {
    mc.style.display = 'block';
    mc.style.zIndex = '1000';
    openProfileModal(profileId);
  } else {
    console.error('Modal container not found in showProfileDetail');
  }
};

window.updateHeartOnly = function (pageId, liked, chapterNum) {
  const path = document.getElementById('heart-' + pageId);
  const chapColors = { 1: '#E8FF90', 2: '#FFD5BD', 3: '#D3B2E2' };
  const color = chapColors[chapterNum] || '#9B72CC';

  if (path) {
    if (liked) {
      path.setAttribute('fill', color);
      path.setAttribute('stroke', 'none');
    } else {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#ccc');
    }
  }

  // Also update badges if they exist
  const badges = document.querySelectorAll(`[data-page-id="${pageId}"] .card-liked-badge`);
  badges.forEach(badge => { badge.style.visibility = liked ? 'visible' : 'hidden'; });
};

// Double tap anywhere logic
let lastTap = 0;
document.addEventListener('touchstart', function (e) {
  const now = Date.now();
  if (now - lastTap < 300 && now - lastTap > 30) {
    if (e.cancelable) e.preventDefault();
    const pageId = window.getCurrentPageId();
    const chapter = window.getCurrentChapter();
    if (pageId) handleLike(pageId, chapter);
    lastTap = 0;
  } else {
    lastTap = now;
  }
}, { passive: false });

// Global Styles Injection
(function () {
  const style = document.createElement('style');
  style.textContent = `
    [id^="like-btn-"] {
      position: fixed;
      bottom: 48px;
      right: 24px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      z-index: 150;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .bottom-nav {
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .bottom-nav.nav-hidden {
      transform: translateY(calc(100% + 20px));
    }
    .paged-indicator-centered {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 64px;
      color: #9B72CC;
      opacity: 0.85;
      z-index: 5;
      pointer-events: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
})();




window.sendLike = function () {
  alert('좋아요를 보냈습니다!');
  closeModal();

  if (!hasShownCTA) {
    hasShownCTA = true;
    setTimeout(() => showCTA(), 600);
  }
}

window.showCTA = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;
  const overlay = document.createElement('div');
  overlay.className = 'bottom-sheet-overlay';
  overlay.id = 'cta-sheet-overlay';
  overlay.innerHTML = `
    <div class="bottom-sheet">
       <div class="sheet-title">나의 페이지를 채워보세요 📖</div>
       <div class="sheet-body">답변을 채울수록 더 잘 맞는<br/>사람을 만날 수 있어요.</div>
       <button class="btn-primary" style="margin-bottom:12px;" onclick="goToMyPage()">지금 채우러 가기</button>
       <button style="width:100%; padding:14px; background:none; border:none; color:var(--text-muted); font-size:15px; cursor:pointer;" onclick="closeCTA()">나중에</button>
    </div>
  `;
  container.appendChild(overlay);
  setTimeout(() => overlay.classList.add('active'), 20);
}

window.closeCTA = function () {
  const overlay = document.getElementById('cta-sheet-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 400);
  }
}

window.goToMyPage = function () {
  closeCTA();
  switchTab('profile');
}

// "지금 답변하러 가기" on a viewer-locked chapter. The profile book is rendered
// inside #modal-container, so the modal has to come down before the tab swap.
window.goToMyChapters = function () {
  closeModal();
  switchTab('profile');
}

// ── 필터 칩 · 모임 폼 카테고리 분기 ────────────────────
window.toggleFilterChip = function (elem, type) {
  const textVal = elem.innerText.trim();

  if (type === 'loc') {
    if (meetupFilterLocation === textVal && textVal !== '전체') {
      meetupFilterLocation = '전체';
    } else {
      meetupFilterLocation = textVal;
    }
  } else if (type === 'cat') {
    if (meetupFilterCategory === textVal && textVal !== '전체') {
      meetupFilterCategory = '전체';
    } else {
      meetupFilterCategory = textVal;
    }
  }

  // Refresh UI highlighting for the entire row
  const row = elem.parentElement;
  row.querySelectorAll('.filter-chip').forEach(c => {
    const cVal = c.innerText.trim();
    const currentVal = (type === 'loc' ? meetupFilterLocation : meetupFilterCategory);
    c.classList.toggle('selected', cVal === currentVal);
  });

  if (currentTab === 'meetups') renderMeetupList();
}

// Form Modal Component logic handlers
window.selectModalCategory = function (elem) {
  const grid = elem.parentElement;
  grid.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('selected'));
  elem.classList.add('selected');
}

window.selectModalMeetupCategory = function (elem) {
  const grid = elem.parentElement;

  if (elem.classList.contains('selected')) {
    const selected = grid.querySelectorAll('.filter-chip.selected');
    if (selected.length > 1) {
      elem.classList.remove('selected', 'primary-cat', 'secondary-cat');
      const remaining = grid.querySelector('.filter-chip.selected');
      if (remaining && !remaining.classList.contains('primary-cat')) {
        remaining.classList.remove('secondary-cat');
        remaining.classList.add('primary-cat');
        const check = remaining.querySelector('.secondary-check');
        if (check) check.style.display = 'none';
      }
      const thisCheck = elem.querySelector('.secondary-check');
      if (thisCheck) thisCheck.style.display = 'none';
    }
    return;
  }

  const selected = grid.querySelectorAll('.filter-chip.selected');
  if (selected.length >= 2) {
    window.showToast('카테고리는 최대 2개까지 선택할 수 있어요');
    return;
  }

  elem.classList.add('selected');
  if (selected.length === 0) {
    elem.classList.add('primary-cat');
  } else {
    elem.classList.add('secondary-cat');
    const check = elem.querySelector('.secondary-check');
    if (check) check.style.display = 'block';
  }
  updateCreateMeetupFormByCategory();
}

function updateCreateMeetupFormByCategory() {
  const sel = Array.from(document.querySelectorAll('#create-meetup-category .filter-chip.selected')).map(e => e.textContent.trim());
  const isCommunity = sel.some(s => s.includes('커뮤니티'));
  const isEvent = sel.some(s => s.includes('행사'));
  const showLinks = isCommunity || isEvent;

  const capWrapper = document.getElementById('create-meetup-capacity-wrapper');
  const feeWrapper = document.getElementById('create-meetup-fee-wrapper');
  const linksSection = document.getElementById('create-meetup-links-section');
  const addBtn = document.getElementById('create-meetup-links-add-btn');

  if (capWrapper) {
    capWrapper.style.opacity = isCommunity ? '0.4' : '1';
    capWrapper.style.pointerEvents = isCommunity ? 'none' : 'auto';
  }
  if (feeWrapper) {
    feeWrapper.style.opacity = isCommunity ? '0.4' : '1';
    feeWrapper.style.pointerEvents = isCommunity ? 'none' : 'auto';
  }
  if (linksSection) linksSection.style.display = showLinks ? 'block' : 'none';

  if (addBtn) {
    const list = document.getElementById('create-meetup-links-list');
    const count = list ? list.querySelectorAll('.meetup-link-item').length : 0;
    addBtn.style.display = count >= 2 ? 'none' : 'block';
  }
}
window.selectCalendarDay = function (elem, day) {
  const grid = elem.parentElement;
  grid.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
  elem.classList.add('selected');

  const docExt = document.getElementById('cal-header-text');
  if (docExt) {
    const dummyDate = new Date(2026, 3, day);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    docExt.innerText = `2026년 4월 ${day}일 (${days[dummyDate.getDay()]})`;
  }
}
window.handleWheelScroll = function (elem) {
  const itemHeight = 40;
  clearTimeout(elem.scrollTimeout);
  elem.scrollTimeout = setTimeout(() => {
    const activeIndex = Math.round(elem.scrollTop / itemHeight);
    const items = elem.querySelectorAll('.picker-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === activeIndex);
    });
  }, 50);
}

// ── Profile-book gating ──────────────────────────────────────────────
// Two gates that used to overlap, now split by trigger point:
//   1. full-screen intro modal — once ever, on the first 발견 entry after onboarding
//   2. contextual popup — every time a 프로필북/모임 card's detail is opened
// Browsing (scroll, list view) is never gated, and 메시지 탭 is never gated.

// ── 게이트 — 프로필 완성 판정 · 온보딩 후 모달 ──────
const INTRO_MODAL_SHOWN_KEY = 'p2_intro_modal_shown';
const PROFILE_BOOK_DONE_KEY = 'p2_profile_book_complete';

function readGateFlag(key) {
  try { return window.localStorage.getItem(key) === '1'; } catch (e) { return false; }
}
function writeGateFlag(key) {
  try { window.localStorage.setItem(key, '1'); } catch (e) { /* storage unavailable */ }
}

// The single answer to "has this user written their own profile book?".
// Backend truth wins while signed in; otherwise localStorage carries it across
// reloads so the no-Supabase demo flow gates identically.
window.isProfileBookComplete = function () {
  if (window.profileComplete) return true;
  if (window.supabaseClient && window.currentAuthUser) return !!window.basicInfoComplete;
  return readGateFlag(PROFILE_BOOK_DONE_KEY);
};

window.initMainApp = function () {
  navigateTo('main');
  setTimeout(() => {
    switchTab('discover');
    setTimeout(maybeShowPostOnboardingModal, 800);
  }, 300);
}

// Gate 1 — fires only on the first 발견 entry, and never again once shown.
// The flag is written before the modal opens so a reload mid-modal can't
// resurrect it.
window.maybeShowPostOnboardingModal = function () {
  if (window.isProfileBookComplete()) return;
  if (readGateFlag(INTRO_MODAL_SHOWN_KEY)) return;
  writeGateFlag(INTRO_MODAL_SHOWN_KEY);
  showPostOnboardingModal();
};

window.showPostOnboardingModal = function () {
  const container = document.getElementById('modal-container') || document.body;
  const modal = document.createElement('div');
  modal.className = 'post-onboarding-backdrop';
  modal.id = 'post-onboarding-modal';
  modal.innerHTML = `
      <div class="post-onboarding-card">
        <div class="post-onboarding-title">p.2를 시작하기 전에,</div>
        <div class="post-onboarding-sub">나를 먼저 소개해볼까요?</div>
        <button class="post-onboarding-btn" onclick="startProfileSetup()">내 프로필북 작성하기</button>
        <button class="post-onboarding-link" onclick="skipProfileSetup()">나중에 하기</button>
      </div>
    `;
  container.appendChild(modal);
};

window.startProfileSetup = function () {
  dismissPostOnboardingModal();
  setTimeout(() => navigateTo('profile-setup-1'), 300);
};

// "나중에 하기" — closes the intro modal and nothing else. 발견/모임 stay fully
// browsable; the contextual gate takes over from here.
window.skipProfileSetup = function () {
  dismissPostOnboardingModal();
};

// Gate 2 — contextual popup over whatever card the user just tapped.
// Repeats on every detail attempt until the profile book is written, so it
// carries no "나중에 하기" dismissal state; tapping the dim backdrop closes it
// and leaves the user on the card list.
window.showLockedProfileModal = function () {
  if (document.getElementById('locked-profile-modal')) return; // never stack
  const container = document.getElementById('modal-container') || document.body;
  const modal = document.createElement('div');
  modal.className = 'post-onboarding-backdrop';
  modal.id = 'locked-profile-modal';
  modal.innerHTML = `
      <div class="post-onboarding-card">
        <div class="post-onboarding-title">프로필북을 먼저 작성해주세요</div>
        <button class="post-onboarding-btn" style="background:#E2FF74; color:#2D2A2B;" onclick="dismissLockedModal(); navigateTo('profile-setup-1');">프로필북 작성하기</button>
      </div>
    `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) dismissLockedModal(); // backdrop only, not the card
  });
  container.appendChild(modal);
};

// Blocks detail entry for 프로필북/모임 cards. Returns true when the caller
// should stop. Browsing paths must never call this.
window.blockedByProfileGate = function () {
  if (window.isProfileBookComplete()) return false;
  showLockedProfileModal();
  return true;
};

// 모임 탭 list cards route through here rather than calling openMeetupDetail
// directly, so the same meetup opened from a chat (메시지 탭) stays ungated.
window.openMeetupFromList = function (id) {
  if (window.blockedByProfileGate()) return;
  openMeetupDetail(id);
};

// Same gate for the sponsored cards that leave the app instead of opening a detail.
window.openMeetupLinkFromList = function (url) {
  if (window.blockedByProfileGate()) return;
  window.open(url, '_blank');
};

window.dismissLockedModal = function () {
  const modal = document.getElementById('locked-profile-modal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s';
    setTimeout(() => modal.remove(), 300);
  }
};

window.dismissPostOnboardingModal = function () {
  const modal = document.getElementById('post-onboarding-modal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s';
    setTimeout(() => modal.remove(), 300);
  }
};

window.skipSetupToDiscover = function () {
  switchTab('discover');
};

window.finalizeProfile = function () {
  window.profileComplete = true;
  writeGateFlag(PROFILE_BOOK_DONE_KEY); // survives reload even without a backend
  markBasicInfoComplete(); // fire-and-forget; unlocks gated tabs immediately, DB write is best-effort
  navigateTo('main');
  setTimeout(() => {
    switchTab('profile');
  }, 300);
};

// ── 성향 배지 (F/B/V) · 툴팁 ──────────────────────
// ----------------------------------------------------
window.getRoleBadgeHTML = function (role) {
  const code = getRoleCode(role);
  if (!code) return '';
  return `<div class="role-badge" onclick="event.stopPropagation(); showRoleTooltip(event, '${code}')">${ROLE_SHORT[code]}</div>`;
};

window.showRoleTooltip = function (event, role) {
  hideRoleTooltip();
  const tooltip = document.createElement('div');
  tooltip.className = 'role-tooltip';
  tooltip.id = 'role-tooltip';
  tooltip.innerText = ROLE_CODES.map(c => `${ROLE_SHORT[c]} ${ROLE_LABELS[c]}`).join(' · ');
  document.body.appendChild(tooltip);

  const rect = event.currentTarget.getBoundingClientRect();
  tooltip.style.top = (rect.top + window.scrollY - 36) + 'px';
  tooltip.style.left = (rect.left + rect.width / 2) + 'px';

  const timer = setTimeout(() => hideRoleTooltip(), 2500);
  tooltip.dataset.timerId = timer;

  const dismissHandler = (e) => {
    if (!tooltip.contains(e.target) && e.target !== event.currentTarget) {
      hideRoleTooltip();
      document.removeEventListener('pointerdown', dismissHandler);
    }
  };
  setTimeout(() => document.addEventListener('pointerdown', dismissHandler), 10);
};

window.hideRoleTooltip = function () {
  const existing = document.getElementById('role-tooltip');
  if (existing) {
    if (existing.dataset.timerId) clearTimeout(existing.dataset.timerId);
    existing.remove();
  }
};

// ══════════════════════════════════════════════════════════════
// 탭 & 모임
// 탭 전환, 모임 목록·상세·만들기, 내 프로필, 사진
// ══════════════════════════════════════════════════════════════

window.switchTab = function (tabName) {
  currentTab = tabName;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-tab') === tabName) item.classList.add('active');
  });

  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;
  contentArea.innerHTML = '';

  if (tabName === 'discover') {
    window.showLikedCollection = false;

    // On App Load / First Discover Visit: check weekly cadence
    if (!window.isDiscoverInitialized) {
      const weekTs = getWeeklyResetTimestamp();
      const storedTs = parseInt(localStorage.getItem('sp_week_start') || '0');
      const isNewWeek = storedTs !== weekTs;

      if (isNewWeek) {
        localStorage.setItem(P2_STORAGE_KEYS.weekStart, String(weekTs));
        localStorage.removeItem(P2_STORAGE_KEYS.viewedThisWeek);
        pagedSet.clear();
        passedSet.clear();
        savedBooks.length = 0;
      }

      // 덮은 책은 주가 바뀌어도 다시 배달되지 않는다. 무반응(그냥 넘김)과
      // 갈리는 지점이 여기다 — 그쪽은 아무 흔적도 남기지 않으므로 8주 쿨다운
      // 뒤 자연히 다시 후보에 든다.
      loadClosedBooks();
      const allProfiles = MOCK_PROFILES
        .map(profile => ({ id: 'p' + profile.id, type: 'profile', profile }))
        .filter(item => !closedBooks.has(item.id));
      dailyProfiles = seededShuffle(allProfiles, weekTs).slice(0, getWeeklyBookCount());
      browseQueue = [...dailyProfiles];

      // 이번 주 배달에 없는 항목은 목록에서 떨어뜨린다. 지난 주 잔재나
      // 예전 무작위 배달이 남긴 기록을 여기서 스스로 정리한다.
      const dealtIds = new Set(dailyProfiles.map(x => x.id));
      let restoredViewed = [];
      try { restoredViewed = JSON.parse(localStorage.getItem('sp_viewed_this_week') || '[]'); }
      catch (e) { restoredViewed = []; }
      window.weeklyViewedProfiles = Array.isArray(restoredViewed)
        ? restoredViewed.filter(x => x && dealtIds.has(x.id))
        : [];
      try { localStorage.setItem('sp_viewed_this_week', JSON.stringify(window.weeklyViewedProfiles)); }
      catch (e) { /* storage unavailable */ }
      window.isDiscoverInitialized = true;
      window.resetBridgeDismissed();
      setTimeout(() => {
        if (document.getElementById('post-onboarding-modal')) return; // Gate 1이 떠 있으면 양보
        maybeShowReactionsIntro();
      }, 400);
    }

    renderDiscoverTab();
  } else if (tabName === 'meetups') {
    window.showSavedMeetups = false;
    window._meetupSearchOpen = window._meetupSearchOpen || false;
    window._meetupSearchQuery = window._meetupSearchQuery || '';
    contentArea.innerHTML = `
        <div class="content-padding scroll-y" style="padding-top: 10px; height: calc(100vh - 80px); height: calc(100dvh - 80px); background: var(--bg-color);">
        ${getTabHeaderHTML('모임', '', `
          <button id="meetup-search-toggle" onclick="window._toggleMeetupSearch()" style="background: none; border: none; cursor: pointer; border-radius:50%; width:40px; height:40px; color: #9B72CC; display:flex; align-items:center; justify-content:center; transition: background 0.2s;">
            <i data-lucide="search" style="width: 22px; height: 22px;"></i>
          </button>
          <button id="meetup-collection-toggle" class="folder-heart-btn" style="background: none; border: none; cursor: pointer; border-radius:50%; width:40px; height:40px; color: #9B72CC; display:flex; align-items:center; justify-content:center; transition: background 0.2s;">
            <i data-lucide="archive" id="meetup-collection-toggle-icon" style="width: 24px; height: 24px;"></i>
          </button>
        `)}
        <div id="meetup-search-bar" style="display:${window._meetupSearchOpen ? 'block' : 'none'}; margin-bottom:12px;">
          <input id="meetup-search-input" type="text" value="${window._meetupSearchQuery}" placeholder="모임 검색..." oninput="window._onMeetupSearch(this.value)"
            style="width:100%; box-sizing:border-box; padding:10px 16px; border:1.5px solid #E0D8F0; border-radius:24px; font-size:14px; font-family:inherit; outline:none; background:#fff; color:#2C2C2A;">
        </div>
        <p class="tab-header-subtitle">같은 페이지의 사람들과 함께해요.</p>
        <div class="filter-section">
          <div class="filter-row">
            ${['전체', '서울', '경기', '부산', '대구', '인천', '광주', '대전', '제주'].map(loc =>
      `<div class="filter-chip ${meetupFilterLocation === loc ? 'selected' : ''}" onclick="toggleFilterChip(this, 'loc')">${loc}</div>`
    ).join('')}
          </div>
          <div class="filter-row">
            ${['전체', '✨ 소셜', '🎬 문화생활', '🏃 액티비티', '🍽️ 식도락', '📚 스터디', '🎨 크리에이티브', '🎟️ 행사', '🏘️ 커뮤니티'].map(cat =>
      `<div class="filter-chip ${meetupFilterCategory === cat ? 'selected' : ''}" onclick="toggleFilterChip(this, 'cat')">${cat}</div>`
    ).join('')}
          </div>
        </div>
        <div id="meetups-list-container"></div>
        ${getTabWatermarkHTML()}
      </div>
      <div class="fab-add" onclick="openCreateMeetupModal()"><i data-lucide="plus" style="width:24px; height:24px; color:#FFF;"></i></div>
    `;
    renderMeetupList();

    window._toggleMeetupSearch = function () {
      window._meetupSearchOpen = !window._meetupSearchOpen;
      const bar = document.getElementById('meetup-search-bar');
      if (bar) {
        bar.style.display = window._meetupSearchOpen ? 'block' : 'none';
        if (window._meetupSearchOpen) {
          const inp = document.getElementById('meetup-search-input');
          if (inp) { inp.value = window._meetupSearchQuery; setTimeout(() => inp.focus(), 50); }
        }
      }
    };

    window._onMeetupSearch = function (val) {
      window._meetupSearchQuery = val;
      renderMeetupList();
    };

    const _savedToggleBtn = document.getElementById('meetup-collection-toggle');
    if (_savedToggleBtn) {
      _savedToggleBtn.addEventListener('click', () => {
        window.showSavedMeetups = !window.showSavedMeetups;
        const icon = document.getElementById('meetup-collection-toggle-icon');
        if (icon) icon.style.color = window.showSavedMeetups ? '#9B72CC' : '';
        renderMeetupList();
      });
    }
  } else if (tabName === 'messages') {
    contentArea.innerHTML = `
      <div class="message-list" style="padding-top: 10px; display: flex; flex-direction: column; height: 100%;">
        <div class="tab-header-pad-x">
          ${getTabHeaderHTML('메시지', '', `<span style="font-size: 12px; color: #9B72CC; text-decoration: underline; cursor: pointer; font-weight: 600;" onclick="triggerPostMeetingCheckin()">p.M 체크인 테스트</span>`)}
        </div>
        
        <!-- Section 1: Matched Profiles -->
        <div style="display: flex; justify-content: space-between; align-items: baseline; padding-right: 24px;">
          <div class="matches-section-title" style="margin-bottom: 0;">새로운 매치</div>
          <div onclick="openAllMatchesGrid()" style="font-size: 13px; color: #9B72CC; font-weight: 600; cursor: pointer;">전체 보기 →</div>
        </div>
        <div class="matches-scroll-container" style="margin-top: 12px;">
          ${MATCHED_PROFILES.map(match => {
      const p = MOCK_PROFILES.find(pr => pr.id === match.id) || MOCK_PROFILES[0];
      const spineColor = getMatchSpineColor(p.id);
      return `
            <div class="match-thumbnail-wrap" onclick="openMatchIntroModal(${match.id})">
              <div class="match-thumbnail saved-book-cover" style="box-shadow:-2px 0 4px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.18); border-radius:4px; border-left:3px solid ${spineColor};">
                <div class="book-bg-photo" style="background-image: url('${p.image}'); filter: blur(1.5px); transform: scale(1.08);"></div>
                <div class="book-overlay"></div>
                <div style="position:absolute; top:0; left:0; width:100%; height:40%; background:linear-gradient(to bottom, rgba(0,0,0,0.4), transparent); z-index:3;"></div>
                <div style="position:absolute; bottom:0; left:0; width:100%; height:35%; background:linear-gradient(to top, rgba(0,0,0,0.4), transparent); z-index:3;"></div>
                <div class="thumbnail-card-content">
                  <div class="thumbnail-nickname" style="font-family:'Noto Serif KR',serif; font-size:13px; font-weight:400; top:40%; transform:translateY(-50%); padding:0 4px 0 10px; text-shadow:0 1px 4px rgba(0,0,0,0.5);">${p.name}</div>
                </div>
              </div>
              <div class="match-thumbnail-heart">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              ${match.isNew ? `<div class="match-new-dot"></div>` : ''}
            </div>
          `;
    }).join('')}
        </div>

        <!-- Section 2: Conversation List -->
        <div class="matches-section-title" style="margin-top: 0;">대화 중</div>
        <div style="flex: 1; overflow-y: auto; padding-bottom: 40px;">
          ${MOCK_CHATS.map(chat => {
      if (chat.type === 'group') {
        const partCount = (chat.participants || []).length + 1;
        const _mi = MOCK_MEETUPS.find(x => x.id === chat.meetupId);
        const _em = { '소셜':'✨','문화생활':'🎬','액티비티':'🏃‍♀️','식도락':'🍽️','스터디':'📚','크리에이티브':'🎨','행사':'🎟️','커뮤니티':'🏘️' };
        let _icon = '👥';
        if (_mi && _mi.type) { for (const [k,v] of Object.entries(_em)) { if (_mi.type.includes(k)) { _icon=v; break; } } }
        return `
              <div class="message-item" onclick="openChat('${chat.id}')">
                <div class="msg-avatar" style="background:#EDE0FF; display:flex; align-items:center; justify-content:center; font-size:22px; background-image:none;">${_icon}</div>
                <div class="msg-info">
                  <div class="msg-header-row">
                    <span class="msg-name" style="display:flex; align-items:center; gap:6px;">
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${chat.title}</span>
                      <span class="card-age" style="font-size:13px; font-weight:400; color:var(--text-muted);flex-shrink:0;">${partCount}명</span>
                    </span>
                    <span class="msg-time">${chat.time}</span>
                  </div>
                  <div class="msg-preview" style="${chat.unread ? 'font-weight:700; color:#333;' : ''}">${chat.preview}</div>
                </div>
              </div>
            `;
      }
      const p = MOCK_PROFILES.find(pr => pr.name === chat.name);
      return `
              <div class="message-item" onclick="openChat(${chat.id})">
                <div class="msg-avatar" style="background-image: url('${chat.image}')"></div>
                <div class="msg-info">
                  <div class="msg-header-row">
                    <span class="msg-name" style="display:flex; align-items:center; gap:6px;">
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${chat.name}</span>
                      <span class="card-age" style="font-size:14px; font-weight:400; color:var(--text-muted);flex-shrink:0;">${getAge(p ? p.birthYear : 2001)}</span>
                      ${chat.isNew ? '<span class="msg-badge msg-badge-new" style="flex-shrink:0;">NEW</span>' : ''}
                      ${chat.isUnread ? '<span class="msg-badge msg-badge-unread" style="flex-shrink:0;">UNREAD</span>' : ''}
                    </span>
                    <span class="msg-time">${chat.time}</span>
                  </div>
                  <div class="msg-preview" style="${chat.isUnread ? 'font-weight:700; color:#333;' : ''}">${chat.preview}</div>
                </div>
              </div>
            `;
    }).join('')}
          ${getTabWatermarkHTML()}
        </div>
      </div>
    `;
  } else if (tabName === 'profile') {
    // 기본 화면은 남들이 보는 그 화면이다. 편집은 "수정"으로 따로 들어간다.
    contentArea.innerHTML = `
      <div class="scroll-y" style="height: calc(100vh - 84px); height: calc(100dvh - 84px);">
        <div class="tab-header-row" style="padding: 10px 24px 0;">
          <h2>내 프로필북</h2>
          <div class="tab-header-icons">
            <button type="button" class="profile-edit-btn" onclick="window.openMyProfileEdit()">
              <i data-lucide="pencil" style="width:15px; height:15px;" aria-hidden="true"></i>
              수정
            </button>
            <button type="button" class="profile-settings-btn" aria-label="설정" onclick="window.openSettingsPage()">
              <i data-lucide="settings" style="width:24px; height:24px;" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        ${getProfileDetailedHTML(buildMyProfileObject(), false, true)}
        ${getTabWatermarkHTML()}
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initPhotoCarousels();
    const previewGrid = document.getElementById('my-answers-grid');
    if (previewGrid) {
      previewGrid.innerHTML = renderAnswersGrid(MY_ANSWERS, false, 'preview');
      bindCardInteractions();
    }
  } else if (tabName === 'notifications') {
    // 예약해둔 48h·24h 리마인드 중 시점이 지난 것을 목록에 올린다.
    window.flushDueJoinReminders();
    contentArea.innerHTML = `
        <div class="content-padding scroll-y" style="padding-top: 10px; height: calc(100vh - 80px); height: calc(100dvh - 80px); background: var(--bg-color);">
        ${getTabHeaderHTML('알림', '', '')}
        <div class="notif-list">
          ${DUMMY_NOTIFICATIONS.length === 0
        ? '<div class="notif-empty">아직 알림이 없어요</div>'
        : DUMMY_NOTIFICATIONS.map(n => `
              <div class="notif-item${n.unread ? ' unread' : ''}">
                <span class="notif-icon">${n.icon}</span>
                <div class="notif-body">
                  <div class="notif-text">${n.text}</div>
                  <div class="notif-time">${n.time}</div>
                </div>
              </div>`).join('')
      }
        </div>
        ${getTabWatermarkHTML()}
      </div>
    `;
  }

  // No tab-level gate: 발견/모임 lists stay fully browsable and 메시지 is never
  // gated. Gating happens only on detail entry — see blockedByProfileGate().

  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ── 모임 목록 렌더링 ────────────────────────────────────────
function formatCardDate(dateStr) {
  if (!dateStr) return dateStr;
  // Structured format from submitCreateMeetup: "2026년 5월 25일 (월) 오후 7시 00분"
  const full = dateStr.match(/\d+년\s*(\d+)월\s*(\d+)일\s*\(([^)]+)\)\s*(오전|오후|정오)\s*(\d+)시(?:\s*(\d+)분)?/);
  if (full) {
    const [, month, day, wd, ampm, h, m] = full;
    const hour = parseInt(h);
    const min = parseInt(m || '0');
    const h24 = ampm === '오전' ? hour : ampm === '정오' ? 12 : hour + 12;
    const tod = h24 <= 8 ? '아침' : h24 <= 11 ? '오전' : h24 <= 13 ? '낮' : h24 <= 17 ? '오후' : h24 <= 20 ? '저녁' : '밤';
    return `${month}/${day} (${wd}) ${tod} ${hour}시${min === 30 ? ' 반' : ''}`;
  }
  // Free-form strings: convert 오전/오후 → time-of-day label, 요일 short form
  const WD = { '월요일': '(월)', '화요일': '(화)', '수요일': '(수)', '목요일': '(목)', '금요일': '(금)', '토요일': '(토)', '일요일': '(일)' };
  return dateStr
    .replace(/오전\s*(\d+)시/g, (_, h) => { const hr = parseInt(h); return `${hr <= 8 ? '아침' : '오전'} ${hr}시`; })
    .replace(/오후\s*(\d+)시/g, (_, h) => { const hr = parseInt(h); return `${hr <= 1 ? '낮' : hr <= 5 ? '오후' : hr <= 8 ? '저녁' : '밤'} ${hr}시`; })
    .replace(/정오\s*12시/g, '낮 12시')
    .replace(/월요일|화요일|수요일|목요일|금요일|토요일|일요일/g, d => WD[d] || d);
}
window.formatCardDate = formatCardDate;

window.renderMeetupList = function () {
  const container = document.getElementById('meetups-list-container');
  if (!container) return;

  let filtered = MOCK_MEETUPS.filter(m => {
    if (m.cancelled) return false; // 취소된 모임은 목록에서 빠진다
    if (window.isMeetupBlocked(m)) return false; // 차단 관계가 걸린 모임은 존재 자체를 감춘다
    let locMatch = meetupFilterLocation === '전체' || m.fullAddress.includes(meetupFilterLocation);
    let catMatch = meetupFilterCategory === '전체' || m.type === meetupFilterCategory || m.secondaryType === meetupFilterCategory;
    return locMatch && catMatch;
  });

  if (window.showSavedMeetups) {
    filtered = MOCK_MEETUPS.filter(m => m.isSaved && !m.cancelled && !window.isMeetupBlocked(m));
  }

  const _sq = (window._meetupSearchQuery || '').trim().toLowerCase();
  if (_sq) {
    filtered = filtered.filter(m =>
      (m.title || '').toLowerCase().includes(_sq) ||
      (m.desc || '').toLowerCase().includes(_sq) ||
      (m.tags || []).some(tag => tag.toLowerCase().includes(_sq))
    );
  }

  if (filtered.length === 0) {
    const msg = window.showSavedMeetups
      ? `아직 관심 모임이 없어요.<br/>마음에 드는 모임을 저장해보세요! 🔖`
      : `해당하는 모임이 없어요 🌙<br/>다른 지역이나 카테고리를 선택해보세요`;

    container.innerHTML = `
       <div class="discover-empty show fade-in" style="margin-top: 40px; height: 200px;">
         ${!window.showSavedMeetups ? `<i data-lucide="moon" style="width: 48px; height: 48px; color: var(--text-muted); opacity: 0.5; margin-bottom: 16px;"></i>` : ''}
         <p style="font-size: 15px;">${msg}</p>
       </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }
  container.innerHTML = filtered.map(m => {
    if (m.type.includes('행사') && m.isAd === true) {
      const clickAction = m.linkType !== 'internal' && m.externalUrl
        ? `openMeetupLinkFromList('${m.externalUrl}')`
        : `openMeetupFromList(${m.id})`;
      const posterUrl = m.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
      return `
            <div class="meetup-item fade-in" style="overflow: hidden; border: none; position: relative; aspect-ratio: 4/5; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;" onclick="${clickAction}">
              <img src="${posterUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: top; z-index: 1;" />
              
              <!-- Bottom gradient overlay -->
              <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 50%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); z-index: 2; pointer-events: none;"></div>
              
              <!-- Top Right Icons -->
              <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; align-items: center; z-index: 3;">
                <div class="meetup-share-btn" onclick="event.stopPropagation(); window.openMeetupShareSheet(${m.id})" style="position: static; color: white; background: rgba(0,0,0,0.2); backdrop-filter: blur(8px); border-radius: 50%; padding: 6px; display: flex; align-items: center; justify-content: center;">
                  <i data-lucide="share" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="meetup-bookmark-btn" id="bm-${m.id}" onclick="event.stopPropagation(); toggleBookmark(${m.id})" style="position: static; color: white; background: rgba(0,0,0,0.2); backdrop-filter: blur(8px); border-radius: 50%; padding: 6px; display: flex; align-items: center; justify-content: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="${window.bookmarkedMoims && window.bookmarkedMoims[m.id] ? 'white' : 'none'}">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
              </div>

              <!-- Top Left Header (Chip & Badge) -->
              <div style="position: relative; z-index: 3;">
                <div class="meetup-header" style="display: flex; align-items: center; justify-content: flex-start; gap: 8px;">
                  <div class="meetup-chip" style="background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); color: white;">${m.type}</div>
                  ${m.secondaryType ? `<div class="meetup-chip" style="background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); color: rgba(255,255,255,0.8); padding: 4px 8px;">+</div>` : ''}
                  ${m.isAd ? `<div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.4); color: rgba(255,255,255,0.7); font-size: 9px; border-radius: 999px; padding: 1px 5px;">AD</div>` : ''}
                </div>
              </div>

              <!-- Bottom info -->
              <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 20px 24px 24px; z-index: 3; display: flex; align-items: flex-end; justify-content: space-between;">
                <div style="flex: 1; padding-right: 12px;">
                  ${m.showTextInfo ? `
                    <div style="color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600; margin-bottom: 6px;">${getFeedDateString(m)}</div>
                    <div style="color: white; font-size: 20px; font-weight: 600; margin-bottom: 4px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${m.title}</div>
                    <div style="color: rgba(255,255,255,0.8); font-size: 13px; margin-bottom: 2px;">📍 ${m.shortLocation}</div>
                  ` : ''}
                </div>
                <button class="rsvp-btn" onclick="event.stopPropagation(); ${clickAction}" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); flex-shrink: 0; backdrop-filter: blur(4px); margin: 0; font-size: 18px;">→</button>
              </div>
            </div>
      `;
    }

    if (m.type.includes('커뮤니티')) {
      const organizers = m.organizers && m.organizers.length > 0 ? m.organizers : (m.hostImage ? [m.hostImage] : ["https://i.pravatar.cc/150?img=1"]);
      const hostAvatarHtml = organizers.slice(0, 3).map(url => `<div class="attendee-avatar" style="background-image:url('${url}'); background-size:cover; background-position:center top;"></div>`).join('');
      const communityTags = (m.tags || []).map(t => t.startsWith('#') ? t : '#' + t).join('  ');
      const ageDisplay = m.ageRange
        ? `<div style="font-size:13px; color:var(--text-muted); margin-bottom:6px; display:flex; align-items:center; gap:4px;"><i data-lucide="users" style="width:14px;height:14px;stroke:#888;flex-shrink:0;"></i>${m.ageRange}</div>`
        : `<div style="font-size:13px; color:var(--text-muted); margin-bottom:6px; display:flex; align-items:center; gap:4px;"><i data-lucide="users" style="width:14px;height:14px;stroke:#888;flex-shrink:0;"></i>연령 무관</div>`;
      return `
            <div class="meetup-item fade-in" onclick="openMeetupFromList(${m.id})">
              <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; align-items: center; z-index: 3;">
                <div class="meetup-share-btn" onclick="event.stopPropagation(); window.openMeetupShareSheet(${m.id})" style="position: static; color: #9B72CC; background: none;">
                  <i data-lucide="share" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="meetup-bookmark-btn" id="bm-${m.id}" onclick="event.stopPropagation(); toggleBookmark(${m.id})" style="position: static; color: #9B72CC; background: none;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" stroke="#9B72CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="${window.bookmarkedMoims[m.id] ? '#9B72CC' : 'none'}"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>
              </div>
              <div class="meetup-header">
                <div style="display:flex; gap:8px;">
                  <div class="meetup-chip">${m.type}</div>
                  ${m.secondaryType ? `<div class="meetup-chip" style="color:var(--text-muted); background:rgba(0,0,0,0.04);">${m.secondaryType}</div>` : ''}
                </div>
              </div>
              <div>
                <div class="meetup-title">${m.title}</div>
                ${ageDisplay}
                ${communityTags ? `<div style="font-size:12px; color:#9B7FD4; margin-top:4px; line-height:1.8;">${communityTags}</div>` : ''}
              </div>
              <div class="meetup-footer" style="margin-top:16px;">
                <div class="attendee-stack">${hostAvatarHtml}</div>
                <button class="rsvp-btn" onclick="event.stopPropagation(); openMeetupFromList(${m.id})">더 보기 →</button>
              </div>
            </div>
      `;
    }

    const capPercent = (m.currentCap / m.maxCap) * 100;
    const isEndingSoon = (m.currentCap / m.maxCap) >= 0.8 && m.currentCap < m.maxCap;
    const isFull = m.currentCap >= m.maxCap;
    return `
            <div class="meetup-item fade-in ${(!window.isMeetupHost(m) && window.getJoinStatus(m.id) !== 'none') ? 'meetup-item-rsvpd' : ''}" onclick="openMeetupFromList(${m.id})">
              <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; align-items: center; z-index: 3;">
                <div class="meetup-share-btn" onclick="event.stopPropagation(); window.openMeetupShareSheet(${m.id})" style="position: static; color: #9B72CC; background: none;">
                  <i data-lucide="share" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="meetup-bookmark-btn" id="bm-${m.id}" onclick="event.stopPropagation(); toggleBookmark(${m.id})" style="position: static; color: #9B72CC; background: none;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" stroke="#9B72CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="${window.bookmarkedMoims[m.id] ? '#9B72CC' : 'none'}">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
              </div>
              <div class="meetup-header">
                <div style="display:flex; gap:8px;">
                  <div class="meetup-chip">${m.type}</div>
                  ${m.secondaryType ? `<div class="meetup-chip" style="color:var(--text-muted); background: rgba(0,0,0,0.04);">+</div>` : ''}
                </div>
              </div>
              <div>
                <div class="meetup-date">${getFeedDateString(m)}</div>
                <div class="meetup-title">${m.title}</div>
                <div class="meetup-location-preview" style="display:flex; align-items:center;"><i data-lucide="map-pin" style="width:14px;height:14px;stroke:#888;flex-shrink:0;margin-right:4px;"></i>${m.shortLocation}</div>
                <div class="meetup-desc">${m.desc}</div>
              </div>
              <div style="margin-top: 16px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); font-weight:600;">
                  <span>${m.currentCap}/${m.maxCap}명 ${isEndingSoon ? `<span class="meetup-ending-soon-badge">마감 임박</span>` : ''}</span>
                  ${(() => {
                    // hasRSVPd가 아니라 실제 참여 상태에서 읽는다. 둘이 어긋나면
                    // (예: 호스트 모임) 없는 상태가 배지로 나온다.
                    if (window.isMeetupHost(m)) return '';
                    const st = window.getJoinStatus(m.id);
                    if (st === 'none') return '';
                    const label = st === 'confirmed'
                      ? (window.MEETUP_APPROVAL_ENABLED ? '참여 확정' : '참여 예정')
                      : '승인 대기 중';
                    return `<span style="color:var(--primary); display:inline-flex; align-items:center;"><span style="display:inline-block; width:6px; height:6px; background:var(--primary); border-radius:50%; margin-right:6px;"></span>${label}</span>`;
                  })()}
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${capPercent}%;"></div>
                </div>
              </div>
              <div class="meetup-footer">
                <div class="attendee-stack">
                   ${(m.participants || []).slice(0, 5).map(url => `<div class="attendee-avatar" style="background-image:url('${url}');background-size:cover;background-position:center top;"></div>`).join('')}
                   ${m.currentCap > 5 ? `<div style="font-size: 12px; color: var(--text-muted); margin-left: 8px; line-height: 28px;">+${m.currentCap - 5}</div>` : ''}
                </div>
                ${(() => {
                  const host = window.isMeetupHost(m);
                  const st = host ? 'none' : window.getJoinStatus(m.id);
                  const joined = st !== 'none';
                  if (isFull && !joined && !host) return `<button class="rsvp-btn" disabled>마감</button>`;
                  const label = host ? '내 모임 →'
                    : st === 'confirmed' ? (window.MEETUP_APPROVAL_ENABLED ? '참여 확정 ✓' : '참여 완료 ✓')
                    : st === 'pending' ? '승인 대기 중'
                    : '더 보기 →';
                  return `<button class="rsvp-btn ${joined ? 'rsvpd' : ''}" onclick="event.stopPropagation(); openMeetupFromList(${m.id})">${label}</button>`;
                })()}
              </div>
            </div>
          `;
  }).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ── 챕터 메타 · 답변 그리드 ──────────────────────────────
function getLikedBadgeHTML(pageId) {
  const isLiked = window.likedPages && window.likedPages[pageId];
  return `<span class="card-liked-badge" style="visibility: ${isLiked ? 'visible' : 'hidden'}; position: absolute; bottom: 8px; right: 8px; font-size: 10px; color: #888; pointer-events: none;">♥</span>`;
}

// Chapter names + the particle that follows them, so the lock copy reads
// naturally ("나를 채우면" / "사랑을 채우면").
const CHAPTER_META = {
  1: { label: '나', particle: '를' },
  2: { label: '사랑', particle: '을' },
  3: { label: '관계', particle: '를' },
};

// Reciprocity gate: you can read someone else's chapter only once you've
// started your own. Judged purely on MY_ANSWERS, so the verdict is the same
// no matter whose profile book is open. One answer is enough to unlock.
window.isChapterUnlockedForViewer = function (chapNum) {
  const chapQuestions = QUESTIONS.filter(q => q.chapter === chapNum);
  return chapQuestions.some(q => MY_ANSWERS[q.id]);
};

window.renderAnswersGrid = function (answersObj, isCurrentUser, profileId, profileObj) {
  let html = '';
  const chapColors = { 1: '#F0F7D4', 2: '#F7EDE3', 3: '#EDE3F5' };

  // The viewer lock only ever applies to someone else's book. 'myProfile' is
  // the profile tab, 'preview' is my own book seen as others would see it —
  // both render with isCurrentUser false but must never be locked.
  const isOtherPersonsBook = !isCurrentUser && profileId !== 'myProfile' && profileId !== 'preview';
  const chap1 = QUESTIONS.filter(q => q.chapter === 1);
  const chap2 = QUESTIONS.filter(q => q.chapter === 2);
  const chap3 = QUESTIONS.filter(q => q.chapter === 3);

  // Chapter-view gate (skeleton) — when viewing someone else's profile,
  // a chapter with zero answers gets a placeholder instead of the section
  // just silently disappearing. Prefers profileObj.chapterProgress[cN] as
  // the answer-count source of truth when a profile object is passed in;
  // otherwise falls back to counting answersObj directly (e.g. self-preview).
  const isChapterLocked = (chapNum) => {
    if (isCurrentUser) return false;
    const progressVal = profileObj?.chapterProgress?.[`c${chapNum}`];
    if (progressVal !== undefined) return progressVal === 0;
    const group = chapNum === 1 ? chap1 : chapNum === 2 ? chap2 : chap3;
    return group.every(q => !answersObj[q.id]);
  };

  const renderGroup = (group, chapTitle, chapNum) => {
    const dividerHtml = `<div class="grid-chapter-divider" style="grid-column: 1 / -1; margin-top: ${chapTitle.includes('Chapter 1') ? '0' : '24px'};">${chapTitle}</div>`;

    // They haven't written this chapter — nothing to gate.
    if (isChapterLocked(chapNum)) {
      return `
        ${dividerHtml}
        <div class="chapter-locked-placeholder" style="grid-column: 1 / -1;">아직 작성되지 않았어요</div>
      `;
    }

    // They wrote it, but I haven't started mine yet.
    const viewerLocked = isOtherPersonsBook && !window.isChapterUnlockedForViewer(chapNum);

    let visibleQuestions = group;
    if (!isCurrentUser) visibleQuestions = group.filter(q => answersObj[q.id]);
    if (visibleQuestions.length === 0) return '';
    let gHtml = '';
    visibleQuestions.forEach((q) => {
      const ans = answersObj[q.id];
      const pidStr = (profileId === 'myProfile' || profileId === 1) ? 'myProfile' : `user${profileId}`;
      const pageId = `${pidStr}_Q${q.id}`;
      if (ans) {
        if (isCurrentUser) {
          const chapBg = chapColors[q.chapter] || '#FAFAF8';
          gHtml += `
            <div class="grid-square answered-text answer-card-thumb interactable"
                 data-page-id="${pageId}"
                 style="border-radius:12px; background: ${chapBg};">
               <div class="q-num" style="position:absolute; top:10px; left:10px; color:#aaa;">Q.${q.id}</div>
               <div class="answer-preview" style="color:#555; padding: 28px 10px 10px 10px; text-align:left; width:100%; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden;">${applyHighlights(formatAnswerText(ans.text, q))}</div>
               ${getLikedBadgeHTML(pageId)}
            </div>
          `;
        } else {
          const bgStyle = ans.polaroid ? `background-image: url('${ans.polaroid}'); background-size: cover; background-position: center; filter: blur(12px) brightness(0.85);` : '';
          const chapBg = chapColors[q.chapter] || '#FAFAF8';
          gHtml += `
            <div ${viewerLocked ? '' : `data-page-id="${pageId}"`} class="teaser-card" style="background: ${chapBg};">
               ${ans.polaroid ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; ${bgStyle} z-index:1;"></div>` : ''}
               <div class="teaser-frosted-overlay"></div>
               <div class="teaser-q-num ${ans.polaroid ? 'on-dark' : ''}" style="z-index:2;">Q.${q.id}</div>
               <div class="teaser-q-text ${ans.polaroid ? 'on-dark' : ''}" style="z-index:2;">${q.text}</div>
               ${getLikedBadgeHTML(pageId)}
            </div>
          `;
        }
      } else if (isCurrentUser) {
        gHtml += `
            <div class="grid-square unanswered answer-card-thumb empty interactable" data-input-qid="${q.id}">
               <span class="q-num">Q.${q.id}</span>
               <span class="q-text">${q.text}</span>
            </div>
          `;
      }
    });

    if (!viewerLocked) return dividerHtml + gHtml;

    const { label, particle } = CHAPTER_META[chapNum] || { label: '', particle: '을' };
    return `
      ${dividerHtml}
      <div class="chapter-viewer-lock" style="grid-column: 1 / -1;">
        <div class="chapter-viewer-lock-cards" aria-hidden="true">${gHtml}</div>
        <div class="chapter-viewer-lock-veil">
          <svg class="chapter-viewer-lock-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <p class="chapter-viewer-lock-text">Chapter ${chapNum} · ${label}${particle} 채우면<br/>이 챕터를 볼 수 있어요</p>
          <p class="chapter-viewer-lock-sub">한 문장이면 충분해요. 천천히 채워도 괜찮아요 🌙</p>
          <button class="chapter-viewer-lock-btn" onclick="goToMyChapters()">지금 답변하러 가기</button>
        </div>
      </div>
    `;
  };
  html += renderGroup(chap1, 'Chapter 1 · 나', 1);
  html += renderGroup(chap2, 'Chapter 2 · 사랑', 2);
  html += renderGroup(chap3, 'Chapter 3 · 관계', 3);

  return html;
};


// ── 답변 입력 모달 — 저장 · 선택지 ────────────────────
// ----------------------------------------------------
// MODALS LOGIC
// ----------------------------------------------------
function getModalContainer() {
  let dc = document.getElementById('modal-container');
  if (!dc) {
    dc = document.createElement('div');
    dc.id = 'modal-container';
    document.getElementById('app-container').appendChild(dc);
  }
  return dc;
}

window.openInputModal = function (qId) {
  const q = QUESTIONS.find(x => x.id === qId);
  const mc = getModalContainer();
  if (typeof myAnswers === 'undefined' || myAnswers === null) {
    myAnswers = {};
  }
  console.log('question type:', q.type, q.id);
  let chapTitle = "";
  if (q.chapter === 1) chapTitle = "Chapter 1. 내가 생각하는 나";
  if (q.chapter === 2) chapTitle = "Chapter 2. 내가 생각하는 사랑";
  if (q.chapter === 3) chapTitle = "Chapter 3. 내가 생각하는 우리의 미래";

  let inputHTML = '';
  const existingAns = myAnswers[qId] ? myAnswers[qId].text : '';

  if (q.type === 'text') {
    inputHTML = `<textarea id="ans-${q.id}" class="input-field" style="height: 140px; resize: none; border-radius: 12px; font-size: 16px;" placeholder="편안하게 당신의 이야기를 들려주세요.">${existingAns || ''}</textarea>`;
  } else if (q.type === 'choice') {
    inputHTML = `<div class="choice-section" id="ans-${q.id}">
        ${q.options.map(opt => `<button class="choice-btn ${existingAns === opt ? 'selected' : ''}" onclick="toggleChoice(this)">${opt}</button>`).join('')}
      </div>`;
  } else if (q.type === 'multiple-choice') {
    const selected = Array.isArray(existingAns) ? existingAns : [];
    inputHTML = `
        <div style="font-size:13px; color:#999; margin-bottom:12px;">정확히 ${q.limit}개를 선택해주세요.</div>
        <div class="choice-group" id="ans-${q.id}" data-limit="${q.limit}" style="display:flex; flex-wrap:wrap; gap:8px;">
          ${q.options.map(opt => `<button class="choice-pill ${selected.includes(opt) ? 'selected' : ''}" onclick="toggleMultipleChoice(this, '${opt}', ${q.limit})" style="padding:8px 14px; border-radius:100px; border:1px solid #eee; background:#FAFAF8; font-size:14px; color:#666; transition:0.2s;">${opt}</button>`).join('')}
        </div>`;
  } else if (q.type === 'compound') {
    const answers = typeof existingAns === 'object' ? existingAns : {};
    inputHTML = `<div id="ans-${q.id}">`;
    q.subQuestions.forEach(sq => {
      const labelHTML = sq.text ? `<p class="choice-label">${sq.text}</p>` : '';
      inputHTML += `<div class="choice-section">${labelHTML}`;
      if (sq.type === 'ab-choice') {
        inputHTML += `<div class="sub-q-group sub-q" data-sqid="${sq.id}">
            ${sq.options.map(opt => `<button class="choice-btn ${answers[sq.id] === opt ? 'selected' : ''}" onclick="toggleChoice(this)">${opt}</button>`).join('')}
          </div>`;
      } else if (sq.type === 'multiple-choice') {
        const selArr = Array.isArray(answers[sq.id]) ? answers[sq.id] : [];
        inputHTML += `<div style="font-size:13px; color:#999; margin-bottom:12px;">정확히 ${sq.limit}개를 선택해주세요.</div>
          <div class="choice-group sub-q" data-sqid="${sq.id}" data-limit="${sq.limit}" style="display:flex; flex-wrap:wrap; gap:8px;">
            ${sq.options.map(opt => `<button class="choice-pill ${selArr.includes(opt) ? 'selected' : ''}" onclick="toggleMultipleChoice(this, '${opt}', ${sq.limit})" style="padding:8px 14px; border-radius:100px; border:1px solid #eee; background:#FAFAF8; font-size:14px; color:#666; transition:0.2s;">${opt}</button>`).join('')}
          </div>`;
      } else if (sq.type === 'choice') {
        inputHTML += `<div class="sub-q-group sub-q" data-sqid="${sq.id}">
            ${sq.options.map(opt => `<button class="choice-btn ${answers[sq.id] === opt ? 'selected' : ''}" onclick="toggleChoice(this)">${opt}</button>`).join('')}
          </div>`;
      } else if (sq.type === 'text') {
        const ph = sq.placeholder || '답변을 입력해주세요.';
        inputHTML += `<textarea class="input-field sub-q" data-sqid="${sq.id}" style="height: 100px; resize: none; border-radius: 10px; font-size: 15px;" placeholder="${ph}">${answers[sq.id] || ''}</textarea>`;
      }
      inputHTML += `</div>`;
    });
    inputHTML += `</div>`;
  }

  mc.innerHTML = `
  <div class="modal fade-in active" style="z-index: 100; background: var(--surface);">
    <div class="app-header" style="background:var(--surface);">
      <button class="back-btn" onclick="closeModal()"><i data-lucide="x"></i></button>
      <div style="font-weight:600; font-size:16px;">답변 작성</div>
      <div style="width:32px;"></div>
    </div>
    <div class="content-padding scroll-y">
      <div style="font-size:13px; color:var(--primary); font-weight:600; margin-bottom:12px;">${chapTitle}</div>
      <h2 style="font-size:20px; margin-bottom:24px; line-height:1.4;">Q${q.id}. ${q.text}</h2>
      <div id="modal-input-container" style="margin-bottom:32px;">
        ${inputHTML}
      </div>
      <button class="btn-primary" onclick="saveAnswer(${q.id})">저장하기</button>
      <div style="text-align:center; margin-top:24px;">
        <span style="color:var(--text-muted); font-size:14px; text-decoration:underline; cursor:pointer;" onclick="closeModal()">건너뛰기</span>
      </div>
    </div>
  </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.toggleChoice = function (btn) {
  const section = btn.closest('.choice-section') || btn.closest('.choice-group');
  section.querySelectorAll('.choice-btn, .choice-pill').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

window.toggleMultipleChoice = function (btn, val, limit) {
  const group = btn.closest('.choice-group');
  const selected = group.querySelectorAll('.choice-pill.selected');
  if (!btn.classList.contains('selected') && selected.length >= limit) {
    // already reached limit, ignore or replace first? Let's just ignore for now
    return;
  }
  btn.classList.toggle('selected');
}

window.saveAnswer = function (qId) {
  const q = QUESTIONS.find(x => x.id === qId);
  let val = null;

  if (q.type === 'text') {
    val = document.getElementById(`ans-${q.id}`).value.trim();
  } else if (q.type === 'choice') {
    const selected = document.querySelector(`#ans-${q.id} .choice-btn.selected, #ans-${q.id} .choice-pill.selected`);
    val = selected ? selected.innerText : null;
  } else if (q.type === 'multiple-choice') {
    const selectedDots = document.querySelectorAll(`#ans-${q.id} .choice-pill.selected`);
    val = Array.from(selectedDots).map(d => d.innerText);
  } else if (q.type === 'compound') {
    val = {};
    document.querySelectorAll(`#ans-${q.id} .sub-q`).forEach(el => {
      const sqid = el.dataset.sqid;
      if (el.tagName === 'TEXTAREA') {
        val[sqid] = el.value.trim();
      } else if (el.dataset.limit) {
        const pills = el.querySelectorAll('.choice-pill.selected');
        val[sqid] = Array.from(pills).map(p => p.innerText);
      } else {
        const sel = el.querySelector('.choice-btn.selected, .choice-pill.selected');
        val[sqid] = sel ? sel.innerText : null;
      }
    });
    if (Object.values(val).every(v => !v || (Array.isArray(v) && v.length === 0))) val = null;
  }

  if (val !== null) {
    myAnswers[qId] = { text: val };
    persistMyAnswers();
  }
  closeModal();

  // 챕터 목록에서 들어왔다면 그리로 돌아간다 — 목록 → 문항 → 목록.
  if (window.__returnToChapterList) {
    window.returnToChapterList();
    return;
  }

  const _grid = document.getElementById('my-answers-grid');
  if (_grid) {
    renderMyProfile();
  }
}

// ── 내 프로필 — 기본 정보 · 상세 HTML ────────────
window.renderMyProfile = function () {
  const _grid = document.getElementById('my-answers-grid');
  if (!_grid) return;
  // 프로필 탭 그리드는 감상용 렌더다. 저장 후 재렌더에서 편집 스타일로
  // 되돌리면 탭을 다시 밟기 전까지 화면이 달라 보인다 — 진입 시와 같은 인자로.
  _grid.innerHTML = renderAnswersGrid(MY_ANSWERS, false, 'preview');
  bindCardInteractions();
}

// "나에 대해" 8항목. 전부 자유 텍스트다 — 선택형으로 가두면 MBTI를 안 쓰는
// 사람이나 "가끔 마셔요" 같은 답을 담을 자리가 없어진다.
const ABOUT_ME_FIELDS = [
  { key: 'style', label: '내 스타일', placeholder: '예) 긴머리 차분 163', required: true },
  { key: 'ideal', label: '이상형', placeholder: '예) 웃는 모습이 매력적인 사람', required: true },
  { key: 'drink', label: '주량', placeholder: '예) 가끔 한두 잔', required: true },
  { key: 'smoke', label: '흡연 여부', placeholder: '예) 비흡연', required: true },
  { key: 'mbti', label: 'MBTI', placeholder: '예) INFJ', required: false },
  { key: 'saju', label: '사주 일주', placeholder: '예) 갑자일주', required: false },
  { key: 'religion', label: '종교', placeholder: '예) 무교', required: false },
  { key: 'job', label: '직업군', placeholder: '예) 디자인', required: false },
];
window.ABOUT_ME_FIELDS = ABOUT_ME_FIELDS;

window.renderBasicInfoRows = function (p, isMine, isPreview = false) {
  const fields = ABOUT_ME_FIELDS.map(f => ({ ...f, value: p.aboutMe?.[f.key] }));

  let html = '';
  fields.forEach((f, idx) => {
    const hasValue = f.value && f.value.trim() !== '';

    if (!isMine) {
      // Visitor or Preview view: only show if has value
      if (!hasValue) return;
    }

    const displayValue = hasValue ? f.value : '---';
    const valStyle = hasValue ? 'color: #2C2C2A;' : 'color: #ddd;';
    const rowStyle = idx === fields.length - 1 ? 'border-bottom: none;' : '';

    html += `
        <div class="info-row" style="${rowStyle}">
          <div class="info-label">${f.label}</div>
          <div class="info-val" style="${valStyle}">${displayValue}</div>
        </div>
      `;
  });
  return html;
};

// How many answers I've written in a chapter (0–9).
window.getChapterAnswerCount = function (chapNum) {
  return QUESTIONS.filter(q => q.chapter === chapNum && MY_ANSWERS[q.id]).length;
};

// Weekly profile-book allowance: 3 by default, +1 per fully written chapter
// (9/9), capped at 6. Single source of truth — the dashboard copy and the
// number of books 발견 actually deals out both read from here, so they can't
// drift apart. There is no per-answer bonus.
window.getWeeklyBookCount = function () {
  const completedChapters = [1, 2, 3].filter(c => window.getChapterAnswerCount(c) === 9).length;
  return Math.min(6, 3 + completedChapters);
};

window.getProfileDetailedHTML = function (p, isMine, isPreview = false, showEditForm = false) {
  const currentYear = 2026;
  const birthYear = p.birthYear || (currentYear - (p.age || 28) + 1);
  const age = currentYear - birthYear + 1;
  const yearSuffix = (birthYear % 100).toString().padStart(2, '0');

  // Calculate actual counts for owner
  const c1Count = window.getChapterAnswerCount(1);
  const c2Count = window.getChapterAnswerCount(2);
  const c3Count = window.getChapterAnswerCount(3);

  const benefitCount = window.getWeeklyBookCount();

  const chapters = [
    { num: 1, label: '나', count: c1Count, pct: (c1Count / 9) * 100 },
    { num: 2, label: '사랑', count: c2Count, pct: (c2Count / 9) * 100 },
    { num: 3, label: '관계', count: c3Count, pct: (c3Count / 9) * 100 }
  ];

  // Item 6 skeleton: nudge banner on my own profile when any chapter has
  // zero answers. Bare markup only — real popup/banner styling comes later.
  const hasEmptyChapter = isMine && !isPreview && chapters.some(ch => ch.count === 0);
  const chapterIncompleteBannerHTML = hasEmptyChapter ? `
    <div class="chapter-incomplete-banner" onclick="document.getElementById('my-answers-grid')?.scrollIntoView({behavior:'smooth'})">
      챕터 작성하고 프로필북 완성하기
    </div>
  ` : '';

  const photos = p.photos || (p.image ? [p.image] : []);

  // --- My Profile: 3×2 photo grid ---
  const myPhotoSectionHTML = (() => {
    const photos = window.myPhotos || [];
    const slots = Array.from({length: 6}, (_, i) => {
      const ph = photos[i];
      return ph
        ? `<div class="photo-slot filled" data-idx="${i}" style="background-image:url('${ph}');">
             <div class="photo-delete-btn" onclick="event.stopPropagation();window.deleteMyPhoto(${i})">×</div>
             ${i === 0 ? '<div class="photo-main-badge">대표</div>' : ''}
           </div>`
        : `<div class="photo-slot empty" onclick="window.addMyPhoto()">
             <i data-lucide="plus" style="width:22px;height:22px;color:#C2C2C0;"></i>
           </div>`;
    }).join('');
    return `<div class="my-photo-grid" id="my-photo-grid">${slots}</div>`;
  })();

  const pagedIndicatorDetail = (!isMine && !isPreview && (pagedSet?.has('p' + p.id) ?? false)) ? '<div class="paged-indicator-detail">♥</div>' : '';

  // --- Photo section ---
  const carouselPhotos = isPreview ? (window.myPhotos || []).filter(Boolean) : photos;
  // 헤더는 가로로 긴 배너 한 장 + 그 아래 경계에 걸친 원형 썸네일.
  // 인라인 dot 캐러셀은 없앴다 — 사진 전체는 탭해서 라이트박스로 본다.
  const buildCarousel = (phs, indicator) => {
    if (!phs.length) {
      return `<div class="prof-header">
        <div class="prof-header-banner is-empty"><i data-lucide="camera" style="width:40px;height:40px;color:#C2C2C0;"></i></div>
      </div>`;
    }
    // 대표 사진(사진1)은 원형 썸네일 전용이다. 배너와 라이트박스는 사진2부터 —
    // 같은 사진을 두 자리에서 두 번 보여주지 않는다.
    const cover = phs[0];
    const extras = phs.slice(1); // 사진2~6, 최대 5장
    if (!extras.length) {
      // 대표 사진 한 장뿐. 배너에 쓸 사진이 그것밖에 없으니 폴백으로 깔되,
      // 확대해서 보여줄 게 없으므로 라이트박스는 아예 걸지 않는다.
      return `
    <div class="prof-header">
      <div class="prof-header-banner is-static" style="background-image:url('${cover}');">${indicator}</div>
      <div class="prof-header-avatar is-static" style="background-image:url('${cover}');"></div>
    </div>
  `;
    }
    const zoomLabel = `사진 ${extras.length}장 크게 보기`;
    return `
    <div class="prof-header">
      <button type="button" class="prof-header-banner" data-prof-lightbox
        aria-label="${zoomLabel}"
        style="background-image:url('${extras[0]}');">
        ${indicator}
        ${extras.length > 1 ? `<span class="prof-header-count" aria-hidden="true">1/${extras.length}</span>` : ''}
      </button>
      <button type="button" class="prof-header-avatar" data-prof-lightbox
        aria-label="${zoomLabel}"
        style="background-image:url('${cover}');"></button>
    </div>
  `;
  };

  const photoSectionHTML = isMine
    ? myPhotoSectionHTML
    : buildCarousel(carouselPhotos, pagedIndicatorDetail);

  // 라이트박스가 열 사진 목록. 헤더를 그리는 시점에 확정해둔다.
  // 대표 사진은 원형 썸네일에만 남고 라이트박스에는 등장하지 않는다.
  window.__profLightboxPhotos = carouselPhotos.slice(1);

  // 내 프로필이면 내 위치, 남의 프로필이면 그 사람의 위치. 둘을 섞지 않는다.
  // 예전에는 상대에게 location이 없으면 내 지역이 상대 지역처럼 찍혔다.
  // 값이 없을 땐 거리와 같은 톤으로 '--' — 칸은 지키되 없다는 걸 분명히 한다.
  // 광역까지만. 구·동이 들어와도 여기서 잘린다.
  const locationStr = (isMine
    ? (toBroadRegion(userLocation) || getProfileRegion(p, userCoords))
    : getProfileRegion(p)) || '--';
  const locationSpan = `<span style="font-size:16px; font-weight:400; color:var(--text-muted);"> · ${locationStr}</span>`;
  const headerContent = isMine ? `${formatUserHeader(p, 'detail')}${locationSpan} ${getRoleBadgeHTML(p.role)}` :
    `${p.name} <span style="font-size:16px; font-weight:400; color:var(--text-muted);"> ${age}세 (${yearSuffix}년생) · ${locationStr}</span> ${getRoleBadgeHTML(p.role)}`;

  return `
    <div style="padding-bottom:120px;">
      ${photoSectionHTML}
      
      <div style="padding: 24px;">
        ${showEditForm ? getProfileEditFormHTML() : `
        <div class="card-name" style="font-size:${(isMine || isPreview) ? '28px' : '22px'}; display:flex; align-items:center; gap:8px; font-weight:${(isMine || isPreview) ? '700' : '600'}; color:${(isMine || isPreview) ? 'var(--text-dark)' : 'var(--text-dark)'}; flex-wrap:wrap;">
          ${headerContent}
        </div>

        <div class="card-tags" style="margin-top:16px;">
          ${(p.tags || []).map(t => `<div class="card-tag">${t}</div>`).join('')}
        </div>

        <div class="profile-badge-row">
          ${(isMine || isPreview) && getRelationshipBadgeLabel()
            ? `<div class="profile-badge profile-badge--relationship">${getRelationshipBadgeLabel()}</div>`
            : ''}
          <div class="profile-badge">${p.intent || '연애를 기대해요 ❤️'}</div>
        </div>

        <div style="font-size:15px; margin-top:20px; line-height:1.5; color:var(--text-dark); white-space: pre-line;">
          ${p.bio || DEFAULT_BIO}
        </div>
        `}

        ${chapterIncompleteBannerHTML}

        ${showEditForm ? '' : `
        <div class="profile-section-title" style="margin-top:40px;">나에 대해</div>
        <div class="info-card">
           ${renderBasicInfoRows(p, isMine, isPreview)}
        </div>`}
        
        ${(isMine || isPreview) && !showEditForm ? `
        <div class="profile-section-title">나의 챕터</div>
        <div class="info-card" style="padding-bottom: 24px;">
          <!-- Benefit Dashboard -->
          <div style="margin-bottom:24px; padding:16px; background:#F8FAFE; border-radius:12px; border:1px solid #E8EEFB;">
            <div style="font-size:13px; color:#666; margin-bottom:4px;">
              📖 이번 주 열람 가능한 프로필북
              <span style="font-size:13px; font-weight:700; color:var(--text-dark); background: linear-gradient(transparent 60%, rgba(226,255,116,0.7) 60%); padding: 0 3px;">
                ${benefitCount}권
              </span>
            </div>

            <div style="font-size:12px; color:#9B72CC; margin-top:8px; font-weight:500;">
              ${chapters.some(cl => cl.count < 9)
        ? '한 Chapter를 완성할 때마다 +1권 열람할 수 있어요'
        : '세 Chapter를 모두 완성했어요. 최대 6권 ✨'}
            </div>
          </div>

           ${chapters.map(ch => `
             <div class="chapter-row" style="display:flex; align-items:center; gap:12px; padding:10px 0;">
                <div class="chapter-label" style="font-size:13px; font-weight:600; color:#444; white-space:nowrap; flex-shrink:0;">Chapter ${ch.num} · ${ch.label}</div>
                <div class="chapter-track" style="flex:1; margin:0;"><div class="chapter-fill" style="width: ${ch.pct}%;"></div></div>
                <div class="chapter-pct" style="font-size:12px; color:#888; flex-shrink:0; width:30px; text-align:right;">${ch.count}/9</div>
             </div>
           `).join('')}
           ${c1Count >= 8 ? `<div class="chapter-badge" style="margin-top:8px;">나를 아는 사람 ✨</div>` : ''}
           <button class="btn-secondary" style="margin-top: 24px; color: var(--primary); border: 1px solid var(--primary); padding: 12px; font-size:14px; background:transparent; font-weight:600;" onclick="window.openMyProfileEdit(); window.openEditChapters();">페이지 채우기 &darr;</button>
        </div>
        ` : ''}

      ${showEditForm ? '' : `
      <div class="profile-section-title" style="margin-top:40px;">${isMine ? '나의 페이지' : p.name + '님의 페이지'}</div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">가치관을 보여줄 수 있는 27개의 질문에 답해보세요.</p>`}
      
      ${showEditForm ? '' : `
      <div id="my-answers-grid" class="answers-grid" style="column-gap:8px; row-gap:8px;">
      </div>`}

      ${isMine && !isPreview ? `
        ${P_QURATED_ENABLED ? `
        <div class="profile-section-label">p.Qurated</div>
        <div class="qurated-card">
          <div class="qurated-info">
            <div class="qurated-card-title">p.Qurated</div>
            <div class="qurated-card-subtitle">Q가 당신에게 딱 맞는 사람을 소개해드려요</div>
          </div>
          <button class="qurated-apply-btn" onclick="window.openQuratedPage()">${window.isQurated ? '신청 현황 보기' : '신청하기'}</button>
        </div>
        ` : ''}

        <!-- 친구 초대·위치·설정·로그아웃은 톱니바퀴 → 설정 페이지로 옮겼다.
             이 화면에는 프로필 콘텐츠만 남긴다. openSettingsPage() 참조. -->
      ` : ''}

      </div>
    </div>
  `;
};

// ── 사진 — 캐러셀 · 그리드 편집 · 업로드 ────────────
// ── 사진 라이트박스 ────────────────────────────────────
// 헤더에서 dot 캐러셀을 걷어낸 대신, 배너나 원형 썸네일을 누르면 전체화면으로
// 열려 좌우 스와이프로 모든 사진을 본다.
window.openPhotoLightbox = function (photos, startIndex = 0) {
  const list = (photos || []).filter(Boolean);
  if (!list.length || document.getElementById('photo-lightbox')) return;
  const opener = document.activeElement;
  let cur = Math.max(0, Math.min(startIndex, list.length - 1));

  const box = document.createElement('div');
  box.id = 'photo-lightbox';
  box.className = 'photo-lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', `사진 ${list.length}장`);
  box.innerHTML = `
    <button type="button" class="photo-lightbox-close" id="photo-lightbox-close" aria-label="닫기">
      <i data-lucide="x" style="width:22px;height:22px;" aria-hidden="true"></i>
    </button>
    <div class="photo-lightbox-track" id="photo-lightbox-track" style="width:${list.length * 100}%; transform:translateX(-${cur * (100 / list.length)}%);">
      ${list.map(ph => `<div class="photo-lightbox-slide" style="flex:0 0 ${100 / list.length}%; background-image:url('${ph}');"></div>`).join('')}
    </div>
    ${list.length > 1 ? `<div class="photo-lightbox-dots" id="photo-lightbox-dots">
      ${list.map((_, i) => `<span class="photo-lightbox-dot${i === cur ? ' active' : ''}"></span>`).join('')}
    </div>` : ''}
  `;
  (document.getElementById('app-container') || document.body).appendChild(box);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const track = box.querySelector('#photo-lightbox-track');
  const dots = [...box.querySelectorAll('.photo-lightbox-dot')];
  function paint() {
    track.style.transform = `translateX(-${cur * (100 / list.length)}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
  }
  function go(delta) {
    const next = cur + delta;
    if (next < 0 || next > list.length - 1) return;
    cur = next;
    paint();
  }

  let sx = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 30) return;
    go(dx < 0 ? 1 : -1);
  }, { passive: true });

  function close() {
    document.removeEventListener('keydown', onKey, true);
    box.remove();
    if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  }
  document.addEventListener('keydown', onKey, true);

  // 배경 탭으로 닫기. 사진 자체를 누른 건 통과시킨다.
  box.addEventListener('click', e => { if (e.target === box) close(); });
  box.querySelector('#photo-lightbox-close').addEventListener('click', close);
  requestAnimationFrame(() => box.querySelector('#photo-lightbox-close')?.focus());
};

window.initPhotoCarousels = function () {
  // --- Discover profile card carousels ---
  document.querySelectorAll('[id^="carousel-"]').forEach(carousel => {
    const cId = carousel.id.replace('carousel-', '');
    const inner = document.getElementById(`carousel-inner-${cId}`);
    const dots = carousel.querySelectorAll('.photo-dot');
    if (!inner) return;
    const total = dots.length;
    let cur = 0;
    let tsX = 0;
    carousel.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; e.stopPropagation(); }, { passive: true });
    carousel.addEventListener('touchend', e => {
      e.stopPropagation();
      const dx = e.changedTouches[0].clientX - tsX;
      if (Math.abs(dx) < 30) return;
      if (dx < 0 && cur < total - 1) cur++;
      if (dx > 0 && cur > 0) cur--;
      inner.style.transform = `translateX(-${cur * (100 / total)}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === cur));
    }, { passive: true });
    carousel.addEventListener('click', e => e.stopPropagation());
  });

  // --- Other profile detail carousel ---
  // --- Profile header → lightbox ---
  // 배너든 원형 썸네일이든 누르면 같은 라이트박스가 열린다.
  document.querySelectorAll('[data-prof-lightbox]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const photos = window.__profLightboxPhotos || [];
      window.openPhotoLightbox(photos, 0);
    });
  });

  // --- My Profile circular carousel ---
  const myCarousel = document.getElementById('my-photo-carousel');
  if (myCarousel) {
    const inner = document.getElementById('my-photo-carousel-inner');
    const dots = document.querySelectorAll('#my-photo-carousel ~ * .photo-dot, .photo-dot');
    // count children items by reading inner's child count
    if (!inner) return;
    const items = inner.children;
    const total = items.length;
    if (total <= 1) return;
    let cur = 0;
    let tsX = 0;
    myCarousel.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; e.stopPropagation(); }, { passive: true });
    myCarousel.addEventListener('touchend', e => {
      e.stopPropagation();
      const dx = e.changedTouches[0].clientX - tsX;
      if (Math.abs(dx) < 30) return;
      if (dx < 0 && cur < total - 1) cur++;
      if (dx > 0 && cur > 0) cur--;
      inner.style.transform = `translateX(-${cur * (100 / total)}%)`;
    }, { passive: true });
  }
};

window.refreshPhotoGrid = function () {
  const grid = document.getElementById('my-photo-grid');
  if (!grid) return;
  const photos = window.myPhotos;
  grid.innerHTML = Array.from({length: 6}, (_, i) => {
    const ph = photos[i];
    return ph
      ? `<div class="photo-slot filled" data-idx="${i}" style="background-image:url('${ph}');">
           <div class="photo-delete-btn" onclick="event.stopPropagation();window.deleteMyPhoto(${i})">×</div>
           ${i === 0 ? '<div class="photo-main-badge">대표</div>' : ''}
         </div>`
      : `<div class="photo-slot empty" onclick="window.addMyPhoto()">
           <i data-lucide="plus" style="width:22px;height:22px;color:#C2C2C0;"></i>
         </div>`;
  }).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.deleteMyPhoto = function (idx) {
  window.myPhotos.splice(idx, 1);
  const wasEdit = window._photoGridEditMode;
  window.refreshPhotoGrid();
  window.initPhotoGrid();
  if (wasEdit) {
    const g = document.getElementById('my-photo-grid');
    if (g) {
      g.querySelectorAll('.photo-delete-btn').forEach(b => b.style.display = 'flex');
      g.querySelectorAll('.photo-slot.filled').forEach(s => s.classList.add('editing'));
      window._photoGridEditMode = true;
    }
  }
};

// '+'를 누르면 실제 사진 라이브러리가 열린다. input[type=file]을 화면에
// 두지 않고 그때그때 만들어 쓴다 — 그리드가 다시 그려질 때마다 살아남을
// 엘리먼트를 관리하지 않아도 된다.
window.addMyPhoto = function () {
  const MAX = 6;
  const remaining = MAX - (window.myPhotos || []).length;
  if (remaining <= 0) { window.showToast(`사진은 최대 ${MAX}장까지 올릴 수 있어요`); return; }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.style.display = 'none';
  document.body.appendChild(input);

  input.addEventListener('change', () => {
    const files = [...(input.files || [])].slice(0, remaining);
    let pending = files.length;
    if (!pending) { input.remove(); return; }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        window.myPhotos.push(e.target.result);
        if (--pending === 0) {
          window.refreshPhotoGrid();
          input.remove();
        }
      };
      reader.onerror = () => {
        if (--pending === 0) { window.refreshPhotoGrid(); input.remove(); }
      };
      reader.readAsDataURL(file);
    });
  });

  input.click();
};

window.initPhotoGrid = function () {
  const grid = document.getElementById('my-photo-grid');
  if (!grid) return;

  let lpTimer = null;

  const setEdit = (on) => {
    window._photoGridEditMode = on;
    grid.querySelectorAll('.photo-delete-btn').forEach(b => b.style.display = on ? 'flex' : 'none');
    grid.querySelectorAll('.photo-slot.filled').forEach(s => s.classList.toggle('editing', on));
    if (!on) {
      window._photoGridDragSrc = null;
      grid.querySelectorAll('.photo-slot').forEach(s => s.classList.remove('dragging'));
    }
  };

  grid.addEventListener('touchstart', e => {
    if (e.target.closest('.photo-delete-btn')) return;
    const slot = e.target.closest('.photo-slot.filled');
    if (!slot) { if (window._photoGridEditMode) setEdit(false); return; }
    if (window._photoGridEditMode) {
      window._photoGridDragSrc = parseInt(slot.dataset.idx);
      slot.classList.add('dragging');
      return;
    }
    const idx = parseInt(slot.dataset.idx);
    lpTimer = setTimeout(() => {
      lpTimer = null;
      setEdit(true);
      window._photoGridDragSrc = idx;
      slot.classList.add('dragging');
    }, 500);
  }, { passive: true });

  grid.addEventListener('touchmove', e => {
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
  }, { passive: true });

  grid.addEventListener('touchend', e => {
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
    const src = window._photoGridDragSrc;
    if (src === null) return;
    const t = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const tgt = el && el.closest('.photo-slot[data-idx]');
    if (tgt) {
      const ti = parseInt(tgt.dataset.idx);
      if (ti !== src) {
        const tmp = window.myPhotos[src];
        window.myPhotos.splice(src, 1);
        window.myPhotos.splice(ti, 0, tmp);
        window._photoGridDragSrc = null;
        window.refreshPhotoGrid();
        window.initPhotoGrid();
        const newGrid = document.getElementById('my-photo-grid');
        if (newGrid && window._photoGridEditMode) {
          newGrid.querySelectorAll('.photo-delete-btn').forEach(b => b.style.display = 'flex');
          newGrid.querySelectorAll('.photo-slot.filled').forEach(s => s.classList.add('editing'));
        }
        return;
      }
    }
    grid.querySelectorAll('.photo-slot').forEach(s => s.classList.remove('dragging'));
    window._photoGridDragSrc = null;
  }, { passive: true });
};

// ── 모임 만들기 — 모달 · 캘린더 · 슬라이더 · 이미지 · 링크 · 제출 ────
window.openCreateMeetupModal = function (editId) {
  const mc = getModalContainer();
  // 수정 모드. 폼은 만들기와 완전히 같고, 기존 값만 채워 연다.
  const editing = editId != null ? MOCK_MEETUPS.find(x => String(x.id) === String(editId)) : null;
  window._editingMeetupId = editing ? editing.id : null;
  window._meetupImages = editing && Array.isArray(editing.images) ? [...editing.images] : [];

  const hourOpts = [];
  for (let i = 6; i <= 11; i++) hourOpts.push(`오전 ${i}시`);
  hourOpts.push('정오 12시');
  for (let i = 1; i <= 11; i++) hourOpts.push(`오후 ${i}시`);
  const minOpts = ['00분', '30분'];
  const ageOpts = ['20대 초반', '20대 중반', '20대 후반', '30대 초반', '30대 중반', '30대 후반', '40대 초반', '40대 중반', '40대 후반', '50대 이상'];

  const LBL = 'font-size:14px; font-weight:600; color:#888; margin-bottom:12px; margin-top:24px; display:block;';
  const INP = 'background:#fff; border:1px solid #E8E4DF; border-radius:12px; padding:12px 16px; width:100%; font-size:15px; box-sizing:border-box; outline:none;';

  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index:200; background:var(--bg-color);">
      <div class="app-header">
        <button class="back-btn" onclick="closeModal()"><i data-lucide="x"></i></button>
        <div style="font-size:16px; font-weight:600;">${editing ? '모임 수정' : '모임 만들기'}</div>
        <div style="width:32px;"></div>
      </div>
      <div class="scroll-y" style="padding:24px 24px 60px;">

        <!-- 카테고리 -->
        <div style="${LBL} margin-top:0;">카테고리 선택 <span style="color:var(--primary);">*</span></div>
        <div class="modal-category-grid" id="create-meetup-category" style="margin-bottom:24px;">
          ${['✨ 소셜', '🎬 문화생활', '🏃 액티비티', '🍽️ 식도락', '📚 스터디', '🎨 크리에이티브', '🎟️ 행사', '🏘️ 커뮤니티'].map((cat, idx) =>
    `<div class="filter-chip ${idx === 0 ? 'selected primary-cat' : ''}" onclick="selectModalMeetupCategory(this)" style="width:100%; border-radius:12px; position:relative;">
              <span class="cat-text">${cat}</span>
              <span class="secondary-check" style="display:none; position:absolute; right:12px; font-size:12px;">✓</span>
            </div>`
  ).join('')}
        </div>

        <!-- 모임 이름 -->
        <div style="${LBL}">모임 이름 <span style="color:var(--primary);">*</span></div>
        <input type="text" id="create-meetup-title" style="${INP} margin-bottom:24px;" placeholder="모임 이름" />

        <!-- 장소 -->
        <div style="${LBL}">지역 <span style="color:var(--primary);">*</span></div>
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:32px;">
          ${['서울', '경기', '부산', '대구', '인천', '광주', '대전', '제주'].map(r =>
    `<div class="filter-chip" onclick="selectMeetupRegion(this,'${r}')" style="border-radius:12px; padding:10px 0; text-align:center; font-size:14px;">${r}</div>`
  ).join('')}
        </div>
        <input type="hidden" id="create-meetup-region" value="" />
        <div style="font-size:13px; font-weight:500; color:#888; margin-bottom:8px;">상세 장소 <span style="font-weight:400; font-size:12px;">(선택사항)</span></div>
        <input type="text" id="create-meetup-location-detail" style="${INP} margin-bottom:8px;" placeholder="예) 홍대입구역 근처, 강남역 카페" />
        <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-muted); margin-bottom:32px; cursor:pointer;">
          <input type="checkbox" id="create-meetup-location-private" style="width:16px; height:16px; accent-color:var(--primary); cursor:pointer;" />
          정확한 주소는 참여 확정 후 공개할게요
        </label>

        <!-- 날짜 -->
        <div style="${LBL}">날짜 <span style="color:var(--primary);">*</span></div>
        <div class="calendar-wrapper" id="create-meetup-calendar" style="margin-bottom:32px;">
          <div class="calendar-header">
            <button type="button" onclick="prevMeetupMonth()" style="background:none; border:none; cursor:pointer; padding:4px; display:flex; align-items:center;"><i data-lucide="chevron-left" style="width:20px; color:var(--text-muted);"></i></button>
            <div id="cal-header-text" style="font-size:15px; font-weight:600;"></div>
            <button type="button" onclick="nextMeetupMonth()" style="background:none; border:none; cursor:pointer; padding:4px; display:flex; align-items:center;"><i data-lucide="chevron-right" style="width:20px; color:var(--text-muted);"></i></button>
          </div>
          <div class="calendar-grid" id="create-meetup-calendar-grid">
            <div class="calendar-day-header" style="color:#FF6B6B;">일</div>
            <div class="calendar-day-header">월</div><div class="calendar-day-header">화</div>
            <div class="calendar-day-header">수</div><div class="calendar-day-header">목</div>
            <div class="calendar-day-header">금</div><div class="calendar-day-header">토</div>
          </div>
        </div>

        <!-- 시간 -->
        <div style="${LBL}">시간 <span style="color:var(--primary);">*</span></div>
        <div class="picker-wrapper" id="create-meetup-time" style="margin-bottom:24px;">
          <div class="picker-wheel-container" onscroll="handleWheelScroll(this)">
            <div class="picker-spacer"></div>
            ${hourOpts.map(h => `<div class="picker-item">${h}</div>`).join('')}
            <div class="picker-spacer"></div>
          </div>
          <div class="picker-wheel-container" onscroll="handleWheelScroll(this)">
            <div class="picker-spacer"></div>
            ${minOpts.map(m => `<div class="picker-item">${m}</div>`).join('')}
            <div class="picker-spacer"></div>
          </div>
          <div class="picker-overlay-bar"></div>
        </div>

        <!-- 설명 -->
        <div style="${LBL}">설명</div>
        <textarea id="create-meetup-desc" style="${INP} height:120px; resize:none; margin-bottom:24px;" placeholder="예) 초보 환영, 강아지 환영 🐾"></textarea>

        <!-- 사진 -->
        <div style="${LBL}">사진 <span style="font-weight:400; font-size:13px;">(선택사항)</span></div>
        <div id="meetup-image-preview" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;"></div>
        <input type="file" id="meetup-image-input" accept="image/*" multiple style="display:none;" onchange="handleMeetupImageSelect(this)" />
        <button type="button" id="meetup-image-add-btn" onclick="document.getElementById('meetup-image-input').click()" style="display:flex; align-items:center; gap:6px; padding:10px 16px; border:1.5px dashed #C89FDB; border-radius:12px; background:none; color:#9B72CC; font-size:14px; cursor:pointer; margin-bottom:24px;">
          <i data-lucide="plus" style="width:16px;height:16px;stroke:#9B72CC;"></i> 사진 추가
        </button>

        <!-- 참여 조건 -->
        <div style="${LBL}">참여 조건</div>

        <div style="font-size:13px; font-weight:600; color:var(--text-muted); margin-bottom:10px;">연령대 <span style="color:var(--primary);">*</span></div>
        <div id="age-pickers-wrapper" style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
          <div class="picker-wrapper" id="create-meetup-age-from-picker" style="flex:1;">
            <div class="picker-wheel-container" onscroll="handleWheelScroll(this)">
              <div class="picker-spacer"></div>
              ${ageOpts.map(a => `<div class="picker-item" style="font-size:13px;">${a}</div>`).join('')}
              <div class="picker-spacer"></div>
            </div>
            <div class="picker-overlay-bar"></div>
          </div>
          <span style="flex-shrink:0; font-size:16px; color:var(--text-muted); font-weight:500;">~</span>
          <div class="picker-wrapper" id="create-meetup-age-to-picker" style="flex:1;">
            <div class="picker-wheel-container" onscroll="handleWheelScroll(this)">
              <div class="picker-spacer"></div>
              ${ageOpts.map(a => `<div class="picker-item" style="font-size:13px;">${a}</div>`).join('')}
              <div class="picker-spacer"></div>
            </div>
            <div class="picker-overlay-bar"></div>
          </div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-muted); margin-top:-20px; margin-bottom:16px; cursor:pointer;">
          <input type="checkbox" id="create-meetup-age-any" onchange="toggleAgeAny()" style="width:16px; height:16px; accent-color:var(--primary); cursor:pointer;" />
          연령 무관
        </label>

        <div style="font-size:13px; font-weight:600; color:var(--text-muted); margin-bottom:8px;">태그 <span style="font-weight:400; font-size:12px;">(선택사항)</span></div>
        <input type="text" id="create-meetup-tags" style="${INP} margin-bottom:8px;" placeholder="예) 스없, 일스, 반려동물 환영 — 콤마(,)로 구분" oninput="updateTagPreview()" />
        <div id="tag-preview" style="min-height:20px; font-size:13px; color:#9B7FD4; margin-bottom:24px; word-break:break-all; line-height:1.6;"></div>

        <!-- 참여비 -->
        <div id="create-meetup-fee-wrapper" style="margin-bottom:24px;">
          <div style="${LBL} margin-top:0;">참여비 <span style="font-weight:400; font-size:13px;">(선택사항)</span></div>
          <div style="display:flex; gap:8px; margin-bottom:10px;">
            <div class="filter-chip" id="fee-btn-split" onclick="selectFeeType('1/N')" style="flex:1; border-radius:12px; padding:10px 0; text-align:center; font-size:14px;">1/N</div>
            <div class="filter-chip" id="fee-btn-each" onclick="selectFeeType('각자')" style="flex:1; border-radius:12px; padding:10px 0; text-align:center; font-size:14px;">각자</div>
            <div class="filter-chip" id="fee-btn-free" onclick="selectFeeType('없음')" style="flex:1; border-radius:12px; padding:10px 0; text-align:center; font-size:14px;">없음</div>
            <div class="filter-chip" id="fee-btn-other" onclick="selectFeeType('기타')" style="flex:1; border-radius:12px; padding:10px 0; text-align:center; font-size:14px;">기타</div>
          </div>
          <input type="text" id="create-meetup-fee-input" style="${INP} display:none;" placeholder="예) 2만원, 재료비 실비" />
        </div>

        <!-- 정원 -->
        <div id="create-meetup-capacity-wrapper" style="margin-bottom:24px;">
          <div style="${LBL} margin-top:0;">정원 (명)</div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="position:relative; flex:1;">
              <input type="number" id="create-meetup-cap-min" min="2" style="${INP} padding-right:28px;" placeholder="최소" />
              <span style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px; pointer-events:none;">명</span>
            </div>
            <span style="color:var(--text-muted); font-size:14px; flex-shrink:0;">~</span>
            <div style="position:relative; flex:1;">
              <input type="number" id="create-meetup-cap-max" min="2" style="${INP} padding-right:28px;" placeholder="최대" />
              <span style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px; pointer-events:none;">명</span>
            </div>
          </div>
        </div>

        <!-- 호스트 공개 여부 -->
        <div style="${LBL}">호스트 공개 여부</div>
        <div id="create-meetup-host-public" style="display:flex; gap:8px; margin-bottom:8px;">
          <div class="filter-chip selected" style="flex:1; border-radius:12px; padding:10px 0; text-align:center;" onclick="selectModalCategory(this)">익명으로 진행</div>
          <div class="filter-chip" style="flex:1; border-radius:12px; padding:10px 0; text-align:center;" onclick="selectModalCategory(this)">프로필 공개</div>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:24px; line-height:1.4;">익명 선택 시 호스트 정보가 참여자에게 표시되지 않아요</div>

        <!-- 링크 (커뮤니티/행사만) -->
        <div id="create-meetup-links-section" style="display:none; margin-bottom:24px;">
          <div style="${LBL} margin-top:0;">링크 <span style="font-weight:400; font-size:13px;">(선택사항)</span></div>
          <div id="create-meetup-links-list"></div>
          <button type="button" onclick="addMeetupLink()" id="create-meetup-links-add-btn" style="background:none; border:1px dashed #E8E4DF; border-radius:12px; padding:10px 0; width:100%; color:var(--text-muted); font-size:14px; cursor:pointer;">+ 링크 추가</button>
          <div style="font-size:12px; color:var(--text-muted); margin-top:8px;">최대 2개 추가 가능</div>
        </div>

        <!-- 주의사항 -->
        <div style="${LBL}">주의사항 <span style="font-weight:400; font-size:13px;">(선택사항)</span></div>
        <textarea id="create-meetup-notice" style="${INP} height:100px; resize:none; margin-bottom:32px;" placeholder="예) 편한 운동화 지참&#10;예) 주류 포함 모임, 과도한 음주 자제&#10;예) 노쇼 시 다음 모임 참여 제한"></textarea>

        <button class="btn-primary" style="margin-bottom:40px;" onclick="submitCreateMeetup()">${editing ? '저장하기' : '모임 만들기'}</button>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  setTimeout(() => {
    const now = editing && editing.timestamp && Number.isFinite(new Date(editing.timestamp).getTime())
      ? new Date(editing.timestamp) : new Date();
    window._selectedCalDate = null;
    window.renderMeetupCalendar(now.getFullYear(), now.getMonth() + 1);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    // 시간 피커: 오후 1시(index 13) / 00분(index 0)
    const timeWheels = document.querySelectorAll('#create-meetup-time .picker-wheel-container');
    if (timeWheels[0]) { timeWheels[0].scrollTop = 13 * 40; window.handleWheelScroll(timeWheels[0]); }
    if (timeWheels[1]) { timeWheels[1].scrollTop = 0; window.handleWheelScroll(timeWheels[1]); }
    // 연령대 피커: 30대 초반(index 3) ~ 40대 초반(index 6)
    const ageFromWheel = document.querySelector('#create-meetup-age-from-picker .picker-wheel-container');
    const ageToWheel = document.querySelector('#create-meetup-age-to-picker .picker-wheel-container');
    if (ageFromWheel) { ageFromWheel.scrollTop = 3 * 40; window.handleWheelScroll(ageFromWheel); }
    if (ageToWheel) { ageToWheel.scrollTop = 6 * 40; window.handleWheelScroll(ageToWheel); }
    if (editing) prefillCreateMeetupForm(editing, { hourOpts, minOpts, ageOpts });
  }, 30);
};

// 기존 값 채우기. 폼이 DOM 상태로 값을 들고 있어서(칩 selected, 휠 scrollTop)
// 값 하나하나를 그 형태로 되돌려놔야 한다.
function prefillCreateMeetupForm(m, opts) {
  const { hourOpts, minOpts, ageOpts } = opts;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? '' : v; };
  const wheelTo = (sel, idx) => {
    const w = document.querySelector(sel);
    if (!w || idx < 0) return;
    w.scrollTop = idx * 40;
    window.handleWheelScroll(w);
  };

  // 카테고리
  document.querySelectorAll('#create-meetup-category .filter-chip').forEach(chip => {
    const txt = chip.querySelector('.cat-text')?.innerText.trim();
    chip.classList.remove('selected', 'primary-cat', 'secondary-cat');
    const check = chip.querySelector('.secondary-check');
    if (check) check.style.display = 'none';
    if (txt === m.type) chip.classList.add('selected', 'primary-cat');
    else if (m.secondaryType && txt === m.secondaryType) {
      chip.classList.add('selected', 'secondary-cat');
      if (check) check.style.display = 'block';
    }
  });
  updateCreateMeetupFormByCategory();

  setVal('create-meetup-title', m.title);

  // 지역 · 상세 장소
  const region = (m.shortLocation || '').trim();
  const known = ['서울', '경기', '부산', '대구', '인천', '광주', '대전', '제주'];
  const hit = known.find(r => region.startsWith(r) || (m.fullAddress || '').includes(r));
  document.querySelectorAll('[onclick^="selectMeetupRegion"]').forEach(el => {
    el.classList.toggle('selected', el.innerText.trim() === hit);
  });
  setVal('create-meetup-region', hit || '');
  const detailOnly = hit ? region.replace(new RegExp('^' + hit + '\\s*'), '') : region;
  setVal('create-meetup-location-detail', detailOnly);
  const priv = document.getElementById('create-meetup-location-private');
  if (priv) priv.checked = m.locationTiming === '참여 확정 후';

  // 날짜 · 시간 — timestamp가 가장 믿을 만한 원본이다.
  const d = m.timestamp ? new Date(m.timestamp) : null;
  if (d && Number.isFinite(d.getTime())) {
    window._selectedCalDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    document.querySelectorAll('#create-meetup-calendar-grid .calendar-day').forEach(el => {
      if (Number(el.textContent) === d.getDate()) el.classList.add('selected');
    });
    const h24 = d.getHours();
    const label = h24 < 12 ? `오전 ${h24}시` : h24 === 12 ? '정오 12시' : `오후 ${h24 - 12}시`;
    wheelTo('#create-meetup-time .picker-wheel-container', hourOpts.indexOf(label));
    const mins = d.getMinutes() >= 30 ? '30분' : '00분';
    const wheels = document.querySelectorAll('#create-meetup-time .picker-wheel-container');
    if (wheels[1]) { wheels[1].scrollTop = minOpts.indexOf(mins) * 40; window.handleWheelScroll(wheels[1]); }
  }

  setVal('create-meetup-desc', m.desc);
  setVal('create-meetup-notice', m.rules);
  setVal('create-meetup-tags', (m.tags || []).map(t => String(t).replace(/^#/, '')).join(', '));
  if (typeof window.updateTagPreview === 'function') window.updateTagPreview();

  // 참여비
  const feeMap = { '1/N': '1/N', '각자': '각자', '무료': '없음', '없음': '없음' };
  const feeType = feeMap[m.fee] || (m.fee ? '기타' : '없음');
  if (typeof window.selectFeeType === 'function') window.selectFeeType(feeType);
  if (feeType === '기타') setVal('create-meetup-fee-input', m.fee);

  // 정원 — 최소값은 모임 객체에 없다. 최대만 되돌린다.
  setVal('create-meetup-cap-max', m.maxCap || '');

  // 호스트 공개 여부
  document.querySelectorAll('#create-meetup-host-public .filter-chip').forEach(el => {
    el.classList.toggle('selected', el.innerText.trim() === (m.hostPublic ? '프로필 공개' : '익명으로 진행'));
  });

  // 연령대
  const anyCb = document.getElementById('create-meetup-age-any');
  const isAny = !m.ageRange || m.ageRange === '무관' || m.ageRange === '연령 무관';
  if (anyCb) { anyCb.checked = isAny; if (typeof window.toggleAgeAny === 'function') window.toggleAgeAny(); }
  if (!isAny) {
    const [from, to] = String(m.ageRange).split('~').map(x => x.trim());
    wheelTo('#create-meetup-age-from-picker .picker-wheel-container', ageOpts.indexOf(from));
    wheelTo('#create-meetup-age-to-picker .picker-wheel-container', ageOpts.indexOf(to));
  }

  renderMeetupImagePreviews();
}
window.prefillCreateMeetupForm = prefillCreateMeetupForm;

window._calState = { year: null, month: null };
window._selectedCalDate = null;

window.renderMeetupCalendar = function (year, month) {
  window._calState = { year, month };
  const headerEl = document.getElementById('cal-header-text');
  const gridEl = document.getElementById('create-meetup-calendar-grid');
  if (!headerEl || !gridEl) return;

  headerEl.textContent = `${year}년 ${month}월`;

  const headers = Array.from(gridEl.querySelectorAll('.calendar-day-header'));
  gridEl.innerHTML = '';
  headers.forEach(h => gridEl.appendChild(h));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  for (let i = 0; i < firstDay; i++) {
    gridEl.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const isPast = date < today;
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.textContent = d;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (isPast) {
      cell.style.cssText = 'color:#CCC; cursor:default;';
    } else if (window._selectedCalDate === dateStr) {
      cell.style.cssText = 'background:var(--primary); color:#fff; border-radius:50%; cursor:pointer;';
      cell.onclick = () => window.selectMeetupCalDate(year, month, d);
    } else {
      cell.style.cssText = 'cursor:pointer;';
      cell.onclick = () => window.selectMeetupCalDate(year, month, d);
    }
    if (date.getDay() === 0) cell.style.color = isPast ? '#FFBBBB' : '#FF6B6B';
    if (window._selectedCalDate === dateStr) cell.style.cssText = 'background:var(--primary); color:#fff; border-radius:50%; cursor:pointer;';
    gridEl.appendChild(cell);
  }
};

window.prevMeetupMonth = function () {
  let { year, month } = window._calState;
  month--;
  if (month < 1) { month = 12; year--; }
  window.renderMeetupCalendar(year, month);
};

window.nextMeetupMonth = function () {
  let { year, month } = window._calState;
  month++;
  if (month > 12) { month = 1; year++; }
  window.renderMeetupCalendar(year, month);
};

window.selectMeetupCalDate = function (year, month, day) {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  window._selectedCalDate = dateStr;
  window.renderMeetupCalendar(year, month);
};

window.initAgeSlider = function () {
  if (!document.getElementById('age-slider-style')) {
    const s = document.createElement('style');
    s.id = 'age-slider-style';
    s.textContent = `
      #age-range-from, #age-range-to { pointer-events: none; }
      #age-range-from::-webkit-slider-thumb, #age-range-to::-webkit-slider-thumb {
        pointer-events: all; -webkit-appearance: none; appearance: none;
        width: 22px; height: 22px; border-radius: 50%;
        background: var(--primary, #E87B4B); border: 2px solid #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,.2); cursor: pointer;
      }
    `;
    document.head.appendChild(s);
  }
  const AGE = ['20대 초반', '20대 중반', '20대 후반', '30대 초반', '30대 중반', '30대 후반', '40대 초반', '40대 중반', '40대 후반', '50대 초반', '50대 중반', '50대 후반', '60대 초반', '60대 중반', '60대 후반'];
  const fromEl = document.getElementById('age-range-from');
  const toEl = document.getElementById('age-range-to');
  const fillEl = document.getElementById('age-slider-fill');
  const labelEl = document.getElementById('age-slider-label');
  if (!fromEl || !toEl || !fillEl || !labelEl) return;

  function updateSlider(moved) {
    let from = parseInt(fromEl.value);
    let to = parseInt(toEl.value);
    if (from > to) {
      if (moved === 'from') { fromEl.value = to; from = to; }
      else { toEl.value = from; to = from; }
    }
    fillEl.style.left = (from / 14 * 100) + '%';
    fillEl.style.right = ((14 - to) / 14 * 100) + '%';
    labelEl.textContent = AGE[from] + ' ~ ' + AGE[to];
    fromEl.style.zIndex = from >= to - 1 ? '3' : '2';
    toEl.style.zIndex = from >= to - 1 ? '2' : '3';
  }

  fromEl.addEventListener('input', () => updateSlider('from'));
  toEl.addEventListener('input', () => updateSlider('to'));
  updateSlider('from');
};

window.toggleAgeAny = function () {
  const cb = document.getElementById('create-meetup-age-any');
  const wrapper = document.getElementById('age-pickers-wrapper');
  if (!cb || !wrapper) return;
  wrapper.style.opacity = cb.checked ? '0.35' : '1';
  wrapper.style.pointerEvents = cb.checked ? 'none' : '';
};

window.selectFeeType = function (type) {
  ['each', 'split', 'free', 'other'].forEach(id => {
    const btn = document.getElementById(`fee-btn-${id}`);
    if (btn) btn.classList.remove('selected');
  });
  const idMap = { '각자': 'each', '1/N': 'split', '없음': 'free', '기타': 'other' };
  const btn = document.getElementById(`fee-btn-${idMap[type]}`);
  if (btn) btn.classList.add('selected');
  const inp = document.getElementById('create-meetup-fee-input');
  if (inp) inp.style.display = type === '기타' ? 'block' : 'none';
};

window._meetupImages = [];

window.handleMeetupImageSelect = function (input) {
  const files = Array.from(input.files);
  const remaining = 5 - window._meetupImages.length;
  files.slice(0, remaining).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      window._meetupImages.push(e.target.result);
      renderMeetupImagePreviews();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
};

window.removeMeetupImage = function (idx) {
  window._meetupImages.splice(idx, 1);
  renderMeetupImagePreviews();
};

function renderMeetupImagePreviews() {
  const container = document.getElementById('meetup-image-preview');
  const addBtn = document.getElementById('meetup-image-add-btn');
  if (!container) return;
  container.innerHTML = window._meetupImages.map((src, i) => `
    <div style="position:relative; width:80px; height:80px; border-radius:10px; overflow:hidden; flex-shrink:0;">
      <img src="${src}" style="width:100%; height:100%; object-fit:cover;" />
      <button onclick="removeMeetupImage(${i})" style="position:absolute; top:3px; right:3px; width:20px; height:20px; border-radius:50%; background:rgba(0,0,0,0.6); border:none; color:white; font-size:14px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center;">×</button>
    </div>
  `).join('');
  if (addBtn) addBtn.style.display = window._meetupImages.length >= 5 ? 'none' : 'flex';
}

window.openImageViewer = function (meetupId, startIdx) {
  const m = MOCK_MEETUPS.find(x => x.id === meetupId);
  if (!m || !m.images || m.images.length === 0) return;
  const images = m.images;
  let idx = startIdx || 0;

  const overlay = document.createElement('div');
  overlay.id = 'image-viewer-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.93);z-index:9999;display:flex;align-items:center;justify-content:center;touch-action:none;';

  function render() {
    overlay.innerHTML = `
      <button onclick="document.getElementById('image-viewer-overlay').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:white;font-size:28px;cursor:pointer;z-index:1;line-height:1;">×</button>
      <button id="iv-prev" onclick="window._ivPrev()" style="position:absolute;left:12px;background:none;border:none;color:white;font-size:40px;cursor:pointer;padding:12px;opacity:${idx === 0 ? '0.25' : '1'};${idx === 0 ? 'pointer-events:none;' : ''}">‹</button>
      <img src="${images[idx]}" style="max-width:92vw;max-height:86vh;object-fit:contain;border-radius:8px;display:block;" />
      <button id="iv-next" onclick="window._ivNext()" style="position:absolute;right:12px;background:none;border:none;color:white;font-size:40px;cursor:pointer;padding:12px;opacity:${idx === images.length - 1 ? '0.25' : '1'};${idx === images.length - 1 ? 'pointer-events:none;' : ''}">›</button>
      ${images.length > 1 ? `<div style="position:absolute;bottom:16px;color:rgba(255,255,255,0.6);font-size:13px;">${idx + 1} / ${images.length}</div>` : ''}
    `;
  }

  window._ivPrev = () => { if (idx > 0) { idx--; render(); } };
  window._ivNext = () => { if (idx < images.length - 1) { idx++; render(); } };

  let touchStartX = 0;
  overlay.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -50) window._ivNext();
    else if (dx > 50) window._ivPrev();
  });

  render();
  document.body.appendChild(overlay);
};

window.updateTagPreview = function () {
  const input = document.getElementById('create-meetup-tags');
  const preview = document.getElementById('tag-preview');
  if (!input || !preview) return;
  const tags = input.value.split(',').map(t => t.trim()).filter(t => t);
  preview.textContent = tags.map(t => '#' + t).join('  ');
};

window.selectMeetupRegion = function (elem, region) {
  elem.parentElement.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('selected'));
  elem.classList.add('selected');
  const hidden = document.getElementById('create-meetup-region');
  if (hidden) hidden.value = region;
};

window.addMeetupLink = function () {
  const list = document.getElementById('create-meetup-links-list');
  const addBtn = document.getElementById('create-meetup-links-add-btn');
  if (!list) return;
  const count = list.querySelectorAll('.meetup-link-item').length;
  if (count >= 2) return;

  const idx = Date.now();
  const item = document.createElement('div');
  item.className = 'meetup-link-item';
  item.dataset.idx = idx;
  item.style.cssText = 'background:#F9F9F9; border-radius:12px; padding:14px; margin-bottom:10px;';
  item.innerHTML = `
    <div style="display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;">
      ${['메인', '인증', '소셜', '기타'].map(t => `<div class="filter-chip link-type-chip" style="border-radius:999px; padding:4px 12px; font-size:13px;" onclick="selectLinkType(this,'${idx}')">${t}</div>`).join('')}
      <button type="button" onclick="removeMeetupLink('${idx}')" style="margin-left:auto; background:none; border:none; color:var(--text-muted); font-size:18px; cursor:pointer; line-height:1;">×</button>
    </div>
    <div class="link-url-input" data-link-idx="${idx}">
      <input type="text" class="input-field" placeholder="https://" style="margin:0;" />
    </div>
    <div class="link-social-input" data-link-idx="${idx}" style="display:none;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:13px; color:var(--text-muted); min-width:64px; flex-shrink:0;">인스타그램</span>
        <span style="color:var(--text-muted);">@</span>
        <input type="text" class="input-field social-instagram-input" placeholder="아이디 입력" style="margin:0; flex:1;" />
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:13px; color:var(--text-muted); min-width:64px; flex-shrink:0;">X</span>
        <span style="color:var(--text-muted);">@</span>
        <input type="text" class="input-field social-x-input" placeholder="아이디 입력" style="margin:0; flex:1;" />
      </div>
    </div>
  `;
  list.appendChild(item);
  if (addBtn) addBtn.style.display = list.querySelectorAll('.meetup-link-item').length >= 2 ? 'none' : 'block';
};

window.removeMeetupLink = function (idx) {
  const item = document.querySelector(`.meetup-link-item[data-idx="${idx}"]`);
  if (item) item.remove();
  const addBtn = document.getElementById('create-meetup-links-add-btn');
  if (addBtn) addBtn.style.display = 'block';
};

window.selectLinkType = function (elem, idx) {
  const item = document.querySelector(`.meetup-link-item[data-idx="${idx}"]`);
  if (!item) return;
  item.querySelectorAll('.link-type-chip').forEach(c => c.classList.remove('selected'));
  elem.classList.add('selected');
  const isSocial = elem.textContent.trim() === '소셜';
  item.querySelector(`.link-url-input`).style.display = isSocial ? 'none' : 'block';
  item.querySelector(`.link-social-input`).style.display = isSocial ? 'block' : 'none';
};

window.selectSocialPlatform = function (elem, idx) {
  const item = document.querySelector(`.meetup-link-item[data-idx="${idx}"]`);
  if (!item) return;
  item.querySelectorAll('.social-platform-chip').forEach(c => c.classList.remove('selected'));
  elem.classList.add('selected');
};

window.submitCreateMeetup = function () {
  // 1. Collect form values
  const catEls = document.querySelectorAll('#create-meetup-category .filter-chip.selected');
  let selectedCategory = '🎬 문화생활';
  let secondaryCategory = '';
  if (catEls.length > 0) {
    const pri = Array.from(catEls).find(e => e.classList.contains('primary-cat')) || catEls[0];
    selectedCategory = pri.querySelector('.cat-text') ? pri.querySelector('.cat-text').innerText : pri.innerText;
    if (catEls.length > 1) {
      const sec = Array.from(catEls).find(e => e.classList.contains('secondary-cat')) || catEls[1];
      secondaryCategory = sec.querySelector('.cat-text') ? sec.querySelector('.cat-text').innerText : sec.innerText;
    }
  }

  const titleEl = document.getElementById('create-meetup-title');
  const inputTitle = titleEl ? titleEl.value.trim() : '';

  const regionEl = document.getElementById('create-meetup-region');
  const detailEl = document.getElementById('create-meetup-location-detail');
  const inputRegion = regionEl ? regionEl.value.trim() : '';
  const detail = detailEl ? detailEl.value.trim() : '';
  const inputLocation = inputRegion && detail ? `${inputRegion} ${detail}` : (inputRegion || detail || '');

  const locationPrivateEl = document.getElementById('create-meetup-location-private');
  const locationTimingSelected = locationPrivateEl && locationPrivateEl.checked ? '참여 확정 후' : '바로 공개';

  let selectedDate = '날짜 미정';
  if (window._selectedCalDate) {
    const [cy, cm, cd] = window._selectedCalDate.split('-').map(Number);
    const dateObj = new Date(cy, cm - 1, cd);
    const WD = ['일', '월', '화', '수', '목', '금', '토'];
    selectedDate = `${cy}년 ${cm}월 ${cd}일 (${WD[dateObj.getDay()]})`;
  }

  // Time from pickers (use scoped selector to avoid picking up age pickers)
  const timePickers = document.querySelectorAll('#create-meetup-time .picker-wheel-container');
  let selectedTime = "오후 7시 00분";
  if (timePickers.length >= 2) {
    const hIdx = Math.round(timePickers[0].scrollTop / 40);
    const mIdx = Math.round(timePickers[1].scrollTop / 40);
    const hItems = timePickers[0].querySelectorAll('.picker-item');
    const mItems = timePickers[1].querySelectorAll('.picker-item');
    if (hItems[hIdx] && mItems[mIdx]) {
      selectedTime = hItems[hIdx].innerText + ' ' + mItems[mIdx].innerText;
    }
  }

  const capMinEl = document.getElementById('create-meetup-cap-min');
  const capMaxEl = document.getElementById('create-meetup-cap-max');
  const capMin = capMinEl ? parseInt(capMinEl.value) || 2 : 2;
  const capMax = capMaxEl ? parseInt(capMaxEl.value) || capMin : capMin;
  const selectedCapacity = capMax;

  const selectedFeeBtn = document.querySelector('#create-meetup-fee-wrapper .filter-chip.selected');
  const feeType = selectedFeeBtn ? selectedFeeBtn.innerText.trim() : '';
  const feeInputEl = document.getElementById('create-meetup-fee-input');
  let inputFee = '무료';
  if (feeType === '각자') inputFee = '각자';
  else if (feeType === '1/N') inputFee = '1/N';
  else if (feeType === '기타') inputFee = feeInputEl && feeInputEl.value.trim() ? feeInputEl.value.trim() : '기타';

  const tagsEl = document.getElementById('create-meetup-tags');
  const tagsText = tagsEl ? tagsEl.value.trim() : '';
  const inputTags = tagsText
    ? tagsText.split(',').map(t => t.trim()).filter(t => t).map(t => t.startsWith('#') ? t : '#' + t)
    : ['#스타일무관'];

  const descEl = document.getElementById('create-meetup-desc');
  const inputDescription = descEl ? descEl.value.trim() : '';

  const noticeEl = document.getElementById('create-meetup-notice');
  const inputNotice = noticeEl ? noticeEl.value.trim() : '';

  const hostPublicEl = document.querySelector('#create-meetup-host-public .selected');
  const hostPublicSelected = hostPublicEl ? (hostPublicEl.innerText.trim() === '프로필 공개') : false;

  const ageAnyCb = document.getElementById('create-meetup-age-any');
  const isAgeAny = ageAnyCb && ageAnyCb.checked;
  const ageFromWheel = document.querySelector('#create-meetup-age-from-picker .picker-wheel-container');
  const ageToWheel = document.querySelector('#create-meetup-age-to-picker .picker-wheel-container');
  let ageRange = '';
  if (isAgeAny) {
    ageRange = '무관';
  } else if (ageFromWheel && ageToWheel) {
    const afIdx = Math.round(ageFromWheel.scrollTop / 40);
    const atIdx = Math.round(ageToWheel.scrollTop / 40);
    const afItems = ageFromWheel.querySelectorAll('.picker-item');
    const atItems = ageToWheel.querySelectorAll('.picker-item');
    if (afItems[afIdx] && atItems[atIdx]) {
      ageRange = afItems[afIdx].innerText + ' ~ ' + atItems[atIdx].innerText;
    }
  }
  if (!ageRange) { window.showToast('참여 연령대를 선택해주세요'); return; }

  const inputLinks = [];
  document.querySelectorAll('.meetup-link-item').forEach(item => {
    const typeEl = item.querySelector('.link-type-chip.selected');
    const type = typeEl ? typeEl.textContent.trim() : '기타';
    if (type === '소셜') {
      const igEl = item.querySelector('.social-instagram-input');
      const xEl = item.querySelector('.social-x-input');
      const igHandle = igEl ? igEl.value.trim().replace(/^@/, '') : '';
      const xHandle = xEl ? xEl.value.trim().replace(/^@/, '') : '';
      if (igHandle) inputLinks.push({ type: '소셜', platform: '인스타그램', handle: igHandle });
      if (xHandle) inputLinks.push({ type: '소셜', platform: 'X', handle: xHandle });
    } else {
      const urlEl = item.querySelector('.link-url-input input');
      const url = urlEl ? urlEl.value.trim() : '';
      if (url) inputLinks.push({ type, url });
    }
  });

  if (!selectedCategory) { window.showToast('카테고리를 선택해주세요'); return; }
  if (!inputTitle) { window.showToast('모임 이름을 입력해주세요'); return; }
  if (!inputRegion) { window.showToast('지역을 선택해주세요'); return; }
  if (!window._selectedCalDate) { window.showToast('날짜를 선택해주세요'); return; }

  // timestamp는 '모임 시작 시각'이다. 여기에 생성 시각을 넣으면 만들자마자
  // 이미 시작된 모임이 되어 신청도 브릿지 노출도 막힌다.
  const startISO = buildMeetupStartISO(window._selectedCalDate, selectedTime);

  const fields = {
    type: selectedCategory,
    secondaryType: secondaryCategory,
    title: inputTitle,
    shortLocation: inputLocation,
    fullAddress: inputLocation,
    date: selectedDate + " " + selectedTime,
    timestamp: startISO,
    desc: inputDescription,
    maxCap: selectedCapacity,
    fee: inputFee,
    tags: inputTags,
    rules: inputNotice,
    hostPublic: hostPublicSelected,
    locationTiming: locationTimingSelected,
    ageRange: ageRange || null,
    links: inputLinks.length > 0 ? inputLinks : null,
    images: (window._meetupImages || []).length > 0 ? [...window._meetupImages] : null,
  };

  // ── 수정 모드 ──────────────────────────────────────
  const editingId = window._editingMeetupId;
  if (editingId != null) {
    const m = MOCK_MEETUPS.find(x => String(x.id) === String(editingId));
    if (!m) { window.showToast('모임을 찾을 수 없어요'); return; }
    // 날짜·시간·장소가 바뀌었는지는 덮어쓰기 전에 봐야 안다.
    const before = { timestamp: m.timestamp, date: m.date, fullAddress: m.fullAddress, shortLocation: m.shortLocation };
    Object.assign(m, fields);
    window._editingMeetupId = null;

    const changed = [];
    if (before.timestamp !== m.timestamp || before.date !== m.date) changed.push('일정');
    if (before.fullAddress !== m.fullAddress || before.shortLocation !== m.shortLocation) changed.push('장소');
    if (changed.length) notifyMeetupParticipants(m, `'${m.title}' 모임 정보가 변경됐어요. 확인해주세요`, '📝');
    persistMyMeetups();

    window.closeModal();
    openMeetupDetail(m.id);
    window.showToast(changed.length ? `수정했어요 · 참여자에게 ${changed.join('·')} 변경을 알렸어요` : '수정했어요');
    return;
  }

  const newMeetup = Object.assign({
    id: Date.now(),
    currentCap: selectedCategory.includes('행사') ? 0 : 1,
    isRecommended: false,
    isSaved: false,
    // 호스트는 참여자가 아니다. true로 두면 목록 카드가 참여 배지를 단다.
    hasRSVPd: false,
    createdByMe: true,
    hostName: "나",
    hostType: selectedCategory.includes('행사') ? "단체" : "개인",
    hostBio: "",
    styleTrait: "무관",
    participants: []
  }, fields);

  MOCK_MEETUPS.unshift(newMeetup);
  persistMyMeetups();

  // 3. Close modal
  window.closeModal();

  // 4. Refresh tab
  // '.tab.active'는 이 화면에 없을 때가 있어 null.dataset으로 터졌다.
  // 앱이 이미 들고 있는 currentTab을 쓴다.
  if (currentTab === 'meetups') {
    window.renderMeetupList();
  } else {
    window.switchTab('meetups');
  }

  // 5. Show toast
  window.showToast("모임이 생성됐어요 🎉");
};

// "2026-9-10" + "오후 7시 30분" → ISO. 날짜가 없으면 null(시간 제약 없는 항목).
function buildMeetupStartISO(calDate, timeLabel) {
  if (!calDate) return null;
  const [y, mo, d] = String(calDate).split('-').map(Number);
  if (![y, mo, d].every(Number.isFinite)) return null;
  let hour = 19, min = 0;
  const t = String(timeLabel || '').match(/(오전|오후|정오)\s*(\d+)시(?:\s*(\d+)분)?/);
  if (t) {
    const h = Number(t[2]);
    hour = t[1] === '오전' ? h : t[1] === '정오' ? 12 : (h % 12) + 12;
    min = Number(t[3] || 0);
  }
  return new Date(y, mo - 1, d, hour, min, 0).toISOString();
}
window.buildMeetupStartISO = buildMeetupStartISO;

// ── 모임 취소 ────────────────────────────────────────
// 삭제가 아니라 '취소됨' 표시다. 목록·브릿지에서는 빠지지만 호스트의 만든 모임
// 목록에는 남는다 — 내가 뭘 취소했는지는 남아 있어야 한다.
window.cancelMeetup = function (id) {
  const m = MOCK_MEETUPS.find(x => String(x.id) === String(id));
  if (!m) return { ok: false, reason: 'not_found' };
  if (!isMeetupHost(m)) return { ok: false, reason: 'not_host' };
  if (m.cancelled) return { ok: false, reason: 'already' };
  m.cancelled = true;
  m.cancelledAt = Date.now();
  persistMyMeetups();
  const n = notifyMeetupParticipants(m, `'${m.title}' 모임이 취소됐어요`, '🚫');
  return { ok: true, notified: n };
};

// 되돌릴 수 없는 행동에는 시트를 세운다. 책 덮기와 같은 무게라 같은 형태를 쓴다.
window.openConfirmSheet = function ({ title, body, confirmLabel, cancelLabel, onConfirm }) {
  if (document.getElementById('confirm-sheet')) return;
  const opener = document.activeElement;
  const scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';
  const sheet = document.createElement('div');
  sheet.id = 'confirm-sheet';
  sheet.className = 'confirm-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', 'confirm-sheet-title');
  sheet.innerHTML = `
    <div class="sheet-grabber" aria-hidden="true"></div>
    <h2 class="confirm-sheet-title" id="confirm-sheet-title">${escapeHTML(title || '')}</h2>
    <p class="confirm-sheet-body">${escapeHTML(body || '')}</p>
    <div class="confirm-sheet-actions">
      <button type="button" class="sheet-btn sheet-btn--ghost" id="confirm-sheet-cancel">${escapeHTML(cancelLabel || '그만두기')}</button>
      <button type="button" class="sheet-btn sheet-btn--commit" id="confirm-sheet-ok">${escapeHTML(confirmLabel || '확인')}</button>
    </div>
  `;
  const container = document.getElementById('app-container') || document.body;
  container.appendChild(scrim);
  container.appendChild(sheet);

  function dismiss() {
    document.removeEventListener('keydown', onKey, true);
    sheet.remove(); scrim.remove();
    if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus();
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); dismiss(); } }
  document.addEventListener('keydown', onKey, true);
  scrim.addEventListener('click', dismiss);
  sheet.querySelector('#confirm-sheet-cancel').addEventListener('click', dismiss);
  sheet.querySelector('#confirm-sheet-ok').addEventListener('click', () => { dismiss(); onConfirm && onConfirm(); });
  requestAnimationFrame(() => sheet.querySelector('#confirm-sheet-cancel')?.focus());
};

window.handleCancelMeetup = function (id) {
  const m = MOCK_MEETUPS.find(x => String(x.id) === String(id));
  if (!m) return;
  window.openConfirmSheet({
    title: '모임을 취소할까요?',
    body: '참여자 전원에게 취소 알림이 가고, 목록에서 더 이상 보이지 않아요. 되돌릴 수 없어요.',
    cancelLabel: '계속 진행하기',
    confirmLabel: '모임 취소하기',
    onConfirm: () => doCancelMeetup(id),
  });
};

function doCancelMeetup(id) {
  const res = window.cancelMeetup(id);
  if (!res.ok) { window.showToast('취소할 수 없어요'); return; }
  window.closeModal();
  if (currentTab === 'meetups') window.renderMeetupList();
  window.showToast(res.notified ? `모임을 취소하고 참여자 ${res.notified}명에게 알렸어요` : '모임을 취소했어요');
}

// 참여자 전원에게 알림. 목업에서 실제 수신자는 '나'뿐이고(내 신청 기록이 있을 때),
// 호스트가 승인해둔 신청자 수는 화면에 보여줄 숫자로만 센다.
function notifyMeetupParticipants(m, text, icon) {
  let count = 0;
  const mine = meetupJoins[String(m.id)];
  if (mine && (mine.status === 'pending' || mine.status === 'confirmed')) {
    DUMMY_NOTIFICATIONS.unshift({ icon: icon || '📣', text, time: '방금', unread: true });
    count += 1;
  }
  count += (meetupApplicants[String(m.id)] || []).filter(a => a && a.status === 'confirmed').length;
  return count;
}
window.notifyMeetupParticipants = notifyMeetupParticipants;

// ── 설정 페이지 ────────────────────────────────────────
// 예전에는 내 프로필 화면 하단에 인라인으로 붙어 있었다. 프로필은 남에게
// 보여줄 내용이고 설정은 나만 쓰는 도구라, 같은 스크롤에 있을 이유가 없다.
// 닉네임 · 생년월일 · 성향 · 연애 상태 · 찾는 것.
// 프로필 '내용'이 아니라 계정의 뼈대라서 수정 화면이 아니라 설정에 둔다.
window.closeSettingsPage = function () {
  // 저장하지 않은 닉네임 초안은 그냥 버린다. 확정은 '저장' 버튼에만 있다.
  closeModal();
  if (currentTab === 'profile') switchTab('profile');
};

function getBasicsFormHTML() {
  const nickOk = window.canChangeNickname();
  const birthText = `${userBirthDate.year}년 ${userBirthDate.month}월 ${userBirthDate.day}일`;
  const seekingLabel = (SEEKING_INTENTS.find(o => o.key === userSeekingIntent) || {}).label || '';

  return `
    <div class="edit-field">
      <span class="edit-field-label">닉네임</span>
      <!-- 닉네임만 초안이다. 3개월 쿨다운이 걸리는 값이라 화면을 닫는 것만으로
           확정되면 안 된다 — 스쳐 지나가다 오타를 남기면 세 달을 못 고친다. -->
      <div class="nickname-row">
        <input type="text" class="input-field" id="edit-name" maxlength="20"
          placeholder="닉네임" value="${escapeAttr(userName || '')}"
          ${nickOk ? '' : 'disabled'}
          oninput="window.onNicknameInput(this.value)" />
        ${nickOk ? `<button type="button" class="nickname-save" id="nickname-save" disabled
          onclick="window.saveNickname()">저장</button>` : ''}
      </div>
      ${nickOk
        ? '<span class="edit-field-hint">닉네임은 3개월에 한 번 바꿀 수 있어요. 저장을 눌러야 확정돼요.</span>'
        : `<span class="edit-field-hint is-locked">${escapeHTML(window.nicknameUnlockText())}</span>`}
    </div>

    <label class="edit-field">
      <span class="edit-field-label">생년월일</span>
      <!-- 온보딩 이후 영구 고정. 나이는 매칭의 기준값이라 나중에 못 바꾼다. -->
      <div class="edit-field-readonly">${escapeHTML(birthText)}</div>
      <span class="edit-field-hint">생년월일은 바꿀 수 없어요</span>
    </label>

    <h3 class="basics-heading">성향</h3>
    <div class="role-pills">
      ${ROLE_CODES.map(c => `
        <div class="role-pill${userRole === c ? ' active' : ''}" onclick="selectRole('${c}', this)">${ROLE_LABELS[c]}</div>
      `).join('')}
    </div>

    <h3 class="basics-heading">연애 상태</h3>
    <div class="role-pills">
      ${RELATIONSHIP_STATUSES.map(o => `
        <div class="role-pill${userRelationshipStatus === o.key ? ' active' : ''}" onclick="selectRelationshipStatus('${o.key}', this)">${o.label}</div>
      `).join('')}
    </div>

    <h3 class="basics-heading">p.2에서 찾는 것</h3>
    ${isPartnered()
      ? `<div class="edit-section-note">연애 중이거나 결혼하신 분께는 "친구/네트워크가 생겼으면 해요"로 표시돼요.</div>`
      : `<div class="role-pills is-stacked">
          ${SEEKING_INTENTS.map(o => `
            <div class="role-pill${userSeekingIntent === o.key ? ' active' : ''}" onclick="window.selectSeekingFromBasics('${o.key}')">${o.label}</div>
          `).join('')}
        </div>`}
  `;
}
window.getBasicsFormHTML = getBasicsFormHTML;

// 설정 화면의 기본 사항 블록만 다시 그린다. 연애 상태를 바꾸면 아래 구성이 달라진다.
window.renderBasicsForm = function () {
  const host = document.querySelector('.settings-basics');
  if (!host) return;
  host.innerHTML = getBasicsFormHTML();
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// 타자를 칠 때는 아무것도 확정하지 않는다. 저장 버튼만 켜고 끈다.
window.onNicknameInput = function (value) {
  const btn = document.getElementById('nickname-save');
  if (!btn) return;
  const next = (value || '').trim();
  btn.disabled = !next || next === (userName || '').trim();
};

// 여기서만 닉네임이 바뀌고, 여기서만 쿨다운 시계가 돈다.
window.saveNickname = function () {
  const el = document.getElementById('edit-name');
  if (!el) return;
  const next = (el.value || '').trim();
  if (!next) { window.showToast('닉네임을 입력해주세요'); return; }
  if (next === (userName || '').trim()) return;
  if (!window.canChangeNickname()) { window.showToast(window.nicknameUnlockText()); return; }

  userName = next;
  userNicknameChangedAt = Date.now();
  persistOnboardingChoices();
  window.renderBasicsForm();
  window.showToast('닉네임을 저장했어요');
};

window.selectSeekingFromBasics = function (key) {
  userSeekingIntent = key;
  persistOnboardingChoices();
  window.renderBasicsForm();
};

window.openSettingsPage = function () {
  const mc = getModalContainer();
  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 200; background: var(--bg-color); display:flex; flex-direction:column; height:100%;">
      <div class="app-header" style="background:var(--bg-color); flex-shrink:0;">
        <button class="back-btn" aria-label="뒤로" onclick="window.closeSettingsPage()"><i data-lucide="chevron-left" style="width:28px;"></i></button>
        <div style="font-size:16px; font-weight:600; color:var(--text-dark);">설정</div>
        <div style="width:32px;"></div>
      </div>

      <div class="scroll-y" style="flex:1;">
        <div style="padding: 8px 24px 40px;">
          <div class="profile-section-label">친구 초대</div>
          <div class="settings-card" onclick="window.openInvitePage()" style="cursor: pointer; margin-bottom: 8px;">
            <div class="settings-row">
              <span style="font-weight: 600;">초대하기</span>
              <i data-lucide="chevron-right"></i>
            </div>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-left: 4px; margin-bottom: 24px;">
            나만의 초대코드로 소중한 사람을 초대해보세요
          </div>

          <div class="profile-section-label">기본 사항</div>
          <div class="settings-basics">${getBasicsFormHTML()}</div>

          <div class="profile-section-label">위치</div>
          <div class="location-banner" id="location-banner">${getLocationBannerHTML()}</div>
          ${window.hasUserLocation() ? `
          <div class="settings-card" style="margin-bottom:24px;">
            <div class="settings-row no-chevron">
              <span>현재 지역</span>
              <span class="version-text">${toBroadRegion(userLocation) || '--'}</span>
            </div>
          </div>` : ''}

          <div class="profile-section-label">설정</div>
          <div class="settings-card">
            <div class="settings-row">
              <span>알림 설정</span>
              <i data-lucide="chevron-right"></i>
            </div>
            <div class="settings-row" onclick="window.openBlockedList()">
              <span>차단 목록</span>
              <i data-lucide="chevron-right"></i>
            </div>
            <div class="settings-row">
              <span>개인정보 처리방침</span>
              <i data-lucide="chevron-right"></i>
            </div>
            <div class="settings-row">
              <span>이용약관</span>
              <i data-lucide="chevron-right"></i>
            </div>
            <div class="settings-row no-chevron">
              <span>버전 정보</span>
              <span class="version-text">v0.1.0</span>
            </div>
          </div>

          <div class="settings-footer-links">
            <div class="footer-link">로그아웃</div>
            <div class="footer-link danger">계정 탈퇴</div>
          </div>
        </div>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ── 내 프로필 편집 · 프로필 모달 ────────────────────────
// 내 프로필 객체. 탭의 기본 화면과 편집 화면이 같은 데이터를 본다.
window.buildMyProfileObject = function () {
  return {
    name: userName || '나나',
    birthYear: userBirthDate.year || 1990,
    role: userRole || 'GT',
    location: userLocation,
    tags: userTags.length > 0 ? userTags : ['영화', '카페', '자연', '독서'],
    intent: getIntentBadgeLabel(),
    bio: userBio || DEFAULT_BIO,
    aboutMe: {
      style: userStyle,
      ideal: userIdeal,
      drink: userDrink,
      smoke: userSmoke,
      mbti: userMBTI,
      saju: userSaju,
      religion: userReligion,
      job: userJob
    },
    // 목업 고정값이 아니라 실제 저장된 답변 수. renderAnswersGrid가 이 값으로
    // 챕터 잠금을 판정하므로, 0개인 챕터가 채워진 것처럼 보이면 안 된다.
    chapterProgress: {
      c1: window.getChapterAnswerCount(1),
      c2: window.getChapterAnswerCount(2),
      c3: window.getChapterAnswerCount(3),
    },
    photos: (window.myPhotos || []).filter(Boolean),
    image: (window.myPhotos || []).find(Boolean) || null,
  };
};

// ── 편집 폼 — 기본 정보 ────────────────────────────────
// 온보딩에서 정해진 값들을 나중에 고칠 자리. 온보딩과 같은 컴포넌트(.role-pills,
// .intent-option, .tag-pill, .date-selects)를 그대로 써서 두 화면이 같은 물건으로
// 읽히게 한다. 입력은 즉시 상태에 반영되고 persistOnboardingChoices()가 저장한다.
function getProfileEditFormHTML() {
  const b = userBirthDate;
  const birthText = b && b.year ? `${b.year}년 ${b.month || 1}월 ${b.day || 1}일` : '—';
  const nickOk = window.canChangeNickname();

  // 사진 그리드는 탭 위에 고정. 어느 섹션을 편집하든 내 얼굴은 늘 보인다.
  // 아래는 관심사 / 한마디 / 나에 대해 / 나의 페이지 네 갈래의 책갈피 탭.
  const active = PROFILE_EDIT_TABS.some(t => t.key === window.__profileEditTab)
    ? window.__profileEditTab : PROFILE_EDIT_TABS[0].key;

  return `
    <div class="profile-edit-form">
      <div class="pe-tabs" role="tablist" aria-label="편집할 항목">
        ${PROFILE_EDIT_TABS.map(t => {
          const on = t.key === active;
          return `<button type="button" role="tab" id="pe-tab-${t.key}"
                    class="pe-tab${on ? ' is-active' : ''}"
                    aria-selected="${on}" aria-controls="pe-panel"
                    tabindex="${on ? '0' : '-1'}"
                    onclick="window.selectProfileEditTab('${t.key}')">${t.label}</button>`;
        }).join('')}
      </div>
      <div id="pe-panel" class="pe-panel" role="tabpanel" aria-labelledby="pe-tab-${active}">
        ${renderProfileEditPanel(active)}
      </div>
    </div>
  `;
}

// 네 섹션 순서. 가벼운 것부터 무거운 것 순 — 관심사·한마디는 한 번에 끝나고
// 나에 대해는 8칸, 나의 페이지는 27문항이다.
const PROFILE_EDIT_TABS = [
  { key: 'tags', label: '관심사' },
  { key: 'bio', label: '한마디' },
  { key: 'about', label: '나에 대해' },
  { key: 'pages', label: '나의 페이지' },
];
window.__profileEditTab = window.__profileEditTab || 'tags';

function renderProfileEditPanel(key) {
  if (key === 'tags') {
    return `
      <div id="edit-tag-counter" class="interest-counter ${userTags.length >= 3 ? 'ready' : ''}">${userTags.length}/${MAX_TAGS}개 선택됨</div>
      ${INTEREST_CATEGORIES.map(cat => `
        <div class="tag-category">
          <span class="tag-category-title">${cat.name}</span>
          <div class="tags-container">
            ${cat.tags.map(tag => `
              <div class="tag-pill${userTags.includes(tag) ? ' selected' : ''}" onclick="window.toggleProfileTag(this, '${tag}')">${tag}</div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;
  }

  if (key === 'bio') {
    return `
      <p class="sub-editor-note">프로필 상단에 한 줄로 걸리는 문장이에요.</p>
      <label class="edit-field">
        <span class="edit-field-label">한마디</span>
        <input type="text" class="input-field" id="edit-bio" maxlength="40"
          placeholder="${escapeAttr(DEFAULT_BIO)}" value="${escapeAttr(userBio)}"
          oninput="window.updateProfileField('bio', this.value)" />
      </label>
    `;
  }

  if (key === 'about') {
    return ABOUT_ME_FIELDS.map(f => `
      <label class="edit-field">
        <span class="edit-field-label">${f.label}</span>
        <input type="text" class="input-field" id="edit-about-${f.key}" maxlength="40"
          placeholder="${escapeAttr(f.placeholder)}" value="${escapeAttr(getAboutMeValue(f.key))}"
          oninput="window.updateAboutMeField('${f.key}', this.value)" />
      </label>
    `).join('');
  }

  // 나의 페이지 — 챕터 탭(Ch1/2/3)이 이 안에 그대로 들어온다. 탭 속의 탭.
  return renderChapterSection();
}
window.renderProfileEditPanel = renderProfileEditPanel;

// 탭만 갈아끼운다. 사진 그리드와 탭 줄은 그대로 둔다.
window.selectProfileEditTab = function (key) {
  if (!PROFILE_EDIT_TABS.some(t => t.key === key)) return;
  window.__profileEditTab = key;
  const panel = document.getElementById('pe-panel');
  if (!panel) return;
  document.querySelectorAll('.pe-tab').forEach(el => {
    const on = el.id === `pe-tab-${key}`;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-selected', String(on));
    el.tabIndex = on ? 0 : -1;
  });
  panel.setAttribute('aria-labelledby', `pe-tab-${key}`);
  panel.innerHTML = renderProfileEditPanel(key);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  window.bindChapterTabKeys();
  // 섹션을 바꿨는데 이전 섹션에서 내려둔 스크롤에 남아 있으면 엉뚱한 데서 시작한다.
  const sc = document.getElementById('profile-edit-body');
  if (sc) sc.scrollTop = 0;
  panel.classList.remove('is-swapping');
  void panel.offsetWidth;
  panel.classList.add('is-swapping');
};

// 8항목이 각각 전역 변수라 키↔변수 매핑이 한 곳에 있어야 한다.
function getAboutMeValue(key) {
  switch (key) {
    case 'style': return userStyle;
    case 'ideal': return userIdeal;
    case 'drink': return userDrink;
    case 'smoke': return userSmoke;
    case 'mbti': return userMBTI;
    case 'saju': return userSaju;
    case 'religion': return userReligion;
    case 'job': return userJob;
    default: return '';
  }
}

window.updateAboutMeField = function (key, value) {
  switch (key) {
    case 'style': userStyle = value; break;
    case 'ideal': userIdeal = value; break;
    case 'drink': userDrink = value; break;
    case 'smoke': userSmoke = value; break;
    case 'mbti': userMBTI = value; break;
    case 'saju': userSaju = value; break;
    case 'religion': userReligion = value; break;
    case 'job': userJob = value; break;
    default: return;
  }
  persistOnboardingChoices();
};

// 입력 즉시 상태에 반영하고 저장한다. "완료"를 눌러야만 반영되는 구조는
// 중간에 이탈했을 때 무엇이 남았는지 알 수 없게 만든다.
window.updateProfileField = function (field, value) {
  if (field === 'name') userName = value;
  else if (field === 'bio') userBio = value;
  else if (field === 'year') userBirthDate = { ...userBirthDate, year: value };
  else if (field === 'month') userBirthDate = { ...userBirthDate, month: value };
  else if (field === 'day') userBirthDate = { ...userBirthDate, day: value };
  persistOnboardingChoices();
};

// 편집 화면 전용 태그 토글. 온보딩의 updateTagUI()는 온보딩 DOM을 찾으므로
// 여기서는 이 화면의 카운터와 pill만 갱신한다.
window.toggleProfileTag = function (el, tagName) {
  const selected = userTags.includes(tagName);
  if (selected) userTags = userTags.filter(t => t !== tagName);
  else if (userTags.length < MAX_TAGS) userTags = [...userTags, tagName];
  else { showToast(`관심사는 최대 ${MAX_TAGS}개까지 고를 수 있어요`); return; }

  el.classList.toggle('selected', !selected);
  const counter = document.getElementById('edit-tag-counter');
  if (counter) {
    counter.textContent = `${userTags.length}/${MAX_TAGS}개 선택됨`;
    counter.classList.toggle('ready', userTags.length >= 3);
  }
  persistOnboardingChoices();
};

// ── 개별 항목 편집 화면 ────────────────────────────────
// 편집 화면 위에 한 겹 더 올린다. 닫으면 편집 화면 본문만 다시 그려
// 방금 바꾼 값이 섹션 요약에 반영된다.
function openSubEditor(title, bodyHTML, afterRender) {
  let host = document.getElementById('sub-editor');
  if (!host) {
    host = document.createElement('div');
    host.id = 'sub-editor';
    (document.getElementById('app-container') || document.body).appendChild(host);
  }
  host.innerHTML = `
    <div class="modal fade-in active sub-editor-modal" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
      <div class="app-header" style="background:var(--bg-color); flex-shrink:0;">
        <button class="back-btn" aria-label="뒤로" onclick="window.closeSubEditor()"><i data-lucide="chevron-left" style="width:28px;"></i></button>
        <div style="font-size:16px; font-weight:600; color:var(--text-dark);">${escapeHTML(title)}</div>
        <button type="button" class="profile-edit-done" onclick="window.closeSubEditor()">완료</button>
      </div>
      <div class="scroll-y" style="flex:1;">
        <div style="padding: 8px 24px 40px;">${bodyHTML}</div>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  if (afterRender) afterRender();
}

window.closeSubEditor = function () {
  const host = document.getElementById('sub-editor');
  if (host) host.remove();
  window.renderProfileEditBody();
};

// 1) p.2에서 찾는 것 — 연애 중·기혼이면 애초에 진입점이 없다.
window.openEditSeeking = function () {
  if (isPartnered()) return;
  openSubEditor('p.2에서 찾는 것', `
    <p class="sub-editor-note">지금 마음에 가까운 쪽으로 골라주세요.</p>
    ${SEEKING_INTENTS.map(o => `
      <div class="intent-option${userSeekingIntent === o.key ? ' selected' : ''}" onclick="selectSeekingIntent(this, '${o.key}')">${o.label}</div>
    `).join('')}
  `);
};

// 2) 관심사
window.openEditTags = function () {
  openSubEditor('관심사', `
    <div id="edit-tag-counter" class="interest-counter ${userTags.length >= 3 ? 'ready' : ''}">${userTags.length}/${MAX_TAGS}개 선택됨</div>
    ${INTEREST_CATEGORIES.map(cat => `
      <div class="tag-category">
        <span class="tag-category-title">${cat.name}</span>
        <div class="tags-container">
          ${cat.tags.map(tag => `
            <div class="tag-pill${userTags.includes(tag) ? ' selected' : ''}" onclick="window.toggleProfileTag(this, '${tag}')">${tag}</div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `);
};

// 3) 한마디 + 나에 대해 — 두 섹션의 연필이 같은 화면으로 온다.
window.openEditBioAbout = function () {
  openSubEditor('한마디 · 나에 대해', `
    <label class="edit-field">
      <span class="edit-field-label">한마디</span>
      <input type="text" class="input-field" id="edit-bio" maxlength="40"
        placeholder="${escapeAttr(DEFAULT_BIO)}" value="${escapeAttr(userBio)}"
        oninput="window.updateProfileField('bio', this.value)" />
    </label>

    <h3 class="sub-editor-heading">나에 대해</h3>
    ${ABOUT_ME_FIELDS.map(f => `
      <label class="edit-field">
        <span class="edit-field-label">${f.label}</span>
        <input type="text" class="input-field" id="edit-about-${f.key}" maxlength="40"
          placeholder="${escapeAttr(f.placeholder)}" value="${escapeAttr(getAboutMeValue(f.key))}"
          oninput="window.updateAboutMeField('${f.key}', this.value)" />
      </label>
    `).join('')}
  `);
};

// 4) 나의 페이지 — 챕터 요약 + 27문항 전체(답변 유무 무관)
// 마지막으로 보던 챕터. 문항 하나 편집하고 돌아왔을 때(returnToChapterList)
// 1챕터로 튕기면 답을 채우던 흐름이 끊긴다.
window.__chapterTab = window.__chapterTab || 1;

const CHAPTER_TAB_LABELS = { 1: '나', 2: '사랑', 3: '관계' };

// 한 챕터(9문항)의 행들. 답변한 것과 안 한 것을 함께 세운다 — 빈 문항이
// 목록에서 빠지면 "무엇이 남았는지"를 알 방법이 없다.
window.renderChapterQuestionRows = function (chapNum) {
  return QUESTIONS.filter(q => q.chapter === chapNum).map(q => {
    const raw = MY_ANSWERS[q.id];
    const text = raw && typeof raw === 'object' ? formatAnswerText(raw.text, q) : (raw || '');
    const has = String(text || '').trim().length > 0;
    return `
      <button type="button" class="chapter-q-row${has ? ' is-answered' : ''}" onclick="window.openChapterAnswer(${q.id})">
        <span class="chapter-q-no">Q.${q.id}</span>
        <span class="chapter-q-body">
          <span class="chapter-q-text">${escapeHTML(q.text)}</span>
          <span class="chapter-q-answer">${has ? escapeHTML(String(text).replace(/\n/g, ' ').slice(0, 40)) : '아직 답하지 않았어요'}</span>
        </span>
        <i data-lucide="${has ? 'pencil' : 'plus'}" class="chapter-q-icon" aria-hidden="true"></i>
      </button>`;
  }).join('');
};

// 상단 진행 요약 블록은 그대로 두고 아래 문항 리스트만 갈아끼운다.
window.selectChapterTab = function (chapNum) {
  window.__chapterTab = chapNum;
  const list = document.getElementById('chapter-q-list');
  if (!list) return;

  document.querySelectorAll('.chapter-tab').forEach((el, i) => {
    const on = (i + 1) === chapNum;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-selected', String(on));
    el.tabIndex = on ? 0 : -1;
  });

  list.setAttribute('aria-labelledby', `chapter-tab-${chapNum}`);
  list.innerHTML = window.renderChapterQuestionRows(chapNum);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // 챕터를 바꿨는데 이전 챕터에서 내려둔 스크롤에 남아 있으면 9문항 중
  // 엉뚱한 지점부터 보인다. 전환할 때마다 맨 위로 되돌린다.
  const scroller = document.getElementById('profile-edit-body')
    || document.querySelector('#sub-editor .scroll-y');
  if (scroller) scroller.scrollTop = 0;

  // 내용만 교체하면 전환이 뚝 끊긴다 — 짧은 페이드로 이어준다.
  list.classList.remove('is-swapping');
  void list.offsetWidth;
  list.classList.add('is-swapping');
};

// 챕터 요약(=탭) + 선택한 챕터의 9문항. 이제 서브에디터가 아니라 프로필 수정
// 화면의 '나의 페이지' 탭 안에 들어간다. 마크업은 한 벌만 둔다.
function renderChapterSection() {
  const answered = ch => QUESTIONS.filter(q => q.chapter === ch && MY_ANSWERS[q.id]).length;
  const benefit = window.getWeeklyBookCount ? window.getWeeklyBookCount() : 3;
  const active = [1, 2, 3].includes(window.__chapterTab) ? window.__chapterTab : 1;

  // 진행 요약이 곧 탭이다. 진행률을 보는 자리와 챕터를 고르는 자리를
  // 따로 두면 같은 정보가 화면에 두 번 나온다.
  return `
    <div class="chapter-summary">
      <div class="chapter-summary-top">
        📖 이번 주 열람 가능한 프로필북
        <span class="chapter-summary-count">${benefit}권</span>
      </div>
      <div class="chapter-tabs" role="tablist" aria-label="챕터 선택">
        ${[1, 2, 3].map(n => {
          const c = answered(n);
          const on = n === active;
          return `
          <button type="button" role="tab" id="chapter-tab-${n}"
                  class="chapter-tab${on ? ' is-active' : ''}"
                  aria-selected="${on}" aria-controls="chapter-q-list"
                  tabindex="${on ? '0' : '-1'}"
                  onclick="window.selectChapterTab(${n})">
            <span class="chapter-label">Chapter ${n} · ${CHAPTER_TAB_LABELS[n]}</span>
            <span class="chapter-track"><span class="chapter-fill" style="width:${Math.round(c / 9 * 100)}%;"></span></span>
            <span class="chapter-pct">${c}/9</span>
          </button>`;
        }).join('')}
      </div>
    </div>
    <div id="chapter-q-list" class="chapter-q-list" role="tabpanel" aria-labelledby="chapter-tab-${active}">
      ${window.renderChapterQuestionRows(active)}
    </div>
  `;
}
window.renderChapterSection = renderChapterSection;

// role="tab"을 붙였으면 좌우 방향키가 돌아야 한다. 렌더 뒤에 한 번 건다.
window.bindChapterTabKeys = function () {
  const tabs = [...document.querySelectorAll('.chapter-tab')];
  tabs.forEach((el, i) => {
    if (el.__keysBound) return;
    el.__keysBound = true;
    el.addEventListener('keydown', e => {
      const d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1
              : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = (i + d + tabs.length) % tabs.length;
      window.selectChapterTab(next + 1);
      tabs[next].focus();
    });
  });
};

// 예전 진입점. 이제 '나의 페이지'는 프로필 수정 화면의 탭이라 그리로 보낸다.
window.openEditChapters = function () {
  window.__profileEditTab = 'pages';
  if (!document.getElementById('profile-edit-modal')) window.openMyProfileEdit();
  else window.renderProfileEditBody();
};

// 문항 하나를 연다. 답변 타입별 입력 UI는 openInputModal이 이미 갖고 있으므로
// (text / choice / multiple-choice / compound) 그대로 쓴다. 자유 텍스트로 덮어쓰면
// compound 9문항과 multiple-choice 1문항의 구조가 날아간다.
window.openChapterAnswer = function (qid) {
  window.__returnToChapterList = true;
  window.__profileEditTab = 'pages';
  // openInputModal은 #modal-container를 통째로 갈아끼운다 — 그 안에 있던
  // 프로필 수정 모달이 사라지므로, 돌아올 때 다시 세워야 한다.
  const host = document.getElementById('sub-editor');
  if (host) host.remove();
  openInputModal(qid);

  // 저장하지 않고 닫는 경로(X · 건너뛰기)도 문항 목록으로 돌아가야 한다.
  const modal = document.querySelector('#modal-container .modal');
  if (!modal) return;
  modal.querySelectorAll('[onclick*="closeModal()"]').forEach(el => {
    el.setAttribute('onclick', 'window.returnToChapterList()');
  });
};

// 문항 화면 → 수정 화면 → 문항 목록 순으로 다시 세운다.
window.returnToChapterList = function () {
  window.__returnToChapterList = false;
  window.__profileEditTab = 'pages';
  closeModal();
  window.openMyProfileEdit();
};

// 편집 화면. 예전에는 이쪽이 프로필 탭의 기본 화면이었고 완성본이 모달이었다.
// 둘의 자리를 바꿨다 — 기본은 남에게 보이는 모습, 편집은 의도해서 들어간다.
window.openMyProfileEdit = function () {
  const mc = getModalContainer();
  // 닉네임 잠금은 "실제로 바꿨을 때"만 걸린다. 타자 한 글자마다 잠그면
  // 입력 도중에 필드가 죽는다. 열 때의 값을 기억해 닫을 때 비교한다.
  window.__nameAtEditOpen = userName || '';
  mc.innerHTML = `
    <div class="modal fade-in active" id="profile-edit-modal" style="z-index: 200; background: var(--bg-color); display:flex; flex-direction:column; height:100%;">
      <div class="app-header" style="background:var(--bg-color); flex-shrink:0;">
        <button class="back-btn" aria-label="뒤로" onclick="window.closeMyProfileEdit()"><i data-lucide="chevron-left" style="width:28px;"></i></button>
        <div style="font-size:16px; font-weight:600; color:var(--text-dark);">내 프로필북 수정</div>
        <button type="button" class="profile-edit-done" onclick="window.closeMyProfileEdit()">완료</button>
      </div>

      <div class="scroll-y" id="profile-edit-body" style="flex:1;">
        ${getProfileDetailedHTML(window.buildMyProfileObject(), true, false, true)}
      </div>
    </div>
  `;
  window.afterProfileEditRender();
};

// 편집 화면 본문만 다시 그린다. 연애 상태를 바꾸면 진입점 구성이 달라진다.
window.renderProfileEditBody = function () {
  const body = document.getElementById('profile-edit-body');
  if (!body) return;
  body.innerHTML = getProfileDetailedHTML(window.buildMyProfileObject(), true, false, true);
  window.afterProfileEditRender();
};

window.afterProfileEditRender = function () {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initPhotoCarousels();
  initPhotoGrid();
  window.bindChapterTabKeys();

  // 상위 탭도 방향키로 돌아야 한다.
  const tabs = [...document.querySelectorAll('.pe-tab')];
  tabs.forEach((el, i) => {
    el.addEventListener('keydown', e => {
      const d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1
              : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = (i + d + tabs.length) % tabs.length;
      window.selectProfileEditTab(PROFILE_EDIT_TABS[next].key);
      document.getElementById(`pe-tab-${PROFILE_EDIT_TABS[next].key}`)?.focus();
    });
  });
};

// 편집을 닫으면 기본 화면을 다시 그려 수정 내용이 곧바로 반영되게 한다.
window.closeMyProfileEdit = function () {
  // 닉네임이 실제로 바뀐 경우에만 쿨다운 시계를 돌린다.
  const before = window.__nameAtEditOpen ?? '';
  if ((userName || '') !== before && (userName || '').trim()) {
    userNicknameChangedAt = Date.now();
    persistOnboardingChoices();
  }
  closeModal();
  if (currentTab === 'profile') switchTab('profile');
};


window.handleCardClick = function (profileId, qId = null) {
  if (window.blockedByProfileGate()) return;
  if (qId) {
    openAnswerRevealModal(profileId, qId);
  } else {
    openProfileModal(profileId);
  }
};

window.openProfileModal = function (profileId, fromChat = false) {
  console.log('openProfileModal executing for ID:', profileId);
  const p = MOCK_PROFILES.find(x => x.id === profileId);
  const mc = getModalContainer();

  const alreadyPaged = pagedSet?.has('p' + profileId) ?? false;

  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color); display:flex; flex-direction:column; height:100%;">
       <div class="app-header" style="background:var(--bg-color); flex-shrink:0;">
         <button class="back-btn" aria-label="${fromChat ? '뒤로' : '닫기'}" onclick="closeModal()">
           <i data-lucide="${fromChat ? 'chevron-left' : 'x'}" style="width:28px;"></i>
         </button>
         <div style="font-size:16px; font-weight:600; color:var(--text-dark);">${p ? p.name : ''}</div>
         <button type="button" class="profile-block-btn" aria-label="${window.isBlockRelated(profileId) ? '차단 해제' : '차단하기'}" onclick="window.handleToggleBlock(${profileId})">
           <i data-lucide="${window.isBlockRelated(profileId) ? 'user-check' : 'user-x'}" style="width:22px;height:22px;"></i>
         </button>
       </div>
       <div style="flex:1; overflow:hidden; display:flex; flex-direction:column;">
         <div class="scroll-y" style="height:100%;">
           ${getProfileDetailedHTML(p, false)}
         </div>
       </div>
       ${window.isBookClosed('p' + profileId) ? `
       <button id="prof-reopen-btn" class="prof-reopen-btn" onclick="window._handleReopenTap(${profileId})">
         <i data-lucide="rotate-ccw" style="width:18px; height:18px;" aria-hidden="true"></i>
         책 덮기 취소
       </button>
       ` : `
       <button id="prof-page-fab" class="prof-fab" aria-label="${alreadyPaged ? '이미 좋아요를 보낸 프로필북' : '마음 보내기'}" onclick="window._handleProfFabTap(${profileId})">
         <i data-lucide="heart" id="prof-fab-icon" ${alreadyPaged ? 'fill="#fff"' : ''} style="width:24px; height:24px; color:#fff;"></i>
       </button>
       `}
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initPhotoCarousels();

  window._handleProfFabTap = function (pid) {
    const fab = document.getElementById('prof-page-fab');
    const fabSvg = document.getElementById('prof-fab-icon');
    const cardId = 'p' + pid;

    if (pagedSet?.has(cardId)) {
      showToast('이미 Page했어요 ♥');
      return;
    }
    if (window.__actionLocked) return;
    window.__actionLocked = true;
    setTimeout(() => { window.__actionLocked = false; }, 1000);

    // Fill heart
    if (fabSvg) {
      const path = fabSvg.querySelector('path');
      if (path) { path.setAttribute('fill', '#fff'); path.setAttribute('stroke', 'none'); }
    }

    // Pulse animation
    if (fab) {
      fab.classList.add('pulsing');
      fab.addEventListener('animationend', () => fab.classList.remove('pulsing'), { once: true });
    }

    // Toast
    showToast('Page her ♥');

    // 발견 카드의 하트와 같은 경로. 다시보기에서 들어와도 저장·매칭이 동작한다.
    const profile = (browseQueue.find(x => x.id === cardId)
      || dailyProfiles.find(x => x.id === cardId)
      || (window.weeklyViewedProfiles || []).find(x => x.id === cardId) || {}).profile;
    const isMutualMatch = window.pageProfile(cardId);
    // 다시보기 리스트에서 들어온 경우 그 리스트의 상태 표시가 바로 바뀌어야 한다.
    if (currentTab === 'discover') renderDiscoverTab();
    if (isMutualMatch && profile) {
      if (!MATCHED_PROFILES.find(m => m.id === profile.id)) {
        MATCHED_PROFILES.unshift({ id: profile.id, name: profile.name, image: profile.image, isNew: true });
      }
      setTimeout(() => showMutualMatchOverlay(profile), 1700);
    }
  };

  // 책 덮기 취소 — 무반응으로 되돌리고, 그 자리에서 바로 좋아요가 가능해진다.
  window._handleReopenTap = function (pid) {
    if (!window.reopenBook('p' + pid)) return;
    renderDiscoverTab();
    // 같은 프로필을 다시 그려 하트 버튼이 돌아오게 한다.
    openProfileModal(pid, fromChat);
  };

  // Populate answers grid for the selected user
  const gridContainer = mc.querySelector('#my-answers-grid');
  if (gridContainer) {
    const profileAnswers = p.answers || {};
    gridContainer.innerHTML = renderAnswersGrid(profileAnswers, false, p.id, p);
    bindCardInteractions();
  }

  // Pull-to-close gesture
  const modalEl = mc.querySelector('.modal');
  const scrollEl = modalEl.querySelector('.scroll-y');
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  modalEl.addEventListener('touchstart', (e) => {
    if (scrollEl.scrollTop <= 0) {
      startY = e.touches[0].clientY;
      isDragging = true;
    }
  }, { passive: true });

  modalEl.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY - startY;
    if (currentY > 0) {
      if (e.cancelable) e.preventDefault();
      const scale = Math.max(0.85, 1 - (currentY / 1500));
      modalEl.style.transform = `translateY(${currentY}px) scale(${scale})`;
      modalEl.style.borderRadius = `${Math.min(20, currentY / 10)}px`;
    } else {
      isDragging = false;
      modalEl.style.transform = '';
    }
  }, { passive: false });

  modalEl.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    if (currentY > 150) {
      modalEl.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1), opacity 0.3s';
      modalEl.style.transform = `translateY(120px) scale(0.6) rotate(-4deg)`;
      modalEl.style.opacity = '0';
      setTimeout(closeModal, 400);
    } else {
      modalEl.style.transition = 'transform 0.3s ease-out';
      modalEl.style.transform = '';
      modalEl.style.borderRadius = '';
      setTimeout(() => { modalEl.style.transition = ''; }, 300);
    }
    currentY = 0;
  });
}


// Bottom Nav Hide/Show on Scroll

// ── 스크롤 핸들러 · 모임 날짜 포맷 · 주간 리셋 ──────
let lastScrollTop = 0;
document.addEventListener('scroll', function (e) {
  if (e.target.classList && e.target.classList.contains('scroll-y')) {
    const st = e.target.scrollTop;
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    if (st > lastScrollTop && st > 80) {
      // Scrolling down
      nav.classList.add('nav-hidden');
      e.target.classList.add('nav-hidden-content');
    } else if (st < lastScrollTop) {
      // Scrolling up
      nav.classList.remove('nav-hidden');
      e.target.classList.remove('nav-hidden-content');
    }
    lastScrollTop = st <= 0 ? 0 : st;
  }
}, true);

const _DAYS_SHORT = ['일','월','화','수','목','금','토'];

function _dateRangeStr(startDate, endDate) {
  const s = new Date(startDate + 'T00:00:00');
  const e = new Date(endDate + 'T00:00:00');
  return `${s.getMonth()+1}/${s.getDate()} (${_DAYS_SHORT[s.getDay()]}) — ${e.getMonth()+1}/${e.getDate()} (${_DAYS_SHORT[e.getDay()]})`;
}

function getFeedDateString(m) {
  if (m.startDate && m.endDate) return _dateRangeStr(m.startDate, m.endDate);
  if (!m.timestamp) return m.date || '';
  const dt = new Date(m.timestamp);
  const now = new Date();
  const dow = _DAYS_SHORT[dt.getDay()];
  const h = dt.getHours();
  const period = h >= 12 ? '오후' : '오전';
  const dh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  const timeStr = `${period} ${dh}시`;
  // Monday-based week boundaries
  const mon = new Date(now); mon.setHours(0,0,0,0);
  mon.setDate(mon.getDate() - (mon.getDay() === 0 ? 6 : mon.getDay() - 1));
  const nextMon = new Date(mon); nextMon.setDate(mon.getDate() + 7);
  const afterMon = new Date(mon); afterMon.setDate(mon.getDate() + 14);
  const dtD = new Date(dt); dtD.setHours(0,0,0,0);
  if (dtD >= mon && dtD < nextMon) return `이번주 (${dow}) ${timeStr}`;
  if (dtD >= nextMon && dtD < afterMon) return `다음주 (${dow}) ${timeStr}`;
  return `${dt.getMonth()+1}/${dt.getDate()} (${dow}) ${timeStr}`;
}

function getDetailDateString(m) {
  if (m.startDate && m.endDate) return _dateRangeStr(m.startDate, m.endDate);
  if (!m.timestamp) return m.date || '';
  const dt = new Date(m.timestamp);
  const dow = _DAYS_SHORT[dt.getDay()];
  const h = dt.getHours();
  const period = h >= 12 ? '오후' : '오전';
  const dh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${dt.getMonth()+1}/${dt.getDate()} (${dow}) ${period} ${dh}시`;
}

// Returns UTC timestamp of the most recent Monday 7:00 AM KST (UTC+9)
function getWeeklyResetTimestamp() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const dow = kst.getUTCDay(); // 0=Sun, 1=Mon … in KST
  const hour = kst.getUTCHours();
  let daysSince = dow === 0 ? 6 : dow - 1;
  if (dow === 1 && hour < 7) daysSince = 7; // Monday before 7AM → previous cycle
  const resetKST = new Date(kst);
  resetKST.setUTCDate(kst.getUTCDate() - daysSince);
  resetKST.setUTCHours(7, 0, 0, 0);
  return resetKST.getTime() - 9 * 3600 * 1000;
}

function getNextMondayKSTStr() {
  const nextTs = getWeeklyResetTimestamp() + 7 * 24 * 3600 * 1000;
  const nextKST = new Date(nextTs + 9 * 3600 * 1000);
  return `${nextKST.getUTCMonth() + 1}월 ${nextKST.getUTCDate()}일 (월)`;
}

// ── 모임 상세 — 참여 · 북마크 · 오픈카톡 ────────────
// ── 모임 참여 — 신청 → 호스트 승인 → 참여 확정 ──────────────────────
//
// "참여하기"는 더 이상 확정이 아니다. 신청과 확정 사이에 호스트 승인이 들어간다.
// 호스트는 오픈채팅방에 실제로 들어왔는지, 닉네임이 앱과 같은지를 눈으로 보고
// 승인한다 — 그래서 카톡 링크는 확정이 아니라 '신청' 시점에 공개된다.
//
//   none      아직 신청 안 함
//   pending   신청함. 카톡 링크 공개, 정원 카운트 제외, 참여자 열람 불가
//   confirmed 호스트 승인 완료. 정원 포함, 참여자 열람 가능
//
// 시간 기반 마감·자동 만료는 두지 않는다. 번개(당일 즉흥)와 사전 기획형을 한
// 규칙으로 덮으려면 "모임 시작 전까지 항상 열려있음"이 가장 단순하다. 시작이
// 지나면 미승인 신청은 알아서 무의미해지므로 따로 만료 처리하지 않는다.

// 호스트 승인 단계 on/off. 코드는 그대로 두고 이 값만 내린다.
//   true  참여하기 → 신청(pending) → 호스트 승인 → 확정(confirmed)
//   false 참여하기 → 즉시 확정. 신청·승인 개념이 화면에서 사라진다.
// 주소 공개 체크박스의 "참여 확정"도 자연히 이 값을 따라간다 — 꺼져 있으면
// 참여하기를 누른 순간이 곧 확정이라 별도 분기가 필요 없다.
const MEETUP_APPROVAL_ENABLED = false;
window.MEETUP_APPROVAL_ENABLED = MEETUP_APPROVAL_ENABLED;

let meetupJoins = {};      // { [meetupId]: { status, appliedAt, confirmedAt, reminders } }
let meetupApplicants = {}; // { [meetupId]: [ { profileId, name, appliedAt, status } ] }

function persistMeetupJoins() {
  try {
    window.localStorage.setItem(P2_STORAGE_KEYS.meetupJoins, JSON.stringify(meetupJoins));
    window.localStorage.setItem(P2_STORAGE_KEYS.meetupApplicants, JSON.stringify(meetupApplicants));
  } catch (e) { /* private mode / quota */ }
}

function restoreMeetupJoins() {
  const read = (k) => {
    try { const v = JSON.parse(window.localStorage.getItem(k) || 'null'); return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
    catch (e) { return {}; }
  };
  meetupJoins = read(P2_STORAGE_KEYS.meetupJoins);
  meetupApplicants = read(P2_STORAGE_KEYS.meetupApplicants);
  syncMeetupJoinsToMocks();
}
window.restoreMeetupJoins = restoreMeetupJoins;

// MOCK_MEETUPS는 새로고침마다 리터럴 그대로 되살아난다. 저장해둔 신청·승인
// 결과를 한 번 얹어주지 않으면 목록 라벨이 '더 보기'로 돌아가고, 승인으로 늘려둔
// 확정 인원도 사라진다. 로드당 한 번만 도므로 중복 가산은 없다.
function syncMeetupJoinsToMocks() {
  Object.entries(meetupJoins).forEach(([id, rec]) => {
    const m = getMeetup(id);
    if (!m || !rec) return;
    if (rec.status === 'pending' || rec.status === 'confirmed') m.hasRSVPd = true;
    if (rec.status === 'confirmed') m.currentCap = getConfirmedCount(m) + 1;
  });
  Object.entries(meetupApplicants).forEach(([id, list]) => {
    const m = getMeetup(id);
    if (!m || !Array.isArray(list)) return;
    list.filter(a => a && a.status === 'confirmed').forEach(a => {
      m.currentCap = getConfirmedCount(m) + 1;
      if (a.image) (m.participants = m.participants || []).push(a.image);
    });
  });
}

function getMeetup(id) { return MOCK_MEETUPS.find(x => String(x.id) === String(id)) || null; }

// ── 차단 ────────────────────────────────────────────────
//
// 두 방향을 따로 저장한다. 내가 건 차단(blockedUsers)만으로는 "A가 나를
// 차단했다"를 표현할 수 없는데, 스펙이 요구하는 건 대칭이다. 실제로는 서버가
// 두 번째 목록을 내려줘야 하고, 지금은 목업이 그 자리를 대신한다.
let blockedUsers = new Set();    // 내가 차단한 사람
let blockedByUsers = new Set();  // 나를 차단한 사람 (서버가 알려줄 값)

function persistBlocks() {
  try {
    window.localStorage.setItem(P2_STORAGE_KEYS.blockedUsers, JSON.stringify([...blockedUsers]));
    window.localStorage.setItem(P2_STORAGE_KEYS.blockedByUsers, JSON.stringify([...blockedByUsers]));
  } catch (e) { /* private mode / quota */ }
}

function restoreBlocks() {
  const read = (k) => {
    try { const v = JSON.parse(window.localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  };
  blockedUsers = new Set(read(P2_STORAGE_KEYS.blockedUsers).map(Number).filter(Number.isFinite));
  blockedByUsers = new Set(read(P2_STORAGE_KEYS.blockedByUsers).map(Number).filter(Number.isFinite));
}
window.restoreBlocks = restoreBlocks;

// 어느 방향이든 차단이면 차단 관계다.
window.isBlockRelated = function (profileId) {
  const id = Number(profileId);
  return blockedUsers.has(id) || blockedByUsers.has(id);
};
window.getBlockedUsers = function () { return [...blockedUsers]; };

// 차단은 즉시 반영된다. 다음 새로고침을 기다리지 않는다.
function refreshAfterBlockChange() {
  if (typeof currentTab !== 'undefined' && currentTab === 'meetups' && typeof renderMeetupList === 'function') renderMeetupList();
  if (typeof currentTab !== 'undefined' && currentTab === 'discover' && typeof renderDiscoverTab === 'function') {
    if (typeof window.resetBridgeDismissed === 'function') window.resetBridgeDismissed();
    renderDiscoverTab();
  }
}

window.blockUser = function (profileId) {
  const id = Number(profileId);
  if (!Number.isFinite(id)) return false;
  blockedUsers.add(id);
  persistBlocks();
  refreshAfterBlockChange();
  return true;
};

window.unblockUser = function (profileId) {
  const id = Number(profileId);
  blockedUsers.delete(id);
  persistBlocks();
  refreshAfterBlockChange();
  return true;
};

// 목업 전용. 상대가 나를 차단한 상황을 만들어 대칭 동작을 확인한다.
window.__setBlockedByUser = function (profileId, on = true) {
  const id = Number(profileId);
  if (on) blockedByUsers.add(id); else blockedByUsers.delete(id);
  persistBlocks();
  refreshAfterBlockChange();
};

// 이 모임에 걸린 사람들의 프로필 id. 목업은 참여자를 이미지 URL로, 호스트를
// 이름으로 들고 있어서 그걸 프로필로 되짚는다. 백엔드가 붙으면 id가 바로 온다.
function getMeetupPeopleIds(m) {
  const ids = new Set();
  if (!m) return ids;
  const host = MOCK_PROFILES.find(x => x.name === m.hostName);
  if (host) ids.add(host.id);
  (m.participants || []).forEach(url => {
    const prof = MOCK_PROFILES.find(x => x.image === url);
    if (prof) ids.add(prof.id);
  });
  // 호스트가 제외한 사람은 더 이상 이 모임의 사람이 아니다.
  (m.removedParticipants || []).forEach(id => ids.delete(Number(id)));
  return ids;
}
window.getMeetupPeopleIds = getMeetupPeopleIds;

// 호스트든 참여자든 한 명이라도 차단 관계면 그 모임은 보이지 않는다.
// 이미 참여 중이던 모임도 예외가 아니다 — 앱 안에서 보이는 정보는 즉시 끊는다.
// 다만 내가 연 모임은 남긴다. 여기서 숨기면 호스트가 자기 모임을 수정도
// 취소도 할 수 없게 되고, 그건 차단이 지켜주려던 것과 무관한 손해다.
window.isMeetupBlocked = function (m) {
  if (!m || isMeetupHost(m)) return false;
  for (const id of getMeetupPeopleIds(m)) {
    if (window.isBlockRelated(id)) return true;
  }
  return false;
};

window.handleToggleBlock = function (profileId) {
  const prof = MOCK_PROFILES.find(x => x.id === Number(profileId));
  const name = prof ? prof.name : '이 사람';
  if (blockedUsers.has(Number(profileId))) {
    window.unblockUser(profileId);
    window.showToast(`${name} 님 차단을 해제했어요`);
    openProfileModal(Number(profileId));
    return;
  }
  window.openConfirmSheet({
    title: `${name} 님을 차단할까요?`,
    body: '서로의 프로필과 모임이 앱에서 보이지 않게 돼요. 이미 참여 중인 모임도 함께 숨겨져요. 카톡방 멤버십은 그대로예요.',
    confirmLabel: '차단하기',
    onConfirm: () => {
      window.blockUser(profileId);
      window.closeModal();
      window.showToast(`${name} 님을 차단했어요`);
    },
  });
};

window.openBlockedList = function () {
  const ids = window.getBlockedUsers();
  const rows = ids.map(id => MOCK_PROFILES.find(x => x.id === id)).filter(Boolean);
  openSubEditor('차단 목록', rows.length === 0
    ? `<p class="sub-editor-note">차단한 사람이 없어요.</p>`
    : `<p class="sub-editor-note">차단한 사람의 프로필과 모임은 앱에서 보이지 않아요.</p>
       ${rows.map(pr => `
       <div class="applicant-row">
         <div class="applicant-avatar" style="background-image:url('${pr.image}');"></div>
         <div class="applicant-meta"><div class="applicant-name">${escapeHTML(pr.name || '')}</div></div>
         <button type="button" class="applicant-approve" onclick="window.handleUnblockFromList(${pr.id})">차단 해제</button>
       </div>`).join('')}`);
};

window.handleUnblockFromList = function (profileId) {
  const prof = MOCK_PROFILES.find(x => x.id === Number(profileId));
  window.unblockUser(profileId);
  window.showToast(`${prof ? prof.name : ''} 님 차단을 해제했어요`);
  window.openBlockedList();
};

// ── 호스트 — 참여자 제외 ─────────────────────────────────
window.removeParticipant = function (meetupId, profileId) {
  const m = getMeetup(meetupId);
  if (!m || !isMeetupHost(m)) return { ok: false, reason: 'not_host' };
  const prof = MOCK_PROFILES.find(x => x.id === Number(profileId));
  if (!prof) return { ok: false, reason: 'not_found' };
  const before = (m.participants || []).length;
  m.participants = (m.participants || []).filter(url => url !== prof.image);
  if (m.participants.length === before) return { ok: false, reason: 'not_participant' };
  m.removedParticipants = [...new Set([...(m.removedParticipants || []), Number(profileId)])];
  m.currentCap = Math.max(0, getConfirmedCount(m) - 1);
  // 승인 기록도 되돌린다. 안 그러면 새로고침 때 다시 얹혀 되살아난다.
  const list = meetupApplicants[String(meetupId)] || [];
  const a = list.find(x => String(x.profileId) === String(profileId));
  if (a) a.status = 'removed';
  persistMeetupJoins();
  persistMyMeetups();
  return { ok: true, name: prof.name };
};

window.handleRemoveParticipant = function (meetupId, profileId) {
  const prof = MOCK_PROFILES.find(x => x.id === Number(profileId));
  window.openConfirmSheet({
    title: `${prof ? prof.name : '이 참여자'} 님을 제외할까요?`,
    body: '여기서 제외해도 카톡방 멤버는 자동으로 빠지지 않아요. 카톡방에서 직접 내보내주세요.',
    confirmLabel: '제외하기',
    onConfirm: () => {
      const res = window.removeParticipant(meetupId, profileId);
      if (!res.ok) { window.showToast('제외할 수 없어요'); return; }
      openMeetupDetail(meetupId);
      window.showToast(`${res.name} 님을 제외했어요`);
    },
  });
};

// ── 내가 만든 모임 임시 저장 ─────────────────────────────
// 백엔드가 붙으면 서버가 들고 갈 자리다. 지금은 새로고침에 사라지지만
// 않게 통째로 넣고 뺀다. 사진은 data URI라 용량을 먹으므로 저장에 실패하면
// (quota) 조용히 포기한다 — 모임을 못 만드는 것보다는 낫다.
function persistMyMeetups() {
  try {
    const mine = MOCK_MEETUPS.filter(m => m && m.createdByMe);
    window.localStorage.setItem(P2_STORAGE_KEYS.myMeetups, JSON.stringify(mine));
  } catch (e) { /* private mode / quota */ }
}
window.persistMyMeetups = persistMyMeetups;

function restoreMyMeetups() {
  let saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(P2_STORAGE_KEYS.myMeetups) || 'null'); }
  catch (e) { saved = null; }
  if (!Array.isArray(saved)) return;
  // 뒤에서부터 unshift해야 저장된 순서(최신이 앞)가 그대로 선다.
  saved.slice().reverse().forEach(m => {
    if (!m || m.id == null || getMeetup(m.id)) return;
    MOCK_MEETUPS.unshift(m);
  });
}
window.restoreMyMeetups = restoreMyMeetups;

// 모임 시작 시각. 없으면 null — 없는 모임(커뮤니티 등)은 시간 제약을 걸지 않는다.
function getMeetupStartTs(m) {
  const t = m && m.timestamp ? new Date(m.timestamp).getTime() : NaN;
  return Number.isFinite(t) ? t : null;
}

// 시작 전까지는 신청도 승인도 계속 열려있다.
function hasMeetupStarted(m, now = Date.now()) {
  const t = getMeetupStartTs(m);
  return t !== null && now >= t;
}

window.getJoinStatus = function (id) {
  const rec = meetupJoins[String(id)];
  return rec && (rec.status === 'pending' || rec.status === 'confirmed') ? rec.status : 'none';
};

// 정원은 '확정 인원'만 센다. 신청 중인 사람은 포함하지 않는다.
function getConfirmedCount(m) {
  const n = Number(m && m.currentCap);
  return Number.isFinite(n) ? n : (m && m.participants ? m.participants.length : 0);
}
window.getConfirmedCount = getConfirmedCount;

// 내가 만든 모임이면 내가 호스트다. 생성 플로우가 createdByMe를 심어준다.
function isMeetupHost(m) { return !!(m && m.createdByMe); }
window.isMeetupHost = isMeetupHost;

// 신청 시점 기준으로 아직 오지 않은 리마인드만 예약한다. 2시간 뒤 시작하는
// 번개라면 48h·24h 시점이 이미 지났으므로 자연히 아무것도 안 잡힌다 —
// "번개는 스킵"을 위한 별도 분기가 필요 없는 이유다.
function scheduleJoinReminders(m, appliedAt) {
  const start = getMeetupStartTs(m);
  if (start === null) return [];
  return [48, 24]
    .map(h => ({ h, at: start - h * 3600 * 1000, sent: false }))
    .filter(r => r.at > appliedAt);
}
window.scheduleJoinReminders = scheduleJoinReminders;

// 예약해둔 리마인드 중 시점이 지난 것을 알림으로 꺼낸다. 실제 푸시가 붙기 전까지
// 클라이언트에서 대신 세워두는 자리다.
window.flushDueJoinReminders = function (now = Date.now()) {
  const fired = [];
  Object.entries(meetupJoins).forEach(([id, rec]) => {
    if (!rec || !Array.isArray(rec.reminders)) return;
    const m = getMeetup(id);
    if (!m) return;
    if (m.cancelled) return; // 취소된 모임 리마인드는 보내지 않는다
    rec.reminders.forEach(r => {
      if (r.sent || r.at > now) return;
      r.sent = true;
      // 같은 24시간 지점이라도 아직 승인 대기면 '승인 리마인드', 확정됐으면
      // '참석 리마인드'다. 둘을 따로 예약하면 같은 시각에 두 개가 온다.
      const attend = r.h === 24 && rec.status === 'confirmed';
      fired.push(attend
        ? { icon: '⏰', text: `내일 '${m.title}' 모임이 있어요`, time: '방금', unread: true }
        : { icon: '📅', text: `'${m.title}' 모임이 ${r.h}시간 뒤에 시작돼요`, time: '방금', unread: true });
    });
  });
  if (fired.length) {
    persistMeetupJoins();
    DUMMY_NOTIFICATIONS.unshift(...fired);
  }
  return fired;
};

// 신청. 정원이 찼거나 이미 시작했으면 받지 않는다.
window.applyToMeetup = function (id) {
  const m = getMeetup(id);
  if (!m) return { ok: false, reason: 'not_found' };
  if (m.cancelled) return { ok: false, reason: 'cancelled' };
  if (isMeetupHost(m)) return { ok: false, reason: 'host' };
  if (window.getJoinStatus(id) !== 'none') return { ok: false, reason: 'already' };
  if (hasMeetupStarted(m)) return { ok: false, reason: 'started' };
  if (isMeetupFull(m)) return { ok: false, reason: 'full' };

  const now = Date.now();
  // 승인이 꺼져 있으면 누른 즉시 확정이다. 정원도 이때 올라간다.
  const instant = !MEETUP_APPROVAL_ENABLED;
  meetupJoins[String(id)] = {
    status: instant ? 'confirmed' : 'pending',
    appliedAt: now,
    confirmedAt: instant ? now : null,
    reminders: scheduleJoinReminders(m, now),
  };
  m.hasRSVPd = true;
  // 승인이 켜져 있으면 신청 단계에서는 정원(currentCap)을 건드리지 않는다.
  if (instant) m.currentCap = getConfirmedCount(m) + 1;
  persistMeetupJoins();
  return { ok: true, confirmed: instant };
};

// 썸네일은 늘 보이지만 프로필로 들어가는 건 참여자만. 호스트는 자기 모임이니 통과.
window.openMeetupAttendee = function (meetupId, profileId) {
  const m = getMeetup(meetupId);
  if (!m) return;
  if (!isMeetupHost(m) && window.getJoinStatus(meetupId) !== 'confirmed') {
    window.showToast('참여하면 프로필을 볼 수 있어요');
    return;
  }
  if (window.blockedByProfileGate()) return;
  openProfileModal(Number(profileId));
};

window.handleCancelJoin = function (meetupId) {
  window.openConfirmSheet({
    title: '참여를 취소할까요?',
    body: '취소하면 그 자리에 다른 분이 참여할 수 없어요.',
    cancelLabel: '계속 참여하기',
    confirmLabel: '참여 취소하기',
    onConfirm: () => {
      if (!window.cancelMeetupJoin(meetupId)) { window.showToast('취소할 수 없어요'); return; }
      openMeetupDetail(meetupId);
      if (currentTab === 'meetups' && typeof renderMeetupList === 'function') renderMeetupList();
      window.showToast('참여를 취소했어요');
    },
  });
};

// 확정자가 취소하면 자리가 다시 열린다.
window.cancelMeetupJoin = function (id) {
  const m = getMeetup(id);
  const rec = meetupJoins[String(id)];
  if (!m || !rec) return false;
  if (rec.status === 'confirmed') m.currentCap = Math.max(0, getConfirmedCount(m) - 1);
  // 기록을 지우면 예약해둔 리마인드도 함께 사라진다 — 안 가는 모임 알림은 소음이다.
  delete meetupJoins[String(id)];
  m.hasRSVPd = false;
  persistMeetupJoins();
  return true;
};

// ── 호스트 쪽 ───────────────────────────────────────────────
// 신청자 목록. 내가 만든 모임에는 목업 신청자를 심어둔다 — 안 그러면 호스트
// 화면이 영원히 비어 있어서 승인 흐름을 볼 수가 없다. 모임 id로 시드를 고정해
// 새로고침해도 같은 사람이 나온다.
function seedApplicants(m) {
  const key = String(m.id);
  if (meetupApplicants[key]) return meetupApplicants[key];
  const pool = MOCK_PROFILES.filter(p => p && p.name);
  const n = Math.min(3, pool.length);
  const base = seedFrom(key) % Math.max(1, pool.length);
  const start = getMeetupStartTs(m) || Date.now();
  meetupApplicants[key] = Array.from({ length: n }, (_, i) => {
    const prof = pool[(base + i * 5) % pool.length];
    return {
      profileId: prof.id,
      name: prof.name,
      image: prof.image,
      // 신청 시각은 시작 며칠 전으로 흩어둔다. 빠른 순 정렬이 보이게.
      appliedAt: start - (72 - i * 17) * 3600 * 1000,
      status: 'pending',
    };
  });
  persistMeetupJoins();
  return meetupApplicants[key];
}

window.getMeetupApplicants = function (id) {
  const m = getMeetup(id);
  if (!m || !isMeetupHost(m)) return [];
  // 신청 시각 빠른 순.
  return seedApplicants(m).slice().sort((a, b) => a.appliedAt - b.appliedAt);
};

// 승인. 이 시점에 정원을 다시 본다 — 신청받을 때는 자리가 있었어도 그 사이
// 다른 신청자가 승인돼 찼을 수 있다.
window.approveApplicant = function (meetupId, profileId) {
  const m = getMeetup(meetupId);
  if (!m || !isMeetupHost(m)) return { ok: false, reason: 'not_host' };
  const list = meetupApplicants[String(meetupId)] || [];
  const a = list.find(x => String(x.profileId) === String(profileId));
  if (!a) return { ok: false, reason: 'not_found' };
  if (a.status === 'confirmed') return { ok: false, reason: 'already' };
  if (isMeetupFull(m)) return { ok: false, reason: 'full' };

  a.status = 'confirmed';
  a.confirmedAt = Date.now();
  m.currentCap = getConfirmedCount(m) + 1;
  if (a.image) (m.participants = m.participants || []).push(a.image);
  persistMeetupJoins();
  return { ok: true };
};

// 내 신청을 호스트가 승인한 상황. 실제로는 서버가 밀어주지만 목업에서는
// 이 함수가 그 자리를 대신한다.
window.confirmMyJoin = function (id) {
  const m = getMeetup(id);
  const rec = meetupJoins[String(id)];
  if (!m || !rec || rec.status !== 'pending') return { ok: false, reason: 'not_pending' };
  if (isMeetupFull(m)) return { ok: false, reason: 'full' };
  rec.status = 'confirmed';
  rec.confirmedAt = Date.now();
  m.currentCap = getConfirmedCount(m) + 1;
  persistMeetupJoins();
  DUMMY_NOTIFICATIONS.unshift({ icon: '✅', text: `'${m.title}' 참여가 확정됐어요`, time: '방금', unread: true });
  return { ok: true };
};

function formatApplyTime(ts) {
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return '';
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

window.openMeetupDetail = function (id) {
  const m = MOCK_MEETUPS.find(x => x.id === id);
  // 목록에서 감춰도 딥링크·북마크로 열리면 소용없다. 진입 지점 전부에 같은 규칙.
  if (m && window.isMeetupBlocked(m)) {
    if (window.showToast) window.showToast('지금은 볼 수 없는 모임이에요');
    window.closeModal();
    return;
  }
  const mc = getModalContainer();
  const capPercent = (m.currentCap / m.maxCap) * 100;
  const isGroup = m.hostType === '단체';
  const isEvent = m.type.includes('행사');
  const isPrivate = m.hostType === '개인' && !m.hostPublic;
  const isCommunity = m.type.includes('커뮤니티');
  // 신청(pending) / 확정(confirmed) — 화면 곳곳이 이 둘을 다르게 다룬다.
  const joinStatus = window.getJoinStatus(m.id);
  const isPending = joinStatus === 'pending';
  const isConfirmed = joinStatus === 'confirmed';
  const isApplied = isPending || isConfirmed;
  const meetupStarted = hasMeetupStarted(m);
  const isFullNow = isMeetupFull(m);
  const iAmHost = isMeetupHost(m);
  // "정확한 주소는 참여 확정 후 공개" 체크박스. 꺼져 있으면 누구에게나 보인다.
  const addressGated = m.locationTiming === '참여 확정 후';
  const showFullAddress = !!m.fullAddress && (iAmHost || !addressGated || isConfirmed);
  const showHostThumb = !isCommunity && !!m.hostIsPublic && m.hostType !== '단체';
  const displayedCap = (showHostThumb ? 1 : 0) + (m.participants || []).length;
  const displayCapPercent = m.maxCap > 0 ? Math.round((displayedCap / m.maxCap) * 100) : 0;
  // 화면에 쓰는 숫자는 '확정 인원'. 신청 중인 사람은 여기 들어오지 않는다.
  const confirmedCount = getConfirmedCount(m);
  const confirmedPercent = m.maxCap > 0 ? Math.min(100, Math.round((confirmedCount / m.maxCap) * 100)) : 0;
  const showAgeRange = !!(m.ageRange && m.ageRange !== '연령 무관');
  const showFee = !!(m.fee && !['없음', '무료'].includes(m.fee));
  const cleanDesc = isCommunity
    ? m.desc.split('\n').filter(l => !/^(연령대|조건)\s*:/.test(l.trim())).join('\n').trim()
    : m.desc;
  const organizerImgs = isCommunity ? (m.organizers || (m.hostImage ? [m.hostImage] : [])) : [];

  // 호스트 시점에만 붙는 신청자 목록. 거절 버튼은 두지 않는다 — 승인하지 않으면
  // 모임이 시작되면서 자연히 무의미해지고, 거절 통보는 아무도 원하지 않는다.
  // 수정·취소는 호스트라면 언제나 있어야 한다. 승인 플래그와 무관하다.
  const hostActionsHTML = iAmHost ? `
    <div class="host-actions">
      <button type="button" class="host-action-btn" onclick="window.openCreateMeetupModal(${m.id})">
        <i data-lucide="pencil" style="width:15px;height:15px;" aria-hidden="true"></i> 모임 수정
      </button>
      ${m.cancelled ? '' : `<button type="button" class="host-action-btn is-danger" onclick="window.handleCancelMeetup(${m.id})">
        <i data-lucide="x-circle" style="width:15px;height:15px;" aria-hidden="true"></i> 모임 취소
      </button>`}
    </div>` : '';

  // 호스트가 참여자를 덜어낼 수 있는 자리. 앱 명단과 카톡방 명단은 따로 논다는
  // 사실을 여기서 미리 말해둔다 — 제외해놓고 카톡방에 남아 있으면 더 혼란스럽다.
  const rosterSectionHTML = iAmHost ? (() => {
    const people = (m.participants || []).map(url => MOCK_PROFILES.find(x => x.image === url)).filter(Boolean);
    return `
    <div class="applicant-section" id="roster-section">
      <div class="applicant-section-title">참여자 관리<span class="applicant-count">${people.length}명</span></div>
      <div class="applicant-full-note">여기서 제외해도 카톡방 멤버는 자동으로 빠지지 않아요. 카톡방에서 직접 내보내주세요.</div>
      ${people.length === 0 ? `<div class="applicant-empty">아직 참여자가 없어요.</div>` : people.map(pr => `
        <div class="applicant-row">
          <div class="applicant-avatar" style="background-image:url('${pr.image}');"></div>
          <div class="applicant-meta"><div class="applicant-name">${escapeHTML(pr.name || '')}</div></div>
          <button type="button" class="applicant-remove" onclick="window.handleRemoveParticipant(${m.id}, ${pr.id})">제외</button>
        </div>
      `).join('')}
    </div>`;
  })() : '';

  const applicantsSectionHTML = (iAmHost && MEETUP_APPROVAL_ENABLED) ? (() => {
    const list = window.getMeetupApplicants(m.id);
    const waiting = list.filter(a => a.status !== 'confirmed');
    return `
    <div class="applicant-section" id="applicant-section">
      <div class="applicant-section-title">
        신청자 목록<span class="applicant-count">${waiting.length}명 대기</span>
      </div>
      ${isFullNow ? `<div class="applicant-full-note">정원이 다 찼어요. 자리가 나면 승인할 수 있어요.</div>` : ''}
      ${list.length === 0 ? `<div class="applicant-empty">아직 신청한 사람이 없어요.</div>` : list.map(a => `
        <div class="applicant-row${a.status === 'confirmed' ? ' is-confirmed' : ''}">
          <div class="applicant-avatar" style="background-image:url('${a.image || ''}');"></div>
          <div class="applicant-meta">
            <div class="applicant-name">${escapeHTML(a.name || '')}</div>
            <div class="applicant-time">${formatApplyTime(a.appliedAt)} 신청</div>
          </div>
          ${a.status === 'confirmed'
            ? `<span class="applicant-done">승인됨</span>`
            : `<button type="button" class="applicant-approve" ${isFullNow ? 'disabled' : ''}
                 onclick="window.handleApproveApplicant(${m.id}, ${a.profileId})">승인</button>`}
        </div>
      `).join('')}
    </div>`;
  })() : '';

  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color);">
       <div class="app-header" style="background:var(--bg-color); justify-content: space-between;">
         <button class="back-btn" onclick="closeModal(); if(currentTab==='meetups') renderMeetupList();"><i data-lucide="chevron-left" style="width:28px;"></i></button>
         <div style="display: flex; align-items: center;">
           <button onclick="event.stopPropagation(); window.openMeetupShareSheet(${m.id})" style="background: none; border: none; cursor: pointer; color: #9B72CC; display:flex; align-items:center; justify-content:center; padding: 6px; margin-right: 8px;">
             <i data-lucide="share" style="width: 24px; height: 24px;"></i>
           </button>
           <button id="detail-bm-${m.id}" onclick="event.stopPropagation(); toggleBookmark(${m.id})" style="background: none; border: none; cursor: pointer; color: #9B72CC; display:flex; align-items:center; justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="${window.bookmarkedMoims[m.id] ? '#9B72CC' : 'none'}">
                 <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
           </button>
         </div>
       </div>
       <div class="scroll-y" style="padding: 10px 24px 140px;">
          <div style="color:var(--primary); font-size:14px; font-weight:700; margin-bottom:8px;">${(() => { const ds = getDetailDateString(m); return isCommunity ? m.type : (ds ? `${m.type} · ${ds}` : m.type); })()}</div>
          <h2 style="font-size: 26px; line-height: 1.3; margin-bottom: 8px; font-weight:800;">${m.title}</h2>
          ${m.cancelled ? `<div class="meetup-cancelled-banner">이 모임은 취소됐어요</div>` : ''}
          
          ${isApplied ? `
              ${!MEETUP_APPROVAL_ENABLED ? '' : isPending ? `
              <div class="join-status-card is-pending">
                <div class="join-status-title"><span class="join-status-dot"></span>승인 대기 중</div>
                <div class="join-status-body">호스트가 오픈채팅방에서 확인한 뒤 승인하면 참여가 확정돼요.</div>
              </div>` : `
              <div class="join-status-card is-confirmed">
                <div class="join-status-title">✅ 참여 확정</div>
                <div class="join-status-body">호스트 승인이 끝났어요. 참여자 목록을 볼 수 있어요.</div>
              </div>`}
              ${showFullAddress ? `
              <div class="address-reveal-card" style="margin-bottom:${m.kakaoLink ? '12px' : (showAgeRange ? '8px' : '24px')};">
                <div class="address-reveal-card-title"><i data-lucide="map-pin" style="width:16px;"></i> 장소 안내</div>
                <div class="address-reveal-card-text" style="white-space: pre-wrap;">${m.fullAddress}</div>
                ${addressGated ? `<div class="address-reveal-card-sub">참여 ${MEETUP_APPROVAL_ENABLED ? '확정' : '신청'} 후 공개되는 장소입니다</div>` : ''}
              </div>` : `
              <div class="meetup-location-preview" style="margin-bottom:12px; font-size:15px; color:#666;"><i data-lucide="map-pin" style="width:14px;height:14px;stroke:#888;vertical-align:middle;margin-right:4px;"></i>${m.shortLocation}<span class="join-locked-note">상세 주소는 참여 확정 후 공개돼요</span></div>`}
              ${m.kakaoLink ? `<div onclick="window.open('${m.kakaoLink}', '_blank')" style="margin-bottom:8px; background:#FEE500; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px; cursor:pointer;">
                <span style="font-size:18px;">💬</span>
                <div style="flex:1;">
                  <div style="font-size:13px; font-weight:700; color:#3A1D1D;">오픈채팅방 입장하기</div>
                  <div style="font-size:11px; color:#7A5C00; margin-top:2px;">카카오 오픈채팅</div>
                </div>
              </div>
              ${MEETUP_APPROVAL_ENABLED ? `<div class="join-nickname-tip" style="margin-bottom:${showAgeRange ? '8px' : '24px'};">
                오픈채팅방에서 닉네임을 <b>'${escapeHTML(userName || '내 닉네임')}'</b>으로 바꿔주세요. 호스트가 그 이름으로 확인하고 승인해요.
              </div>` : ''}` : ''}`
    : showFullAddress && !isCommunity ? `
              <div class="address-reveal-card" style="margin-bottom:${showAgeRange ? '8px' : '24px'};">
                <div class="address-reveal-card-title"><i data-lucide="map-pin" style="width:16px;"></i> 장소 안내</div>
                <div class="address-reveal-card-text" style="white-space: pre-wrap;">${m.fullAddress}</div>
              </div>`
    : `<div class="meetup-location-preview" style="margin-bottom:${showAgeRange ? '8px' : '24px'}; font-size:15px; color:#666;"><i data-lucide="map-pin" style="width:14px;height:14px;stroke:#888;vertical-align:middle;margin-right:4px;"></i>${isCommunity ? (m.location || m.shortLocation) : m.shortLocation}${addressGated ? `<span class="join-locked-note">정확한 주소는 참여 ${MEETUP_APPROVAL_ENABLED ? '확정' : '신청'} 후 공개돼요</span>` : ''}</div>`
    }

          ${showAgeRange ? `<div style="font-size:14px; color:#888; margin-bottom:24px; display:flex; align-items:center;"><i data-lucide="users" style="width:14px;height:14px;stroke:#888;vertical-align:middle;margin-right:4px;"></i>${m.ageRange}</div>` : ''}

          <!-- New Info Fields -->
          ${!isCommunity && showFee ? `
          <div style="margin-bottom: 32px; border-top: 1px solid #EEE; padding-top: 20px;">
            <div style="display:flex;">
              <div style="width:80px; font-size:14px; color:#888;">참여비</div>
              <div style="font-size:14px; color:var(--text-dark); font-weight:500;">${m.fee}</div>
            </div>
          </div>
          ` : ''}
          
          <!-- Host Section (Conditional) -->
          ${!isPrivate && (!isEvent || m.host?.isPublic) ? `
          <div style="display:flex; align-items:center; margin-bottom: 32px; padding: 16px; background:#F9F9F9; border-radius:16px;">
             ${isGroup ?
        `<div style="width:48px; height:48px; border-radius:12px; background-image:url('${m.hostLogo}'); background-size:cover; background-position:center;"></div>` :
        `<div class="attendee-avatar" style="width:48px; height:48px; background-image:url('${MOCK_PROFILES.find(p => p.name === m.hostName)?.image || MOCK_PROFILES[0].image}'); background-size:cover; background-position:center top;"></div>`
      }
             <div style="margin-left: 12px; flex:1;">
                <div style="font-size:15px; font-weight:700; display:flex; align-items:center; gap:6px;">
                  HOST: ${m.host?.name || m.hostName}
                  ${!isGroup ? getRoleBadgeHTML(MOCK_PROFILES.find(p => p.name === m.hostName)?.role) : ''}
                </div>
                <div style="font-size:13px; color:#777; margin-top:2px;">${m.host?.bio || m.hostBio}</div>
             </div>
          </div>
          ` : ''}
          
          <div style="font-size:16px; line-height:1.6; color:var(--text-dark); margin-bottom: 12px; white-space: pre-line;">
            ${cleanDesc}
          </div>

          <!-- Images -->
          ${m.images && m.images.length > 0 ? `
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
            ${m.images.map((src, i) => `
              <div onclick="openImageViewer(${m.id}, ${i})" style="width:80px; height:80px; border-radius:10px; overflow:hidden; cursor:pointer; flex-shrink:0;">
                <img src="${src}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Links -->
          ${m.links && m.links.length > 0 ? `
          <div style="margin-bottom:20px;">
            ${m.links.map(link => {
        if (link.type === '소셜') {
          const url = link.url || (link.platform === 'X' ? `https://x.com/${link.handle}` : `https://instagram.com/${link.handle}`);
          const iconImg = link.platform === 'X'
            ? `<img src="https://cdn.simpleicons.org/x/000000" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;">`
            : `<img src="https://cdn.simpleicons.org/instagram/E1306C" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;">`;
          return `<div onclick="window.open('${url}','_blank')" style="display:flex; align-items:center; gap:8px; padding:10px 0; border-bottom:1px solid var(--border-color); cursor:pointer;">
                  <span style="font-size:12px; font-weight:600; color:#888; flex-shrink:0; min-width:36px;">${link.type}</span>
                  <span style="font-size:14px; color:var(--primary); text-decoration:underline; display:flex; align-items:center;">${iconImg}@${link.handle}</span>
                </div>`;
        }
        return `<div onclick="window.open('${link.url}','_blank')" style="display:flex; align-items:center; gap:8px; padding:10px 0; border-bottom:1px solid var(--border-color); cursor:pointer; overflow:hidden;">
                <span style="font-size:12px; font-weight:600; color:#888; flex-shrink:0; min-width:36px;">${link.type}</span>
                <span style="font-size:14px; color:var(--primary); text-decoration:underline; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${link.url}</span>
              </div>`;
      }).join('')}
          </div>
          ` : ''}

          <!-- Hashtags -->
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:40px;">
            ${(m.tags || []).map(tag => `<div style="padding:4px 10px; border:1px solid #C89FDB; color:#9B72CC; border-radius:100px; font-size:12px; font-weight:500;">${tag}</div>`).join('')}
          </div>
          
          ${isCommunity ? `
          <div style="background:var(--surface); padding:20px; border-radius:16px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <div style="font-size:15px; font-weight:600; margin-bottom:12px;">호스트</div>
            <div class="attendee-stack" style="flex-wrap: wrap; gap:12px;">
               ${organizerImgs.length > 0
        ? organizerImgs.map(url => `<div class="attendee-avatar" style="width:40px; height:40px; margin-left:0; border:none; outline:2.5px solid #9B72CC; outline-offset:2px; background-image:url('${url}');background-size:cover;background-position:center top;"></div>`).join('')
        : `<div class="attendee-avatar" style="width:40px; height:40px; margin-left:0; border:none; outline:2.5px solid #9B72CC; outline-offset:2px; background-image:url('${isGroup ? m.hostLogo : (MOCK_PROFILES.find(p => p.name === m.hostName)?.image || m.hostImage || MOCK_PROFILES[0].image)}');background-size:cover;background-position:center top;"></div>`}
            </div>
          </div>
          ` : (isEvent && m.showParticipants === false) ? `` : `
          <div style="background:var(--surface); padding:20px; border-radius:16px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <div style="font-size:15px; font-weight:600; margin-bottom:12px;">참여자 (${confirmedCount}/${m.maxCap}명)<span class="join-count-note">확정 인원</span></div>
            <div class="progress-track" style="margin-bottom: 24px;">
               <div class="progress-fill" style="width: ${confirmedPercent}%;"></div>
            </div>
            <!-- 누가 오는지는 참여를 정하기 전에 알아야 하는 정보다. 썸네일은
                 늘 보여주고, 프로필 상세로 들어가는 것만 참여 후로 미룬다. -->
            <div class="attendee-stack" style="flex-wrap: wrap; gap:12px;">
               ${showHostThumb ? (() => {
                 const hp = MOCK_PROFILES.find(x => x.name === m.hostName);
                 return `<div class="attendee-avatar is-host" ${hp ? `onclick="window.openMeetupAttendee(${m.id}, ${hp.id})"` : ''} style="width:40px; height:40px; margin-left:0; border: none; outline: 2.5px solid #9B72CC; outline-offset: 2px; background-image:url('${hp?.image || m.hostImage || MOCK_PROFILES[0].image}'); background-size:cover; background-position:center top;"></div>`;
               })() : ''}
               ${(m.participants || []).map(url => {
                 const pp = MOCK_PROFILES.find(x => x.image === url);
                 return `<div class="attendee-avatar" ${pp ? `onclick="window.openMeetupAttendee(${m.id}, ${pp.id})"` : ''} style="width:40px; height:40px; margin-left:0; border: none; background-image:url('${url}');background-size:cover;background-position:center top;"></div>`;
               }).join('')}
            </div>
            ${(isConfirmed || iAmHost) ? '' : `<div class="attendee-hint">참여하면 프로필을 볼 수 있어요</div>`}
          </div>
          ${hostActionsHTML}${applicantsSectionHTML}${rosterSectionHTML}
          `}

          <!-- Rules Section -->
          ${!isCommunity ? `
          <div style="margin-top:24px; padding:20px; background:#F0F0F0; border-radius:16px;">
            <div style="font-size:14px; font-weight:700; margin-bottom:8px; color:#555;">주의사항</div>
            <div style="font-size:14px; color:#666; line-height:1.5;">${m.rules || '매너 있는 참여 부탁드립니다.'}</div>
          </div>
          ` : ''}

          <!-- Reviews Section (Only if Group) -->
          ${isGroup && m.reviews ? `
          <div style="margin-top:40px;">
            <div style="font-size:16px; font-weight:700; margin-bottom:16px;">이전 후기</div>
            ${m.reviews.map(rev => `
              <div style="margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #EEE;">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                  <span style="font-size:12px; color:#AAA;">${rev.date}</span>
                </div>
                <div style="font-size:14px; color:#666; line-height:1.4;">${rev.text}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

       </div>
       <div class="modal-fixed-bottom" style="display:block; z-index: 110; padding: 16px 24px; background: white; border-top: 1px solid #EEE;">
          ${(() => {
            // 정원이 찬 경우에만 막는다. 시작 전까지는 언제든 신청할 수 있다.
            // 내가 연 모임에 내가 신청할 일은 없다.
            const label = m.cancelled ? '취소된 모임이에요'
              : iAmHost ? '내가 여는 모임'
              : isConfirmed ? (MEETUP_APPROVAL_ENABLED ? '참여 확정 ✓' : '참여 완료 ✓')
              : isPending ? '승인 대기 중'
              : m.disableRSVP ? '외부 사이트에서 신청'
              : meetupStarted ? '이미 시작된 모임이에요'
              : isFullNow ? '정원이 찼어요'
              : '참여하기';
            const dead = m.cancelled || iAmHost || isApplied || m.disableRSVP || meetupStarted || isFullNow;
            const mainBtn = `<button id="detail-rsvp-btn" style="width: 100%; padding: 16px; border-radius: 14px; background: ${dead ? '#CCC' : '#9B72CC'}; color: white; font-size: 16px; font-weight: 600; border: none; cursor: ${dead ? 'default' : 'pointer'}; pointer-events: ${dead ? 'none' : 'auto'};" onclick="window.handleMeetupApply(${m.id})">${label}</button>`;
            // 참여했으면 되돌릴 길이 있어야 한다. 상태만 보여주고 끝내지 않는다.
            if (!isApplied || m.cancelled) return mainBtn;
            return `${mainBtn}
              <button type="button" id="detail-cancel-join" class="join-cancel-btn" onclick="window.handleCancelJoin(${m.id})">참여 취소</button>`;
          })()}
       </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}


window.closeModal = function () {
  const mc = document.getElementById('modal-container');
  if (mc) mc.innerHTML = '';
}

// 참여하기 탭 → 신청 접수. 확정이 아니라 신청이다.
window.handleMeetupApply = function (meetupId) {
  const res = window.applyToMeetup(meetupId);
  if (!res.ok) {
    const msg = res.reason === 'cancelled' ? '취소된 모임이에요'
      : res.reason === 'host' ? '내가 여는 모임이에요'
      : res.reason === 'full' ? '정원이 찼어요'
      : res.reason === 'started' ? '이미 시작된 모임이에요'
      : res.reason === 'already' ? '이미 신청한 모임이에요' : '신청할 수 없어요';
    if (window.showToast) window.showToast(msg);
    return;
  }
  window.showApplySubmitted(meetupId);
};

// 호스트가 승인 버튼을 눌렀을 때. 정원은 이 시점에 다시 본다.
window.handleApproveApplicant = function (meetupId, profileId) {
  const res = window.approveApplicant(meetupId, profileId);
  if (!res.ok) {
    if (window.showToast) window.showToast(res.reason === 'full' ? '정원이 다 찼어요' : '승인할 수 없어요');
    return;
  }
  openMeetupDetail(meetupId);
  if (window.showToast) window.showToast('승인했어요');
};

// 신청 직후 화면. 여기서 카톡방으로 넘어가고, 닉네임을 맞춰달라고 부탁한다 —
// 호스트가 승인 여부를 판단하는 근거가 그 닉네임이기 때문이다.
window.showApplySubmitted = function (meetupId) {
  const m = getMeetup(meetupId);
  if (!m) return;
  const mc = getModalContainer();
  const nick = escapeHTML(userName || '내 닉네임');
  const approving = MEETUP_APPROVAL_ENABLED;
  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color);">
      <div style="height: 100vh; height: 100dvh; display: flex; flex-direction: column; align-items: center; padding: 0 24px; box-sizing: border-box;">
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px;">
          <div style="font-size: 48px; text-align: center;">${approving ? '📮' : '🎉'}</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--text-dark); text-align: center;">${approving ? '신청이 접수됐어요' : '참여 완료'}</div>
          <div style="font-size: 14px; color: #999; text-align: center;">${escapeHTML(m.title)}</div>
          ${approving ? `
          <div class="apply-steps">
            <div class="apply-step"><span class="apply-step-no">1</span><span>아래 버튼으로 오픈채팅방에 들어가세요</span></div>
            <div class="apply-step"><span class="apply-step-no">2</span><span>채팅방 닉네임을 <b>'${nick}'</b>으로 바꿔주세요</span></div>
            <div class="apply-step"><span class="apply-step-no">3</span><span>호스트가 확인하고 승인하면 참여가 확정돼요</span></div>
          </div>` : `<div style="height:12px;"></div>`}
          ${m.kakaoLink ? `<button onclick="window.open('${m.kakaoLink}', '_blank')" style="width: 100%; padding: 16px; border-radius: 14px; background: #FEE500; color: #3A1D1D; font-size: 15px; font-weight: 700; border: none; cursor: pointer;">💬 오픈채팅방 입장하기</button>` : ''}
        </div>
        <div style="width: 100%; padding-bottom: 40px;">
          <button onclick="openMeetupDetail(${m.id})" style="width: 100%; padding: 14px; border-radius: 24px; background: #F0F0F0; color: #555; font-size: 15px; font-weight: 600; border: none; cursor: pointer;">돌아가기</button>
        </div>
      </div>
    </div>
  `;
};

// 예전 이름으로 들어오는 경로가 남아 있어 신청 흐름으로 넘긴다.
window.joinMeetupChat = function (meetupId) { window.handleMeetupApply(meetupId); };

// 옛 진입점. 정원을 직접 올리던 경로라 그대로 두면 '확정 인원' 규칙이 깨진다.
window.submitRSVP = function (id) {
  window.handleMeetupApply(id);
};


window.toggleBookmark = function (id) {
  window.bookmarkedMoims[id] = !window.bookmarkedMoims[id];
  const isBookmarked = window.bookmarkedMoims[id];

  // Sync Feed Card Icon
  const bmBtn = document.getElementById(`bm-${id}`);
  if (bmBtn) {
    bmBtn.classList.remove('meetup-btn-pop');
    void bmBtn.offsetWidth; // trigger reflow
    bmBtn.classList.add('meetup-btn-pop');
    const svg = bmBtn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isBookmarked ? '#9B72CC' : 'none');
  }

  // Sync Detail Modal Icon
  const detailBtn = document.getElementById(`detail-bm-${id}`);
  if (detailBtn) {
    detailBtn.classList.remove('meetup-btn-pop');
    void detailBtn.offsetWidth; // trigger reflow
    detailBtn.classList.add('meetup-btn-pop');
    const svg = detailBtn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isBookmarked ? '#9B72CC' : 'none');
  }

  // Sync internal object state for logic elsewhere
  const m = MOCK_MEETUPS.find(x => x.id === id);
  if (m) m.isSaved = isBookmarked;

  if (currentTab === 'meetups' && window.showSavedMeetups) {
    renderMeetupList();
  }
}
window.openProfileFromModal = function (profileId, backTarget) {
  const p = MOCK_PROFILES.find(pr => pr.id === profileId);
  if (!p) return;
  const amc = document.getElementById('answer-modal-container');
  if (amc) amc.style.display = 'none';
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;
  const backAction = backTarget === 'grid' ? `openAllMatchesGrid()` : `closeAnswerCard(); switchTab('messages')`;
  contentArea.innerHTML = `
    <div style="position:absolute; top: calc(-1 * var(--safe-top)); left:0; width:100%; height:calc(100vh - 84px); height:calc(100dvh - 144px + var(--safe-top)); background:var(--bg-color); z-index:50; display:flex; flex-direction:column; overflow:hidden;">
      <div class="app-header" style="background:var(--bg-color); padding-top: calc(20px + var(--safe-top));">
        <button class="back-btn" onclick="${backAction}"><i data-lucide="chevron-left" style="width:28px;"></i></button>
        <div style="font-size:15px; font-weight:600;">${p.name}</div>
        <div style="width:32px;"></div>
      </div>
      <div class="scroll-y" style="flex:1;">${getProfileDetailedHTML(p, false)}</div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.openProfileForChat = function (profileId, chatId) {
  const p = MOCK_PROFILES.find(pr => pr.id === profileId);
  if (!p) return;
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;
  contentArea.innerHTML = `
    <div style="position:absolute; top: calc(-1 * var(--safe-top)); left:0; width:100%; height:calc(100vh - 84px); height:calc(100dvh - 144px + var(--safe-top)); background:var(--bg-color); z-index:50; display:flex; flex-direction:column; overflow:hidden;">
      <div class="app-header" style="background:var(--bg-color); padding-top: calc(20px + var(--safe-top));">
        <button class="back-btn" onclick="openChat(${chatId})"><i data-lucide="chevron-left" style="width:28px;"></i></button>
        <div style="font-size:15px; font-weight:600;">${p.name}</div>
        <div style="width:32px;"></div>
      </div>
      <div class="scroll-y" style="flex:1;">${getProfileDetailedHTML(p, false)}</div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ══════════════════════════════════════════════════════════════
// 매칭 · 메시지 · p.M
// 매칭 소개 플로우, 모임 후 팔로업, 그룹/1:1 채팅
// ══════════════════════════════════════════════════════════════

window.openMatchIntroModal = function (profileId, isQurated = false, from = 'messages') {
  const match = MATCHED_PROFILES.find(m => m.id === profileId);
  if (!match) return;

  const otherProfile = MOCK_PROFILES.find(p => p.id === match.id) || MOCK_PROFILES[0];
  const otherSpineColor = getSpineColor(otherProfile.id);
  const otherAge = getAge(otherProfile.birthYear);
  const otherDistLabel = formatDistanceLabel(otherProfile);

  let amc = document.getElementById('answer-modal-container');
  if (!amc) {
    amc = document.createElement('div');
    amc.id = 'answer-modal-container';
    amc.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:3000; pointer-events:auto;';
    document.body.appendChild(amc);
  }
  amc.style.display = 'block';

  amc.innerHTML = `
      <div class="match-intro-modal fade-in" style="overflow: hidden; display: flex; flex-direction: column;">
        <div class="chat-header" style="position: relative; width: 100%; z-index: 3001; background: transparent; justify-content: center; padding: 12px 20px; border-bottom: none; min-height: 60px;">
          <button class="modal-fixed-close" style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 0;" onclick="closeAnswerCard(); switchTab('messages')">
            <i data-lucide="x" style="color:#333; width:28px;"></i>
          </button>
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div style="font-size:16px; font-weight:700; color:#333;">${otherProfile.name}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${otherAge}세 ・ ${otherDistLabel}</div>
          </div>
          <button onclick="openProfileFromModal(${otherProfile.id}, '${from}')" style="position:absolute; right:20px; top:50%; transform:translateY(-50%); background:none; border:none; padding:0; cursor:pointer;">
            <div style="width:32px; height:32px; border-radius:50%; background-image:url('${otherProfile.image}'); background-size:cover; background-position:center; background-color:#EDE0FF; border:1px solid rgba(0,0,0,0.08);"></div>
          </button>
        </div>

        <div class="match-intro-pm" style="flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; display:flex; flex-direction:column;">
          <div style="text-align: center; font-size: 13px; color: var(--text-muted); margin-bottom: 20px;" class="fade-in">
            어떤 인연이 될지는 두 분이 써내려가요
          </div>
          <div class="pm-message-row fade-in" style="animation-delay: 0.5s;">
            <div class="pm-avatar">p.M</div>
            <div class="pm-bubble">
              함께 읽고 싶은 이야기가 많을 것 같아요 ☺️
            </div>
          </div>

          ${!isQurated ? `
          <div class="match-options fade-in" id="regular-match-options-${match.id}" style="animation-delay: 1s; display:flex; flex-direction:column; margin-top:auto; margin-bottom:0; padding:0 4px 24px; gap:10px; position:relative; z-index:10; overflow:visible;">
            <button id="btn-step1-meetup-${match.id}" style="padding:14px 20px; font-size:14px; border-radius:14px; border:1.5px solid #C89FDB; background:white; color:#9B72CC; width:100%; cursor:pointer; font-family:'Pretendard',sans-serif; text-align:left;">
              📅 함께 참여할 수 있는 모임이 있어요
            </button>
            <button id="btn-step1-date-${match.id}" style="padding:14px 20px; font-size:14px; border-radius:14px; border:1.5px solid #C89FDB; background:white; color:#9B72CC; width:100%; cursor:pointer; font-family:'Pretendard',sans-serif; text-align:left;">
              ✨ 둘만의 만남을 제안해볼까요?
            </button>
            <button id="btn-step1-chat-${match.id}" style="padding:14px 20px; font-size:14px; border-radius:14px; border:1.5px solid #C89FDB; background:white; color:#9B72CC; width:100%; cursor:pointer; font-family:'Pretendard',sans-serif; text-align:left;">
              💬 먼저 대화를 나눠볼게요
            </button>
          </div>
          ` : ''}

        </div>

        <div class="match-intro-input-wrap fade-in" style="animation-delay: 1.5s; position: relative; background: white; width: 100%; padding: 12px 16px; padding-bottom: max(16px, env(safe-area-inset-bottom)); border-top: 1px solid #EEE; display: flex; flex-direction: column;">
          <div id="match-intro-preview-container"></div>
          <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
            <input type="text" class="match-intro-input" placeholder="첫 메시지를 건네보세요" id="match-intro-input-field">
            <button class="match-intro-send" onclick="sendFirstMessage(${match.id})">
              <i data-lucide="send" style="width:20px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  if (typeof lucide !== 'undefined') lucide.createIcons();

  if (!isQurated) {
    const mid = match.id;
    const b1 = document.getElementById(`btn-step1-meetup-${mid}`);
    const b2 = document.getElementById(`btn-step1-date-${mid}`);
    const b3 = document.getElementById(`btn-step1-chat-${mid}`);
    if (b1) b1.addEventListener('click', (e) => { e.stopPropagation(); window.renderMatchStep2a(mid); });
    if (b2) b2.addEventListener('click', (e) => { e.stopPropagation(); window.renderMatchStep2b(mid); });
    if (b3) b3.addEventListener('click', (e) => { e.stopPropagation(); window.handleChatDirectly(mid); });
  }
};

const attachMatchBtnListener = (id, callback) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', (e) => { e.stopPropagation(); callback(e); });
    el.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); callback(e); });
  }
};

window.renderMatchStep1 = function (matchId) {
  const container = document.getElementById(`regular-match-options-${matchId}`);
  if (!container) return;
  container.innerHTML = `
      <button id="btn-step1-meetup-${matchId}" style="padding: 12px 16px; font-size: 14px; border-radius: 12px; border: 1.5px solid #C89FDB; background: white; color: #9B72CC; width: 100%; cursor: pointer; font-family: 'Pretendard', sans-serif;">
        📅 함께 참여할 수 있는 모임이 있어요
      </button>
      <button id="btn-step1-date-${matchId}" style="padding: 12px 16px; font-size: 14px; border-radius: 12px; border: 1.5px solid #C89FDB; background: white; color: #9B72CC; width: 100%; cursor: pointer; font-family: 'Pretendard', sans-serif;">
        ✨ 둘만의 만남을 제안해볼까요?
      </button>
      <button id="btn-step1-chat-${matchId}" style="padding: 12px 16px; font-size: 14px; border-radius: 12px; border: 1.5px solid #C89FDB; background: white; color: #9B72CC; width: 100%; cursor: pointer; font-family: 'Pretendard', sans-serif;">
        💬 먼저 대화를 나눠볼게요
      </button>
    `;

  setTimeout(() => {
    attachMatchBtnListener(`btn-step1-meetup-${matchId}`, () => window.renderMatchStep2a(matchId));
    attachMatchBtnListener(`btn-step1-date-${matchId}`, () => window.renderMatchStep2b(matchId));
    attachMatchBtnListener(`btn-step1-chat-${matchId}`, () => window.handleChatDirectly(matchId));
  }, 0);
};

window.renderMatchStep2a = function (matchId, selectedId = null) {
  const container = document.getElementById(`regular-match-options-${matchId}`);
  if (!container) return;

  const meetups = MOCK_MEETUPS.filter(m => m.isRecommended).slice(0, 2);
  const meetupsHTML = meetups.map((m) => {
    const isSelected = m.id === selectedId;
    return `
      <div style="background:white; border-radius:14px; border:1.5px solid ${isSelected ? '#9B72CC' : '#EEE'}; padding:14px 16px; margin-bottom:8px; display:flex; align-items:center; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.06);" 
           onclick="openMeetupDetail(${m.id})">
        <div style="flex:1; text-align: left;">
          <div style="font-size:11px; color:#9B72CC; margin-bottom:4px;">${m.type}</div>
          <div style="font-size:15px; font-weight:600; color:#333; margin-bottom:4px;">${m.title}</div>
          <div style="font-size:12px; color:var(--text-muted);">📍 ${m.shortLocation} · ${m.date}</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">👥 ${m.currentCap}/${m.maxCap}명</div>
        </div>
        <div style="width:24px; height:24px; border-radius:50%; border:2px solid #C89FDB; display:flex; align-items:center; justify-content:center; margin-left:12px; flex-shrink:0; background:${isSelected ? '#9B72CC' : 'white'};"
             onclick="event.stopPropagation(); window.renderMatchStep2a(${matchId}, ${isSelected ? 'null' : m.id})">
          ${isSelected ? '<i data-lucide="check" style="width:14px; height:14px; color:white;"></i>' : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <button onclick="window.renderMatchStep1(${matchId})" style="background: none; border: none; color: #9B72CC; font-size: 13px; font-weight: 600; cursor: pointer; padding: 0;">← 뒤로</button>
      </div>
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:12px; text-align:center;">p.M이 두 분께 어울릴 것 같은 모임을 골랐어요 ☺️</div>
      ${meetupsHTML}
      <button id="btn-propose-meetup" ${!selectedId ? 'disabled' : ''} 
              style="display:block; width:100%; padding:14px; border-radius:14px; border:none; background:${selectedId ? '#9B72CC' : '#EEE'}; color:${selectedId ? 'white' : '#AAA'}; font-size:15px; font-weight:600; cursor:${selectedId ? 'pointer' : 'default'}; margin-top:12px;"
              onclick="window.proposeMeetup(${matchId}, ${selectedId})">
        이 모임 제안하기
      </button>
      <div style="text-align:center; margin-top:12px;">
        <span onclick="closeAnswerCard(); switchTab('meetups');" style="color:var(--text-muted); font-size:12px; text-decoration:underline; cursor:pointer;">모임 더 보기 →</span>
      </div>
    `;

  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.clearMeetupProposal = function () {
  const previewContainer = document.getElementById('match-intro-preview-container');
  const input = document.getElementById('match-intro-input-field');
  if (previewContainer) previewContainer.innerHTML = '';
  if (input) {
    input.dataset.meetupId = '';
  }
};

window.proposeMeetup = function (matchId, meetupId) {
  const m = MOCK_MEETUPS.find(x => x.id === meetupId);
  if (!m) return;

  const previewContainer = document.getElementById('match-intro-preview-container');
  const input = document.getElementById('match-intro-input-field');

  if (previewContainer && input) {
    previewContainer.innerHTML = `
      <div onclick="openMeetupDetail(${m.id})" style="cursor: pointer; background: white; border: 1px solid #EEE; border-radius: 12px; padding: 10px 14px; margin-bottom: 12px; position: relative;" class="fade-in">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
          <div style="font-size:11px; color:#9B72CC; font-weight: 600;">${m.type}</div>
          <div onclick="event.stopPropagation(); window.clearMeetupProposal();" style="cursor:pointer; color:#AAA;"><i data-lucide="x" style="width:14px;"></i></div>
        </div>
        <div style="font-size:14px; font-weight:700; color:#333; margin-bottom:4px;">${m.title}</div>
        <div style="font-size:12px; color:var(--text-muted);">📍 ${m.shortLocation} · ${m.date}</div>
      </div>
    `;

    input.value = "같이 가실래요? 😊";
    input.dataset.meetupId = meetupId;
    input.focus();

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};

window.renderMatchStep2b = function (matchId) {
  const container = document.getElementById(`regular-match-options-${matchId}`);
  if (!container) return;

  const options = ['☕ 카페', '🍽 식사', '🍺 술 한 잔', '💡 기타 제안'];
  container.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <button id="btn-step2b-back-${matchId}" style="background: none; border: none; color: #9B72CC; font-size: 13px; font-weight: 600; cursor: pointer; padding: 0;">← 뒤로</button>
      </div>
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:12px; text-align:center;">어떤 만남을 제안하시겠어요?</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${options.map((opt, i) => `
          <button id="btn-step2b-opt-${matchId}-${i}" style="display:block; width:100%; padding:12px; border-radius:999px; border:1.5px solid #C89FDB; background:white; color:#9B72CC; font-size:14px; cursor:pointer; font-family:'Pretendard',sans-serif; text-align:center;">
            ${opt}
          </button>
        `).join('')}
      </div>
    `;

  setTimeout(() => {
    attachMatchBtnListener(`btn-step2b-back-${matchId}`, () => window.renderMatchStep1(matchId));
    options.forEach((opt, i) => {
      attachMatchBtnListener(`btn-step2b-opt-${matchId}-${i}`, () => window.renderMatchStep3(opt, matchId));
    });
  }, 0);
};

window.renderMatchStep3 = function (type, matchId) {
  const container = document.getElementById(`regular-match-options-${matchId}`);
  if (!container) return;

  const dates = ['이번 주말', '다음 주말', '평일 저녁', '날짜 직접 제안'];
  container.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <button id="btn-step3-back-${matchId}" style="background: none; border: none; color: #9B72CC; font-size: 13px; font-weight: 600; cursor: pointer; padding: 0;">← 뒤로</button>
      </div>
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:12px; text-align:center;">언제가 좋으세요?</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${dates.map((date, i) => `
          <button id="btn-step3-date-${matchId}-${i}" style="display:block; width:100%; padding:12px; border-radius:999px; border:1.5px solid #C89FDB; background:white; color:#9B72CC; font-size:14px; cursor:pointer; font-family:'Pretendard',sans-serif; text-align:center;">
            ${date}
          </button>
        `).join('')}
      </div>
    `;

  setTimeout(() => {
    attachMatchBtnListener(`btn-step3-back-${matchId}`, () => window.renderMatchStep2b(matchId));
    dates.forEach((date, i) => {
      attachMatchBtnListener(`btn-step3-date-${matchId}-${i}`, () => window.handleSelectDateTime(type, date, matchId));
    });
  }, 0);
};

window.handleSelectDateTime = function (type, date, matchId) {
  const input = document.getElementById('match-intro-input-field');
  const container = document.getElementById(`regular-match-options-${matchId}`);
  if (!input) return;

  if (date === '날짜 직접 제안') {
    if (type === '💡 기타 제안') {
      input.value = `어떤 만남이면 좋을지 제안해줄 수 있어요? 편하신 날짜 알려주세요 😊`;
    } else {
      input.value = `${type} 어떠세요? 편하신 날짜 알려주세요 😊`;
    }
  } else {
    if (type === '💡 기타 제안') {
      input.value = `${date}에 어떤 만남이면 좋을지 제안해줄 수 있어요? 😊`;
    } else {
      input.value = `${date}에 ${type} 어떠세요? 😊`;
    }
  }

  input.focus();
  if (container) container.style.display = 'none';
};

window.handleChatDirectly = function (matchId) {
  const container = document.getElementById(`regular-match-options-${matchId}`);
  const input = document.getElementById('match-intro-input-field');
  if (container) container.style.display = 'none';
  if (input) input.focus();
};

window.sendFirstMessage = function (profileId) {
  const input = document.getElementById('match-intro-input-field');
  const msg = input ? input.value.trim() : '';
  const meetupId = input && input.dataset.meetupId ? parseInt(input.dataset.meetupId) : null;
  if (!msg) return;

  const matchIdx = MATCHED_PROFILES.findIndex(m => m.id === profileId);
  if (matchIdx === -1) return;
  const match = MATCHED_PROFILES[matchIdx];

  // Remove from matches, add to chats
  MATCHED_PROFILES.splice(matchIdx, 1);

  const newChatId = MOCK_CHATS.length + 1;
  MOCK_CHATS.unshift({
    id: newChatId,
    name: match.name,
    image: match.image,
    source: "발견 매치",
    score: "새로운 매칭",
    preview: msg,
    time: "방금 전",
    isNew: false,
    isUnread: false,
    messages: [
      { text: msg, type: "sent", meetupId: meetupId }
    ]
  });

  closeAnswerCard();

  // Ensure we are on messages tab
  if (currentTab === 'messages') {
    switchTab('messages');
  }

  setTimeout(() => {
    openChat(newChatId);
  }, 100);
};

// ── 모임 후 p.M 팔로업 체크인 ──────────────────────────
window.triggerPostMeetingCheckin = function () {
  let amc = document.getElementById('answer-modal-container');
  if (!amc) {
    amc = document.createElement('div');
    amc.id = 'answer-modal-container';
    amc.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:3000; pointer-events:auto;';
    document.body.appendChild(amc);
  }
  amc.style.display = 'block';

  window._pmCheckinState = 'initial';

  const renderPMModal = () => {
    let content = '';
    if (window._pmCheckinState === 'initial') {
      content = `
          <div class="pm-bubble">어제 만남 어떠셨어요? ☺️</div>
          <div style="margin-top: 24px; width: 100%;">
            <button class="pm-choice-btn" onclick="window._pmCheckinState='good'; renderPMCheckinUI()">잘 맞았어요, 더 알아가고 싶어요</button>
            <button class="pm-choice-btn" onclick="window._pmCheckinState='friend'; renderPMCheckinUI()">친구로 계속 만나고 싶어요</button>
            <button class="pm-choice-btn" onclick="window._pmCheckinState='wait'; renderPMCheckinUI()">조금 더 지켜볼게요</button>
            <button class="pm-choice-btn" onclick="window._pmCheckinState='bad'; renderPMCheckinUI()">아쉬웠어요</button>
          </div>
        `;
    } else if (window._pmCheckinState === 'bad') {
      content = `
          <div class="pm-bubble">괜찮으셨어요? 불편한 점이 있었다면 말씀해주셔도 괜찮아요.</div>
          <div style="margin-top: 24px; width: 100%;">
            <button class="pm-choice-btn" onclick="window._pmCheckinState='end'; renderPMCheckinUI()">무례한 언행이 있었어요</button>
            <button class="pm-choice-btn" onclick="window._pmCheckinState='end'; renderPMCheckinUI()">프로필과 많이 달랐어요</button>
            <button class="pm-choice-btn" onclick="window._pmCheckinState='end'; renderPMCheckinUI()">불쾌한 신체 접촉이 있었어요</button>
            <button class="pm-choice-btn" onclick="window._pmCheckinState='end'; renderPMCheckinUI()">기타 (자연스러운 종료)</button>
          </div>
        `;
    } else if (window._pmCheckinState === 'end') {
      content = `
          <div class="pm-bubble" style="background:#FFF0F0;">
            서로 좋은 시간이었지만 지금은 인연이 아닌 것 같다고 하셨어요.<br/>좋은 분 만나시길 바란다고 전해달라 하셨어요 ☺️
          </div>
          <div style="margin-top: 24px; width: 100%; text-align: center;">
            <button class="pm-choice-btn" style="background:var(--bg-color); border:none; color:var(--text-muted);" onclick="closeAnswerCard()">닫기</button>
          </div>
        `;
    } else {
      content = `
          <div class="pm-bubble">소중한 의견 감사합니다. 앞으로의 매칭에 참고할게요! ☺️</div>
          <div style="margin-top: 24px; width: 100%; text-align: center;">
            <button class="pm-choice-btn" style="background:var(--bg-color); border:none; color:var(--text-muted);" onclick="closeAnswerCard()">닫기</button>
          </div>
        `;
    }

    amc.innerHTML = `
        <div class="match-intro-modal fade-in" style="background: var(--bg-color);">
          <div class="modal-fixed-close" style="top:24px; left:24px; z-index:3001;" onclick="closeAnswerCard()">
            <i data-lucide="x" style="color:#333;"></i>
          </div>
          <div style="padding: 80px 24px 24px; font-weight:700; font-size:18px; color:#C89FDB;">p.M 체크인</div>
          
          <div class="match-intro-pm" style="flex:1; display:flex; flex-direction:column; justify-content:flex-end; background:transparent; box-shadow:none;">
            <div class="pm-message-row fade-in" style="align-items:flex-end;">
              <div class="pm-avatar" style="margin-bottom:8px;">p.M</div>
              <div style="display:flex; flex-direction:column; width:100%;">
                ${content}
              </div>
            </div>
          </div>
        </div>
      `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.renderPMCheckinUI = renderPMModal;
  renderPMModal();
};


// ── 그룹 채팅 · 사이드 패널 · 제한 프로필 ────────────
window.closeGroupSidePanel = function () {
  const el = document.getElementById('group-side-panel-overlay');
  if (el) el.remove();
};

window.openGroupSidePanel = function (chatId) {
  closeGroupSidePanel();
  const c = MOCK_CHATS.find(x => x.id === chatId);
  if (!c) return;
  const meetup = MOCK_MEETUPS.find(x => x.id === c.meetupId);
  const host = meetup ? MOCK_PROFILES.find(p => p.name === meetup.hostName) : null;
  const parts = (c.participants || []);

  const overlay = document.createElement('div');
  overlay.id = 'group-side-panel-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:200;display:flex;justify-content:flex-end;';

  const hostHTML = host ? `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F0EDE8;">
      <div style="width:32px;height:32px;border-radius:50%;background-image:url('${host.image}');background-size:cover;background-color:#EDE0FF;flex-shrink:0;"></div>
      <div style="flex:1;">
        <span style="font-size:13px;font-weight:600;color:#333;">${host.name}</span>
        <span style="font-size:11px;color:#999;margin-left:4px;">${getAge(host.birthYear)}세</span>
      </div>
      <span style="font-size:10px;color:#9B72CC;background:#EDE4F7;padding:2px 8px;border-radius:20px;font-weight:600;">호스트</span>
    </div>` : '';

  const partsHTML = parts.map(pp => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F0EDE8;">
      <div style="width:32px;height:32px;border-radius:50%;background-image:url('${pp.image}');background-size:cover;background-color:#EDE0FF;flex-shrink:0;"></div>
      <div>
        <span style="font-size:13px;font-weight:600;color:#333;">${pp.name}</span>
        <span style="font-size:11px;color:#999;margin-left:4px;">${getAge(pp.birthYear)}세</span>
      </div>
    </div>`).join('');

  overlay.innerHTML = `
    <div onclick="closeGroupSidePanel()" style="position:absolute;inset:0;background:rgba(0,0,0,0.3);"></div>
    <div style="position:relative;width:80%;max-width:300px;height:100%;background:var(--bg-color);overflow-y:auto;z-index:1;animation:slideInRight 0.25s ease-out;display:flex;flex-direction:column;">
      <div style="padding:20px 16px 12px;border-bottom:1px solid #F0EDE8;">
        <div style="font-size:15px;font-weight:700;color:#333;margin-bottom:6px;">${c.title}</div>
        ${meetup ? `
          <div style="font-size:12px;color:#666;margin-bottom:2px;">📍 ${meetup.shortLocation || ''}</div>
          <div style="font-size:12px;color:#666;margin-bottom:2px;">📅 ${meetup.date || ''}</div>
          <div style="font-size:12px;color:#666;">${(parts.length + (host ? 1 : 0))}명 참여 중</div>
        ` : ''}
      </div>
      <div style="padding:12px 16px;border-bottom:1px solid #F0EDE8;">
        <div style="font-size:11px;font-weight:600;color:#999;margin-bottom:8px;">공지사항</div>
        <div style="font-size:13px;color:${meetup?.notice ? '#333' : '#BBB'};">${meetup?.notice || '공지사항이 없어요'}</div>
      </div>
      <div style="padding:12px 16px;flex:1;">
        <div style="font-size:11px;font-weight:600;color:#999;margin-bottom:4px;">참여자</div>
        ${hostHTML}${partsHTML}
      </div>
    </div>
  `;
  const container = document.getElementById('app-container') || document.body;
  container.appendChild(overlay);
};

function openGroupChat(chatId) {
  const chat = MOCK_CHATS.find(c => c.id === chatId);
  if (!chat) return;
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  const m = MOCK_MEETUPS.find(x => x.id === chat.meetupId);
  const hostProfile = m ? MOCK_PROFILES.find(p => p.name === m.hostName) : null;
  const participants = chat.participants || [];
  const totalCount = participants.length + (hostProfile ? 1 : 0);

  const renderGroupChatView = () => {
    contentArea.innerHTML = `
      <div style="position: absolute; top: calc(-1 * var(--safe-top)); left:0; width: 100%; height: calc(100vh - 84px); height: calc(100dvh - 144px + var(--safe-top)); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column;">
        <div class="chat-header" style="position: relative; justify-content: center; padding: calc(12px + var(--safe-top)) 20px 12px; min-height: 60px;">
          <button class="back-btn" onclick="switchTab('messages')" style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); padding: 0;">
            <i data-lucide="chevron-left" style="width:28px;"></i>
          </button>
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="font-size:16px; font-weight:700; color:#333;">${chat.title}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${totalCount}명 참여 중</div>
          </div>
          <button onclick="openGroupSidePanel('${chatId}')" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); border:none; background:none; cursor:pointer; padding:0; color:#555;">
            <i data-lucide="more-horizontal" style="width:22px; height:22px;"></i>
          </button>
        </div>
        <div class="chat-scroller" id="group-chat-scroller">
          ${chat.messages.map(msg => {
            if (msg.type === 'system') {
              return `<div style="text-align:center; font-size:12px; color:#AAA; padding:8px 16px;">${msg.text}</div>`;
            }
            if (msg.type === 'host' || msg.type === 'participant') {
              return `
                <div style="display:flex; align-items:flex-start; gap:8px;">
                  <div style="width:34px;height:34px;border-radius:50%;background-image:url('${msg.image}');background-size:cover;background-position:center;flex-shrink:0;background-color:#EDE0FF;"></div>
                  <div>
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;">${msg.name}${msg.type === 'host' ? ' · 호스트' : ''}</div>
                    <div style="display:flex;align-items:flex-end;gap:6px;">
                      <div class="chat-bubble received" style="margin:0;">${msg.text}</div>
                      ${msg.time ? `<div style="font-size:10px;color:#BBB;white-space:nowrap;">${msg.time}</div>` : ''}
                    </div>
                  </div>
                </div>`;
            }
            return `<div class="chat-bubble ${msg.type}">${msg.text}</div>`;
          }).join('')}
        </div>
        <div class="chat-input-bar">
          <button style="border:none; background:none; cursor:pointer; color: var(--text-muted);">
            <i data-lucide="plus" style="width: 24px;"></i>
          </button>
          <input type="text" id="group-chat-input" class="chat-input" placeholder="메시지 보내기..." />
          <button id="group-chat-send" class="match-intro-send">
            <i data-lucide="send" style="width: 20px;"></i>
          </button>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const input = contentArea.querySelector('#group-chat-input');
    const scroller = contentArea.querySelector('#group-chat-scroller');
    const sendBtn = contentArea.querySelector('#group-chat-send');

    function sendGroupMsg() {
      const text = input.value.trim();
      if (!text) return;
      chat.messages.push({ type: 'sent', text });
      input.value = '';
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble sent';
      bubble.textContent = text;
      scroller.appendChild(bubble);
      scroller.scrollTop = scroller.scrollHeight;
    }

    input.addEventListener('keydown', e => { if (e.key === 'Enter') sendGroupMsg(); });
    sendBtn.addEventListener('click', sendGroupMsg);
  };

  window.openGroupParticipants = function (cId) {
    const c = MOCK_CHATS.find(x => x.id === cId);
    if (!c) return;
    const meetup = MOCK_MEETUPS.find(x => x.id === c.meetupId);
    const host = meetup ? MOCK_PROFILES.find(p => p.name === meetup.hostName) : null;
    const parts = c.participants || [];

    contentArea.innerHTML = `
      <div style="position: absolute; top: calc(-1 * var(--safe-top)); left:0; width: 100%; height: calc(100vh - 84px); height: calc(100dvh - 144px + var(--safe-top)); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column; overflow:hidden;">
        <div class="app-header" style="background:var(--bg-color); padding-top: calc(20px + var(--safe-top));">
          <button class="back-btn" onclick="openChat('${cId}')">
            <i data-lucide="chevron-left" style="width:28px;"></i>
          </button>
          <div style="font-size:15px; font-weight:600;">참여자 목록</div>
          <div style="width:32px;"></div>
        </div>
        <div class="scroll-y" style="flex:1; padding:0 24px;">
          ${host ? `
          <div style="padding:16px 0; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="openLimitedProfile(${host.id}, '${cId}')">
            <div style="width:48px;height:48px;border-radius:50%;background-image:url('${host.image}');background-size:cover;background-position:center;flex-shrink:0;"></div>
            <div style="flex:1;">
              <div style="font-size:15px;font-weight:600;color:#333;">${host.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">${getAge(host.birthYear)}세</div>
            </div>
            <span style="font-size:12px;font-weight:600;color:#9B72CC;background:#F0E6FF;padding:3px 8px;border-radius:20px;">호스트</span>
          </div>
          ` : ''}
          ${parts.map(pp => `
          <div style="padding:16px 0; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="openLimitedProfile(${pp.id}, '${cId}')">
            <div style="width:48px;height:48px;border-radius:50%;background-image:url('${pp.image}');background-size:cover;background-position:center;flex-shrink:0;"></div>
            <div>
              <div style="font-size:15px;font-weight:600;color:#333;">${pp.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">${getAge(pp.birthYear)}세</div>
            </div>
          </div>
          `).join('')}
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  renderGroupChatView();
}

window.openLimitedProfile = function (profileId, chatId) {
  const p = MOCK_PROFILES.find(pr => pr.id === profileId);
  if (!p) return;
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  const age = 2026 - (p.birthYear || 1995) + 1;
  const yearSuffix = ((p.birthYear || 1995) % 100).toString().padStart(2, '0');
  const blurStyle = p.photoPrivate ? 'filter:blur(8px);' : '';

  const limitedFields = [
    { label: '내 스타일', value: p.aboutMe?.style },
    { label: '이상형', value: p.aboutMe?.ideal },
    { label: '주량', value: p.aboutMe?.drink },
    { label: '흡연 여부', value: p.aboutMe?.smoke }
  ].filter(f => f.value && f.value.trim() !== '');

  const infoRowsHTML = limitedFields.map((f, idx) => `
    <div class="info-row" style="${idx === limitedFields.length - 1 ? 'border-bottom:none;' : ''}">
      <div class="info-label">${f.label}</div>
      <div class="info-val" style="color:#2C2C2A;">${f.value}</div>
    </div>
  `).join('');

  contentArea.innerHTML = `
    <div style="position: absolute; top: calc(-1 * var(--safe-top)); left:0; width: 100%; height: calc(100vh - 84px); height: calc(100dvh - 144px + var(--safe-top)); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column; overflow:hidden;">
      <div class="app-header" style="background:var(--bg-color); padding-top: calc(20px + var(--safe-top));">
        <button class="back-btn" onclick="openGroupParticipants('${chatId}')">
          <i data-lucide="chevron-left" style="width:28px;"></i>
        </button>
        <div style="font-size:15px; font-weight:600;">${p.name}</div>
        <div style="width:32px;"></div>
      </div>
      <div class="scroll-y" style="flex:1;">
        <div style="padding-bottom:120px;">
          <div class="prof-modal-photo" style="position:relative; height:450px; overflow:hidden; background:#EEE;">
            <div style="position:absolute;inset:0;background-image:url('${p.image}');background-size:cover;background-position:center;${blurStyle}"></div>
            ${p.photoPrivate ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"><div style="background:rgba(0,0,0,0.5);padding:12px 24px;border-radius:14px;color:white;font-size:14px;font-weight:600;">🔒 매칭 후 공개</div></div>` : ''}
          </div>

          <div style="padding:24px;">
            <div class="card-name" style="font-size:22px; display:flex; align-items:center; gap:8px; font-weight:600; color:var(--text-dark); flex-wrap:wrap;">
              ${p.name} <span style="font-size:16px; font-weight:400; color:var(--text-muted);">${age}세 (${yearSuffix}년생)</span> ${getRoleBadgeHTML(p.role)}
            </div>

            <div class="card-tags" style="margin-top:16px;">
              ${(p.tags || []).map(t => `<div class="card-tag">${t}</div>`).join('')}
            </div>

            <div class="profile-badge" style="margin-top:24px; display:inline-block;">
              ${p.intent || '연애를 기대해요 ❤️'}
            </div>

            <div style="font-size:15px; margin-top:20px; line-height:1.5; color:var(--text-dark); white-space:pre-line;">
              ${p.bio || ''}
            </div>

            ${infoRowsHTML ? `
            <div class="profile-section-title" style="margin-top:40px;">나에 대해</div>
            <div class="info-card">${infoRowsHTML}</div>
            ` : ''}

            <div style="margin-top:32px; background:#F8F4FF; border-radius:16px; padding:20px; text-align:center;">
              <div style="font-size:15px; font-weight:600; color:#9B72CC;">💜 더 알아보려면 매칭이 필요해요</div>
              <div style="font-size:13px; color:#AAA; margin-top:6px;">챕터 답변과 추가 사진은 매칭 후 공개돼요</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ── 1:1 채팅 ──────────────────────────────────────────────
window.openChat = function (chatId) {
  const chat = MOCK_CHATS.find(c => c.id === chatId);
  if (!chat) return;

  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  if (chat.type === 'group') {
    openGroupChat(chatId);
    return;
  }

  const p = MOCK_PROFILES.find(pr => pr.name === chat.name);
  const ageDistText = p
    ? `${getAge(p.birthYear)}세 ・ ${formatDistanceLabel(p)}`
    : chat.score;
  const sharedMeetup = MOCK_MEETUPS.find(m =>
    m.hasRSVPd && (m.hostName === chat.name || (m.participants || []).some(img => img === p?.image))
  );

  const renderChatView = () => {
    contentArea.innerHTML = `
      <div style="position: absolute; top: calc(-1 * var(--safe-top)); left:0; width: 100%; height: calc(100vh - 84px); height: calc(100dvh - 144px + var(--safe-top)); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column;">
        <div class="chat-header" style="position: relative; justify-content: center; padding: calc(12px + var(--safe-top)) 20px 12px; min-height: 60px;">
          <button class="back-btn" onclick="switchTab('messages')" style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); padding: 0;"><i data-lucide="chevron-left" style="width:28px;"></i></button>
          <div class="chat-header-user-info" style="display:flex; flex-direction:column; align-items:center;">
            <div style="font-size:16px; font-weight:700; color:#333;">${chat.name}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${ageDistText}</div>
          </div>
          <button onclick="openProfileForChat(${p?.id || 0}, ${chatId})" style="position:absolute; right:20px; top:50%; transform:translateY(-50%); background:none; border:none; padding:0; cursor:pointer;">
            <div style="width:32px; height:32px; border-radius:50%; background-image:url('${p?.image || ''}'); background-size:cover; background-position:center; background-color:#EDE0FF; border:1px solid rgba(0,0,0,0.08);"></div>
          </button>
        </div>
        ${sharedMeetup ? `
        <div id="shared-meetup-banner" style="background:#EDE4F7; padding:10px 16px; display:flex; align-items:center; gap:8px; flex-shrink:0;">
          <span style="font-size:13px; color:#333; flex:1; cursor:pointer; line-height:1.3;" onclick="openMeetupDetail(${sharedMeetup.id})">📅 ${sharedMeetup.title} · ${sharedMeetup.date || ''}</span>
          <button onclick="document.getElementById('shared-meetup-banner').remove()" style="background:none; border:none; cursor:pointer; color:#999; padding:0; font-size:18px; flex-shrink:0; line-height:1;">×</button>
        </div>
        ` : ''}

        <div class="chat-scroller">
          ${chat.messages.map((m, idx) => {
      let meetupHTML = '';
      if (m.meetupId) {
        const meetup = MOCK_MEETUPS.find(x => x.id === m.meetupId);
        if (meetup) {
          meetupHTML = `
                  <div onclick="openMeetupDetail(${meetup.id})" style="cursor: pointer; background: white; border: 1px solid #EEE; border-radius: 12px; padding: 12px; margin-bottom: 4px; max-width: 260px; align-self: flex-end; text-align: left; position: relative;">
                    <div style="font-size:11px; color:#9B72CC; margin-bottom:4px;">${meetup.type}</div>
                    <div style="font-size:14px; font-weight:700; color:#333; margin-bottom:4px;">${meetup.title}</div>
                    <div style="font-size:12px; color:var(--text-muted);">📍 ${meetup.shortLocation} · ${meetup.date}</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">👥 ${meetup.currentCap}/${meetup.maxCap}명</div>
                    <div style="font-size: 11px; color: #9B72CC; font-weight: 600; text-align: right; margin-top: 8px;">자세히 보기 →</div>
                  </div>
                `;
        }
      }
      if (m.type === 'received') {
        const isConsecutive = idx > 0 && chat.messages[idx - 1].type === 'received';
        const avatarHTML = isConsecutive
          ? `<div style="width:32px; flex-shrink:0;"></div>`
          : `<div onclick="openProfileForChat(${p?.id || 0}, ${chatId})" style="width:32px; height:32px; border-radius:50%; background-image:url('${p?.image || ''}'); background-size:cover; background-position:center; flex-shrink:0; background-color:#EDE0FF; cursor:pointer;"></div>`;
        return `
              ${meetupHTML}
              <div style="display:flex; align-items:flex-start; gap:8px;">
                ${avatarHTML}
                <div class="chat-bubble received">${m.text}</div>
              </div>`;
      }
      return `
              ${meetupHTML}
              <div class="chat-bubble ${m.type}">${m.text}</div>
            `;
    }).join('')}
        </div>
        <div class="chat-input-bar">
          <button style="border:none; background:none; cursor:pointer; color: var(--text-muted);"><i data-lucide="plus" style="width: 24px;"></i></button>
          <input type="text" class="chat-input" placeholder="메시지 보내기..." />
          <button class="match-intro-send">
            <i data-lucide="send" style="width: 20px;"></i>
          </button>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.openChatProfile = function (cId) {
    const c = MOCK_CHATS.find(x => x.id === cId);
    const p = MOCK_PROFILES.find(pr => pr.name === c.name);
    if (!p) return;

    contentArea.innerHTML = `
      <div style="position: absolute; top: calc(-1 * var(--safe-top)); left:0; width: 100%; height: calc(100vh - 84px); height: calc(100dvh - 144px + var(--safe-top)); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column; overflow:hidden;">
        <div class="app-header" style="background:var(--bg-color); padding-top: calc(20px + var(--safe-top));">
          <button class="back-btn" onclick="openChat(${cId})"><i data-lucide="chevron-left" style="width:28px;"></i></button>
          <div style="font-size:15px; font-weight:600;">${p.name}</div>
          <div style="width:32px;"></div>
        </div>
        <div class="scroll-y" style="flex:1;">
          ${getProfileDetailedHTML(p, false)}
        </div>
        <div class="detail-action-bar">
          <div class="detail-btn-pass" onclick="closeModal()">닫기</div>
          <div class="detail-btn-like" onclick="sendLike()">좋아요 보내기 💜</div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  renderChatView();
}

// ── 내 모임 탭 · 저장한 모임 ────────────────────────────
window.setDiscoverFilter = function (f) { discoverFilterType = f; renderDiscoverTab(); };
window.toggleLikedCollection = function () { window.showLikedCollection = !window.showLikedCollection; renderDiscoverTab(); };
function renderMyMeetingsTab(tabName) {
  const content = document.getElementById('my-meetings-content');
  if (!content) return;

  const tabs = ['applied', 'bookmarked', 'created'];
  const tabLabels = { applied: '신청한 모임', bookmarked: '북마크', created: '만든 모임' };

  const tabBarHtml = tabs.map(t => `
    <button onclick="renderMyMeetingsTab('${t}')" style="
      flex:1; background:none; border:none; padding:12px 0; font-size:14px; font-weight:600; cursor:pointer;
      color:${t === tabName ? '#9B72CC' : 'var(--text-muted)'};
      border-bottom:${t === tabName ? '2px solid #9B72CC' : '2px solid transparent'};
    ">${tabLabels[t]}</button>
  `).join('');

  let bodyHtml = '';

  if (tabName === 'applied') {
    const samples = MOCK_MEETUPS.filter(m => m.currentCap > 0).slice(0, 2);
    if (samples.length === 0) {
      bodyHtml = `<div style="text-align:center;color:var(--text-muted);margin-top:60px;">신청한 모임이 없어요</div>`;
    } else {
      bodyHtml = samples.map(m => `
        <div onclick="openMeetupDetail(${m.id})" style="
          display:flex; justify-content:space-between; align-items:center;
          padding:16px 0; border-bottom:1px solid var(--border-color); cursor:pointer;
        ">
          <div>
            <div style="font-weight:700; font-size:15px; margin-bottom:4px; color:var(--text-dark);">${m.title}</div>
            <div style="font-size:13px; color:var(--text-muted);">${m.date} · ${m.shortLocation}</div>
          </div>
          <span style="
            background:#E8F5E9; color:#4CAF50; border-radius:999px;
            padding:2px 8px; font-size:12px; font-weight:600; white-space:nowrap; margin-left:12px;
          ">확정 ✓</span>
        </div>
      `).join('');
    }
  } else if (tabName === 'bookmarked') {
    const saved = MOCK_MEETUPS.filter(m => window.bookmarkedMoims && window.bookmarkedMoims[m.id]);
    if (saved.length === 0) {
      bodyHtml = `<div style="text-align:center;color:var(--text-muted);margin-top:60px;">북마크한 모임이 없어요</div>`;
    } else {
      bodyHtml = saved.map(m => `
        <div onclick="openMeetupDetail(${m.id})" style="
          display:flex; justify-content:space-between; align-items:center;
          padding:16px 0; border-bottom:1px solid var(--border-color); cursor:pointer;
        ">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:15px; margin-bottom:4px; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.title}</div>
            <div style="font-size:13px; color:var(--text-muted);">${m.date} · ${m.shortLocation}</div>
          </div>
          <span style="
            background:#F3EEFF; color:#9B72CC; border-radius:999px;
            padding:2px 8px; font-size:12px; font-weight:600; white-space:nowrap; margin-left:12px; flex-shrink:0;
          ">북마크 ♥</span>
        </div>
      `).join('');
    }
  } else if (tabName === 'created') {
    const mine = MOCK_MEETUPS.filter(m => m.createdByMe);
    if (mine.length === 0) {
      bodyHtml = `<div style="text-align:center;color:var(--text-muted);margin-top:60px;">만든 모임이 없어요</div>`;
    } else {
      bodyHtml = mine.map(m => `
        <div onclick="openMeetupDetail(${m.id})" style="
          display:flex; justify-content:space-between; align-items:center;
          padding:16px 0; border-bottom:1px solid var(--border-color); cursor:pointer;
        ">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:15px; margin-bottom:4px; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.title}</div>
            <div style="font-size:13px; color:var(--text-muted);">${m.date} · ${m.shortLocation}</div>
          </div>
          <span style="
            background:${m.cancelled ? '#F1EFEF' : '#E8F5E9'}; color:${m.cancelled ? '#8A8587' : '#4CAF50'}; border-radius:999px;
            padding:2px 8px; font-size:12px; font-weight:600; white-space:nowrap; margin-left:12px; flex-shrink:0;
          ">${m.cancelled ? '취소됨' : '주최 ✓'}</span>
        </div>
      `).join('');
    }
  }

  content.innerHTML = `
    <div style="display:flex; border-bottom:1px solid var(--border-color);">${tabBarHtml}</div>
    <div style="padding:0 24px 40px;">${bodyHtml}</div>
  `;
}
window.renderMyMeetingsTab = renderMyMeetingsTab;

function closeMyMeetings() {
  window.closeModal();
}
window.closeMyMeetings = closeMyMeetings;

function openMyMeetings() {
  const mc = getModalContainer();
  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index:200; background:var(--bg-color);">
      <div class="app-header">
        <button class="back-btn" onclick="closeModal()"><i data-lucide="chevron-left" style="width:28px;"></i></button>
        <div style="font-size:16px; font-weight:600;">내 모임</div>
        <div style="width:32px;"></div>
      </div>
      <div class="scroll-y" style="padding-top:0;">
        <div id="my-meetings-content"></div>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  renderMyMeetingsTab('applied');
}
window.openMyMeetings = openMyMeetings;

document.addEventListener('click', function (e) {
  if (e.target.closest('.folder-heart-btn')) openMyMeetings();
});

window.toggleSavedMeetups = function () {
  window.showSavedMeetups = !window.showSavedMeetups;

  const btn = document.getElementById('meetup-collection-toggle');
  const icon = document.getElementById('meetup-collection-toggle-icon');
  if (btn && icon) {
    btn.style.background = window.showSavedMeetups ? 'rgba(155,114,204,0.1)' : 'none';
    icon.setAttribute('fill', window.showSavedMeetups ? '#9B72CC' : 'none');
  }

  renderMeetupList();
};
window.restartDiscover = function () {
  // New queue = only unsaved + unpassed cards from today's 6
  const remaining = dailyProfiles.filter(p => !(pagedSet?.has(p.id) ?? false) && !(passedSet?.has(p.id) ?? false));
  browseQueue = [...remaining];
  renderDiscoverTab();
};

// ══════════════════════════════════════════════════════════════
// 발견 탭
// 스택 제스처, 스와이프, 매칭 오버레이, 렌더링
// ══════════════════════════════════════════════════════════════

let currentDragCard = null;
let startX = 0;
let startY = 0;

window.initStackGestures = function (cardEl) {
  if (!cardEl) return;

  cardEl.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentDragCard = cardEl;
    cardEl.classList.add('dragging');
  }, { passive: true });

  cardEl.addEventListener('touchmove', e => {
    if (!currentDragCard) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    const rot = dx / 15;
    currentDragCard.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
  }, { passive: true });

  cardEl.addEventListener('touchend', e => {
    if (!currentDragCard) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    currentDragCard.classList.remove('dragging');

    if (dx > 100) {
      swipeRight();
    } else if (dx < -100) {
      swipeLeft();
    } else if (dy < -150) {
      swipeUp();
    } else {
      currentDragCard.style.transform = '';
    }
    currentDragCard = null;
  });
};

// 좌우 스와이프는 판단이 아니라 진행이다. 좋아요도 책 덮기도 아니지만,
// 그 책은 이번 주 몫으로 읽은 것이므로 스택에서 빠지고 남은 권수도 줄어든다.
// 아무 흔적도 남기지 않는 무반응이라 8주 쿨다운 뒤 다시 후보에 든다.
function advanceStack(dir) {
  const card = document.querySelector('.book-card.level-0');
  if (!card) return;
  if (card.classList.contains('bridge-card')) { slideBridgeAway(card, dir); return; }

  card.style.transform = `translateX(${dir * 150}%) rotate(${dir * 30}deg)`;
  card.style.opacity = '0';
  setTimeout(() => {
    try {
      const item = browseQueue.shift();
      if (item) {
        passedSet.add(item.id);        // 남은 권수 계산에서 빠진다
        rememberViewedProfile(item);   // "이번 주 다시보기"에는 남는다
      }
    } finally {
      renderDiscoverTab();
    }
  }, 300);
}

window.swipeLeft = function () { advanceStack(-1); };

window.swipeRight = function () { advanceStack(1); };

window.detailSwipeLeft = function () {
  const card = browseQueue[0];
  if (!card) return;

  // 넘기기 누른 카드
  passedSet.add(card.id);
  browseQueue.shift();

  if (!window.weeklyViewedProfiles) window.weeklyViewedProfiles = [];
  if (!window.weeklyViewedProfiles.some(v => v.id === card.id)) {
    window.weeklyViewedProfiles.push(card);
    localStorage.setItem('sp_viewed_this_week', JSON.stringify(window.weeklyViewedProfiles));
  }

  closeModal();
  renderDiscoverTab();
};

window.detailSwipeRight = function () {
  const card = browseQueue[0];
  if (!card || window.__actionLocked) return;

  // Lock actions briefly to prevent duplicates
  window.__actionLocked = true;
  setTimeout(() => { window.__actionLocked = false; }, 1000);

  // Check mutual match condition (mocking: first time always true)
  const isMutualMatch = !window.__hasMockedMutualMatch;
  if (isMutualMatch) {
    window.__hasMockedMutualMatch = true;
  }

  // Page her 누른 카드
  pagedSet.add(card.id);

  const alreadySaved = savedBooks.some(b => b.id === card.id);
  if (!alreadySaved) {
    savedBooks.push(card);
  }

  if (!window.weeklyViewedProfiles) window.weeklyViewedProfiles = [];
  if (!window.weeklyViewedProfiles.some(v => v.id === card.id)) {
    window.weeklyViewedProfiles.push(card);
    localStorage.setItem('sp_viewed_this_week', JSON.stringify(window.weeklyViewedProfiles));
  }

  browseQueue.shift(); // remove from queue

  if (isMutualMatch) {
    // Add to MATCHED_PROFILES
    const numId = parseInt(card.id.replace('p', ''));
    if (!MATCHED_PROFILES.find(m => m.id === numId)) {
      MATCHED_PROFILES.unshift({ id: numId, name: card.profile.name, image: card.profile.image, isNew: true });
    }
    // Show mutual match overlay
    showMutualMatchOverlay(card.profile);
  } else {
    const overlay = document.getElementById('paged-heart-overlay');
    if (overlay) overlay.classList.add('active');

    setTimeout(() => {
      if (overlay) overlay.classList.remove('active');
      closeModal();
      renderDiscoverTab();
    }, 600);
  }
};

window.showMutualMatchOverlay = function (p) {
  if (!document.getElementById('float-keyframes')) {
    const style = document.createElement('style');
    style.id = 'float-keyframes';
    style.textContent = `
      @keyframes bookFloat {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-8px); }
      }
      @keyframes orbitSpin {
        from { transform: rotate(-10deg); }
        to   { transform: rotate(350deg); }
      }
    `;
    document.head.appendChild(style);
  }

  const container = document.getElementById('modal-container') || document.body;
  const overlay = document.createElement('div');
  overlay.className = 'fade-in active';
  overlay.id = 'mutual-match-overlay';
  overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:var(--bg-color); z-index:4000; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; transition:opacity 0.3s; pointer-events:auto;';

  const otherSpineColor = getSpineColor(p.id);
  const otherAge = getAge(p.birthYear);
  const otherDistLabel = formatDistanceLabel(p);

  overlay.innerHTML = `
    <div style="font-size:22px; font-weight:700; color:#9B72CC; margin-bottom:60px;">on the same page ♥︎</div>

    <div style="position:relative; width:296px; height:220px; display:flex; align-items:center; justify-content:center; gap:20px; margin-bottom:40px;">

      <!-- Orbit ellipse (behind covers) -->
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:0; pointer-events:none;">
        <div style="animation:orbitSpin 12s linear infinite;">
          <svg width="300" height="220" viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="150" cy="110" rx="145" ry="105" stroke="#C89FDB" stroke-width="1" opacity="0.6"/>
            <text x="295" y="114" fill="#C89FDB" font-size="14" text-anchor="middle" dominant-baseline="middle" opacity="0.8">✦</text>
          </svg>
        </div>
      </div>

      <!-- My Profile -->
      <div class="saved-book-cover" style="width:120px; height:180px; background:#F0F0EE; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; z-index:1; animation:bookFloat 3s ease-in-out infinite;">
        <div class="book-spine" style="background:linear-gradient(to right, #DDD, rgba(0,0,0,0.05)); width:6px;"></div>
        ${typeof userProfilePhoto !== 'undefined' && userProfilePhoto ? `<div style="position:absolute; inset:0; background-image:url('${userProfilePhoto}'); background-size:cover; background-position:center;"></div>` : `<span style="font-size:24px; font-weight:700; color:#CCC;">나</span>`}
        <div class="book-overlay"></div>
      </div>

      <!-- Other Profile -->
      <div class="saved-book-cover" style="width:120px; height:180px; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.15); position:relative; overflow:hidden; z-index:1; animation:bookFloat 3s ease-in-out infinite; animation-delay:0.5s;">
        <div class="book-spine" style="background:linear-gradient(to right, ${otherSpineColor}, rgba(0,0,0,0.15)); width:6px;"></div>
        <div class="book-bg-photo" style="background-image:url('${p.image}'); filter:none; transform:scale(1);"></div>
        <div class="book-overlay"></div>
      </div>
    </div>

    <div style="font-size:16px; font-weight:600; color:var(--text-muted); margin-bottom:8px;">
      ${p.name} · <span style="font-size:14px; font-weight:400;">${otherAge}세 · ${otherDistLabel}</span>
    </div>
    <div style="font-size:13px; color:var(--text-muted); margin-bottom:80px; text-align:center;">
      어떤 인연이 될지는 두 분이 써내려가요
    </div>

    <div style="width:100%; max-width:320px; pointer-events:auto;">
      <button id="btn-match-chat" class="btn-primary" style="width:100%; margin-bottom:16px; padding:16px; border-radius:16px; font-size:16px; cursor:pointer; pointer-events:auto;">메시지 시작하기</button>
      <button id="btn-match-later" style="width:100%; background:none; border:none; color:var(--text-muted); font-size:14px; padding:12px; font-weight:600; cursor:pointer; pointer-events:auto;">나중에</button>
    </div>
  `;

  container.appendChild(overlay);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  overlay.querySelector('#btn-match-chat').addEventListener('click', () => handleMatchOverlayAction('chat', p.id));
  overlay.querySelector('#btn-match-later').addEventListener('click', () => handleMatchOverlayAction('later'));
};

window.handleMatchOverlayAction = function (action, profileId) {
  const overlay = document.getElementById('mutual-match-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      closeModal(); // Close the detailed profile modal if open
      renderDiscoverTab();

      if (action === 'chat') {
        switchTab('messages');
        setTimeout(() => {
          openMatchIntroModal(profileId);
        }, 100);
      }
    }, 300);
  }
};

// ══════════════════════════════════════════════════════════════
// 발견 탭 — 세 가지 반응
//
//   좋아요   명시적. 하트 버튼을 눌러야만 일어난다.
//   무반응   그냥 넘긴다. 아무 상태도 남지 않고, 8주 쿨다운 정책에 따라
//            나중에 다시 등장할 수 있다. 그래서 여기 코드가 없다.
//   책 덮기  영구 제외. 눌러야만 일어나고, 되돌리려면 별도 조치가 필요하다.
//
// 좌우 스와이프는 셋 중 어느 것도 아니다 — 다음 책으로 넘기는 내비게이션이다.
// ══════════════════════════════════════════════════════════════

// 덮은 책은 주간 배달에서 영구히 빠진다. 세션이 아니라 기기에 남아야 하므로
// (지금은 백엔드가 이 값을 갖고 있지 않다) localStorage에 둔다.
const CLOSED_BOOKS_KEY = 'p2_closed_books';
let closedBooks = new Set();

function loadClosedBooks() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(CLOSED_BOOKS_KEY) || '[]');
    closedBooks = new Set(Array.isArray(raw) ? raw.filter(x => typeof x === 'string') : []);
  } catch (e) {
    closedBooks = new Set();
  }
  return closedBooks;
}

function saveClosedBooks() {
  try { window.localStorage.setItem(CLOSED_BOOKS_KEY, JSON.stringify([...closedBooks])); }
  catch (e) { /* private mode / quota */ }
}

window.isBookClosed = function (cardId) {
  return closedBooks.has(cardId);
};

// 책 덮기 — 영구 제외. 8주 뒤 재등장하는 무반응과 달리 되돌아오지 않는다.
window.closeBook = function (cardId) {
  if (!cardId || closedBooks.has(cardId)) return;
  const item = browseQueue.find(x => x.id === cardId)
    || dailyProfiles.find(x => x.id === cardId)
    || (window.weeklyViewedProfiles || []).find(x => x.id === cardId);

  closedBooks.add(cardId);
  saveClosedBooks();

  // 이번 주 스택에서는 즉시 빠지고, 남은 권수에서도 빠진다.
  browseQueue = browseQueue.filter(x => x.id !== cardId);
  passedSet.add(cardId);
  pagedSet.delete(cardId);

  // 다시보기 목록에는 남는다 — 이번 주 안에는 되돌릴 수 있어야 하기 때문.
  // 다음 주가 되면 sp_viewed_this_week가 비워지면서 목록에서 사라지고,
  // 그때부터는 유료 "덮은 책 되돌리기"의 영역이다.
  rememberViewedProfile(item);

  showToast('책을 덮었어요. 이번 주 다시보기에서 되돌릴 수 있어요.');
  renderDiscoverTab();
};

// 책 덮기 취소. 이번 주 다시보기에 남아 있는 동안에만 부를 수 있다.
window.reopenBook = function (cardId) {
  if (!cardId || !closedBooks.has(cardId)) return false;
  closedBooks.delete(cardId);
  saveClosedBooks();
  // 무반응으로 되돌린다: 좋아요도 아니고 덮은 것도 아닌 상태.
  showToast('책을 다시 열었어요.');
  return true;
};

// 다시보기 항목의 상태. 셋 중 하나다.
window.getBookState = function (cardId) {
  if (closedBooks.has(cardId)) return 'closed';
  if (pagedSet.has(cardId)) return 'paged';
  return 'none';
};

// "이번 주 프로필북 다시보기" 목록. 좋아요든 그냥 넘김이든, 한 번 본 책은
// 여기 남는다. 저장이 실패해도(프라이빗 모드·용량 초과) 메모리 목록은 유지한다.
function rememberViewedProfile(item) {
  if (!item) return;
  if (!Array.isArray(window.weeklyViewedProfiles)) window.weeklyViewedProfiles = [];
  if (window.weeklyViewedProfiles.some(v => v.id === item.id)) return;
  window.weeklyViewedProfiles.push(item);
  try { window.localStorage.setItem('sp_viewed_this_week', JSON.stringify(window.weeklyViewedProfiles)); }
  catch (e) { /* storage unavailable */ }
}
window.rememberViewedProfile = rememberViewedProfile;

// 좋아요 — 발견 카드의 하트와 상세 화면의 FAB이 같은 경로를 쓴다.
// 반환값은 상호 매칭 여부.
window.pageProfile = function (cardId) {
  if (!cardId || pagedSet.has(cardId)) return false;

  const item = browseQueue.find(x => x.id === cardId)
    || dailyProfiles.find(x => x.id === cardId);

  pagedSet.add(cardId);
  if (item && !savedBooks.some(b => b.id === cardId)) savedBooks.push(item);

  if (item) {
    rememberViewedProfile(item);
    browseQueue = browseQueue.filter(x => x.id !== cardId);
  }

  const mutual = !window.__hasMockedMutualMatch;
  if (mutual) window.__hasMockedMutualMatch = true;
  return mutual;
};

// 발견 카드의 하트. 상세로 들어가지 않고 표지에서 바로 마음을 보낸다.
window.pageFromCard = function (cardId) {
  if (window.__actionLocked) return;
  if (pagedSet.has(cardId)) { showToast('이미 Page했어요 ♥'); return; }
  window.__actionLocked = true;
  setTimeout(() => { window.__actionLocked = false; }, 1000);

  const item = browseQueue.find(x => x.id === cardId);
  const profile = item ? item.profile : null;
  const mutual = window.pageProfile(cardId);

  const overlay = document.getElementById('paged-heart-overlay');
  if (overlay) overlay.classList.add('active');

  setTimeout(() => {
    if (overlay) overlay.classList.remove('active');
    renderDiscoverTab();
    if (mutual && profile) {
      if (!MATCHED_PROFILES.find(m => m.id === profile.id)) {
        MATCHED_PROFILES.unshift({ id: profile.id, name: profile.name, image: profile.image, isNew: true });
      }
      showMutualMatchOverlay(profile);
    }
  }, 600);
};

// ── 최초 진입 안내 ─────────────────────────────────────────
// 온보딩을 마치고 발견 탭에 처음 들어온 한 번만. 세 가지 반응이 어떻게 다른지
// 여기서 말해두지 않으면, 그냥 넘긴 것과 덮은 것의 차이를 알 방법이 없다.
const REACTIONS_INTRO_KEY = 'p2_reactions_intro_shown';

window.maybeShowReactionsIntro = function () {
  let seen = false;
  try { seen = window.localStorage.getItem(REACTIONS_INTRO_KEY) === '1'; } catch (e) { seen = false; }
  if (seen) return;
  // 플래그를 먼저 쓴다. 안내 도중 새로고침해도 되살아나지 않게.
  try { window.localStorage.setItem(REACTIONS_INTRO_KEY, '1'); } catch (e) { /* storage unavailable */ }
  showReactionsIntro();
};

window.showReactionsIntro = function () {
  if (document.getElementById('reactions-intro')) return;
  const opener = document.activeElement;

  const modal = document.createElement('div');
  modal.id = 'reactions-intro';
  modal.className = 'reactions-intro-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'reactions-intro-title');
  modal.innerHTML = `
    <div class="reactions-intro-card">
      <h2 class="reactions-intro-title" id="reactions-intro-title">이번 주 책을 읽는 방법</h2>
      <ul class="reactions-intro-list">
        <li>
          <span class="reactions-intro-mark reactions-intro-mark--heart" aria-hidden="true">♥</span>
          <span>마음에 들면 <b>하트</b>를 눌러주세요.</span>
        </li>
        <li>
          <span class="reactions-intro-mark" aria-hidden="true">→</span>
          <span>그냥 넘기면, 나중에 다시 만날 수도 있어요.</span>
        </li>
        <li>
          <span class="reactions-intro-mark" aria-hidden="true">―</span>
          <span>확실히 아니다 싶으면 <b>책을 덮어</b>주세요. 다시 보여드리지 않을게요.</span>
        </li>
      </ul>
      <button type="button" class="reactions-intro-btn" id="reactions-intro-ok">읽기 시작하기</button>
    </div>
  `;

  const container = document.getElementById('modal-container') || document.body;
  container.appendChild(modal);

  function dismiss() {
    document.removeEventListener('keydown', onKey, true);
    modal.remove();
    if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus();
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); dismiss(); } }
  document.addEventListener('keydown', onKey, true);

  modal.addEventListener('click', (e) => { if (e.target === modal) dismiss(); });
  modal.querySelector('#reactions-intro-ok').addEventListener('click', dismiss);
  requestAnimationFrame(() => modal.querySelector('#reactions-intro-ok')?.focus());
};

// 되돌릴 수 없는 행동인데다 링크가 작아서 오탭이 쉽다. 무엇이 일어나는지
// 한 번 말해주고, 물러날 길을 같이 준다. 재촉하지 않는 톤으로.
window.confirmCloseBook = function (cardId) {
  if (document.getElementById('close-book-sheet')) return;
  const item = browseQueue.find(x => x.id === cardId) || dailyProfiles.find(x => x.id === cardId);
  const name = item && item.profile ? item.profile.name : '이 프로필북';
  const opener = document.activeElement;

  const scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';
  scrim.id = 'close-book-scrim';

  const sheet = document.createElement('div');
  sheet.id = 'close-book-sheet';
  sheet.className = 'close-book-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', 'close-book-title');
  sheet.innerHTML = `
    <div class="sheet-grabber" aria-hidden="true"></div>
    <h2 class="close-book-title" id="close-book-title">${name} 님의 책을 덮을까요?</h2>
    <p class="close-book-body">덮은 책은 다시 배달되지 않아요.<br>그냥 넘기면 나중에 다시 만날 수도 있어요.</p>
    <div class="close-book-actions">
      <button type="button" class="sheet-btn sheet-btn--ghost" id="close-book-cancel">그냥 넘기기</button>
      <button type="button" class="sheet-btn sheet-btn--commit" id="close-book-confirm">책 덮기</button>
    </div>
  `;

  const container = document.getElementById('app-container') || document.body;
  container.appendChild(scrim);
  container.appendChild(sheet);

  function dismiss() {
    document.removeEventListener('keydown', onKey, true);
    sheet.remove();
    scrim.remove();
    if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus();
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); dismiss(); } }
  document.addEventListener('keydown', onKey, true);

  scrim.addEventListener('click', dismiss);
  sheet.querySelector('#close-book-cancel').addEventListener('click', () => {
    dismiss();
    // "그냥 넘기기"는 무반응이다 — 아무 상태도 남기지 않고 다음 장으로만 넘긴다.
    window.swipeLeft();
  });
  sheet.querySelector('#close-book-confirm').addEventListener('click', () => {
    dismiss();
    window.closeBook(cardId);
  });
  requestAnimationFrame(() => sheet.querySelector('#close-book-cancel')?.focus());
};

// ══════════════════════════════════════════════════════════════
// 발견 → 모임 브릿지 카드
// 스택의 마지막 카드. 이번 주 프로필북을 다 넘긴 사람에게 다음 행선지를 준다.
// ══════════════════════════════════════════════════════════════

// "연애할 사람을 찾고 있어요"를 고른 사람에게만 노출한다. 커뮤니티/양쪽 열려있음
// 유저는 이번 스펙에서 제외 — 카피가 그들에게는 맞지 않는다.
// 브릿지를 이미 넘겼는지. 스택의 끝이 아니라 마지막에서 두 번째 장이므로,
// 한 번 지나가면 그 뒤의 소진 화면으로 넘어간다. 새 주가 시작되면 초기화된다.
// 브릿지 카드는 이제 한 장이 아니라 최대 세 장이고, 각각 프로필북과 똑같이
// 스택 슬롯을 꽉 채운다. 넘긴 카드를 모임 단위로 기억해야 한 장씩 지나간다.
let dismissedBridgeIds = new Set();
window.resetBridgeDismissed = function () { dismissedBridgeIds = new Set(); };

function shouldShowMeetupBridge() {
  // 연애를 기대하는 쪽이면 보여준다. '둘 다 열려있어요'도 연애 의사가 있으니
  // 포함. 친구·네트워크만 찾는 community 유저에게는 소개 성격이 어긋난다.
  return userSeekingIntent === 'dating' || userSeekingIntent === 'both';
}

// 브릿지 카드를 넘긴다. 다음은 소진 화면이다.
window.dismissBridgeCard = function (meetupId) {
  const key = String(meetupId ?? '');
  if (!key || dismissedBridgeIds.has(key)) return;
  dismissedBridgeIds.add(key);
  renderDiscoverTab();
};

// 모집 마감일 필드가 데이터에 없어서 행사 일시(timestamp)를 마감 시점으로 본다.
// timestamp가 없는 항목(기간제 행사·상시 커뮤니티)은 "임박"이라는 축에 올릴 수
// 없으므로 후보에서 뺀다.
// ── 브릿지 추천 필터 ───────────────────────────────────
// 소셜 · 마감 전 · 만석 아님 · 지역 일치 · 연령대 포함, 다섯 개를 모두 통과한
// 모임만 후보다. 통과한 것들 중 마감 임박순 상위 3개를 보여준다.

const BRIDGE_MEETUP_LIMIT = 3;

// 카테고리. type이 "✨ 소셜"처럼 이모지를 달고 오므로 포함 관계로 본다.
function isSocialMeetup(m) {
  return /소셜/.test(String(m && m.type || '')) || /소셜/.test(String(m && m.secondaryType || ''));
}

// "30대 초반 ~ 40대 초반" → { min: 3, max: 6 } (DECADE_POINTS 인덱스).
// "연령 무관"이나 파싱 불가는 null — 제한 없음으로 보고 통과시킨다.
function parseAgeBand(ageRange) {
  const raw = String(ageRange || '').trim();
  if (!raw || /무관|전체|제한\s*없/.test(raw)) return null;
  const parts = raw.split(/[~\-–—]/).map(x => x.trim()).filter(Boolean);
  if (!parts.length) return null;
  const idx = label => DECADE_POINTS.indexOf(label);
  const min = idx(parts[0]);
  const max = idx(parts[parts.length - 1]);
  if (min < 0 || max < 0) return null;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

// 발견 탭 필터가 쓰는 것과 같은 나이→연령대 구간.
function getAgeDecadeIndex(age) {
  if (!Number.isFinite(age)) return null;
  if (age < 23) return 0;
  if (age < 27) return 1;
  if (age < 30) return 2;
  if (age < 33) return 3;
  if (age < 37) return 4;
  if (age < 40) return 5;
  if (age < 43) return 6;
  if (age < 47) return 7;
  if (age < 50) return 8;
  return 9;
}

function matchesAgeBand(m, age) {
  const band = parseAgeBand(m && m.ageRange);
  if (!band) return true; // 연령 무관
  const idx = getAgeDecadeIndex(age);
  if (idx === null) return true; // 나이를 모르면 이 조건으로 거르지 않는다
  return idx >= band.min && idx <= band.max;
}

// ── 지역 ───────────────────────────────────────────────
// 모임 지역 문자열이 "마포구 (홍대)"(구 + 동네)와 "중구 (대구)"(구 + 도시)로
// 섞여 있어서, 괄호 안팎을 모두 토큰으로 쪼갠 뒤 겹치는 게 있으면 일치로 본다.
const SEOUL_DISTRICTS = ['종로구','중구','용산구','성동구','광진구','동대문구','중랑구','성북구','강북구','도봉구','노원구','은평구','서대문구','마포구','양천구','강서구','구로구','금천구','영등포구','동작구','관악구','서초구','강남구','송파구','강동구'];

function regionTokens(str) {
  return String(str || '')
    .replace(/[()]/g, ' ')
    .split(/[\s,·]+/)
    .map(t => t.trim())
    .filter(Boolean);
}

// "수도권"은 서울·경기·인천을 아우르는 광역 표기다. 그 안의 어느 도시에 사는
// 유저에게도 수도권 모임은 걸려야 한다.
const CAPITAL_AREA = ['서울', '경기', '인천'];
const OTHER_METROS = /대구|부산|광주|대전|울산|세종|제주|강원|충청|전라|경상/;

function isCapitalAreaToken(t) {
  return t === '수도권' || CAPITAL_AREA.some(c => t.startsWith(c));
}

function matchesRegion(m, userRegion) {
  const want = regionTokens(userRegion);
  if (!want.length) return true; // 유저 지역을 모르면 이 조건으로 거르지 않는다
  const have = regionTokens(m && m.shortLocation);
  if (!have.length) return false;

  // 다른 광역시 이름이 붙어 있으면 서울 계열로 오인하지 않는다.
  // ("중구 (대구)"의 중구가 서울 중구로 읽히면 안 된다.)
  const elsewhere = have.some(t => OTHER_METROS.test(t));

  // 유저가 수도권 어딘가에 있고, 모임이 "수도권"으로만 표기돼 있으면 통과.
  const wantsCapital = want.some(isCapitalAreaToken);
  if (wantsCapital && have.some(t => t === '수도권')) return true;

  // 도시 단위("서울")로만 알고 있으면 그 도시의 구 전체를 받아들인다.
  const wantsSeoul = want.some(t => t === '수도권' || t.startsWith('서울'));
  if (wantsSeoul && !elsewhere && have.some(t => SEOUL_DISTRICTS.includes(t))) return true;

  return have.some(t => want.includes(t));
}

// ── 광역 단위 축약 ─────────────────────────────────────
// 사람의 지역은 광역까지만 노출한다. "마포구"나 "성수동"이 프로필에 찍히면
// 사는 동네가 특정된다 — 커밍아웃하지 않았을 수 있는 사용자에게는 이게
// 프라이버시가 아니라 안전 문제다. 구·동 단위는 거리 계산 같은 내부 용도로만.
const BROAD_REGIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

// 광역명이 아닌 표기를 광역으로 끌어올린다. 판단이 안 서면 빈 값을 돌려
// 잘못된 노출 대신 '--'가 뜨게 한다.
const BROAD_ALIASES = [
  [/서울|강남|강북|강서|강동|마포|성동|종로|용산|광진|동대문|중랑|성북|도봉|노원|은평|서대문|양천|구로|금천|영등포|동작|관악|서초|송파/, '서울'],
  [/부산|해운대|수영구|남포/, '부산'],
  [/대구|수성구|달서/, '대구'],
  [/인천|연수구|송도|부평/, '인천'],
  [/광주광역|서구 광주/, '광주'],
  [/대전|유성/, '대전'],
  [/울산/, '울산'],
  [/세종/, '세종'],
  [/경기|수원|성남|고양|용인|부천|안양|안산|화성|남양주|의정부|파주|김포/, '경기'],
  [/강원|춘천|원주|강릉/, '강원'],
  [/충북|청주/, '충북'],
  [/충남|천안|아산/, '충남'],
  [/전북|전주/, '전북'],
  [/전남|여수|순천/, '전남'],
  [/경북|포항|경주|구미/, '경북'],
  [/경남|창원|김해|진주/, '경남'],
  [/제주|서귀포/, '제주'],
];

// 프로필의 지역. location 텍스트가 있으면 그걸, 없으면 좌표에서 역산한다.
// 어느 쪽이든 광역까지만 — 구·동은 여기서 잘린다.
function getProfileRegion(profile, fallbackCoords) {
  const named = toBroadRegion(profile && profile.location);
  if (named) return named;
  const c = getProfileCoords(profile) || fallbackCoords;
  if (!c) return '';
  return toBroadRegion(resolveRegionFromCoords(c.lat, c.lng));
}
window.getProfileRegion = getProfileRegion;

function toBroadRegion(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  // 이미 광역명이면 그대로.
  const exact = BROAD_REGIONS.find(r => raw === r || raw.startsWith(r));
  if (exact) return exact;
  if (raw === '수도권') return '수도권';
  for (const [re, name] of BROAD_ALIASES) {
    if (re.test(raw)) return name;
  }
  return ''; // 알 수 없으면 노출하지 않는다
}
window.toBroadRegion = toBroadRegion;

// 디바이스 위치 → 지역명. 모임 데이터에 좌표가 없어서 좌표를 지역 이름으로
// 바꿔야 하는데, 이 앱에는 역지오코딩 경로가 없다. 아래 표는 그 자리를 메우는
// 임시 수단이고, 실제 지오코딩 API가 붙으면 이 함수만 교체하면 된다.
const REGION_ANCHORS = [
  { name: '서울', lat: 37.5665, lng: 126.9780, radiusKm: 30 },
  { name: '인천', lat: 37.4563, lng: 126.7052, radiusKm: 25 },
  { name: '경기', lat: 37.2636, lng: 127.0286, radiusKm: 25 },
  { name: '대전', lat: 36.3504, lng: 127.3845, radiusKm: 25 },
  { name: '대구', lat: 35.8714, lng: 128.6014, radiusKm: 25 },
  { name: '광주', lat: 35.1595, lng: 126.8526, radiusKm: 25 },
  { name: '부산', lat: 35.1796, lng: 129.0756, radiusKm: 30 },
  { name: '울산', lat: 35.5384, lng: 129.3114, radiusKm: 25 },
  { name: '제주', lat: 33.4996, lng: 126.5312, radiusKm: 40 },
];

function resolveRegionFromCoords(lat, lng) {
  let best = null;
  for (const a of REGION_ANCHORS) {
    const dLat = (lat - a.lat) * 111;
    const dLng = (lng - a.lng) * 88; // 위도 35~38도 부근의 경도 1도 거리
    const km = Math.sqrt(dLat * dLat + dLng * dLng);
    if (km <= a.radiusKm && (!best || km < best.km)) best = { name: a.name, km };
  }
  return best ? best.name : null;
}

// 브릿지 필터가 쓰는 유저 지역. 위치 권한이 있으면 그 값을, 없거나 실패하면
// 프로필에 저장된 지역으로 폴백한다. 렌더는 동기이므로 결과를 캐시해두고,
// 위치가 늦게 도착하면 그때 한 번 다시 그린다.
// 지역 필터가 쓰는 값. 미설정이면 빈 문자열이고, matchesRegion은 빈 값을
// "이 조건으로 거르지 않음"으로 읽는다 — 콘텐츠를 아예 못 보는 것보다 낫다.
function getUserRegion() {
  return userLocation || '';
}
window.getUserRegion = getUserRegion;

window.hasUserLocation = function () {
  return userLocationStatus === 'granted' && !!userCoords;
};

const LOCATION_KEY = 'p2_user_location';

function persistUserLocation() {
  try {
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify({
      status: userLocationStatus, region: userLocation, coords: userCoords,
    }));
  } catch (e) { /* private mode / quota */ }
}

function restoreUserLocation() {
  let saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(LOCATION_KEY) || 'null'); }
  catch (e) { saved = null; }
  if (!saved || typeof saved !== 'object') return;
  if (['unset', 'granted', 'denied'].includes(saved.status)) userLocationStatus = saved.status;
  if (typeof saved.region === 'string') userLocation = saved.region;
  if (saved.coords && Number.isFinite(saved.coords.lat) && Number.isFinite(saved.coords.lng)) {
    userCoords = { lat: saved.coords.lat, lng: saved.coords.lng };
  }
}
window.restoreUserLocation = restoreUserLocation;

// 온보딩의 위치 항목. 광역 라벨까지만 보여준다 — 구 단위는 내부 계산용이다.
function getLocationSectionHTML() {
  if (userLocationStatus === 'granted') {
    return `
      <div class="location-row is-set">
        <i data-lucide="map-pin" class="location-icon" aria-hidden="true"></i>
        <span class="location-text">${userLocation ? `${userLocation} 근처로 설정됐어요` : '위치가 확인됐어요'}</span>
      </div>
      <p class="location-note">가까운 사람과 모임을 찾는 데에만 써요. 정확한 주소는 누구에게도 보이지 않아요.</p>
    `;
  }
  const denied = userLocationStatus === 'denied';
  return `
    <p class="location-note">더 가까운 사람과 모임을 보여드리기 위해 위치 정보를 사용해요.<br>정확한 주소는 누구에게도 보이지 않아요.</p>
    <button type="button" class="location-btn" id="location-request-btn" onclick="window.handleLocationRequest('location-section')">
      <i data-lucide="map-pin" style="width:16px;height:16px;" aria-hidden="true"></i>
      ${denied ? '위치 다시 시도하기' : '내 위치 사용하기'}
    </button>
    ${denied ? '<p class="location-note location-note--denied">위치 없이도 계속할 수 있어요. 대신 모든 지역의 모임을 보여드려요.</p>' : ''}
  `;
}
window.getLocationSectionHTML = getLocationSectionHTML;

// 위치를 아직 안 준 사람에게만 뜨는 배너. 설정해두면 사라진다.
function getLocationBannerHTML() {
  if (window.hasUserLocation()) return '';
  return `
    <div class="location-banner-inner">
      <i data-lucide="map-pin" class="location-banner-icon" aria-hidden="true"></i>
      <div class="location-banner-text">
        <div class="location-banner-title">위치를 설정하면 더 가까운 모임을 보여드릴 수 있어요</div>
        <div class="location-banner-sub">지금은 모든 지역의 모임을 보여드리고 있어요.</div>
      </div>
      <button type="button" class="location-banner-btn" id="location-banner-btn" onclick="window.handleLocationRequest('location-banner')">위치 설정</button>
    </div>
  `;
}
window.getLocationBannerHTML = getLocationBannerHTML;

// 온보딩 버튼과 설정 배너가 공유하는 핸들러.
window.handleLocationRequest = async function (containerId) {
  const btn = document.getElementById('location-request-btn') || document.getElementById('location-banner-btn');
  if (btn) { btn.disabled = true; btn.classList.add('is-busy'); }

  const res = await window.requestUserLocation();

  const host = containerId ? document.getElementById(containerId) : null;
  if (host) {
    host.innerHTML = containerId === 'location-banner' ? getLocationBannerHTML() : getLocationSectionHTML();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  showToast(res.ok
    ? (res.region ? `${res.region} 근처로 설정했어요` : '위치를 확인했어요')
    : '위치 없이 계속할게요. 모든 지역의 모임을 보여드려요.');

  const inSettings = containerId === 'location-banner' && !!document.querySelector('.modal.active');
  if (currentTab === 'discover') renderDiscoverTab();
  else if (currentTab === 'profile' && !inSettings) switchTab('profile');
  return res;
};

// 위치 권한 요청. 온보딩 버튼과 설정 배너가 같은 함수를 쓴다.
// 성공하면 좌표와 광역 라벨을 저장한다 — 구 단위는 화면에 내보내지 않는다.
window.requestUserLocation = function () {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      userLocationStatus = 'denied';
      persistUserLocation();
      resolve({ ok: false, reason: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        userLocation = resolveRegionFromCoords(userCoords.lat, userCoords.lng) || '';
        userLocationStatus = 'granted';
        persistUserLocation();
        resolve({ ok: true, region: userLocation });
      },
      () => {
        // 거부해도 '서울'로 가정하지 않는다. 미설정으로 남기고 필터를 건너뛴다.
        userCoords = null;
        userLocation = '';
        userLocationStatus = 'denied';
        persistUserLocation();
        resolve({ ok: false, reason: 'denied' });
      },
      { timeout: 8000, maximumAge: 600000 }
    );
  });
};

// 예전에는 발견 탭이 렌더될 때마다 조용히 위치를 물었다. 이제는 온보딩과
// 설정 배너에서 명시적으로만 요청한다.
function ensureUserRegion() { /* no-op: 위치는 명시적 동의로만 받는다 */ }
window.ensureUserRegion = ensureUserRegion;

// ── 거리 ───────────────────────────────────────────────
// 두 좌표가 모두 있을 때만 계산한다. 하나라도 없으면 null이고, 화면에서는
// 거리 칩 자체가 사라진다 — id 해시로 만든 가짜 숫자를 보여주지 않는다.
function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s1)));
}

function getProfileCoords(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const c = profile.coords;
  if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) return c;
  if (Number.isFinite(profile.lat) && Number.isFinite(profile.lng)) {
    return { lat: profile.lat, lng: profile.lng };
  }
  return null;
}

function getDistanceKm(profile) {
  if (!window.hasUserLocation()) return null;
  const other = getProfileCoords(profile);
  if (!other) return null;
  return haversineKm(userCoords, other);
}
window.getDistanceKm = getDistanceKm;

// 거리 칩 문자열. 알 수 없어도 칸을 비우지 않는다 — 표지 메타바는 No./거리/성향
// 세 칸이 고정이라, 가운데가 사라지면 나머지가 밀린다. 자리는 지키되 값이 없다는
// 사실은 분명히 보이게 '--km'로 채운다.
const DISTANCE_UNKNOWN_LABEL = '--km';
window.DISTANCE_UNKNOWN_LABEL = DISTANCE_UNKNOWN_LABEL;

function formatDistanceLabel(profile) {
  const km = getDistanceKm(profile);
  if (km === null) return DISTANCE_UNKNOWN_LABEL;
  // '--km'과 같은 붙임 형태. 같은 칸에 번갈아 들어가므로 간격이 어긋나면 안 된다.
  return km < 1 ? `${(Math.round(km * 10) / 10).toFixed(1)}km` : `${Math.round(km)}km`;
}
window.formatDistanceLabel = formatDistanceLabel;

// 정원이 찬 모임은 권해봐야 들어갈 수 없다. 날짜가 남았어도 후보에서 뺀다.
function isMeetupFull(m) {
  const cap = Number(m && m.maxCap);
  const cur = Number(m && m.currentCap);
  if (!Number.isFinite(cap) || cap <= 0) return false; // 정원 개념이 없는 항목
  return Number.isFinite(cur) && cur >= cap;
}

// 다섯 조건을 통과한 모임을 마감 임박순으로 최대 3개. 모자라면 있는 만큼만,
// 하나도 없으면 빈 배열 — 그때는 브릿지 카드 자체가 뜨지 않는다.
function getBridgeMeetups() {
  const now = Date.now();
  const age = getAge(userBirthDate && userBirthDate.year);
  const region = getUserRegion();

  const eligible = MOCK_MEETUPS.filter(m =>
    m &&
    !m.cancelled &&                // 취소된 모임은 추천하지 않는다
    !window.isMeetupBlocked(m) &&  // 차단 관계가 걸린 모임은 추천하지 않는다
    m.timestamp &&                 // 마감 시점을 알 수 있어야 임박순에 올린다
    isSocialMeetup(m) &&           // ① 카테고리 = 소셜
    !isMeetupFull(m) &&            // ③ 만석 아님
    matchesRegion(m, region) &&    // ④ 지역 일치
    matchesAgeBand(m, age)         // ⑤ 연령대 포함
  ).map(m => ({ m, t: new Date(m.timestamp).getTime() }))
   .filter(x => Number.isFinite(x.t));

  const notDismissed = eligible.filter(x => !dismissedBridgeIds.has(String(x.m.id)));
  const upcoming = notDismissed.filter(x => x.t >= now); // ② 마감 안 지남
  const pool = upcoming.length || !window.__P2_BRIDGE_ALLOW_PAST
    ? upcoming
    // 목업 데이터가 통째로 과거로 밀려 있을 때도 카드가 보이게 하는 개발용 폴백.
    // 실제 데이터가 들어오면 위 분기에서 항상 걸리므로 여기까지 오지 않는다.
    : notDismissed;

  return pool
    .sort((a, b) => a.t - b.t)
    .slice(0, BRIDGE_MEETUP_LIMIT)
    .map(x => x.m);
}
window.getBridgeMeetups = getBridgeMeetups;
window.__P2_BRIDGE_ALLOW_PAST = window.__P2_BRIDGE_ALLOW_PAST !== false;

// "9/5 (토)"
function formatBridgeDate(timestamp) {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const W = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()} (${W[d.getDay()]})`;
}

// 지역만 남긴다: "마포구 (상암)" → "마포구"
function shortenMeetupArea(shortLocation) {
  return String(shortLocation || '').split('(')[0].trim();
}

function getMeetupBridgeCardHTML(m, levelClass, isFront) {
  const avatars = (m.participants || []).slice(0, 5);
  const extra = Math.max(0, (m.currentCap || 0) - avatars.length);
  const metaLine = [
    formatBridgeDate(m.timestamp),
    shortenMeetupArea(m.shortLocation),
    `${m.currentCap}/${m.maxCap}명`,
  ].filter(Boolean).join(' · ');

  return `
    <div class="book-card bridge-card ${levelClass}" data-id="__bridge_${m.id}__" data-bridge-meetup="${m.id}"${isFront ? '' : ' aria-hidden="true"'}>
      <div class="book-spine-soft"></div>
      <div class="bridge-card-inner">
        <p class="bridge-lead">이번주 이런 모임은 어떠세요?</p>
        <div class="bridge-rule"></div>

        <div class="bridge-people">
          <div class="attendee-stack">
            ${avatars.map(url => `<div class="attendee-avatar" style="background-image:url('${url}');background-size:cover;background-position:center top;"></div>`).join('')}
            ${extra > 0 ? `<span class="bridge-people-more">+${extra}</span>` : ''}
          </div>
          <span class="bridge-people-label">이런 분들이 모여요</span>
        </div>

        <h3 class="bridge-title">${m.title}</h3>
        <p class="bridge-meta">${metaLine}</p>

        <button type="button" class="bridge-cta"${isFront ? '' : ' tabindex="-1"'} onclick="window.openMeetupsFromBridge(${m.id})">모임 탭에서 더 보기</button>
      </div>
    </div>
  `;
}

// 목록으로 던져놓고 다시 찾게 하지 않는다. 카드에 적힌 그 모임의 상세를 연다.
// 탭을 먼저 바꿔두는 건 상세를 닫았을 때 뒤에 모임 목록이 남아 있게 하기 위함.
window.openMeetupsFromBridge = function (meetupId) {
  switchTab('meetups');
  const id = Number(meetupId);
  if (!Number.isFinite(id)) return;
  setTimeout(() => openMeetupFromList(id), 100);
};

window.swipeUp = function () {
  const card = document.querySelector('.book-card.level-0');
  if (!card) return;
  if (card.classList.contains('bridge-card')) { card.style.transform = ''; return; }
  const id = card.dataset.id.replace('p', '');
  handleCardClick(parseInt(id));
  card.style.transform = '';
};

// 프로필북과 같은 동작으로 밀어낸 뒤 소진 화면을 그린다.
function slideBridgeAway(card, dir) {
  const meetupId = card.dataset.bridgeMeetup;
  card.style.transform = `translateX(${dir * 150}%) rotate(${dir * 30}deg)`;
  card.style.opacity = '0';
  setTimeout(() => window.dismissBridgeCard(meetupId), 300);
}

window.undoSwipe = function () {
  if (swipeHistory.length === 0) return;
  swipeHistory.pop();
  renderDiscoverTab();
};

// ── 성향 모델 (Give / Take / Give&Take) ─────────────────
//
// 저장값은 기존 F/B/V와 같은 짧은 대문자 코드 컨벤션을 따른다: 'G' / 'T' / 'GT'.
// 화면에 나가는 문자열은 두 종류다.
//   ROLE_LABELS  풀 텍스트 — 온보딩·필터·툴팁처럼 읽고 고르는 자리
//   ROLE_SHORT   약어     — 책 표지 메타바처럼 한 글자 자리에 들어가는 곳
// 데이터는 'F'/'B'/'V'로 들어오는데 카드가 'booker'/'visitor'와 비교하고 있었다.
// 늘 else로 빠져서 모든 프로필이 F로 보였다. 그래서 매핑은 여기 하나만 둔다.
const ROLE_CODES = ['G', 'T', 'GT'];
const ROLE_LABELS = { G: 'Give', T: 'Take', GT: 'Give&Take' };
const ROLE_SHORT = { G: 'G', T: 'T', GT: 'G&T' };

// 백엔드가 'give' / 'GIVE&TAKE' / 'giveandtake' 중 무엇으로 주든 한 코드로 모은다.
function getRoleCode(role) {
  const c = String(role || '').trim().toUpperCase().replace(/[\s_&-]/g, '');
  // 레거시 F/B/V. 이 축을 되살리는 게 아니라, Give/Take 이전에 저장된 값을
  // 읽어내기 위한 대응이다: B 부치 → Give, F 팸 → Take, V 무성향 → Give&Take.
  if (c === 'G' || c === 'GIVE' || c === 'B' || c === 'BUTCH') return 'G';
  if (c === 'T' || c === 'TAKE' || c === 'F' || c === 'FEMME') return 'T';
  if (c === 'GT' || c === 'GIVEANDTAKE' || c === 'GIVETAKE' || c === 'V' || c === 'VISITOR') return 'GT';
  return '';
}

// 표지처럼 폭이 한 글자뿐인 자리.
function getRoleShort(role) {
  const c = getRoleCode(role);
  return c ? ROLE_SHORT[c] : '';
}

// 읽고 고르는 자리.
function getRoleLabel(role) {
  const c = getRoleCode(role);
  return c ? ROLE_LABELS[c] : '';
}
window.getRoleCode = getRoleCode;
window.getRoleShort = getRoleShort;
window.getRoleLabel = getRoleLabel;

// ── 결정론적 셔플 ──────────────────────────────────────
// 같은 주에는 늘 같은 순서가 나와야 한다. Math.random()을 쓰면 새로고침마다
// 다른 책이 배달되어 "이번 주 3권"이라는 약속이 성립하지 않는다.
function seedFrom(value) {
  const str = String(value);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  let t = (seed + 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function seededShuffle(list, seed) {
  const out = [...list];
  const base = seedFrom(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(base + i) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── 책등 색상 · 거리 계산 ────────────────────────────────
const SPINE_COLORS = ['#C89FDB', '#A8C5A0', '#E8B4A0', '#9FB8D8', '#D4B896', '#B8A0C8'];
function getSpineColor(id) {
  const s = String(id).replace('p', '');
  return SPINE_COLORS[[...s].reduce((acc, c) => acc + c.charCodeAt(0), 0) % SPINE_COLORS.length];
}
const getMatchSpineColor = getSpineColor;

// ── 발견 탭 렌더링 · 매칭 그리드 · 보관함 ────────────
window.renderDiscoverTab = function () {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  // Apply discover filters if active
  const _dfActive = window._dfAgeMin !== null || window._dfAgeMax !== null || (window._dfRoles && window._dfRoles.length) || window._dfMaxDist < 200;
  let remaining = browseQueue;
  if (_dfActive) {
    const _amin = window._dfAgeMin ?? targetDecadeRange.min;
    const _amax = window._dfAgeMax ?? targetDecadeRange.max;
    remaining = browseQueue.filter(item => {
      const p = item.profile;
      const age = getAge(p.birthYear);
      // Map age to decade index
      let aidx = 0;
      if (age < 23) aidx = 0; else if (age < 27) aidx = 1; else if (age < 30) aidx = 2;
      else if (age < 33) aidx = 3; else if (age < 37) aidx = 4; else if (age < 40) aidx = 5;
      else if (age < 43) aidx = 6; else if (age < 47) aidx = 7; else if (age < 50) aidx = 8;
      else aidx = 9;
      if (aidx < _amin || aidx > _amax) return false;
      if (window._dfRoles && window._dfRoles.length && !window._dfRoles.includes('none')) {
        const pRole = getRoleCode(p.role);
        if (!pRole || !window._dfRoles.includes(pRole)) return false;
      }
      if (window._dfMaxDist < 200) {
        const d = getDistanceKm(p);
        // 거리를 모르면 이 조건으로 거르지 않는다. 위치 미설정 유저가
        // 슬라이더를 건드렸다는 이유로 빈 화면을 보면 안 된다.
        if (d !== null && d > window._dfMaxDist) return false;
      }
      return true;
    });
  }

  const weeklyUndecided = dailyProfiles.filter(p => !(pagedSet?.has(p.id) ?? false) && !(passedSet?.has(p.id) ?? false)).length;
  let headerHTML = `<div class="tab-header">${getTabHeaderHTML('발견', '가치관, 취향이 맞는 사람을 만나보세요', `
    <span style="font-size:12px; font-weight:600; color:#9B72CC; background:rgba(155,114,204,0.1); border-radius:20px; padding:4px 10px;">이번 주 ${weeklyUndecided}권 남음</span>
    <button onclick="window.openDiscoverFilterSheet()" style="background: none; border: none; cursor: pointer; border-radius:50%; width:40px; height:40px; color: ${_dfActive ? '#fff' : '#9B72CC'}; background:${_dfActive ? '#9B72CC' : 'none'}; display:flex; align-items:center; justify-content:center; transition: background 0.2s;">
      <i data-lucide="sliders-horizontal" style="width: 22px; height: 22px;"></i>
    </button>
    <button onclick="window.openLibraryPage()" style="background: none; border: none; cursor: pointer; border-radius:50%; width:40px; height:40px; color: #9B72CC; display:flex; align-items:center; justify-content:center; transition: background 0.2s;">
      <i data-lucide="library" style="width: 24px; height: 24px;"></i>
    </button>
  `)}</div>`;

  if (_dfActive && remaining.length === 0) {
    contentArea.innerHTML = `
      ${headerHTML}
      <div class="discover-tab-container" style="align-items:center;text-align:center;height:calc(100vh - 100px); height:calc(100dvh - 100px);overflow-y:auto;padding-bottom:32px;">
        <i data-lucide="search-x" style="width:48px;height:48px;color:var(--text-muted);opacity:0.5;margin-bottom:24px;margin-top:40px;"></i>
        <p style="font-size:17px;font-weight:700;margin-bottom:8px;">필터 조건에 맞는<br>프로필이 없어요</p>
        <p style="color:#8E8E8A;font-size:14px;margin-bottom:24px;">조건을 조정해보세요</p>
        <button onclick="window.openDiscoverFilterSheet()" style="border:1.5px solid #9B72CC;color:#9B72CC;background:transparent;border-radius:24px;padding:10px 28px;font-size:14px;font-family:inherit;cursor:pointer;">필터 수정</button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // 위치 조회는 여기서 한 번만 시작된다. 결과가 늦게 오면 그때 다시 그린다.
  ensureUserRegion();
  const bridgeMeetups = shouldShowMeetupBridge() ? getBridgeMeetups() : [];
  const hasBridge = bridgeMeetups.length > 0;

  if (remaining.length === 0 && !hasBridge) {
    // Check if any undecided cards from original 6 remain
    const undecidedInPool = dailyProfiles.filter(p => !(pagedSet?.has(p.id) ?? false) && !(passedSet?.has(p.id) ?? false));
    const allDone = undecidedInPool.length === 0;

    const nextMondayStr = getNextMondayKSTStr();
    const viewedList = window.weeklyViewedProfiles || [];

    const viewedListHTML = viewedList.length > 0 ? `
      <div class="revisit-list">
        <h3 class="revisit-title">이번 주 프로필북 다시보기</h3>
        ${viewedList.map(item => {
          const vp = item.profile || {};
          const vpId = parseInt(String(item.id).replace('p', ''), 10);
          if (!Number.isFinite(vpId)) return '';
          const state = window.getBookState(item.id);
          const line = (vp.bio || '').trim();
          const stateLabel = state === 'paged' ? '좋아요를 보낸 프로필북'
            : state === 'closed' ? '덮은 프로필북, 눌러서 되돌릴 수 있어요'
            : '';
          const mark = state === 'paged'
            ? '<span class="revisit-mark revisit-mark--paged" aria-hidden="true">♥</span>'
            : state === 'closed'
              ? '<span class="revisit-mark revisit-mark--closed" aria-hidden="true">책 덮음</span>'
              : '';
          return `<div class="revisit-row is-${state}" role="button" tabindex="0"
              aria-label="${(vp.name || '이름 없음')}${stateLabel ? ', ' + stateLabel : ''}"
              onclick="handleCardClick(${vpId})">
            <div class="revisit-avatar" style="background-image:url('${vp.image}');"></div>
            <div class="revisit-text">
              <div class="revisit-name">${vp.name || '이름 없음'}</div>
              ${line ? `<div class="revisit-line">${line}</div>` : ''}
            </div>
            ${mark}
            <i data-lucide="chevron-right" class="revisit-chevron" aria-hidden="true"></i>
          </div>`;
        }).join('')}
      </div>
    ` : '';

    contentArea.innerHTML = `
        ${headerHTML}
        <div class="discover-tab-container" id="discover-empty-state" style="align-items: center; text-align: center; height: calc(100vh - 100px); height: calc(100dvh - 100px); overflow-y:auto; padding-bottom:32px;">
          <i data-lucide="moon" style="width: 48px; height: 48px; color: var(--text-muted); opacity: 0.5; margin-bottom: 24px; margin-top: 32px;"></i>
          <p style="margin-bottom: 6px; font-size: 20px; font-weight: 700;">이번 주 프로필북을 모두 읽었어요.</p>
          <p style="color: #8E8E8A; margin-bottom: 4px; font-size: 15px;">다음 월요일에 새로운 프로필북이 도착해요</p>
          <p style="color: #9B72CC; font-size:14px; font-weight:600; margin-bottom:0;">${nextMondayStr}</p>

          ${P_QURATED_ENABLED ? `
          <div class="p-qurated-promo-card" style="margin-top:24px;">
            <div style="font-size: 14px; font-weight: 700; color: #9B72CC; margin-bottom: 6px;">p.Qurated</div>
            <div style="font-size: 13px; color: #888; margin-bottom: 12px; line-height: 1.4;">Q가 당신에게 딱 맞는 사람을 소개해드려요.</div>
            <div onclick="window.openQuratedPage()" style="font-size: 13px; font-weight: 700; color: #9B72CC; cursor: pointer;">자세히 보기</div>
          </div>
          ` : ''}

          ${viewedListHTML}
          ${getTabWatermarkHTML()}
        </div>
      `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  let html = `
      ${headerHTML}
      <div class="discover-tab-container">
        <div class="stack-wrapper" id="stack-wrapper">
    `;

  // 브릿지 카드는 늘 맨 뒤에 깔린다. 앞의 프로필북을 한 장씩 넘기다 보면
  // 마지막에 자연스럽게 올라오고, 그 지점이 스택의 끝이다.
  // 모임 하나당 풀사이즈 카드 하나. 프로필북 뒤에 순서대로(마감 임박순) 깔려,
  // 한 장씩 스와이프해 넘기는 감각이 프로필북과 같아진다.
  const stackItems = [
    ...remaining,
    ...bridgeMeetups.map(m => ({ id: `__bridge_${m.id}__`, type: 'bridge', meetup: m })),
  ];

  const displayCount = Math.min(stackItems.length, 4);
  for (let i = displayCount - 1; i >= 0; i--) {
    const item = stackItems[i];
    const levelClass = `level-${i}`;

    if (item.type === 'bridge') {
      html += getMeetupBridgeCardHTML(item.meetup, levelClass, i === 0);
      continue;
    }

    const p = item.profile;
    const distanceLabel = formatDistanceLabel(p);

    const isPaged = pagedSet?.has(item.id) ?? false;
    const isPassed = passedSet?.has(item.id) ?? false;

    const pagedIndicator = isPaged ? '<div class="paged-indicator">♥</div>' : '';

    // Defensive Quote Selection: Pick a random answer or fallback to bio
    let quote = "";
    const answersDict = p.answers || {};
    const answerKeys = Object.keys(answersDict);
    if (answerKeys.length > 0) {
      const randomKey = answerKeys[Math.floor(Math.random() * answerKeys.length)];
      const ans = answersDict[randomKey];
      quote = (typeof ans === 'object' && ans.text) ? formatAnswerText(ans.text) : (typeof ans === 'string' ? ans : "");
    }
    if (!quote) quote = p.bio || "";

    
    html += `
        <div class="book-card ${levelClass}" data-id="${item.id}" id="card-${item.id}" style="filter: ${isPassed ? 'grayscale(100%)' : 'none'};">
          ${pagedIndicator}
          <div style="position:absolute; left:0; top:0; bottom:0; width:10px; z-index:5; border-radius:6px 0 0 6px; background:linear-gradient(to right, ${getSpineColor(item.id)}CC, ${getSpineColor(item.id)}FF, ${getSpineColor(item.id)}88);">
            <div style="position:absolute; left:3px; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.3);"></div>
          </div>
          <div class="book-cover-content">
            <div class="book-meta-bar">
              <span class="book-meta-no">No. ${getAge(p.birthYear)}</span>
              <span class="book-meta-facts">
                <span class="book-meta-dist">${distanceLabel}</span>
                <span class="book-meta-role">${getRoleShort(p.role)}</span>
              </span>
            </div>
            <div class="book-spacer-top"></div>
            <div class="book-title">${p.name}</div>
            <div class="book-spacer-flex"></div>
            <div class="book-quote">" ${quote} "</div>
          </div>
          <div class="book-bg-photo" style="background-image: url('${p.image}')"></div>
          <div class="book-overlay"></div>
          ${i === 0 ? `<button type="button" class="close-book-link" aria-label="${p.name} 책 덮기 — 다시 보이지 않게 하기" onclick="event.stopPropagation(); window.confirmCloseBook('${item.id}')">책 덮기</button>` : ''}
        </div>
      `;
  }

  const frontItem = stackItems[0];
  const likeTarget = frontItem && frontItem.type !== 'bridge' ? frontItem : null;

  html += `
        </div>

        ${likeTarget ? `
          <button type="button" class="discover-like-fab" id="discover-like-fab"
            aria-label="${likeTarget.profile.name}에게 마음 보내기"
            onclick="window.pageFromCard('${likeTarget.id}')">
            <i data-lucide="heart" class="discover-like-icon" aria-hidden="true"></i>
          </button>
        ` : ''}

        <div class="paged-heart-overlay" id="paged-heart-overlay">
          <i data-lucide="heart" fill="#9B72CC" style="color:#9B72CC; width:48px; height:48px;"></i>
          <span class="paged-heart-text">Paged ♥</span>
        </div>
        ${getTabWatermarkHTML()}
      </div>
    `;

  contentArea.innerHTML = html;
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const frontCard = document.querySelector('.book-card.level-0');
  if (frontCard) {
    // 브릿지 카드도 넘길 수 있다 — 그 뒤에 소진 화면이 이어진다. 다만 표지를
    // 눌러도 프로필은 열리지 않는다. 그 위의 버튼만 동작한다.
    initStackGestures(frontCard);
    if (!frontCard.classList.contains('bridge-card')) {
      frontCard.addEventListener('click', (e) => {
        const id = frontCard.dataset.id.replace('p', '');
        handleCardClick(parseInt(id));
      });
    }
  }
};

window.openAllMatchesGrid = function () {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  let gridHTML = '';
  if (MATCHED_PROFILES.length === 0) {
    gridHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; text-align:center; height:60vh;">
        <p style="font-size:15px; color:#2C2C2A; font-weight:600; margin-bottom:8px;">아직 매칭된 프로필북이 없어요</p>
      </div>
    `;
  } else {
    gridHTML = `
      <div style="display:grid; grid-template-columns:repeat(2,1fr); column-gap:12px; row-gap:16px; padding:0 20px 40px;">
        ${MATCHED_PROFILES.map((match, idx) => {
      const p = MOCK_PROFILES.find(pr => pr.id === match.id);
      const _spineColor = getMatchSpineColor(match.id);
      const distanceLabel = formatDistanceLabel(p);
      const age = p ? getAge(p.birthYear) : '';
      const _answers = match.answers || [];
      const _randomAnswer = _answers.length ? _answers[Math.floor(Math.random() * _answers.length)] : '';
      return `
            <div onclick="openMatchIntroModal(${match.id}, false, 'grid')" class="saved-book-cover" style="box-shadow:-2px 0 4px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.2); border-left:3px solid ${_spineColor};">
              <div class="book-bg-photo" style="background-image:url('${p ? p.image : match.image}'); filter:blur(1.5px); transform:scale(1.08);"></div>
              <div class="book-overlay"></div>
              <div style="position:absolute; top:0; left:0; width:100%; height:40%; background:linear-gradient(to bottom, rgba(0,0,0,0.4), transparent); z-index:3;"></div>
              <div style="position:absolute; bottom:0; left:0; width:100%; height:35%; background:linear-gradient(to top, rgba(0,0,0,0.4), transparent); z-index:3;"></div>
              <div style="position:absolute; top:0; left:0; width:100%; display:flex; justify-content:space-between; padding:10px 8px; box-sizing:border-box; z-index:4;">
                <span style="font-size:10px; color:#fff; font-family:'Jost',sans-serif; font-weight:300;">No.${age}</span>
                <span style="font-size:10px; color:#fff; font-family:'Jost',sans-serif; font-weight:300;">${distanceLabel}</span>
              </div>
              <div class="thumbnail-card-content">
                <div class="thumbnail-nickname" style="top:30%; transform:translateY(-50%);">${p ? p.name : match.name}</div>
              </div>
              ${_randomAnswer ? `<div style="position:absolute; bottom:14px; left:0; width:100%; padding:0 8px; box-sizing:border-box; z-index:4; text-align:center;"><div style="font-size:10px; color:rgba(255,255,255,0.75); font-style:italic; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">"${_randomAnswer}"</div></div>` : ''}
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  contentArea.innerHTML = `
    <div class="app-header" style="background:var(--bg-color);">
      <button class="back-btn" onclick="switchTab('messages')"><i data-lucide="chevron-left" style="width:28px;"></i></button>
      <div style="flex:1; text-align:center; font-size:16px; font-weight:700;">매칭된 프로필북</div>
      <div style="width:48px;"></div>
    </div>
    <div class="scroll-y" style="height:calc(100vh - 140px); height:calc(100dvh - 140px - var(--safe-top)); padding-top:20px;">
      ${gridHTML}
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.renderSavedBox = function () {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  const savedProfiles = savedBooks.map(item => item.profile);

  let gridHTML = '';
  if (savedProfiles.length === 0) {
    gridHTML = `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px; text-align:center; height:60vh;">
          <i data-lucide="heart" style="width:48px; height:48px; color:#EEE; margin-bottom:16px;"></i>
          <p style="font-size:15px; color:#2C2C2A; font-weight:600; margin-bottom:8px;">아직 담은 프로필북이 없어요</p>
          <p style="font-size:13px; color:#8E8E8A;">마음에 드는 분께 Page her를 눌러보세요</p>
        </div>
      `;
  } else {
    gridHTML = `
        <div class="saved-grid">
          ${savedProfiles.map(p => {
      const spineColor = getSpineColor(p.id);
      const distanceLabel = formatDistanceLabel(p);
      return `
              <div class="saved-book-cover" onclick="handleCardClick(${p.id})">
                <div class="book-spine" style="background: linear-gradient(to right, ${spineColor}, rgba(0,0,0,0.15))"></div>
                <div class="thumbnail-card-content">
                  <div class="thumbnail-nickname">${p.name}</div>
                  <div class="thumbnail-info">${getAge(p.birthYear)} ・ ${distanceLabel}</div>
                </div>
                <div class="book-bg-photo" style="background-image: url('${p.image}')"></div>
                <div class="book-overlay"></div>
              </div>
            `;
    }).join('')}
        </div>
      `;
  }

  contentArea.innerHTML = `
      <div class="app-header">
        <button class="icon-btn" onclick="renderDiscoverTab()" style="background:none; border:none; color:#2C2C2A;">
          <i data-lucide="chevron-left" style="width:28px; height:28px;"></i>
        </button>
        <h2 style="margin:0; flex:1; text-align:center; margin-left:8px;">보관함</h2>
        <button class="icon-btn" style="background:none; border:none; color:#9B72CC;">
          <i data-lucide="heart" fill="#9B72CC" style="width:24px;"></i>
        </button>
      </div>
      <div class="scroll-y" style="height: calc(100vh - 140px); height: calc(100dvh - 140px - var(--safe-top)); padding-top: 20px;">
        ${gridHTML}
      </div>
    `;

  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ── iOS standalone viewport-height priming ─────────────────────
// 별개의 WebKit 버그: standalone 홈 화면 앱 콜드 런치 시 `100dvh`가
// 첫 레이아웃에서 실제 화면 크기와 다르게 잡히고, 이후 자연히(또는 실제
// 리사이즈가 있어야) 맞게 재계산된다. env(safe-area-inset-top)과 달리
// dvh는 우리가 흉내낸 스크롤로 재계산이 보장되지 않는 별도 메커니즘이라,
// 애초에 CSS dvh에 기대지 않고 JS가 실측한 값을 px로 박아 넣는다.
// 스플래시는 로드 첫 순간(dvh가 아직 안정되기 전)에 뜨는 유일한 화면이라
// 이 버그의 영향을 가장 먼저/가장 크게 받는다 — 온보딩은 그 사이 dvh가
// 스스로 안정될 시간을 벌어서 멀쩡해 보였을 뿐, #app-container 자체의
// 문제였다.
// 이 스크립트 태그는 body 최하단에 있어 document.body는 이미 존재하므로
// DOMContentLoaded를 기다리지 않고 첫 페인트 전에 곧바로 실행한다.

// ══════════════════════════════════════════════════════════════
// 플랫폼 · 인증 · 앱 시작
// 레이아웃 동기화, Safe Area, Supabase 인증, startApp
// ══════════════════════════════════════════════════════════════

function syncAppHeight() {
  const h = Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight);
  document.documentElement.style.setProperty('--app-vh', h + 'px');
}
syncAppHeight();
window.addEventListener('resize', syncAppHeight);
window.addEventListener('orientationchange', () => setTimeout(syncAppHeight, 100));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncAppHeight);
}

// ── iOS standalone safe-area priming ──────────────────────────
// WebKit 버그: 홈 화면 앱(standalone + black-translucent)에서
// env(safe-area-inset-top)이 첫 페인트엔 0으로 잡히고 한 박자 뒤에야
// 실제 값으로 재계산된다. 예전엔 window.scrollTo()로 스크롤을 흉내내
// 재계산을 "유발"하려 했지만, 실기기에서 확인해보니 프로그래매틱 스크롤은
// WebKit의 내부 재계산 파이프라인을 타지 않는다 — 사용자가 손가락으로
// 직접 스크롤할 때만 값이 갱신됐다. 그래서 억지로 트리거하는 대신,
// WebKit이 스스로 값을 확정할 때까지 매 프레임 프로브를 다시 읽고
// 기다리는 방식으로 바꾼다.

// ── Safe Area 측정 · 적용 ────────────────────────
let safeAreaProbe = null;

// env()를 그대로 높이로 쓰는 숨은 프로브. --safe-top을 참조하지 않으므로
// JS가 써넣은 값에 영향받지 않고 항상 브라우저의 원값을 읽는다.
function measureSafeAreaTop() {
  if (!safeAreaProbe || !safeAreaProbe.isConnected) {
    safeAreaProbe = document.createElement('div');
    safeAreaProbe.setAttribute('aria-hidden', 'true');
    safeAreaProbe.style.cssText =
      'position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;' +
      'height:env(safe-area-inset-top, 0px);';
    document.body.appendChild(safeAreaProbe);
  }
  return safeAreaProbe.getBoundingClientRect().height;
}

let lastSafeTop = -1;

function applySafeAreaTop(top) {
  if (top === lastSafeTop) return;
  lastSafeTop = top;
  if (top > 0) {
    document.documentElement.style.setProperty('--safe-top', top + 'px');
  } else {
    // 가로 모드나 일반 Safari처럼 실제로 0인 경우 — CSS 기본값에 돌려준다.
    document.documentElement.style.removeProperty('--safe-top');
  }
}

// 이벤트 콜백용 단발 측정 — resize/visualViewport 이벤트는 이미 실제
// 지오메트리 변화에 반응해 발화하는 것이므로 한 번만 읽어도 충분하다.
function syncSafeAreaTop() {
  applySafeAreaTop(measureSafeAreaTop());
}

// 연속 몇 프레임 동안 값이 안 바뀌어야 "안정됐다"로 본다. WebKit이 값을
// 고쳐 쓰는 도중엔 프레임마다 흔들릴 수 있어 1프레임 일치만으론 부족하다.
const SAFE_AREA_STABLE_FRAMES = 6;
// 이 프레임 수를 넘기면 더 기다리지 않고 그 시점 값으로 확정한다
// (rAF가 느린 기기/저전력 모드에서도 무한정 폴링하지 않도록).
const SAFE_AREA_MAX_FRAMES = 180;

let safeAreaPolling = false;

function pollSafeAreaUntilStable() {
  if (safeAreaPolling) return;
  safeAreaPolling = true;

  let frame = 0;
  let stableCount = 0;
  let prevValue = -1;
  let finished = false;

  function finish(value) {
    if (finished) return;
    finished = true;
    applySafeAreaTop(value);
    safeAreaPolling = false;
  }

  function tick() {
    if (finished) return;
    const value = measureSafeAreaTop();
    if (value === prevValue) {
      stableCount++;
    } else {
      stableCount = 0;
      prevValue = value;
    }

    if (stableCount >= SAFE_AREA_STABLE_FRAMES || frame >= SAFE_AREA_MAX_FRAMES) {
      finish(value);
      return;
    }

    frame++;
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  // rAF는 스펙상 탭/앱이 비가시 상태면 아예 멈출 수 있다(백그라운드에서
  // 콜드 런치되는 경우 등). 그래도 무한정 멈춰있지 않도록, rAF와 무관한
  // 시간 기반 워치독으로 최소한 그 시점까지의 측정값을 확정한다.
  setTimeout(() => finish(measureSafeAreaTop()), 3000);
}

// 앱이 백그라운드 상태로 열려 rAF가 멈춰 있었을 경우, 다시 보이게 되는
// 시점에 한 번 더 폴링한다.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') pollSafeAreaUntilStable();
});

function primeSafeArea() {
  syncAppHeight();
  syncSafeAreaTop();
  pollSafeAreaUntilStable();
}

document.addEventListener('DOMContentLoaded', primeSafeArea);
window.addEventListener('pageshow', primeSafeArea);
window.addEventListener('resize', () => { syncAppHeight(); syncSafeAreaTop(); });
window.addEventListener('orientationchange', () => setTimeout(() => { syncAppHeight(); pollSafeAreaUntilStable(); }, 100));
if (window.visualViewport) {
  // WebKit이 안쪽에서 스스로 안전영역을 재계산하는 시점을 가장 직접적으로
  // 포착하는 신호 — 사용자의 실제 스크롤/제스처로 값이 바뀌면 여기서 잡힌다.
  window.visualViewport.addEventListener('resize', () => { syncAppHeight(); syncSafeAreaTop(); });
  window.visualViewport.addEventListener('scroll', syncSafeAreaTop);
}

// ── Auth / Onboarding Gate (Supabase) — skeleton only ────────────────
// No UI here: locked screens / popups get their real layout in a later pass.
// Everything below fails open (treats the user as authenticated /
// basic-info-complete) whenever window.supabaseClient isn't configured,
// so the existing mock-data demo flow keeps working untouched until a
// real Supabase project is wired up via env-config.js.

// ── Supabase 인증 — 세션 · 유저 row · 초대코드 사용 ────
window.currentAuthUser = null;  // Supabase auth user, once signed in
window.currentUserRow = null;   // matching row from the `users` table
window.basicInfoComplete = true; // local mirror of users.basic_info_complete, checked synchronously by the tab gate

// ── Invite code validation ───────────────────────────────────────────
// The invite the signup flow has already validated: { code, ownerUserId }.
// ownerUserId is captured here rather than re-queried later on purpose —
// invite_codes is readable only by its owner under RLS, so a signing-up user
// gets an empty result from a direct SELECT. validate_invite_code() runs
// SECURITY DEFINER and hands the owner back, which is the only way the new
// user can learn who invited them.
window.pendingInvite = null;

const PENDING_INVITE_KEY = 'sp_pending_invite';

function rememberPendingInvite(invite) {
  window.pendingInvite = invite;
  try {
    if (invite) window.sessionStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite));
    else window.sessionStorage.removeItem(PENDING_INVITE_KEY);
  } catch (e) { /* storage unavailable */ }
}

// Survives a reload partway through onboarding.
window.getPendingInvite = function () {
  if (window.pendingInvite) return window.pendingInvite;
  try {
    const raw = window.sessionStorage.getItem(PENDING_INVITE_KEY);
    if (raw) window.pendingInvite = JSON.parse(raw);
  } catch (e) { /* storage unavailable or corrupt */ }
  return window.pendingInvite;
};

// Codes are stored uppercase (8 hex chars), so normalise what the user types.
window.normalizeInviteCode = function (raw) {
  return String(raw || '').trim().toUpperCase();
};

// Returns { valid, ownerUserId, reason?, error? }.
// validate_invite_code returns a JSON object: { valid: bool, owner_user_id?: uuid }.
// It is true only for a code that is activated, unexpired and unused.
window.validateInviteCode = async function (rawCode) {
  const code = window.normalizeInviteCode(rawCode);
  if (!code) return { valid: false, ownerUserId: null };

  const sb = window.supabaseClient;
  if (!sb) {
    // Never pass without checking. A missing backend is a deployment fault,
    // not a demo mode — reported as 'no-client' so the caller can say so
    // rather than blaming the code the user typed.
    console.error('[invite] Supabase client unavailable — cannot validate invite code.');
    return { valid: false, ownerUserId: null, reason: 'no-client' };
  }

  const { data, error } = await sb.rpc('validate_invite_code', { input_code: code });
  if (error) {
    console.error(
      '[invite] validate_invite_code failed\n' +
      `  message: ${error.message}\n` +
      `  code:    ${error.code ?? '(none)'}`,
      error
    );
    return { valid: false, ownerUserId: null, error };
  }

  return { valid: data?.valid === true, ownerUserId: data?.owner_user_id || null };
};

// Ensures a `users` row exists for this auth user; returns the row (existing or newly created).
// `invite` is the validated { code, ownerUserId } pair, not a raw URL parameter.
async function ensureUserRow(authUser, invite) {
  const sb = window.supabaseClient;
  if (!sb || !authUser) return null;

  const { data: existing, error: fetchErr } = await sb
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (fetchErr) {
    console.error('ensureUserRow: fetch failed', fetchErr);
    return null;
  }
  if (existing) return existing;

  const { data: created, error: insertErr } = await sb
    .from('users')
    .insert({
      id: authUser.id,
      phone: null,
      invite_code_used: invite?.code || null,
      invited_by: null, // filled in by redeemInviteForUser once the code is burned
      basic_info_complete: false,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('ensureUserRow: insert failed', insertErr);
    return null;
  }

  // Redeem only after the row exists — invite_codes.used_by is an FK to users.id.
  if (invite?.code) await redeemInviteForUser(created, invite);
  return created;
}

// Burns the invite code and records who invited this user.
async function redeemInviteForUser(userRow, invite) {
  const sb = window.supabaseClient;
  if (!sb || !userRow || !invite?.code) return;

  const { data: redeemed, error } = await sb.rpc('redeem_invite_code', {
    input_code: invite.code,
    new_user_id: userRow.id,
  });

  if (error) {
    console.error('[invite] redeem_invite_code failed', error);
    return;
  }
  if (redeemed !== true) {
    // Someone else used it, or it expired between validation and signup.
    console.warn('[invite] code was no longer redeemable:', invite.code);
    return;
  }

  if (!invite.ownerUserId) {
    console.warn('[invite] redeemed but no owner captured; invited_by left null');
    return;
  }

  const { error: linkErr } = await sb
    .from('users')
    .update({ invited_by: invite.ownerUserId })
    .eq('id', userRow.id);

  if (linkErr) {
    console.error('[invite] invited_by update failed', linkErr);
    return;
  }
  userRow.invited_by = invite.ownerUserId;
  rememberPendingInvite(null); // consumed
}

// Called once at splash time to decide where the flow should resume.
// Returns one of: 'complete' | 'signed-in-incomplete' | 'signed-out' | 'no-client' | 'error'.
async function resumeExistingSession() {
  const sb = window.supabaseClient;
  if (!sb) return { status: 'no-client' };

  if (DISABLE_PERSISTENCE) {
    try { await sb.auth.signOut(); } catch (e) { /* no session to clear, ignore */ }
    return { status: 'signed-out' };
  }

  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return { status: 'signed-out' };

    window.currentAuthUser = session.user;
    window.currentUserRow = await ensureUserRow(session.user, window.getPendingInvite());

    if (window.currentUserRow?.nickname) userName = window.currentUserRow.nickname;
    window.basicInfoComplete = !!window.currentUserRow?.basic_info_complete;

    return { status: window.basicInfoComplete ? 'complete' : 'signed-in-incomplete' };
  } catch (err) {
    console.error('resumeExistingSession failed', err);
    return { status: 'error' };
  }
}

// "PASS 인증" button handler — existing markup/design untouched, only the
// click behavior changes: it now performs a real anonymous Supabase sign-in.
window.confirmIdentity = async function (btn) {
  const sb = window.supabaseClient;
  if (!sb) {
    // Previously this faked a successful 인증 and walked on to onboarding-1,
    // which let anyone through whenever the config was broken. There is no
    // sign-in to fake here — stop.
    console.error(
      '[auth] Supabase client unavailable — cannot sign in. ' +
      'Check that env-config.js is deployed and loads before supabase-client.js.'
    );
    showFatalError('서비스에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
    return;
  }

  const originalLabel = btn.innerHTML;
  btn.disabled = true;

  try {
    const invite = window.getPendingInvite();
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) throw error;

    window.currentAuthUser = data.user;
    window.currentUserRow = await ensureUserRow(data.user, invite);
    window.basicInfoComplete = !!window.currentUserRow?.basic_info_complete;

    btn.innerHTML = '인증 완료 ✓';
    btn.style.borderColor = '#4CAF50';
    btn.style.color = '#4CAF50';
    setTimeout(() => navigateTo('onboarding-1'), 1000);
  } catch (err) {
    // No alert() — it hides the only useful information. Everything the
    // Supabase auth API actually returned goes to the console instead.
    console.error(
      '[auth] signInAnonymously failed\n' +
      `  message: ${err?.message ?? String(err)}\n` +
      `  status:  ${err?.status ?? '(none)'}\n` +
      `  code:    ${err?.code ?? err?.error_code ?? '(none)'}\n` +
      '  hint:    "anonymous_provider_disabled" means Anonymous Sign-Ins are off in\n' +
      '           Supabase Dashboard → Authentication → Sign In / Providers.',
      err
    );

    // Inline, non-blocking feedback so the screen still reacts to the tap.
    btn.disabled = false;
    btn.innerHTML = '인증 실패 — 다시 시도';
    btn.style.borderColor = '#E05B5B';
    btn.style.color = '#E05B5B';
    setTimeout(() => {
      btn.innerHTML = originalLabel;
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2500);
  }
};

// Nickname screen "다음" — persists users.nickname, then proceeds as before.
window.confirmNickname = async function () {
  const sb = window.supabaseClient;
  if (sb && window.currentAuthUser && userName) {
    const { error } = await sb.from('users').update({ nickname: userName }).eq('id', window.currentAuthUser.id);
    if (error) console.error('nickname update failed', error);
    else if (window.currentUserRow) window.currentUserRow.nickname = userName;
  }
  navigateTo('onboarding-2');
};

// Marks the "1차 작성" (profile-setup-1~6, chapter questions excluded) as
// done — flips users.basic_info_complete, which the tab gate reads.
async function markBasicInfoComplete() {
  window.basicInfoComplete = true; // unlock tabs immediately; DB write below is best-effort
  const sb = window.supabaseClient;
  if (!sb || !window.currentAuthUser) return;

  const { error } = await sb
    .from('users')
    .update({ basic_info_complete: true })
    .eq('id', window.currentAuthUser.id);

  if (error) {
    console.error('basic_info_complete update failed', error);
    return;
  }
  if (window.currentUserRow) window.currentUserRow.basic_info_complete = true;
}

// Terminal failure screen. Covers everything and offers only a retry — there
// is no degraded mode to fall back to, so nothing behind it should stay usable.
window.showFatalError = function (message) {
  stopInviteCountdown();

  const existing = document.getElementById('fatal-error-screen');
  if (existing) existing.remove();

  const screen = document.createElement('div');
  screen.id = 'fatal-error-screen';
  screen.className = 'fatal-error-screen';
  screen.innerHTML = `
    <div class="fatal-error-card">
      <div class="fatal-error-icon">🌙</div>
      <p class="fatal-error-text">${message}</p>
      <button class="fatal-error-btn" onclick="window.location.reload()">다시 시도</button>
    </div>
  `;
  document.body.appendChild(screen);
};

// ── 앱 시작 (startApp) · 슬라이더 셋업 ────────
function startApp() {
  if (!appContainer) return;

  // 온보딩 도중 새로고침해도 성향·연애 상태·seeking_intent·위치가 남아 있게 한다.
  restoreOnboardingChoices();
  restoreUserLocation();
  restoreMyAnswers();
  restoreBlocks();
  restoreMyMeetups();
  restoreMeetupJoins();

  // Kick off the session check in parallel with the splash animation so
  // it's already resolved by the time doTransition fires.
  const sessionCheckPromise = resumeExistingSession().catch((err) => {
    console.error('resumeExistingSession failed', err);
    return { status: 'error' };
  });

  const splash = createScreen('splash', `
  <!-- Book spine: text reads top→bottom (writing-mode: vertical-lr) -->
  <div class="splash-spine">
    <span class="splash-spine-logo">p<svg viewBox="0 0 24 24" width="8" height="8" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:baseline;position:relative;top:-1px;left:-4px;transform:rotate(135deg);margin:0 1px;"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#C89FDB"/></svg>2</span>
    <span class="splash-spine-tagline" style="font-weight:600;">On the same page</span>
    <span class="splash-spine-studio" style="font-weight:600;">Versatile Studio</span>
  </div>

  <!-- Book cover: 3-zone flex column -->
  <div class="splash-cover">
    <!-- TOP: tagline -->
    <div class="splash-tagline-top" style="font-weight:600;">On the same page</div>
    <!-- CENTER: logo, fills remaining height -->
    <div class="splash-logo-wrap">
      <div class="cover-logo">p<svg class="logo-heart" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:baseline;position:relative;top:4px;left:-3px;transform:rotate(45deg);margin:0 1px;"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#E2FF74"/></svg>2</div>
    </div>
    <!-- BOTTOM: studio -->
    <div class="splash-studio" style="font-weight:600;">Versatile<br>Studio</div>
  </div>
`);
  splash.classList.add('active');
  splash.classList.remove('hidden-right');
  appContainer.appendChild(splash);

  let transitioned = false;
  const doTransition = () => {
    if (transitioned) return;
    transitioned = true;
    if (SKIP_ONBOARDING) {
      navigateTo('main');
      setTimeout(() => switchTab('discover'), 300);
      return;
    }
    sessionCheckPromise.then((result) => {
      if (result.status === 'complete') {
        // Fully onboarded, returning user — skip onboarding entirely.
        navigateTo('main');
        setTimeout(() => switchTab('discover'), 300);
      } else if (result.status === 'signed-in-incomplete') {
        // Already authenticated but hasn't finished onboarding —
        // skip the auth screen specifically, resume where they left off.
        navigateTo('onboarding-1');
      } else if (result.status === 'no-client') {
        // Deliberately no mock-demo fallback: without a backend the invite
        // gate and PASS 인증 can't be enforced, so failing loudly beats
        // silently letting anyone walk into onboarding.
        showFatalError('서비스에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
        console.error('[app] Supabase client unavailable — check env-config.js deployment.');
      } else {
        // signed-out / error — fresh start, invite gate first.
        navigateTo('onboarding-invite');
      }
    });
  };

  setTimeout(doTransition, 2200);
  splash.addEventListener('click', doTransition);
}

document.addEventListener('DOMContentLoaded', startApp);

function setupRangeSlider(defaultMin, defaultMax) {
  const track = document.getElementById('range-track');
  const fill = document.getElementById('range-fill');
  const hMin = document.getElementById('handle-min');
  const hMax = document.getElementById('handle-max');
  const display = document.getElementById('range-val');

  if (!track) return;

  const minVal = 20;
  const maxVal = 60;
  const range = maxVal - minVal;

  let currentMin = defaultMin;
  let currentMax = defaultMax;

  const updateUI = () => {
    const pMin = ((currentMin - minVal) / range) * 100;
    const pMax = ((currentMax - minVal) / range) * 100;
    hMin.style.left = pMin + '%';
    hMax.style.left = pMax + '%';
    fill.style.left = pMin + '%';
    fill.style.width = (pMax - pMin) + '%';
    display.innerText = `${currentMin}세 ~ ${currentMax}세`;
    targetAgeRange.min = currentMin;
    targetAgeRange.max = currentMax;
  };

  const handleDrag = (e, isMax) => {
    const rect = track.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    let p = Math.max(0, Math.min(100, (x / rect.width) * 100));
    let val = Math.round(minVal + (p / 100) * range);

    if (isMax) {
      if (val < currentMin + 1) val = currentMin + 1;
      currentMax = val;
    } else {
      if (val > currentMax - 1) val = currentMax - 1;
      currentMin = val;
    }
    updateUI();
  };

  hMin.onmousedown = (e) => {
    document.onmousemove = (ev) => handleDrag(ev, false);
    document.onmouseup = () => document.onmousemove = null;
  };
  hMax.onmousedown = (e) => {
    document.onmousemove = (ev) => handleDrag(ev, true);
    document.onmouseup = () => document.onmousemove = null;
  };

  hMin.ontouchmove = (e) => handleDrag(e, false);
  hMax.ontouchmove = (e) => handleDrag(e, true);

  updateUI();
}

function setupDecadeSlider(userPoint) {
  const track = document.getElementById('decade-track');
  const fill = document.getElementById('decade-fill');
  const hMin = document.getElementById('handle-min');
  const hMax = document.getElementById('handle-max');
  const marker = document.getElementById('user-marker');
  const display = document.getElementById('decade-val-display');

  if (!track) return;

  const numPoints = DECADE_POINTS.length;
  marker.style.left = (userPoint / (numPoints - 1)) * 100 + '%';

  let currentMinIdx = targetDecadeRange.min;
  let currentMaxIdx = targetDecadeRange.max;

  const updateUI = () => {
    const pMin = (currentMinIdx / (numPoints - 1)) * 100;
    const pMax = (currentMaxIdx / (numPoints - 1)) * 100;
    hMin.style.left = pMin + '%';
    hMax.style.left = pMax + '%';
    fill.style.left = pMin + '%';
    fill.style.width = (pMax - pMin) + '%';
    display.innerText = `${DECADE_POINTS[currentMinIdx]} ~ ${DECADE_POINTS[currentMaxIdx]}`;
    targetDecadeRange.min = currentMinIdx;
    targetDecadeRange.max = currentMaxIdx;
  };

  const handleDrag = (e, isMax, handleEl) => {
    const rect = track.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    let p = Math.max(0, Math.min(100, (x / rect.width) * 100));
    let idx = Math.round((p / 100) * (numPoints - 1));

    if (isMax) {
      if (idx < currentMinIdx + 1) idx = currentMinIdx + 1;
      if (idx !== currentMaxIdx) {
        currentMaxIdx = idx;
        pulseHandle(handleEl);
      }
    } else {
      if (idx > currentMaxIdx - 1) idx = currentMaxIdx - 1;
      if (idx !== currentMinIdx) {
        currentMinIdx = idx;
        pulseHandle(handleEl);
      }
    }
    updateUI();
  };

  const pulseHandle = (el) => {
    el.classList.add('snapping');
    setTimeout(() => el.classList.remove('snapping'), 80);
  }

  hMin.onmousedown = (e) => {
    document.onmousemove = (ev) => handleDrag(ev, false, hMin);
    document.onmouseup = () => document.onmousemove = null;
  };
  hMax.onmousedown = (e) => {
    document.onmousemove = (ev) => handleDrag(ev, true, hMax);
    document.onmouseup = () => document.onmousemove = null;
  };

  hMin.ontouchmove = (e) => handleDrag(e, false, hMin);
  hMax.ontouchmove = (e) => handleDrag(e, true, hMax);

  updateUI();
}

// ── Invite cards (Supabase-backed) ───────────────────────────────────
// invite_codes rows are provisioned per user by the backend (10 per user, on
// users INSERT), so the client never mints a code — it only activates one.
// Card state is always derived from the row, never stored locally:
//   idle     activated_at === null                        → "사용하기"
//   active   activated && now < expires_at && !used_by     → countdown + share
//   expired  everything else (used OR timed out, same UI)  → disabled

// ══════════════════════════════════════════════════════════════
// 초대장 · 라이브러리 · 그 외 페이지
// 초대 슬롯, 라이브러리, p.Qurated, 필터 시트, 토스트
// ══════════════════════════════════════════════════════════════

const INVITE_SLOT_COUNT = 10;
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

// Derived from wherever the app is actually being served, so invite links work
// both under a sub-path (GitHub Pages: https://host/same-page) and at a root
// domain (Vercel et al.) without a build-time constant to keep in sync. A
// trailing slash or an explicit index.html is stripped so the shared link is
// the bare entry point — it never carries the code.
const INVITE_BASE_URL = (() => {
  const loc = (typeof window !== 'undefined' && window.location) || null;
  if (!loc || typeof loc.origin !== 'string') {
    // No DOM (SSR, bare node, a jsdom without a URL) — links fall back to
    // relative, which is useless for sharing but must not throw at load time.
    console.warn('[invite] window.location unavailable; invite links will be relative');
    return '';
  }
  return loc.origin + String(loc.pathname || '').replace(/\/(index\.html?)?$/, '');
})();

window.inviteCardStates = [];

window.getInviteCardState = function (row, nowMs) {
  if (!row || !row.code) return 'empty';
  if (!row.activated_at) return 'idle';
  const expiresMs = row.expires_at ? Date.parse(row.expires_at) : 0;
  if (!row.used_by && nowMs < expiresMs) return 'active';
  return 'expired';
};

// The plain entry point, with no code attached. The code only ever travels in
// the message body, so opening the link can never auto-fill or auto-advance
// anything — the invitee has to enter it deliberately.
window.buildInviteLink = function () {
  return INVITE_BASE_URL;
};

// "23시간 59분 남음" / "12분 남음" / "곧 만료돼요"
window.formatInviteRemaining = function (expiresAt, nowMs) {
  const remaining = Date.parse(expiresAt) - nowMs;
  if (!(remaining > 0)) return '만료됨';
  const totalMinutes = Math.floor(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  if (minutes > 0) return `${minutes}분 남음`;
  return '곧 만료돼요';
};

window.loadInviteCards = async function () {
  const sb = window.supabaseClient;
  if (!sb || !window.currentAuthUser) {
    // Silent here once meant the whole page rendered as empty "준비 중" slots
    // with nothing in the console to explain it — say which half is missing.
    console.warn(
      '[invite] loadInviteCards called with no session — ' +
      `supabaseClient: ${sb ? 'ok' : 'missing'}, window.currentAuthUser: ${window.currentAuthUser ? 'ok' : 'null'}`
    );
    window.inviteCardStates = [];
    return { error: 'no-session' };
  }

  const { data, error } = await sb
    .from('invite_codes')
    .select('code, activated_at, expires_at, used_by, used_at')
    .eq('owner_user_id', window.currentAuthUser.id)
    // Sort by the primary key, not created_at: the seeding trigger inserts all
    // 10 rows in one statement so their created_at values are identical, and a
    // tied sort key lets Postgres reorder rows freely — an activated row moves
    // to the end of the heap, so the card appeared to jump slots after a tap.
    .order('code', { ascending: true });

  if (error) {
    console.error('[invite] failed to load invite_codes', error);
    window.inviteCardStates = [];
    return { error };
  }

  window.inviteCardStates = (data || []).slice(0, INVITE_SLOT_COUNT);
  if (window.inviteCardStates.length < INVITE_SLOT_COUNT) {
    console.warn(`[invite] expected ${INVITE_SLOT_COUNT} codes, got ${window.inviteCardStates.length}`);
  }
  return { data: window.inviteCardStates };
};

const INVITE_EXPIRY_NOTE = '발급 후 24시간 안에 입력해주세요.';

// The code lives in the message body and nowhere else — the link is just the
// front door — so the text has to say plainly what to do with it.
window.buildInviteShareText = function (code) {
  return `같은 페이지를 찾는 공간, p.2에 초대할게요 💜\n\n초대코드: ${code}\n\n앱을 열고 이 코드를 입력하면 가입할 수 있어요.\n${INVITE_EXPIRY_NOTE}`;
};

// The clipboard has no separate url field, so the link is appended to the text.
window.buildInviteClipboardText = function (code) {
  return `${window.buildInviteShareText(code)}\n\n${window.buildInviteLink()}`;
};

// Copies the invite text, or explains why it couldn't. The clipboard API only
// exists in a secure context, so plain http on a LAN IP has no navigator.clipboard
// at all — that reads as a dead button unless we say so.
async function copyInviteText(text) {
  if (!navigator.clipboard) {
    console.error(
      '[invite] navigator.clipboard is unavailable — this page is not a secure context.\n' +
      `  origin: ${location.origin}\n` +
      '  fix:    serve over https, or use http://localhost instead of a LAN IP.'
    );
    window.showToast('복사는 https에서만 돼요');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    window.showToast('링크가 복사됐어요');
    return true;
  } catch (err) {
    console.error(`[invite] clipboard write failed (origin: ${location.origin})`, err);
    window.showToast('복사에 실패했어요 · https에서만 지원돼요');
    return false;
  }
}

window.shareInvite = async function (code) {
  if (!code) {
    console.warn('[invite] shareInvite called with no code — the card has no invite_codes row');
    return;
  }
  const url = window.buildInviteLink();

  if (navigator.share) {
    try {
      await navigator.share({ text: window.buildInviteShareText(code), url });
      return; // actually shared — don't also copy
    } catch (err) {
      // AbortError means either "the user dismissed the sheet" or "the sheet
      // never opened" (desktop Chrome with no share target throws the same
      // thing). Those are indistinguishable here, so fall through to the
      // clipboard instead of leaving the tap with no visible effect.
      console.warn('[invite] navigator.share did not complete; falling back to clipboard', err);
    }
  }

  await copyInviteText(window.buildInviteClipboardText(code));
};

// Ticks the countdown on active cards without re-rendering the whole page.
function startInviteCountdown() {
  stopInviteCountdown();
  window._inviteCountdownTimer = setInterval(() => {
    const nodes = document.querySelectorAll('[data-invite-expires]');
    if (!nodes.length) { stopInviteCountdown(); return; }
    const nowMs = Date.now();
    let anyExpired = false;
    nodes.forEach(node => {
      const expiresAt = node.getAttribute('data-invite-expires');
      if (Date.parse(expiresAt) <= nowMs) anyExpired = true;
      node.textContent = window.formatInviteRemaining(expiresAt, nowMs);
    });
    // A card just crossed its expiry — re-derive states from the rows.
    if (anyExpired) window.renderInvitePage();
  }, 1000);
}

function stopInviteCountdown() {
  if (window._inviteCountdownTimer) {
    clearInterval(window._inviteCountdownTimer);
    window._inviteCountdownTimer = null;
  }
}

const _inviteOrdSuffix = n => { const v = n % 100; return n + (['th','st','nd','rd'][(v-20)%10] || ['th','st','nd','rd'][v] || 'th'); };

// One slot's markup, keyed by index so a single card can be swapped in place
// without redrawing the grid around it. The root element carries
// data-invite-slot, which is what refreshInviteCardSlot looks up.
function buildInviteCardHTML(card, i, nowMs) {
  const num = i + 1;
  const state = window.getInviteCardState(card, nowMs);

  if (state === 'expired') {
    return `
      <div class="invite-card-slot state-used" data-invite-slot="${i}">
        <div class="envelope-flap envelope-flap-top"></div>
        <div class="envelope-flap envelope-flap-bottom"></div>
        <div class="envelope-content">
          <div style="letter-spacing:0.2em; color:rgba(255,255,255,0.6); font-size:13px; font-weight:600;">${card.used_by ? 'INVITED' : 'EXPIRED'}</div>
          <div class="invite-circle">
            <i data-lucide="heart" style="width:20px; height:20px; color:#999;"></i>
          </div>
          <div style="color:#888; font-size:13px; font-family:monospace;">${card.code}</div>
          <div style="color:#999; font-size:12px;">만료됨</div>
        </div>
      </div>
    `;
  }

  if (state === 'active') {
    return `
      <div class="invite-card-slot state-active" data-invite-slot="${i}">
        <div class="invite-inner-card">
          <div class="invite-inner-label">INVITATION</div>
          <div class="invite-code">${card.code}</div>
          <div class="invite-timer" data-invite-expires="${card.expires_at}">${window.formatInviteRemaining(card.expires_at, nowMs)}</div>
        </div>
        <div class="invite-actions">
          <button class="invite-btn-share" onclick="event.stopPropagation(); window.shareInvite('${card.code}'); return false;">공유하기</button>
        </div>
      </div>
    `;
  }

  if (state === 'idle') {
    return `
      <div class="invite-card-slot state-unused" data-invite-slot="${i}">
        <div class="envelope-flap envelope-flap-top"></div>
        <div class="envelope-flap envelope-flap-bottom"></div>
        <div class="envelope-content">
          <div class="invite-number">${_inviteOrdSuffix(num)} Invitation</div>
          <div class="invite-circle">
            <i data-lucide="heart" style="width:20px; height:20px; color:#9B7FD4;"></i>
          </div>
          <button class="use-invite-btn" onclick="window.activateInvite(${i})">사용하기</button>
        </div>
      </div>
    `;
  }

  // No row for this slot.
  return `
    <div class="invite-card-slot state-unused" data-invite-slot="${i}" style="opacity:0.45;">
      <div class="envelope-flap envelope-flap-top"></div>
      <div class="envelope-flap envelope-flap-bottom"></div>
      <div class="envelope-content">
        <div class="invite-number">${_inviteOrdSuffix(num)} Invitation</div>
        <div class="invite-circle">
          <i data-lucide="heart" style="width:20px; height:20px; color:#CCC;"></i>
        </div>
        <button class="use-invite-btn" disabled style="opacity:0.5; cursor:default;">준비 중</button>
      </div>
    </div>
  `;
}

// Redraws exactly one card from its current row. Everything else on the page —
// the other nine slots, the summary bar, the scroll position — is left alone,
// which is what stops the whole screen from flashing on 사용하기.
// Returns false when the slot isn't on screen, so callers can fall back.
window.refreshInviteCardSlot = function (index) {
  const slot = document.querySelector(`[data-invite-slot="${index}"]`);
  if (!slot) return false;

  slot.outerHTML = buildInviteCardHTML(window.inviteCardStates[index] || null, index, Date.now());
  if (typeof lucide !== 'undefined') lucide.createIcons();
  // The replacement may have introduced (or removed) the only countdown node.
  startInviteCountdown();
  return true;
};

window.openInvitePage = async function () {
  const mc = getModalContainer();

  window.renderInvitePage = function () {
    const nowMs = Date.now();
    const rows = window.inviteCardStates;
    const usedCount = rows.filter(r => r.used_by).length;
    const progressPercent = (usedCount / INVITE_SLOT_COUNT) * 100;

    // Always draw 10 slots; any missing row renders as an inert placeholder.
    const cardsHTML = Array.from({ length: INVITE_SLOT_COUNT }, (_, i) =>
      buildInviteCardHTML(rows[i] || null, i, nowMs)
    ).join('');

    mc.innerHTML = `
      <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color);">
         <div class="app-header" style="background:var(--bg-color);">
           <button class="back-btn" onclick="closeModal()"><i data-lucide="chevron-left" style="width:28px;"></i></button>
           <div style="font-weight: 700; font-size: 16px;">초대장</div>
           <div style="width: 48px;"></div>
         </div>
         
         <div class="scroll-y" style="padding: 16px 20px 40px;">
           <!-- Top Summary -->
           <div class="invite-summary-bar">
             <div class="invite-count-text">초대한 친구 <span>${usedCount}</span> / 10</div>
             <div class="invite-progress-bg">
               <div class="invite-progress-fill" style="width: ${progressPercent}%;"></div>
             </div>
           </div>
           
           <!-- Invite Grid -->
           <div class="invite-slots-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:16px;">
             ${cardsHTML}
           </div>
           
           <!-- Bottom Notice -->
           <div class="invite-notice-text">
             · 초대장은 1인당 최대 10장입니다<br>
             · 발급 후 24시간 이내 사용 가능합니다<br>
             · 한번 발급된 코드는 재사용이 불가합니다<br>
             · 초대코드 없이는 가입이 불가합니다
           </div>
         </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    startInviteCountdown();
  };

  window.renderInvitePage();       // paint the shell immediately
  await window.loadInviteCards();  // then fill it from the backend
  window.renderInvitePage();
};

// Activates an existing invite_codes row — the code itself is never generated
// client-side. The `.is('activated_at', null)` filter makes a double tap (or a
// stale card) a no-op instead of resetting a live countdown.
window.activateInvite = async function (index) {
  const sb = window.supabaseClient;
  const card = window.inviteCardStates[index];
  if (!card?.code) return;

  if (!sb) {
    console.warn('[invite] no Supabase client; cannot activate invite code');
    window.showToast('지금은 초대장을 발급할 수 없어요');
    return;
  }

  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt.getTime() + INVITE_TTL_MS);

  const { data, error } = await sb
    .from('invite_codes')
    .update({
      activated_at: activatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('code', card.code)
    .is('activated_at', null)
    .select();

  if (error) {
    console.error('[invite] activation failed', error);
    window.showToast('초대장 발급에 실패했어요');
    return;
  }

  if (!data || data.length === 0) {
    // Already activated elsewhere — our copy of the row is stale, so this is
    // the one case that has to go back to the backend and redraw everything.
    console.warn('[invite] code was already activated:', card.code);
    await window.loadInviteCards();
    window.renderInvitePage();
    return;
  }

  // The update returned the row it wrote, so the new state is already in hand:
  // patch this one card and swap only its DOM node. No refetch, no full
  // re-render, no flash across the other nine slots.
  const updated = data[0];
  window.inviteCardStates[index] = {
    ...card,
    activated_at: updated.activated_at,
    expires_at: updated.expires_at,
    used_by: updated.used_by ?? card.used_by,
    used_at: updated.used_at ?? card.used_at,
  };

  // A false return means the page was closed mid-request. The state is already
  // updated, so the next open renders it correctly — repainting here would just
  // pop the closed modal back up.
  window.refreshInviteCardSlot(index);
};

// ── 라이브러리 페이지 ────────────────────────────────────────
window.openLibraryPage = function () {
  const mc = getModalContainer();

  // 다시보기: past-week profiles (ids 6-10)
  const reviewProfiles = [6, 7, 8, 9, 10]
    .map(id => MOCK_PROFILES.find(p => p.id === id)).filter(Boolean);

  // 받은 ♥: people who liked the user — first is unblurred teaser
  const likedProfiles = [12, 11, 13, 4]
    .map(id => MOCK_PROFILES.find(p => p.id === id)).filter(Boolean);

  function reviewCardHTML(p) {
    const sc = getSpineColor(p.id);
    const age = getAge(p.birthYear);
    const bio = p.bio || '';
    return `
      <div class="saved-book-cover" onclick="handleCardClick(${p.id})"
           style="border-radius:12px; box-shadow:-2px 0 4px rgba(0,0,0,0.1), 0 4px 14px rgba(0,0,0,0.15);">
        <div class="book-spine" style="background:linear-gradient(to right,${sc}CC,${sc}66); width:8px;"></div>
        <div class="book-bg-photo" style="background-image:url('${p.image}'); filter:blur(1.5px); transform:scale(1.05);"></div>
        <div class="book-overlay"></div>
        <div style="position:absolute;top:0;left:0;width:100%;height:45%;background:linear-gradient(to bottom,rgba(0,0,0,0.35),transparent);z-index:3;"></div>
        <div style="position:absolute;bottom:0;left:0;width:100%;height:55%;background:linear-gradient(to top,rgba(0,0,0,0.65),transparent);z-index:3;"></div>
        <div onclick="event.stopPropagation();window._openPlus2Prompt()"
             style="position:absolute;top:8px;left:12px;z-index:6;background:rgba(155,114,204,0.75);backdrop-filter:blur(4px);border-radius:20px;padding:4px 9px;cursor:pointer;">
          <span style="font-size:10px;color:#fff;font-weight:600;">되살리기 🔒</span>
        </div>
        <div style="position:absolute;top:8px;right:8px;z-index:6;background:rgba(0,0,0,0.45);border-radius:20px;padding:2px 7px;">
          <span style="font-size:9px;color:#E2FF74;font-weight:700;letter-spacing:0.04em;">p.2+</span>
        </div>
        <div style="position:absolute;bottom:${bio ? '30px' : '12px'};left:0;width:100%;padding:0 10px 0 14px;box-sizing:border-box;z-index:4;">
          <div style="font-size:15px;font-weight:700;color:#fff;">${p.name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.75);margin-top:1px;">${age}세 · 서울</div>
        </div>
        ${bio ? `<div style="position:absolute;bottom:10px;left:14px;right:10px;z-index:4;font-size:10px;color:rgba(255,255,255,0.55);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">"${bio}"</div>` : ''}
      </div>`;
  }

  function likedCardHTML(p, isTeaser) {
    const sc = getSpineColor(p.id);
    const age = getAge(p.birthYear);
    if (isTeaser) {
      return `
        <div class="saved-book-cover" onclick="handleCardClick(${p.id})"
             style="border-radius:12px; box-shadow:-2px 0 4px rgba(0,0,0,0.1), 0 4px 14px rgba(0,0,0,0.15);">
          <div class="book-spine" style="background:linear-gradient(to right,${sc}CC,${sc}66); width:8px;"></div>
          <div class="book-bg-photo" style="background-image:url('${p.image}'); filter:none; transform:none;"></div>
          <div class="book-overlay"></div>
          <div style="position:absolute;top:0;left:0;width:100%;height:45%;background:linear-gradient(to bottom,rgba(0,0,0,0.3),transparent);z-index:3;"></div>
          <div style="position:absolute;bottom:0;left:0;width:100%;height:55%;background:linear-gradient(to top,rgba(0,0,0,0.6),transparent);z-index:3;"></div>
          <div style="position:absolute;top:8px;left:12px;z-index:6;background:rgba(226,255,116,0.88);border-radius:20px;padding:3px 9px;">
            <span style="font-size:9px;color:#2C2C2A;font-weight:700;">p.2+ 미리보기</span>
          </div>
          <div style="position:absolute;top:8px;right:10px;z-index:6;font-size:14px;color:#ff6b9d;">♥</div>
          <div style="position:absolute;bottom:12px;left:0;width:100%;padding:0 10px 0 14px;box-sizing:border-box;z-index:4;">
            <div style="font-size:15px;font-weight:700;color:#fff;">${p.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.75);margin-top:1px;">${age}세 · 서울</div>
          </div>
        </div>`;
    }
    return `
      <div class="saved-book-cover" onclick="window._openPlus2Prompt()"
           style="border-radius:12px; box-shadow:-2px 0 4px rgba(0,0,0,0.1), 0 4px 14px rgba(0,0,0,0.15); cursor:pointer;">
        <div class="book-spine" style="background:linear-gradient(to right,${sc}CC,${sc}66); width:8px;"></div>
        <div class="book-bg-photo" style="background-image:url('${p.image}'); filter:blur(8px); transform:scale(1.15);"></div>
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.2);z-index:2;"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:5;">
          <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);border-radius:14px;padding:14px 18px;text-align:center;backdrop-filter:blur(6px);">
            <div style="font-size:18px;margin-bottom:4px;">🔒</div>
            <div style="font-size:11px;font-weight:700;color:#E2FF74;margin-bottom:3px;">p.2+</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.75);">구독 시 확인 가능</div>
          </div>
        </div>
      </div>`;
  }

  function renderTabContent(tab) {
    if (tab === 'review') {
      if (!reviewProfiles.length) {
        return `<div style="display:flex;align-items:center;justify-content:center;height:50vh;color:var(--text-muted);font-size:14px;">아직 지나간 프로필북이 없어요</div>`;
      }
      return `
        <div style="font-size:12px;color:var(--text-muted);padding:10px 20px 8px;">지난주 프로필북 · 되살리기는 p.2+ 필요</div>
        <div class="lib-grid">${reviewProfiles.map(p => reviewCardHTML(p)).join('')}</div>`;
    } else {
      if (!likedProfiles.length) {
        return `<div style="display:flex;align-items:center;justify-content:center;height:50vh;color:var(--text-muted);font-size:14px;">아직 받은 ♥가 없어요</div>`;
      }
      return `
        <div style="font-size:12px;color:var(--text-muted);padding:10px 20px 8px;">나를 Page한 사람 · p.2+ 구독으로 모두 확인</div>
        <div class="lib-grid">${likedProfiles.map((p, i) => likedCardHTML(p, i === 0)).join('')}</div>`;
    }
  }

  window._switchLibTab = function (tab) {
    document.getElementById('lib-tab-review').classList.toggle('active', tab === 'review');
    document.getElementById('lib-tab-liked').classList.toggle('active', tab === 'liked');
    document.getElementById('lib-content').innerHTML = renderTabContent(tab);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window._openPlus2Prompt = function () {
    const existingBackdrop = document.getElementById('lib-plus2-backdrop');
    const existingSheet = document.getElementById('lib-plus2-sheet');
    if (existingBackdrop) existingBackdrop.remove();
    if (existingSheet) existingSheet.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'lib-plus2-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:8999;background:rgba(0,0,0,0.35);';
    backdrop.onclick = () => { backdrop.remove(); document.getElementById('lib-plus2-sheet')?.remove(); };

    const sheet = document.createElement('div');
    sheet.id = 'lib-plus2-sheet';
    sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9000;background:#FFF;border-radius:20px 20px 0 0;padding:24px 24px 44px;box-shadow:0 -8px 32px rgba(0,0,0,0.15);animation:sheetUp 0.25s ease-out;';
    sheet.innerHTML = `
      <div style="width:36px;height:4px;background:#E8E8E8;border-radius:4px;margin:0 auto 22px;"></div>
      <div style="font-size:18px;font-weight:700;color:#2C2C2A;margin-bottom:8px;">되살리기는 p.2+ 기능이에요</div>
      <div style="font-size:14px;color:#888;line-height:1.7;margin-bottom:20px;">지나간 프로필북을 다시 Page할 수 있어요.<br>나를 Page한 사람도 모두 확인할 수 있어요.</div>
      <div style="background:#F5EFFE;border-radius:12px;padding:16px;margin-bottom:18px;">
        <div style="font-size:11px;font-weight:700;color:#9B72CC;margin-bottom:8px;letter-spacing:0.06em;">P.2+ 혜택</div>
        <div style="font-size:13px;color:#555;line-height:2;">나를 Page한 사람 모두 보기<br>지나간 프로필북 되살리기<br>광고 제거</div>
      </div>
      <div style="font-size:12px;color:#AAA;text-align:center;margin-bottom:16px;">₩5,900 / 주 &nbsp;·&nbsp; ₩17,900 / 월 &nbsp;·&nbsp; ₩39,900 / 3개월</div>
      <button onclick="document.getElementById('lib-plus2-sheet')?.remove(); document.getElementById('lib-plus2-backdrop')?.remove();"
              style="width:100%;padding:15px;background:#9B72CC;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">구독하기</button>
      <button onclick="document.getElementById('lib-plus2-sheet')?.remove(); document.getElementById('lib-plus2-backdrop')?.remove();"
              style="width:100%;padding:12px;background:transparent;color:#AAA;border:none;font-size:13px;cursor:pointer;font-family:inherit;margin-top:4px;">나중에</button>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
  };

  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index:2000; background:var(--bg-color);">
      <div style="padding:20px 24px 0; display:flex; align-items:center;">
        <button onclick="closeModal()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-dark);padding:0;line-height:1;">←</button>
        <span style="flex:1;text-align:center;font-weight:700;font-size:17px;">라이브러리</span>
        <span style="width:28px;"></span>
      </div>
      <div class="lib-tab-bar">
        <div id="lib-tab-liked" class="lib-tab active" onclick="window._switchLibTab('liked')">받은 ♥</div>
        <div id="lib-tab-review" class="lib-tab" onclick="window._switchLibTab('review')">다시보기</div>
      </div>
      <div id="lib-content" class="scroll-y" style="height:calc(100vh - 118px); height:calc(100dvh - 118px); padding-top:0;">
        ${renderTabContent('liked')}
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ── p.Qurated 페이지 ────────────────────────────────
window.openQuratedPage = function () {
  // 진입점을 다 껐어도 이 함수는 전역에 남아 있다. 여기서 한 번 더 막아야
  // 딥링크나 남은 핸들러로 화면이 열리는 일이 없다.
  if (!P_QURATED_ENABLED) return;

  const mc = getModalContainer();
  let selectedPlan = null;

  window.selectQuratedPlan = function (planType) {
    selectedPlan = planType;
    document.getElementById('plan-basic').classList.toggle('selected', planType === 'basic');
    document.getElementById('plan-premium').classList.toggle('selected', planType === 'premium');

    document.getElementById('btn-basic').textContent = planType === 'basic' ? '선택됨' : '선택하기';
    document.getElementById('btn-premium').textContent = planType === 'premium' ? '선택됨' : '선택하기';

    const submitBtn = document.getElementById('qurated-submit-btn');
    submitBtn.style.opacity = '1';
    submitBtn.style.pointerEvents = 'auto';
  };

  window.submitQuratedApplication = function () {
    mc.innerHTML = `
      <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color); display: flex; flex-direction: column; align-items: center; justify-content: center;">
         <div class="app-header" style="background:var(--bg-color); position: absolute; top: 0; width: 100%; padding-top: var(--safe-top);">
           <button class="back-btn" onclick="closeModal()"><i data-lucide="x" style="width:28px;"></i></button>
           <div style="font-weight: 700; font-size: 16px;"></div>
           <div style="width: 48px;"></div>
         </div>
         <div style="text-align: center;">
           <i data-lucide="check-circle" style="width: 48px; height: 48px; color: #9B72CC; margin-bottom: 16px; margin: 0 auto; display: block;"></i>
           <div style="font-size: 20px; font-weight: 700; color: #333; margin-bottom: 8px;">신청이 완료됐어요 ☺️</div>
           <div style="font-size: 15px; color: #888;">Q가 곧 연락드릴게요.</div>
         </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.isQurated = true; // Update local state
    updateUI(); // Reflect state in profile tab
  };

  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color);">
       <div class="app-header" style="background:var(--bg-color);">
         <button class="back-btn" onclick="closeModal()"><i data-lucide="chevron-left" style="width:28px;"></i></button>
         <div style="font-weight: 700; font-size: 16px;">p.Qurated</div>
         <div style="width: 48px;"></div>
       </div>
       
       <div class="scroll-y" style="padding: 24px 20px 100px;">
         
         <!-- Top Section -->
         <div class="qurated-top-section">
           <div style="font-size: 24px; font-weight: 800; color: #9B72CC; margin-bottom: 4px;">p.Qurated</div>
           <div style="font-size: 15px; color: #333; font-weight: 600; margin-bottom: 6px;">진심으로 맞는 사람을 찾고 있다면</div>
           <div style="font-size: 12px; color: #999; background: #F5F5F5; padding: 2px 8px; border-radius: 4px;">by p.2</div>
         </div>
         
         <!-- Service Intro -->
         <div style="margin: 32px 0;">
           <div style="font-size: 15px; line-height: 1.6; color: #555; text-align: center; margin-bottom: 24px;">
             Q가 당신의 프로필북을 직접 읽고<br>
             가장 잘 맞을 한 사람을 골라드려요.
           </div>
           
           <div style="display: flex; flex-direction: column; gap: 12px; background: #F8F0FC; padding: 20px; border-radius: 16px;">
             <div class="qurated-feature-row">
               <i data-lucide="sparkles" style="width: 18px; color: #9B72CC;"></i>
               <span>알고리즘이 아닌 Q가 직접 큐레이션</span>
             </div>
             <div class="qurated-feature-row">
               <i data-lucide="book-open" style="width: 18px; color: #9B72CC;"></i>
               <span>프로필북 기반의 더욱 깊이 있는 매칭</span>
             </div>
             <div class="qurated-feature-row">
               <i data-lucide="coffee" style="width: 18px; color: #9B72CC;"></i>
               <span>오프라인 만남까지 주선해드려요</span>
             </div>
           </div>
         </div>
         
         <!-- Plan Selection -->
         <div style="margin-bottom: 32px;">
           <div style="font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #333;">플랜 선택</div>
           
           <div id="plan-basic" class="qurated-plan-card" onclick="window.selectQuratedPlan('basic')">
             <div style="font-size: 18px; font-weight: 700; color: #333; margin-bottom: 4px;">Q.Edition</div>
             <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px;">월 100,000원</div>
             <ul style="padding-left: 20px; margin-bottom: 16px; font-size: 14px; color: #666; line-height: 1.6;">
               <li>주 1권 큐레이티드 프로필북</li>
               <li>오프라인 만남 월 1회 주선</li>
             </ul>
             <button id="btn-basic" style="width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #E5E5E5; background: white; color: #333; font-size: 14px; font-weight: 600; cursor: pointer;">선택하기</button>
           </div>
           
           <div id="plan-premium" class="qurated-plan-card premium" onclick="window.selectQuratedPlan('premium')">
             <div style="font-size: 18px; font-weight: 700; color: #9B72CC; margin-bottom: 4px;">Q.Edition+</div>
             <div style="font-size: 16px; font-weight: 600; color: #9B72CC; margin-bottom: 12px;">월 300,000원</div>
             <ul style="padding-left: 20px; margin-bottom: 16px; font-size: 14px; color: #666; line-height: 1.6;">
               <li>주 3권 큐레이티드 프로필북</li>
               <li>오프라인 만남 주 1회 주선</li>
             </ul>
             <button id="btn-premium" style="width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #9B72CC; background: #9B72CC; color: white; font-size: 14px; font-weight: 600; cursor: pointer;">선택하기</button>
           </div>
         </div>
         
         <!-- Bottom Notice -->
         <div style="font-size: 12px; color: #999; text-align: center; line-height: 1.5; margin-bottom: 24px;">
           신청 후 Q가 직접 연락드려요.<br>
           검토까지 영업일 기준 2~3일 소요됩니다.
         </div>
         
       </div>
       
       <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 20px; padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); background: white; border-top: 1px solid #EEE;">
         <button id="qurated-submit-btn" onclick="window.submitQuratedApplication()" style="display: block; width: 100%; padding: 16px; border-radius: 16px; background: #9B72CC; color: white; font-size: 16px; font-weight: 600; border: none; cursor: pointer; opacity: 0.5; pointer-events: none; transition: opacity 0.2s;">
           신청하기
         </button>
       </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

// ── Discover filter state ────────────────────────────────────────

// ── 발견 탭 필터 시트 ──────────────────────────────────────
window._dfAgeMin = null; // null = use onboarding default (targetDecadeRange.min)
window._dfAgeMax = null;
window._dfRoles  = null; // null = no role filter
window._dfMaxDist = 200;

window.openDiscoverFilterSheet = function () {
  const amin = window._dfAgeMin ?? targetDecadeRange.min;
  const amax = window._dfAgeMax ?? targetDecadeRange.max;
  const roles = window._dfRoles ?? (targetRoles.length ? [...targetRoles] : []);
  const dist  = window._dfMaxDist;

  const roleOptions = [
    ...ROLE_CODES.map(c => ({ key: c, label: ROLE_LABELS[c] })),
    { key: 'none', label: '상관없음' },
  ];

  const sheet = document.createElement('div');
  sheet.id = 'discover-filter-sheet';
  sheet.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;background:#fff;border-radius:20px 20px 0 0;padding:24px 24px 40px;box-sizing:border-box;z-index:600;animation:sheetUp 0.28s cubic-bezier(0.22,1,0.36,1) forwards;max-height:90%;overflow-y:auto;';
  sheet.innerHTML = `
    <div style="width:40px;height:4px;background:#E0D8F0;border-radius:2px;margin:0 auto 20px;"></div>
    <div style="font-size:16px;font-weight:700;color:#2C2C2A;margin-bottom:20px;">발견 필터</div>

    <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:8px;">선호 나이대</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span id="df-age-label" style="font-size:14px;font-weight:700;color:#9B72CC;">${DECADE_POINTS[amin]} ~ ${DECADE_POINTS[amax]}</span>
    </div>
    <div style="position:relative;height:36px;margin-bottom:4px;">
      <div style="position:absolute;top:50%;left:0;right:0;height:4px;background:#EDE0FF;border-radius:2px;transform:translateY(-50%);"></div>
      <div id="df-range-fill" style="position:absolute;top:50%;height:4px;background:#9B72CC;border-radius:2px;transform:translateY(-50%);left:${(amin/9)*100}%;right:${100-(amax/9)*100}%;"></div>
      <input type="range" id="df-min-slider" min="0" max="9" value="${amin}" step="1"
        style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:2;"
        oninput="window._dfSliderInput('min',+this.value)">
      <input type="range" id="df-max-slider" min="0" max="9" value="${amax}" step="1"
        style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:3;"
        oninput="window._dfSliderInput('max',+this.value)">
      <div id="df-thumb-min" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#9B72CC;box-shadow:0 2px 6px rgba(155,114,204,0.4);left:${(amin/9)*100}%;pointer-events:none;z-index:4;"></div>
      <div id="df-thumb-max" style="position:absolute;top:50%;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:#9B72CC;box-shadow:0 2px 6px rgba(155,114,204,0.4);left:${(amax/9)*100}%;pointer-events:none;z-index:4;"></div>
    </div>

    <div style="font-size:13px;font-weight:600;color:#555;margin-top:24px;margin-bottom:12px;">선호 성향</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px;" id="df-role-chips">
      ${roleOptions.map(r => `
        <div class="filter-chip${roles.includes(r.key) ? ' selected' : ''}" onclick="window._dfToggleRole('${r.key}')">${r.label}</div>
      `).join('')}
    </div>

    <div style="font-size:13px;font-weight:600;color:#555;margin-top:24px;margin-bottom:8px;">거리</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span id="df-dist-label" style="font-size:14px;font-weight:700;color:#9B72CC;">${dist >= 200 ? '제한 없음' : '최대 ' + dist + 'km'}</span>
    </div>
    <input type="range" id="df-dist-slider" min="0" max="200" step="10" value="${dist}"
      style="width:100%;accent-color:#9B72CC;cursor:pointer;"
      oninput="window._dfDistInput(+this.value)">
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#aaa;margin-top:2px;"><span>0km</span><span>200km+</span></div>

    <div style="display:flex;gap:10px;margin-top:28px;">
      <button onclick="window._dfReset()" style="flex:1;padding:12px;border:1.5px solid #E0D8F0;border-radius:24px;background:#fff;font-size:14px;font-family:inherit;color:#888;cursor:pointer;">초기화</button>
      <button onclick="window._dfApply()" style="flex:2;padding:12px;border:none;border-radius:24px;background:#9B72CC;font-size:14px;font-family:inherit;color:#fff;font-weight:600;cursor:pointer;">적용</button>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.id = 'discover-filter-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.35);z-index:599;';
  overlay.onclick = () => { sheet.remove(); overlay.remove(); };

  const container = document.getElementById('app-container');
  container.appendChild(overlay);
  container.appendChild(sheet);

  // Sync current state into sheet-local vars
  let _sheetMin = amin, _sheetMax = amax, _sheetRoles = [...roles], _sheetDist = dist;

  window._dfSliderInput = function (handle, val) {
    if (handle === 'min') {
      _sheetMin = Math.min(val, _sheetMax);
      document.getElementById('df-min-slider').value = _sheetMin;
    } else {
      _sheetMax = Math.max(val, _sheetMin);
      document.getElementById('df-max-slider').value = _sheetMax;
    }
    document.getElementById('df-age-label').textContent = `${DECADE_POINTS[_sheetMin]} ~ ${DECADE_POINTS[_sheetMax]}`;
    document.getElementById('df-thumb-min').style.left = `${(_sheetMin/9)*100}%`;
    document.getElementById('df-thumb-max').style.left = `${(_sheetMax/9)*100}%`;
    document.getElementById('df-range-fill').style.left = `${(_sheetMin/9)*100}%`;
    document.getElementById('df-range-fill').style.right = `${100-(_sheetMax/9)*100}%`;
  };

  window._dfToggleRole = function (key) {
    if (_sheetRoles.includes(key)) {
      _sheetRoles = _sheetRoles.filter(r => r !== key);
    } else {
      _sheetRoles.push(key);
    }
    // Re-render chips cleanly
    document.getElementById('df-role-chips').innerHTML = roleOptions.map(r =>
      `<div class="filter-chip${_sheetRoles.includes(r.key) ? ' selected' : ''}" onclick="window._dfToggleRole('${r.key}')">${r.label}</div>`
    ).join('');
  };

  window._dfDistInput = function (val) {
    _sheetDist = val;
    document.getElementById('df-dist-label').textContent = val >= 200 ? '제한 없음' : `최대 ${val}km`;
  };

  window._dfReset = function () {
    _sheetMin = targetDecadeRange.min;
    _sheetMax = targetDecadeRange.max;
    _sheetRoles = targetRoles.length ? [...targetRoles] : [];
    _sheetDist = 200;
    window._dfAgeMin = null;
    window._dfAgeMax = null;
    window._dfRoles = null;
    window._dfMaxDist = 200;
    sheet.remove(); overlay.remove();
    renderDiscoverTab();
  };

  window._dfApply = function () {
    window._dfAgeMin = _sheetMin;
    window._dfAgeMax = _sheetMax;
    window._dfRoles = _sheetRoles.length ? [..._sheetRoles] : null;
    window._dfMaxDist = _sheetDist;
    sheet.remove(); overlay.remove();
    renderDiscoverTab();
  };
};

// ── 토스트 · 공유 시트 ────────────────────────────────────
window.showToast = function (msg) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.style.cssText = 'position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:12px 24px; border-radius:24px; font-size:14px; font-weight:500; z-index:9999; opacity:0; transition:opacity 0.3s; pointer-events:none; white-space:nowrap;';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2500);
};

window.openMeetupShareSheet = function (meetupId) {
  let sheet = document.getElementById('share-sheet-container');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.id = 'share-sheet-container';
    document.body.appendChild(sheet);
  }
  const m = MOCK_MEETUPS.find(x => x.id === meetupId);
  if (!m) return;

  sheet.innerHTML = `
    <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:4000; display:flex; flex-direction:column; justify-content:flex-end;" onclick="this.parentNode.innerHTML=''">
      <div style="background:white; border-radius:20px 20px 0 0; padding:24px 24px 40px 24px; width:100%; animation: slideUp 0.3s ease-out;" onclick="event.stopPropagation()">
        <div style="font-size:16px; font-weight:700; margin-bottom:16px; text-align:center;">이 모임 공유하기</div>
        <div onclick="document.getElementById('share-sheet-container').innerHTML=''; window.openShareMatchSelector(${meetupId});" style="padding:16px; font-size:15px; border-bottom:1px solid #EEE; cursor:pointer;">
          💬 메시지로 공유
        </div>
        <div onclick="document.getElementById('share-sheet-container').innerHTML=''; window.shareMeetupLink(${meetupId});" style="padding:16px; font-size:15px; border-bottom:1px solid #EEE; cursor:pointer;">
          🔗 링크로 공유
        </div>
        <div onclick="document.getElementById('share-sheet-container').innerHTML=''" style="padding:16px; font-size:15px; color:#888; text-align:center; cursor:pointer; margin-top:8px;">
          취소
        </div>
      </div>
    </div>
  `;
};

window.shareMeetupLink = function (meetupId) {
  const m = MOCK_MEETUPS.find(x => x.id === meetupId);
  if (!m) return;
  if (navigator.share) {
    navigator.share({
      title: m.title,
      url: window.location.href + '?meetup=' + m.id
    }).catch(console.error);
  } else {
    window.showToast('링크가 클립보드에 복사되었습니다.');
  }
};

window.openShareMatchSelector = function (meetupId) {
  let sheet = document.getElementById('share-match-container');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.id = 'share-match-container';
    document.body.appendChild(sheet);
  }

  if (MATCHED_PROFILES.length === 0) {
    window.showToast('공유할 매칭된 프로필이 없습니다.');
    return;
  }

  sheet.innerHTML = `
    <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:4000; display:flex; flex-direction:column; justify-content:flex-end;" onclick="this.parentNode.innerHTML=''">
      <div style="background:white; border-radius:20px 20px 0 0; padding:24px 24px 40px 24px; width:100%; max-height:80vh; display:flex; flex-direction:column; animation: slideUp 0.3s ease-out;" onclick="event.stopPropagation()">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div style="font-size:16px; font-weight:700;">누구에게 공유할까요?</div>
          <button onclick="document.getElementById('share-match-container').innerHTML=''" style="background:none; border:none; padding:0; cursor:pointer;"><i data-lucide="x" style="width:24px;"></i></button>
        </div>
        <div style="flex:1; overflow-y:auto;">
          ${MATCHED_PROFILES.map(match => {
    const p = MOCK_PROFILES.find(pr => pr.id === match.id) || MOCK_PROFILES[0];
    return `
              <div onclick="document.getElementById('share-match-container').innerHTML=''; closeModal(); openMatchIntroModal(${match.id}); setTimeout(() => window.proposeMeetup(${match.id}, ${meetupId}), 300);" style="display:flex; align-items:center; padding:12px 0; border-bottom:1px solid #EEE; cursor:pointer;">
                <div style="width:40px; height:40px; border-radius:50%; background-image:url('${p.image}'); background-size:cover; background-position:center; margin-right:12px;"></div>
                <div style="flex:1; font-size:15px; font-weight:600; color:#333;">${p.name}</div>
              </div>
            `;
  }).join('')}
        </div>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};
