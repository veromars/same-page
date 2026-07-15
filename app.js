console.log('app loaded');

// Dev flag: set true to skip onboarding and jump straight to the app
const SKIP_ONBOARDING = true;
let myAnswers = window.myAnswers || window.currentUser?.answers || {};
let dailyProfiles = [];
let browseQueue = [];
let pagedSet = new Set();
let passedSet = new Set();
let savedBooks = [];
window.isQurated = false;



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

const MOCK_PROFILES = [
  {
    id: 1, name: "Heej", birthYear: 2001, role: 'V', score: "98% 매칭", tags: ["영화", "와인", "자연"],
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
    id: 2, name: "s", birthYear: 1992, role: 'F', score: "91% 매칭", tags: ["자연", "여행", "맛집"],
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
    id: 3, name: "달", birthYear: 1995, role: 'V', score: "87% 매칭", tags: ["독서", "카페", "여행"],
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
    id: 4, name: "bora", birthYear: 1998, role: 'B', score: "83% 매칭", tags: ["아트", "영화", "독서"],
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
    id: 5, name: "밍", birthYear: 2002, role: 'V', score: "79% 매칭", tags: ["음악", "아트", "카페"],
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
    id: 6, name: "jj", birthYear: 1998, role: 'V', score: "76% 매칭", tags: ["독서", "와인바", "아트갤러리"],
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
    id: 7, name: "milk", birthYear: 1995, role: 'F', score: "74% 매칭", tags: ["카페", "사진", "빈티지"],
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
    id: 8, name: "서연", birthYear: 2000, role: 'B', score: "72% 매칭", tags: ["운동", "음악", "요리"],
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
    id: 9, name: "🐶", birthYear: 1997, role: 'F', score: "70% 매칭", tags: ["재즈", "칵테일", "영화"],
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
    id: 10, name: "ssol", birthYear: 1993, role: 'V', score: "68% 매칭", tags: ["전시", "클래식", "뜨개질"],
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
    id: 11, name: "하늘", birthYear: 1999, role: 'B', score: "66% 매칭", tags: ["고양이", "게임", "만화"],
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
    id: 12, name: "ryo", birthYear: 1996, role: 'F', score: "64% 매칭", tags: ["맛집", "드라마", "쇼핑"],
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
    id: 13, name: "🌙", birthYear: 2001, role: 'V', score: "62% 매칭", tags: ["역사", "한복", "사진"],
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
    id: 14, name: "비", birthYear: 1994, role: 'F', score: "60% 매칭", tags: ["러닝", "요가", "건강식"],
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
    id: 15, name: "peach🍑", birthYear: 1998, role: 'B', score: "58% 매칭", tags: ["음악", "라이브 공연", "맥주"],
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
    id: 16, name: "zoe", birthYear: 1997, role: 'F', score: "94% 매칭", tags: ["와인", "카페", "여행"],
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
    id: 17, name: "하람", birthYear: 2000, role: 'V', score: "92% 매칭", tags: ["독서", "영화", "자연"],
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
    id: 18, name: "kira", birthYear: 1995, role: 'B', score: "89% 매칭", tags: ["여행", "맛집", "음악"],
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
    id: 19, name: "🌿", birthYear: 1998, role: 'F', score: "86% 매칭", tags: ["반려동물", "식물", "집순이"],
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
    id: 20, name: "luna", birthYear: 1993, role: 'V', score: "83% 매칭", tags: ["운동", "수영", "자연"],
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
    id: 21, name: "은유", birthYear: 1999, role: 'F', score: "81% 매칭", tags: ["카페", "디저트", "독서"],
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
    id: 22, name: "tori", birthYear: 1996, role: 'B', score: "78% 매칭", tags: ["전시", "카페", "사진"],
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
    id: 23, name: "솔아", birthYear: 2001, role: 'V', score: "75% 매칭", tags: ["음악", "악기", "공연"],
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
    id: 24, name: "nara", birthYear: 1994, role: 'F', score: "72% 매칭", tags: ["요리", "맛집", "영화"],
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
    id: 1, title: "선데이 필름나이트", date: "일요일 저녁 7시", timestamp: "2026-04-26T19:00:00",
    desc: "'타오르는 여인의 초상' 감상 후 와인 한 잔 🍷", type: "🎬 문화생활", maxCap: 6, currentCap: 6,
    hostName: "bora", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "영화와 와인을 사랑하는 큐레이터 보라입니다.",
    styleTrait: "무관", fee: "1만 5천원 (와인/간식)", tags: [],
    ageRange: "20대 후반 ~ 30대 후반",
    rules: "주류가 포함된 모임으로 과도한 음주는 자제해주세요.",
    isRecommended: true, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "마포구 (홍대)", fullAddress: "서울 마포구 와우산로 29길 26, 2층 씨네라운지",
    participants: [MOCK_PROFILES[0].image, MOCK_PROFILES[1].image, MOCK_PROFILES[2].image, MOCK_PROFILES[3].image, MOCK_PROFILES[4].image]
  },
  {
    id: 2, title: "남산 나이트 하이크", date: "금요일 저녁 8시", timestamp: "2026-04-24T20:00:00",
    desc: "초보 환영, 강아지 환영 🐾", type: "🏃 액티비티", maxCap: 10, currentCap: 7,
    hostName: "s", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "",
    styleTrait: "무관", fee: "무료", tags: [],
    ageRange: "30대 초반 ~ 40대 초반",
    rules: "편한 운동화 and 개인 생수를 지참해주세요.",
    isRecommended: false, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "용산구 (남산)", fullAddress: "서울 용산구 남산공원길 105, 북측 주차장 앞",
    participants: [MOCK_PROFILES[6].image, MOCK_PROFILES[7].image, MOCK_PROFILES[8].image, MOCK_PROFILES[9].image, MOCK_PROFILES[10].image, MOCK_PROFILES[11].image]
  },
  {
    id: 3, title: "퀴어 문학 읽기 모임", date: "4/20 월요일 오후 3시", timestamp: "2026-04-20T15:00:00",
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
    id: 4, title: "성수동 카페 브런치", date: "일요일 오전 11시", timestamp: "2026-04-26T11:00:00",
    desc: "새로 생긴 카페 같이 가요 ☕", type: "🍽️ 식도락", maxCap: 6, currentCap: 4,
    hostName: "밍", hostType: "개인", hostPublic: false, hostIsPublic: false, hostBio: "카페 투어가 취미인 밍입니다. 맛있는 브런치 먹어요!",
    styleTrait: "무관", fee: "1/N", tags: ["#일스"],
    ageRange: "20대 후반 ~ 30대 초반",
    rules: "예약 후 방문하므로 노쇼는 절대 금지입니다.",
    isRecommended: true, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "성동구 (성수)", fullAddress: "서울 성동구 연무장길 11, 카페 모노",
    participants: [MOCK_PROFILES[18].image, MOCK_PROFILES[19].image, MOCK_PROFILES[20].image]
  },
  {
    id: 5, title: "이쪽 바에서 칵테일 한 잔 🍸", date: "5/2 토요일 저녁 9시", timestamp: "2026-05-02T21:00:00",
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
    id: 7, title: "FC빠세 🌈 주말 풋살", date: "이번주 토요일 오전 10시", timestamp: "2026-04-25T10:00:00",
    desc: "실력 무관, 처음이어도 환영해요! 함께 뛰고 땀 흘리고 밥 먹어요 ⚽ 운동화와 긍정 에너지만 챙겨오세요.",
    type: "🏃 액티비티", maxCap: 12, currentCap: 8,
    hostName: "FC빠세", hostType: "단체", hostIsPublic: false, hostLogo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100",
    hostBio: "레즈비언 & 퀴어 여성 풋살 클럽",
    styleTrait: "무관", fee: "1/N (구장 대관료)", tags: ["#스타일무관"],
    ageRange: "20대 후반 ~ 30대 중반",
    rules: "운동화 필참. cleats(축구화)는 착용 불가합니다.",
    isRecommended: false, isSaved: false, hasRSVPd: false, kakaoLink: 'https://open.kakao.com/o/test', shortLocation: "마포구 (상암)", fullAddress: "서울 마포구 성산동 상암월드컵경기장 풋살구장",
    participants: [MOCK_PROFILES[1].image, MOCK_PROFILES[3].image, MOCK_PROFILES[5].image, MOCK_PROFILES[7].image, MOCK_PROFILES[9].image, MOCK_PROFILES[11].image, MOCK_PROFILES[13].image, MOCK_PROFILES[2].image]
  }
];

// Single source of truth for matched users — both messages tab and grid page reference this
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

const appContainer = document.getElementById('app-container');

// State Variables
let userName = '';
let userBirthDate = { year: 1990, month: 1, day: 1 };
const DECADE_POINTS = ['20대 초반', '20대 중반', '20대 후반', '30대 초반', '30대 중반', '30대 후반', '40대 초반', '40대 중반', '40대 후반', '50대 이상'];
let targetDecadeRange = { min: 2, max: 4 };

let userRole = null; // 'F', 'B', 'V'
let userIntent = null;
let userTags = [];
let targetAgeRange = { min: 20, max: 35 };
let targetRoles = []; // ['F', 'B', 'V']
let hasShownCTA = false;
let selectedQuizOpt = null;

// Profile Setup State
window.profileComplete = false;
window.profileIncomplete = false;
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
let userLocation = '서울';
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



let meetupFilterLocation = '전체';
let meetupFilterCategory = '전체';

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

window.confirmIdentity = function (btn) {
  btn.innerHTML = '인증 완료 ✓';
  btn.style.borderColor = '#4CAF50';
  btn.style.color = '#4CAF50';
  setTimeout(() => {
    navigateTo('onboarding-1');
  }, 1000);
}

window.selectRole = function (role, btn) {
  userRole = role;
  document.querySelectorAll('.role-pill').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
}




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

  if (screenId === 'onboarding-0') {
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
        <button class="btn-primary" onclick="navigateTo('onboarding-2')">다음 →</button>
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
          <div class="role-pill" onclick="selectRole('F', this)">F 팸</div>
          <div class="role-pill" onclick="selectRole('B', this)">B 부치</div>
          <div class="role-pill" onclick="selectRole('V', this)">V 무성향</div>
        </div>
      </div>

      <div class="bottom-action-bar">
        <button class="btn-primary" onclick="navigateTo('onboarding-3')">다음 →</button>
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
        <h1>어떤 만남을 원하나요?</h1>
        <p style="margin-bottom: 48px;">이곳에 온 목적을 알려주세요.</p>
        
        <div class="intent-option" onclick="selectIntent(this, 'friend')">친구가 생겼으면 해요 👋</div>
        <div class="intent-option" onclick="selectIntent(this, 'love')">연애를 기대해요 ❤️</div>
        <div class="intent-option" onclick="selectIntent(this, 'both')">친구, 연애 둘 다 열려 있어요 ✨</div>
      </div>
      <div class="bottom-action-bar">
        <button class="btn-primary" onclick="navigateTo('onboarding-4')">다음 →</button>
      </div>
    `);
  }
  else if (screenId === 'onboarding-4') {
    const categories = [
      { name: '문화/예술', tags: ['영화', '드라마', '음악', '아트', '전시', '공연', '사진', '독서'] },
      { name: '음식/음료', tags: ['맛집', '카페', '와인', '칵테일', '요리', '베이킹', '비건'] },
      { name: '액티비티', tags: ['자연', '여행', '운동', '등산', '러닝', '요가', '수영', '테니스', '풋살', '사이클'] },
      { name: '라이프', tags: ['반려동물', '식물', '인테리어', '패션', '뷰티', '게임'] },
      { name: '배움', tags: ['언어', '자기계발', '재테크', '글쓰기', '명상'] }
    ];

    screenElem = createScreen('onboarding-4', `
      ${getProgressBarHTML(4)}
      <div class="app-header" style="background:transparent; padding: 10px 24px;">
        <div onclick="navigateTo('onboarding-3')" style="color: var(--text-muted); font-weight: 500; cursor: pointer;">← 이전</div>
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
          <div class="role-pill-multi" onclick="toggleTargetRole(this, 'F')">F 팸</div>
          <div class="role-pill-multi" onclick="toggleTargetRole(this, 'B')">B 부치</div>
          <div class="role-pill-multi" onclick="toggleTargetRole(this, 'V')">V 무성향</div>
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
      <div class="app-header">
        <div class="app-logo">p<svg viewBox="0 0 24 24" width="12" height="12" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:baseline;position:relative;top:1px;left:-1px;transform:rotate(45deg);margin:0 1px;"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#9B72CC"/></svg>2</div>
        <button onclick="toggleNotifPanel()" style="background:none;border:none;cursor:pointer;padding:4px;position:relative;display:flex;align-items:center;">
          <i data-lucide="bell" style="width: 20px; color: var(--text-muted)"></i>
          <span id="bell-dot" style="display:none;position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;background:#E25C5C;border:1.5px solid #fff;"></span>
        </button>
      </div>
      <div id="main-content" style="flex: 1; position: relative;"></div>
      <div class="bottom-nav">
        <div class="nav-item active" data-tab="discover" onclick="switchTab('discover')"><i data-lucide="book-open"></i><span>발견</span></div>
        <div class="nav-item" data-tab="meetups" onclick="switchTab('meetups')"><i data-lucide="calendar"></i><span>모임</span></div>
        <div class="nav-item" data-tab="messages" onclick="switchTab('messages')"><i data-lucide="message-circle"></i><span>메시지</span></div>
        <div class="nav-item" data-tab="profile" onclick="switchTab('profile')"><i data-lucide="user"></i><span>나</span></div>
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

// Simple logic handlers

window.selectIntent = function (el, intent) {
  userIntent = intent;
  document.querySelectorAll('.intent-option').forEach(opt => opt.classList.remove('selected'));
  if (el) el.classList.add('selected');
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
const notifications = [];

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function addNotification(profileName) {
  notifications.unshift({ profileName, ts: Date.now() });
  updateBellDot();
}

function updateBellDot() {
  const dot = document.getElementById('bell-dot');
  if (dot) dot.style.display = notifications.length ? 'block' : 'none';
}

window.toggleNotifPanel = function () {
  let panel = document.getElementById('notif-panel');
  if (panel) { panel.remove(); return; }
  panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.className = 'notif-panel';
  panel.innerHTML = `
    <div class="notif-panel-header">알림</div>
    ${notifications.length === 0
      ? '<div class="notif-empty">아직 알림이 없어요</div>'
      : notifications.map(n => `
        <div class="notif-item">
          <span class="notif-icon">💜</span>
          <div class="notif-body">
            <div class="notif-text">누군가가 <strong>${n.profileName}</strong>님의 페이지에 ♥를 눌렀어요.</div>
            <div class="notif-time">${timeAgo(n.ts)}</div>
          </div>
        </div>`).join('')
    }
  `;
  document.querySelector('.app-header').appendChild(panel);
};

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

window.initMainApp = function () {
  navigateTo('main');
  setTimeout(() => {
    switchTab('discover');
    setTimeout(showPostOnboardingModal, 800);
  }, 300);
}

window.showPostOnboardingModal = function () {
  const container = document.getElementById('modal-container') || document.body;
  const modal = document.createElement('div');
  modal.className = 'post-onboarding-backdrop';
  modal.id = 'post-onboarding-modal';
  modal.innerHTML = `
      <div class="post-onboarding-card">
        <div class="post-onboarding-title">p.2를 시작하기 전에,</div>
        <div class="post-onboarding-sub">나를 먼저 소개해볼까요?</div>
        <button class="post-onboarding-btn" onclick="startProfileSetup()">내 프로필 작성하기</button>
        <button class="post-onboarding-link" onclick="skipProfileSetup()">나중에 하기</button>
      </div>
    `;
  container.appendChild(modal);
};

window.startProfileSetup = function () {
  dismissPostOnboardingModal();
  setTimeout(() => navigateTo('profile-setup-1'), 300);
};

window.skipProfileSetup = function () {
  window.profileIncomplete = true;
  dismissPostOnboardingModal();
};

window.showLockedProfileModal = function () {
  // Reuse the post-onboarding modal styles for consistency
  const container = document.getElementById('modal-container') || document.body;
  const modal = document.createElement('div');
  modal.className = 'post-onboarding-backdrop';
  modal.id = 'locked-profile-modal';
  modal.innerHTML = `
      <div class="post-onboarding-card">
        <div class="post-onboarding-title">프로필을 먼저 작성해주세요</div>
        <div class="post-onboarding-sub">내 프로필을 작성해야<br/>다른 사람의 프로필북을<br/>열어볼 수 있어요!</div>
        <button class="post-onboarding-btn" style="background:#E2FF74; color:#2D2A2B;" onclick="dismissLockedModal(); navigateTo('profile-setup-1');">프로필 작성하기</button>
        <button class="post-onboarding-link" onclick="dismissLockedModal()">나중에 하기</button>
      </div>
    `;
  container.appendChild(modal);
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
  window.profileIncomplete = true;
  switchTab('discover');
};

window.finalizeProfile = function () {
  window.profileComplete = true;
  window.profileIncomplete = false;
  navigateTo('main');
  setTimeout(() => {
    switchTab('profile');
  }, 300);
};

// ----------------------------------------------------
window.getRoleBadgeHTML = function (role) {
  if (!role) return '';
  return `<div class="role-badge" onclick="event.stopPropagation(); showRoleTooltip(event, '${role}')">${role}</div>`;
};

window.showRoleTooltip = function (event, role) {
  hideRoleTooltip();
  const tooltip = document.createElement('div');
  tooltip.className = 'role-tooltip';
  tooltip.id = 'role-tooltip';
  tooltip.innerText = "F 팸 · B 부치 · V 무성향";
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

    // On App Load / First Discover Visit: Fresh Start
    if (!window.isDiscoverInitialized) {
      const allProfiles = MOCK_PROFILES.map(profile => ({ id: 'p' + profile.id, type: 'profile', profile }));
      // Shuffle
      const shuffled = [...allProfiles].sort(() => Math.random() - 0.5);
      dailyProfiles = shuffled.slice(0, 6);
      browseQueue = [...dailyProfiles];
      pagedSet.clear();
      passedSet.clear();
      savedBooks.length = 0;
      window.isDiscoverInitialized = true;
    }

    renderDiscoverTab();
  } else if (tabName === 'meetups') {
    window.showSavedMeetups = false;
    contentArea.innerHTML = `
        <div class="content-padding scroll-y" style="padding-top: 10px; height: calc(100vh - 140px); background: var(--bg-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h2 style="margin:0;">모임</h2>
          <button id="meetup-collection-toggle" class="folder-heart-btn" style="background: none; border: none; cursor: pointer; border-radius:50%; width:40px; height:40px; color: #9B72CC; display:flex; align-items:center; justify-content:center; transition: background 0.2s;">
            <i data-lucide="archive" id="meetup-collection-toggle-icon" style="width: 24px; height: 24px;"></i>
          </button>
        </div>
        <p style="margin-bottom: 24px;">같은 페이지의 사람들과 함께해요.</p>
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
      </div>
      <div class="fab-add" onclick="openCreateMeetupModal()"><i data-lucide="plus" style="width:24px; height:24px; color:#FFF;"></i></div>
    `;
    renderMeetupList();
  } else if (tabName === 'messages') {
    contentArea.innerHTML = `
      <div class="message-list" style="padding-top: 10px; display: flex; flex-direction: column; height: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 24px;">
          <h2 style="margin-bottom: 8px;">메시지</h2>
          <span style="font-size: 12px; color: #9B72CC; text-decoration: underline; cursor: pointer; font-weight: 600;" onclick="triggerPostMeetingCheckin()">p.M 체크인 테스트</span>
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
      const distance = getDistance(p.id);
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
        </div>
      </div>
    `;
  } else if (tabName === 'profile') {
    const p = {
      name: userName || '나나', birthYear: userBirthDate.year || 1987, role: userRole || 'V', tags: userTags.length > 0 ? userTags : ["영화", "카페", "자연", "독서"],
      intent: userIntent === 'friend' ? '친구가 생겼으면 해요 👋' : (userIntent === 'love' ? '연애를 기대해요 ❤️' : '친구, 연애 둘 다 열려 있어요 ✨'),
      bio: "새로운 시작을 기대하며!",
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
      chapterProgress: { c1: 80, c2: 40, c3: 20 }
    };
    contentArea.innerHTML = `
      <div class="scroll-y" style="height: calc(100vh - 84px);">
        <div style="padding: 16px 24px 4px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:12px;">
            <h2 style="margin:0;">내 프로필</h2>
            <div onclick="openMyProfilePreview()" style="font-size:13px; color:#9B72CC; cursor:pointer; font-weight:500;">미리보기</div>
          </div>
          <button style="background:none; border:none; color:#9B72CC; opacity: 0.3; pointer-events: none; cursor: default; padding:4px; display:flex; align-items:center; justify-content:center;">
            <i data-lucide="settings" style="width:24px; height:24px;"></i>
          </button>
        </div>
        ${getProfileDetailedHTML(p, true)}
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initPhotoCarousels();
    initPhotoGrid();
    const gridHtml = renderAnswersGrid(MY_ANSWERS, true, 'myProfile');
    document.getElementById('my-answers-grid').innerHTML = gridHtml;
    bindCardInteractions();
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

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
    let locMatch = meetupFilterLocation === '전체' || m.fullAddress.includes(meetupFilterLocation);
    let catMatch = meetupFilterCategory === '전체' || m.type === meetupFilterCategory || m.secondaryType === meetupFilterCategory;
    return locMatch && catMatch;
  });

  if (window.showSavedMeetups) {
    filtered = MOCK_MEETUPS.filter(m => m.isSaved);
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
      const clickAction = m.linkType === 'internal'
        ? `openMeetupDetail(${m.id})`
        : (m.externalUrl ? `window.open('${m.externalUrl}', '_blank')` : `openMeetupDetail(${m.id})`);
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
            <div class="meetup-item fade-in" onclick="openMeetupDetail(${m.id})">
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
                <button class="rsvp-btn" onclick="event.stopPropagation(); openMeetupDetail(${m.id})">더 보기 →</button>
              </div>
            </div>
      `;
    }

    const capPercent = (m.currentCap / m.maxCap) * 100;
    const isEndingSoon = (m.currentCap / m.maxCap) >= 0.8 && m.currentCap < m.maxCap;
    const isFull = m.currentCap >= m.maxCap;
    return `
            <div class="meetup-item fade-in ${m.hasRSVPd ? 'meetup-item-rsvpd' : ''}" onclick="openMeetupDetail(${m.id})">
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
                  ${m.hasRSVPd ? `<span style="color:var(--primary); display:inline-flex; align-items:center;"><span style="display:inline-block; width:6px; height:6px; background:var(--primary); border-radius:50%; margin-right:6px;"></span>참여 예정</span>` : ''}
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
                ${isFull && !m.hasRSVPd ? `<button class="rsvp-btn" disabled>마감</button>` : `<button class="rsvp-btn ${m.hasRSVPd ? 'rsvpd' : ''}" onclick="event.stopPropagation(); openMeetupDetail(${m.id})">${m.hasRSVPd ? '신청 완료 ✓' : '더 보기 →'}</button>`}
              </div>
            </div>
          `;
  }).join('');
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

function getLikedBadgeHTML(pageId) {
  const isLiked = window.likedPages && window.likedPages[pageId];
  return `<span class="card-liked-badge" style="visibility: ${isLiked ? 'visible' : 'hidden'}; position: absolute; bottom: 8px; right: 8px; font-size: 10px; color: #888; pointer-events: none;">♥</span>`;
}

window.renderAnswersGrid = function (answersObj, isCurrentUser, profileId) {
  let html = '';
  const chapColors = { 1: '#F0F7D4', 2: '#F7EDE3', 3: '#EDE3F5' };
  const chap1 = QUESTIONS.filter(q => q.chapter === 1);
  const chap2 = QUESTIONS.filter(q => q.chapter === 2);
  const chap3 = QUESTIONS.filter(q => q.chapter === 3);

  const renderGroup = (group, chapTitle) => {
    let visibleQuestions = group;
    if (!isCurrentUser) visibleQuestions = group.filter(q => answersObj[q.id]);
    if (visibleQuestions.length === 0) return '';
    let gHtml = `<div class="grid-chapter-divider" style="grid-column: 1 / -1; margin-top: ${chapTitle.includes('Chapter 1') ? '0' : '24px'};">${chapTitle}</div>`;
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
            <div data-page-id="${pageId}" class="teaser-card" style="background: ${chapBg};">
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
    return gHtml;
  };
  html += renderGroup(chap1, 'Chapter 1 · 나');
  html += renderGroup(chap2, 'Chapter 2 · 사랑');
  html += renderGroup(chap3, 'Chapter 3 · 관계');

  return html;
};


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
  }
  closeModal();
  const _grid = document.getElementById('my-answers-grid');
  if (_grid) {
    renderMyProfile();
  }
}

window.renderMyProfile = function () {
  const _grid = document.getElementById('my-answers-grid');
  if (!_grid) return;
  _grid.innerHTML = renderAnswersGrid(MY_ANSWERS, true, 'myProfile');
  bindCardInteractions();
}

window.renderBasicInfoRows = function (p, isMine, isPreview = false) {
  const fields = [
    { label: '내 스타일', value: p.aboutMe?.style, required: true },
    { label: '이상형', value: p.aboutMe?.ideal, required: true },
    { label: '주량', value: p.aboutMe?.drink, required: true },
    { label: '흡연 여부', value: p.aboutMe?.smoke, required: true },
    { label: 'MBTI', value: p.aboutMe?.mbti, required: false },
    { label: '사주 일주', value: p.aboutMe?.saju, required: false },
    { label: '종교', value: p.aboutMe?.religion, required: false },
    { label: '직업군', value: p.aboutMe?.job, required: false }
  ];

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

window.getProfileDetailedHTML = function (p, isMine, isPreview = false) {
  const currentYear = 2026;
  const birthYear = p.birthYear || (currentYear - (p.age || 28) + 1);
  const age = currentYear - birthYear + 1;
  const yearSuffix = (birthYear % 100).toString().padStart(2, '0');

  // Calculate actual counts for owner
  const getChapterCount = (c) => QUESTIONS.filter(q => q.chapter === c && MY_ANSWERS[q.id]).length;
  const c1Count = getChapterCount(1);
  const c2Count = getChapterCount(2);
  const c3Count = getChapterCount(3);

  // Benefit Logic (Mocking 0 answers today for demo)
  const answersToday = 0;
  let benefitCount = 3;
  if (c1Count === 9) benefitCount++;
  if (c2Count === 9) benefitCount++;
  if (c3Count === 9) benefitCount++;
  const todayBonus = Math.min(2, Math.floor(answersToday / 3));
  benefitCount += todayBonus;

  const chapters = [
    { num: 1, label: '나', count: c1Count, pct: (c1Count / 9) * 100 },
    { num: 2, label: '사랑', count: c2Count, pct: (c2Count / 9) * 100 },
    { num: 3, label: '관계', count: c3Count, pct: (c3Count / 9) * 100 }
  ];

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
  const buildCarousel = (phs, indicator, applyBlur = false) => {
    const blurFilter = applyBlur ? 'filter:blur(0.75px);' : '';
    if (phs.length > 1) return `
    <div id="prof-carousel" style="position:relative; width:100%; height:360px; overflow:hidden;">
      ${indicator}
      <div id="prof-carousel-inner" style="display:flex; width:${phs.length * 100}%; height:100%; transition:transform 0.3s ease;">
        ${phs.map(ph => `<div style="flex:0 0 ${100 / phs.length}%; height:100%; background-image:url('${ph}'); background-size:cover; background-position:center; ${blurFilter}"></div>`).join('')}
      </div>
      <div style="position:absolute; bottom:12px; left:0; width:100%; display:flex; justify-content:center; gap:6px; z-index:5;">
        ${phs.map((_, pi) => `<div style="width:6px; height:6px; border-radius:50%; background:${pi === 0 ? '#FFF' : 'rgba(255,255,255,0.5)'}; transition:background 0.2s;" data-prof-dot="${pi}"></div>`).join('')}
      </div>
    </div>
  `;
    if (phs.length === 1) return `<div class="prof-modal-photo" style="position:relative; background-image:url('${phs[0]}'); height:360px; background-size:cover; background-position:center; ${blurFilter}">${indicator}</div>`;
    return `<div style="width:100%; height:260px; background:#F0F0EE; display:flex; align-items:center; justify-content:center;"><i data-lucide="camera" style="width:40px;height:40px;color:#C2C2C0;"></i></div>`;
  };

  const photoSectionHTML = isMine
    ? myPhotoSectionHTML
    : buildCarousel(carouselPhotos, pagedIndicatorDetail, !isPreview);

  const locationStr = p.location || userLocation;
  const locationSpan = `<span style="font-size:16px; font-weight:400; color:var(--text-muted);"> · ${locationStr}</span>`;
  const headerContent = isMine ? `${formatUserHeader(p, 'detail')}${locationSpan} ${getRoleBadgeHTML(p.role)}` :
    `${p.name} <span style="font-size:16px; font-weight:400; color:var(--text-muted);"> ${age}세 (${yearSuffix}년생) · ${locationStr}</span> ${getRoleBadgeHTML(p.role)}`;

  return `
    <div style="padding-bottom:120px;">
      ${photoSectionHTML}
      
      <div style="padding: 24px;">
        <div class="card-name" style="font-size:${(isMine || isPreview) ? '28px' : '22px'}; display:flex; align-items:center; gap:8px; font-weight:${(isMine || isPreview) ? '700' : '600'}; color:${(isMine || isPreview) ? 'var(--text-dark)' : 'var(--text-dark)'}; flex-wrap:wrap;">
          ${headerContent}
        </div>

        <div class="card-tags" style="margin-top:16px;">
          ${(p.tags || []).map(t => `<div class="card-tag">${t}</div>`).join('')}
        </div>

        <div class="profile-badge" style="margin-top:24px; display:inline-block;">
          ${p.intent || '연애를 기대해요 ❤️'}
        </div>

        <div style="font-size:15px; margin-top:20px; line-height:1.5; color:var(--text-dark); white-space: pre-line;">
          ${p.bio || '새로운 시작을 기대하며!'}
        </div>

        <div class="profile-section-title" style="margin-top:40px;">나에 대해</div>
        <div class="info-card">
           ${renderBasicInfoRows(p, isMine, isPreview)}
        </div>
        
        ${isMine ? `
        <div class="profile-section-title">나의 챕터</div>
        <div class="info-card" style="padding-bottom: 24px;">
          <!-- Benefit Dashboard -->
          <div style="margin-bottom:24px; padding:16px; background:#F8FAFE; border-radius:12px; border:1px solid #E8EEFB;">
            <div style="font-size:13px; color:#666; margin-bottom:4px;">
              📖 오늘 열람 가능한 프로필북 
              <span style="font-size:13px; font-weight:700; color:var(--text-dark); background: linear-gradient(transparent 60%, rgba(226,255,116,0.7) 60%); padding: 0 3px;">
                ${benefitCount}권
              </span>
            </div>
            
            <div style="font-size:12px; color:#9B72CC; margin-top:8px; font-weight:500;">
              ${answersToday < 3 ? `답변 ${3 - answersToday}개 더 작성하면 +1권` :
        (answersToday < 6 ? `답변 ${6 - answersToday}개 더 작성하면 +1권` : '오늘의 답변 보너스 완료! ✨')}
            </div>
            ${chapters.some(cl => cl.count < 9) ? `
              <div style="font-size:11px; color:#999; margin-top:4px;">
                한 Chapter를 완성하면 매일 +1권 열람 가능!
              </div>
            ` : ''}
          </div>

           ${chapters.map(ch => `
             <div class="chapter-row" style="display:flex; align-items:center; gap:12px; padding:10px 0;">
                <div class="chapter-label" style="font-size:13px; font-weight:600; color:#444; white-space:nowrap; flex-shrink:0;">Chapter ${ch.num} · ${ch.label}</div>
                <div class="chapter-track" style="flex:1; margin:0;"><div class="chapter-fill" style="width: ${ch.pct}%;"></div></div>
                <div class="chapter-pct" style="font-size:12px; color:#888; flex-shrink:0; width:30px; text-align:right;">${ch.count}/9</div>
             </div>
           `).join('')}
           ${isMine && c1Count >= 8 ? `<div class="chapter-badge" style="margin-top:8px;">나를 아는 사람 ✨</div>` : ''}
           <button class="btn-secondary" style="margin-top: 24px; color: var(--primary); border: 1px solid var(--primary); padding: 12px; font-size:14px; background:transparent; font-weight:600;">페이지 채우기 &darr;</button>
        </div>
        ` : ''}

      <div class="profile-section-title" style="margin-top:40px;">${isMine ? '나의 페이지' : p.name + '님의 페이지'}</div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">가치관을 보여줄 수 있는 27개의 질문에 답해보세요.</p>
      
      <div id="my-answers-grid" class="answers-grid" style="column-gap:8px; row-gap:8px;">
      </div>

      ${isMine && !isPreview ? `
        <div class="profile-section-label">p.Qurated</div>
        <div class="qurated-card">
          <div class="qurated-info">
            <div class="qurated-card-title">p.Qurated</div>
            <div class="qurated-card-subtitle">Q가 당신에게 딱 맞는 사람을 소개해드려요</div>
          </div>
          <button class="qurated-apply-btn" onclick="window.openQuratedPage()">${window.isQurated ? '신청 현황 보기' : '신청하기'}</button>
        </div>

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

        <div class="profile-section-label">설정</div>
        <div class="settings-card">
          <div class="settings-row">
            <span>알림 설정</span>
            <i data-lucide="chevron-right"></i>
          </div>
          <div class="settings-row">
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
      ` : ''}

      </div>
    </div>
  `;
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
  const profCarousel = document.getElementById('prof-carousel');
  if (profCarousel) {
    const inner = document.getElementById('prof-carousel-inner');
    const dotEls = profCarousel.querySelectorAll('[data-prof-dot]');
    const total = dotEls.length;
    let cur = 0;
    let tsX = 0;
    profCarousel.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; }, { passive: true });
    profCarousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tsX;
      if (Math.abs(dx) < 30) return;
      if (dx < 0 && cur < total - 1) cur++;
      if (dx > 0 && cur > 0) cur--;
      inner.style.transform = `translateX(-${cur * (100 / total)}%)`;
      dotEls.forEach((d, i) => { d.style.background = i === cur ? '#FFF' : 'rgba(255,255,255,0.5)'; });
    }, { passive: true });
  }

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

window.addMyPhoto = function () {
  if ((window.myPhotos || []).length >= 6) return;
  // Placeholder — real impl would open <input type="file">
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

window.openCreateMeetupModal = function () {
  const mc = getModalContainer();
  window._meetupImages = [];

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
        <div style="font-size:16px; font-weight:600;">모임 만들기</div>
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

        <button class="btn-primary" style="margin-bottom:40px;" onclick="submitCreateMeetup()">모임 만들기</button>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  setTimeout(() => {
    const now = new Date();
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
  }, 30);
};

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

  // 2. Create meetup object
  const newMeetup = {
    id: Date.now(),
    type: selectedCategory,
    secondaryType: secondaryCategory,
    title: inputTitle,
    shortLocation: inputLocation,
    fullAddress: inputLocation,
    date: selectedDate + " " + selectedTime,
    timestamp: new Date().toISOString(),
    desc: inputDescription,
    maxCap: selectedCapacity,
    currentCap: selectedCategory.includes('행사') ? 0 : 1,
    fee: inputFee,
    tags: inputTags,
    rules: inputNotice,
    hostPublic: hostPublicSelected,
    locationTiming: locationTimingSelected,
    ageRange: ageRange || null,
    links: inputLinks.length > 0 ? inputLinks : null,
    images: (window._meetupImages || []).length > 0 ? [...window._meetupImages] : null,
    isRecommended: false,
    isSaved: false,
    hasRSVPd: true,
    createdByMe: true,
    hostName: "나",
    hostType: selectedCategory.includes('행사') ? "단체" : "개인",
    hostBio: "",
    styleTrait: "무관",
    participants: []
  };

  MOCK_MEETUPS.unshift(newMeetup);

  // 3. Close modal
  window.closeModal();

  // 4. Refresh tab
  if (document.querySelector('.tab.active').dataset.tab === 'meetups') {
    window.renderMeetupList();
  } else {
    window.switchTab('meetups');
  }

  // 5. Show toast
  window.showToast("모임이 생성됐어요 🎉");
};

window.openMyProfilePreview = function () {
  const mc = getModalContainer();

  // Use real user state collected during onboarding
  const birthYear = userBirthDate.year || 1990;
  const age = getAge(birthYear);
  const yearShort = getYearLabel(birthYear);
  const role = userRole || 'V';
  const tags = userTags.length > 0 ? userTags : ['영화', '카페', '자연', '독서'];
  const displayName = userName || '나나';
  const answeredCount = Object.keys(MY_ANSWERS).length;

  const p = {
    name: displayName,
    birthYear: birthYear,
    role: role,
    location: userLocation,
    tags: tags,
    intent: userIntent === 'friend' ? '친구가 생겼으면 해요 👋' : (userIntent === 'love' ? '연애를 기대해요 ❤️' : '친구, 연애 둘 다 열려 있어요 ✨'),
    bio: "새로운 시작을 기대하며!",
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
    chapterProgress: { c1: 0, c2: 0, c3: 0 },
    photos: (window.myPhotos || []).filter(Boolean),
    image: (window.myPhotos || []).find(Boolean) || null,
  };

  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 200; background: var(--bg-color); display:flex; flex-direction:column; height:100%;">
      <!-- Header -->
      <div class="app-header" style="background:var(--bg-color); flex-shrink:0;">
        <button class="back-btn" onclick="closeModal()"><i data-lucide="x"></i></button>
        <div style="font-size:16px; font-weight:600; color:var(--text-dark);">미리보기</div>
        <div style="width:32px;"></div>
      </div>

      <!-- Scrollable content -->
      <div class="scroll-y" style="flex:1;">
        ${getProfileDetailedHTML(p, false, true)}
      </div>
    </div>
    `;

  if (typeof lucide !== 'undefined') lucide.createIcons();
  initPhotoCarousels();
  const gridHtml = renderAnswersGrid(MY_ANSWERS, false, 'preview');
  const gridContainer = mc.querySelector('#my-answers-grid');
  if (gridContainer) gridContainer.innerHTML = gridHtml;
  bindCardInteractions();
};


window.handleCardClick = function (profileId, qId = null) {
  if (window.profileIncomplete && !window.profileComplete) {
    showLockedProfileModal();
    return;
  }
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

  const backAction = fromChat ? `onclick="closeModal()"` : `onclick="closeModal()"`;
  // Technically same for now but logic is: if from chat, we are a modal on top of chat.

  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color);">
       <div class="modal-fixed-close" ${backAction}>
         <i data-lucide="${fromChat ? 'chevron-left' : 'chevron-down'}" style="color:#FFF;"></i>
       </div>
       <div style="flex:1; overflow:hidden; display:flex; flex-direction:column;">
         <div class="scroll-y" style="height:100%;">
           ${getProfileDetailedHTML(p, false)}
         </div>
       </div>
       <div class="detail-action-bar">
          <div class="detail-btn-pass" onclick="detailSwipeLeft()">Pass</div>
          <div class="detail-btn-like" onclick="detailSwipeRight()">Page her ♥</div>
       </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initPhotoCarousels();

  // Populate answers grid for the selected user
  const gridContainer = mc.querySelector('#my-answers-grid');
  if (gridContainer) {
    const profileAnswers = p.answers || {};
    gridContainer.innerHTML = renderAnswersGrid(profileAnswers, false, p.id);
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
let lastScrollTop = 0;
document.addEventListener('scroll', function (e) {
  if (e.target.classList && e.target.classList.contains('scroll-y')) {
    const st = e.target.scrollTop;
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    if (st > lastScrollTop && st > 80) {
      // Scrolling down
      nav.classList.add('nav-hidden');
    } else if (st < lastScrollTop) {
      // Scrolling up
      nav.classList.remove('nav-hidden');
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

window.openMeetupDetail = function (id) {
  const m = MOCK_MEETUPS.find(x => x.id === id);
  const mc = getModalContainer();
  const capPercent = (m.currentCap / m.maxCap) * 100;
  const isGroup = m.hostType === '단체';
  const isEvent = m.type.includes('행사');
  const isPrivate = m.hostType === '개인' && !m.hostPublic;
  const isCommunity = m.type.includes('커뮤니티');
  const showHostThumb = !isCommunity && !!m.hostIsPublic && m.hostType !== '단체';
  const displayedCap = (showHostThumb ? 1 : 0) + (m.participants || []).length;
  const displayCapPercent = m.maxCap > 0 ? Math.round((displayedCap / m.maxCap) * 100) : 0;
  const showAgeRange = !!(m.ageRange && m.ageRange !== '연령 무관');
  const showFee = !!(m.fee && !['없음', '무료'].includes(m.fee));
  const cleanDesc = isCommunity
    ? m.desc.split('\n').filter(l => !/^(연령대|조건)\s*:/.test(l.trim())).join('\n').trim()
    : m.desc;
  const organizerImgs = isCommunity ? (m.organizers || (m.hostImage ? [m.hostImage] : [])) : [];

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
          
          ${!m.hasRSVPd ?
      `<div class="meetup-location-preview" style="margin-bottom:${showAgeRange ? '8px' : '24px'}; font-size:15px; color:#666;"><i data-lucide="map-pin" style="width:14px;height:14px;stroke:#888;vertical-align:middle;margin-right:4px;"></i>${isCommunity ? (m.location || m.shortLocation) : m.shortLocation}</div>` :
      `<div class="address-reveal-card" style="margin-bottom:${m.kakaoLink ? '12px' : (showAgeRange ? '8px' : '24px')};">
                <div class="address-reveal-card-title"><i data-lucide="map-pin" style="width:16px;"></i> 장소 안내</div>
                <div class="address-reveal-card-text" style="white-space: pre-wrap;">${m.fullAddress}</div>
                <div class="address-reveal-card-sub">참여 확정 후 공개되는 장소입니다</div>
              </div>
              ${m.kakaoLink ? `<div onclick="window.open('${m.kakaoLink}', '_blank')" style="margin-bottom:${showAgeRange ? '8px' : '24px'}; background:#FEE500; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px; cursor:pointer;">
                <span style="font-size:18px;">💬</span>
                <div style="flex:1;">
                  <div style="font-size:13px; font-weight:700; color:#3A1D1D;">오픈채팅방 입장하기</div>
                  <div style="font-size:11px; color:#7A5C00; margin-top:2px;">카카오 오픈채팅</div>
                </div>
              </div>` : ''}`
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
            <div style="font-size:15px; font-weight:600; margin-bottom:12px;">참여자 (${displayedCap}/${m.maxCap}명)</div>
            <div class="progress-track" style="margin-bottom: 24px;">
               <div class="progress-fill" style="width: ${displayCapPercent}%;"></div>
            </div>
            <div class="attendee-stack" style="flex-wrap: wrap; gap:12px;">
               ${showHostThumb ? `
                 <div class="attendee-avatar" style="width:40px; height:40px; margin-left:0; border: none; outline: 2.5px solid #9B72CC; outline-offset: 2px; background-image:url('${MOCK_PROFILES.find(p => p.name === m.hostName)?.image || m.hostImage || MOCK_PROFILES[0].image}'); background-size:cover; background-position:center top;"></div>
               ` : ''}
               ${(m.participants || []).map(url => `
                 <div class="attendee-avatar" style="width:40px; height:40px; margin-left:0; border: none; background-image:url('${url}');background-size:cover;background-position:center top;"></div>
               `).join('')}
            </div>
          </div>
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
          <button id="detail-rsvp-btn" style="width: 100%; padding: 16px; border-radius: 14px; background: ${m.hasRSVPd || m.disableRSVP ? '#CCC' : '#9B72CC'}; color: white; font-size: 16px; font-weight: 600; border: none; cursor: ${m.hasRSVPd || m.disableRSVP ? 'default' : 'pointer'}; pointer-events: ${m.hasRSVPd || m.disableRSVP ? 'none' : 'auto'};" onclick="joinMeetupChat(${m.id})">
             ${m.hasRSVPd ? '신청 완료 ✓' : m.disableRSVP ? '외부 사이트에서 신청' : '참여하기'}
          </button>
       </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}


window.closeModal = function () {
  const mc = document.getElementById('modal-container');
  if (mc) mc.innerHTML = '';
}

window.joinMeetupChat = function (meetupId) {
  const m = MOCK_MEETUPS.find(x => x.id === meetupId);
  if (!m) return;
  m.hasRSVPd = true;
  m.currentCap = (m.currentCap || 0) + 1;
  const mc = getModalContainer();
  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color);">
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 0 24px; box-sizing: border-box;">
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 12px;">
          <div style="font-size: 48px; text-align: center;">🎉</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--text-dark); text-align: center;">참여 완료</div>
          <div style="font-size: 14px; color: #999; text-align: center; margin-bottom: 24px;">${m.title}</div>
          ${m.kakaoLink ? `<button onclick="window.open('${m.kakaoLink}', '_blank')" style="width: 100%; padding: 16px; border-radius: 14px; background: #FEE500; color: #3A1D1D; font-size: 15px; font-weight: 700; border: none; cursor: pointer;">💬 오픈채팅방 입장하기</button>` : ''}
        </div>
        <div style="width: 100%; padding-bottom: 40px;">
          <button onclick="openMeetupDetail(${m.id})" style="width: 100%; padding: 14px; border-radius: 24px; background: #F0F0F0; color: #555; font-size: 15px; font-weight: 600; border: none; cursor: pointer;">돌아가기</button>
        </div>
      </div>
    </div>
  `;
};

window.submitRSVP = function (id) {
  const m = MOCK_MEETUPS.find(x => x.id === id);
  if (!m || m.currentCap >= m.maxCap || m.hasRSVPd) return;
  m.hasRSVPd = true;
  m.currentCap += 1;
  const btn = document.getElementById('detail-rsvp-btn');
  if (btn) {
    btn.innerText = '신청 완료 ✓';
    btn.style.background = '#7BC47F';
    btn.style.boxShadow = '0 8px 16px rgba(123, 196, 127, 0.4)';
    btn.style.border = 'none';
    btn.style.pointerEvents = 'none';
  }
  if (currentTab === 'meetups') {
    renderMeetupList();
  }
}

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
    <div style="position:absolute; top:-60px; left:0; width:100%; height:calc(100vh - 84px); background:var(--bg-color); z-index:50; display:flex; flex-direction:column; overflow:hidden;">
      <div class="app-header" style="background:var(--bg-color);">
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
    <div style="position:absolute; top:-60px; left:0; width:100%; height:calc(100vh - 84px); background:var(--bg-color); z-index:50; display:flex; flex-direction:column; overflow:hidden;">
      <div class="app-header" style="background:var(--bg-color);">
        <button class="back-btn" onclick="openChat(${chatId})"><i data-lucide="chevron-left" style="width:28px;"></i></button>
        <div style="font-size:15px; font-weight:600;">${p.name}</div>
        <div style="width:32px;"></div>
      </div>
      <div class="scroll-y" style="flex:1;">${getProfileDetailedHTML(p, false)}</div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.openMatchIntroModal = function (profileId, isQurated = false, from = 'messages') {
  const match = MATCHED_PROFILES.find(m => m.id === profileId);
  if (!match) return;

  const otherProfile = MOCK_PROFILES.find(p => p.id === match.id) || MOCK_PROFILES[0];
  const otherSpineColor = getSpineColor(otherProfile.id);
  const otherAge = getAge(otherProfile.birthYear);
  const otherDist = getDistance(otherProfile.id);

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
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${otherAge} ・ ${otherDist}km</div>
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
      <div style="position: absolute; top:-60px; left:0; width: 100%; height: calc(100vh - 84px); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column;">
        <div class="chat-header" style="position: relative; justify-content: center; padding: 12px 20px; min-height: 60px;">
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
      <div style="position: absolute; top:-60px; left:0; width: 100%; height: calc(100vh - 84px); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column; overflow:hidden;">
        <div class="app-header" style="background:var(--bg-color);">
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
    <div style="position: absolute; top:-60px; left:0; width: 100%; height: calc(100vh - 84px); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column; overflow:hidden;">
      <div class="app-header" style="background:var(--bg-color);">
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
  const ageDistText = p ? `${getAge(p.birthYear)} ・ ${getDistance(p.id)}km` : chat.score;
  const sharedMeetup = MOCK_MEETUPS.find(m =>
    m.hasRSVPd && (m.hostName === chat.name || (m.participants || []).some(img => img === p?.image))
  );

  const renderChatView = () => {
    contentArea.innerHTML = `
      <div style="position: absolute; top:-60px; left:0; width: 100%; height: calc(100vh - 84px); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column;">
        <div class="chat-header" style="position: relative; justify-content: center; padding: 12px 20px; min-height: 60px;">
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
      <div style="position: absolute; top:-60px; left:0; width: 100%; height: calc(100vh - 84px); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column; overflow:hidden;">
        <div class="app-header" style="background:var(--bg-color);">
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
            background:#E8F5E9; color:#4CAF50; border-radius:999px;
            padding:2px 8px; font-size:12px; font-weight:600; white-space:nowrap; margin-left:12px; flex-shrink:0;
          ">주최 ✓</span>
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

window.swipeLeft = function () {
  const card = document.querySelector('.book-card.level-0');
  if (!card) return;
  card.style.transform = 'translateX(-150%) rotate(-30deg)';
  card.style.opacity = '0';
  setTimeout(() => {
    // Swipe (no action): Card goes to back of browseQueue
    if (browseQueue.length > 0) {
      const item = browseQueue.shift();
      browseQueue.push(item);
    }
    renderDiscoverTab();
  }, 300);
};

window.swipeRight = function () {
  const card = document.querySelector('.book-card.level-0');
  if (!card) return;
  card.style.transform = 'translateX(150%) rotate(30deg)';
  card.style.opacity = '0';
  setTimeout(() => {
    // Swipe (no action): Card goes to back of browseQueue
    if (browseQueue.length > 0) {
      const item = browseQueue.shift();
      browseQueue.push(item);
    }
    renderDiscoverTab();
  }, 300);
};

window.detailSwipeLeft = function () {
  const card = browseQueue[0];
  if (!card) return;

  // 넘기기 누른 카드
  passedSet.add(card.id);
  browseQueue.shift(); // remove from queue

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
  const otherDist = getDistance(p.id);

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
      ${p.name} · <span style="font-size:14px; font-weight:400;">${otherAge}세 · ${otherDist}km</span>
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

window.swipeUp = function () {
  const card = document.querySelector('.book-card.level-0');
  if (!card) return;
  const id = card.dataset.id.replace('p', '');
  handleCardClick(parseInt(id));
  card.style.transform = '';
};

window.undoSwipe = function () {
  if (swipeHistory.length === 0) return;
  swipeHistory.pop();
  renderDiscoverTab();
};

const SPINE_COLORS = ['#C89FDB', '#A8C5A0', '#E8B4A0', '#9FB8D8', '#D4B896', '#B8A0C8'];
function getSpineColor(id) {
  const s = String(id).replace('p', '');
  return SPINE_COLORS[[...s].reduce((acc, c) => acc + c.charCodeAt(0), 0) % SPINE_COLORS.length];
}
const getMatchSpineColor = getSpineColor;

function getDistance(id) {
  const seed = (typeof id === 'string' ? parseInt(id.replace('p', '')) : id);
  return (0.5 + (seed % 45) / 10).toFixed(1);
}

window.renderDiscoverTab = function () {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  // Current browse queue
  const remaining = browseQueue;

  let headerHTML = `
      <div style="padding: 10px 24px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h2 style="margin:0;">발견</h2>
          <button onclick="window.openLibraryPage()" style="background: none; border: none; cursor: pointer; border-radius:50%; width:40px; height:40px; color: #9B72CC; display:flex; align-items:center; justify-content:center; transition: background 0.2s;">
            <i data-lucide="library" style="width: 24px; height: 24px;"></i>
          </button>
        </div>
        <p style="margin-bottom: 24px;">가치관, 취향이 맞는 사람을 만나보세요</p>
      </div>
    `;

  if (remaining.length === 0) {
    // Check if any undecided cards from original 6 remain
    const undecidedInPool = dailyProfiles.filter(p => !(pagedSet?.has(p.id) ?? false) && !(passedSet?.has(p.id) ?? false));
    const allDone = undecidedInPool.length === 0;

    contentArea.innerHTML = `
        ${headerHTML}
        <div class="discover-tab-container" id="discover-empty-state" style="justify-content: center; align-items: center; text-align: center; height: calc(100vh - 160px);">
          <i data-lucide="moon" style="width: 48px; height: 48px; color: var(--text-muted); opacity: 0.5; margin-bottom: 24px;"></i>
          <p style="margin-bottom: 8px; font-size: 20px; font-weight: 700;">오늘의 프로필북을 모두 읽었어요.</p>
          <p style="color: #8E8E8A; margin-bottom: 32px; font-size: 15px;">내일 새로운 책이 도착해요.</p>

          <div class="p-qurated-promo-card">
            <div style="font-size: 14px; font-weight: 700; color: #9B72CC; margin-bottom: 6px;">p.Qurated</div>
            <div style="font-size: 13px; color: #888; margin-bottom: 12px; line-height: 1.4;">Q가 당신에게 딱 맞는 사람을 소개해드려요.</div>
            <div onclick="window.openQuratedPage()" style="font-size: 13px; font-weight: 700; color: #9B72CC; cursor: pointer;">자세히 보기</div>
          </div>
        </div>
      `;

    // FORCE ADD retry button
    const emptyCont = document.getElementById('discover-empty-state');
    if (emptyCont) {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = '다시 읽기';
      retryBtn.style.cssText = `
          display: block;
          margin: 20px auto 32px;
          border: 1.5px solid #9B72CC;
          color: #9B72CC;
          background: transparent;
          border-radius: 24px;
          padding: 12px 32px;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
        `;
      retryBtn.addEventListener('click', () => {
        console.log('Retry clicked. dailyProfiles count:', dailyProfiles.length);

        let rem = dailyProfiles.filter(p => !(pagedSet?.has(p.id) ?? false) && !(passedSet?.has(p.id) ?? false));
        console.log('Remaining undecided cards:', rem.length);

        if (rem.length === 0) {
          console.log('All 6 cards were resolved. Performing full deck reset.');
          pagedSet.clear();
          passedSet.clear();
          rem = [...dailyProfiles];
        }

        browseQueue = [...rem];
        console.log('browseQueue reset to:', browseQueue.length);

        // Re-render the whole tab to ensure clean state
        renderDiscoverTab();
      });
      // Insert before the promo card
      const promo = emptyCont.querySelector('.p-qurated-promo-card');
      if (promo) {
        emptyCont.insertBefore(retryBtn, promo);
      } else {
        emptyCont.appendChild(retryBtn);
      }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  let html = `
      ${headerHTML}
      <div class="discover-tab-container">
        <div class="stack-wrapper" id="stack-wrapper">
    `;

  const displayCount = Math.min(remaining.length, 4);
  for (let i = displayCount - 1; i >= 0; i--) {
    const item = remaining[i];
    const p = item.profile;
    const levelClass = `level-${i}`;
    const distance = getDistance(item.id);

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
              <span class="book-meta-dist">${distance} km</span>
              <span class="book-meta-role">${p.role === 'visitor' ? 'V' : (p.role === 'booker' ? 'B' : 'F')}</span>
            </div>
            <div class="book-spacer-top"></div>
            <div class="book-title">${p.name}</div>
            <div class="book-spacer-flex"></div>
            <div class="book-quote">" ${quote} "</div>
          </div>
          <div class="book-bg-photo" style="background-image: url('${p.image}')"></div>
          <div class="book-overlay"></div>
        </div>
      `;
  }

  html += `
        </div>
        
        <div class="paged-heart-overlay" id="paged-heart-overlay">
          <i data-lucide="heart" fill="#9B72CC" style="color:#9B72CC; width:48px; height:48px;"></i>
          <span class="paged-heart-text">Paged ♥</span>
        </div>
      </div>
    `;

  contentArea.innerHTML = html;
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const frontCard = document.querySelector('.book-card.level-0');
  if (frontCard) {
    initStackGestures(frontCard);
    frontCard.addEventListener('click', (e) => {
      const id = frontCard.dataset.id.replace('p', '');
      handleCardClick(parseInt(id));
    });
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
      const distance = getDistance(match.id);
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
                <span style="font-size:10px; color:#fff; font-family:'Jost',sans-serif; font-weight:300;">${distance}km</span>
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
    <div class="scroll-y" style="height:calc(100vh - 140px); padding-top:20px;">
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
      const distance = getDistance(p.id);
      return `
              <div class="saved-book-cover" onclick="handleCardClick(${p.id})">
                <div class="book-spine" style="background: linear-gradient(to right, ${spineColor}, rgba(0,0,0,0.15))"></div>
                <div class="thumbnail-card-content">
                  <div class="thumbnail-nickname">${p.name}</div>
                  <div class="thumbnail-info">${getAge(p.birthYear)} ・ ${distance}km</div>
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
      <div class="scroll-y" style="height: calc(100vh - 140px); padding-top: 20px;">
        ${gridHTML}
      </div>
    `;

  if (typeof lucide !== 'undefined') lucide.createIcons();
};

function startApp() {
  if (!appContainer) return;
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
    } else {
      navigateTo('onboarding-0');
    }
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

window.openInvitePage = function () {
  const mc = getModalContainer();

  if (!window.inviteCardStates) {
    window.inviteCardStates = [
      { state: 2, num: 1, code: "XY78-MN12" },
      { state: 2, num: 2, code: "JK45-PQ90" },
      { state: 1, num: 3, code: "AB12-XY34" },
      ...Array(7).fill(0).map((_, i) => ({ state: 0, num: i + 4 }))
    ];
  }

  window.renderInvitePage = function () {
    const usedCount = window.inviteCardStates.filter(c => c.state === 2).length;
    const progressPercent = (usedCount / 10) * 100;

    const _ordSuffix = n => { const v = n % 100; return n + (['th','st','nd','rd'][(v-20)%10] || ['th','st','nd','rd'][v] || 'th'); };
    const cardsHTML = window.inviteCardStates.map(card => {
      if (card.state === 2) {
        // Used
        return `
          <div class="invite-card-slot state-used">
            <div class="envelope-flap envelope-flap-top"></div>
            <div class="envelope-flap envelope-flap-bottom"></div>
            <div class="envelope-content">
              <div style="letter-spacing:0.2em; color:rgba(255,255,255,0.6); font-size:13px; font-weight:600;">INVITED</div>
              <div class="invite-circle">
                <i data-lucide="heart" style="width:20px; height:20px; color:#999;"></i>
              </div>
              <div style="color:#888; font-size:13px; font-family:monospace;">${card.code}</div>
            </div>
          </div>
        `;
      } else if (card.state === 1) {
        // Active
        const shareText = `p.2에 초대합니다 🩷 코드: ${card.code}`;
        return `
          <div class="invite-card-slot state-active">
            <div class="invite-inner-card">
              <div class="invite-inner-label">INVITATION</div>
              <div class="invite-code">${card.code}</div>
              <div class="invite-timer">23시간 59분 남음</div>
            </div>
            <div class="invite-actions">
              <button class="invite-btn-copy" onclick="event.stopPropagation(); navigator.clipboard && navigator.clipboard.writeText('${card.code}').then(()=>alert('코드가 복사되었습니다.')).catch(()=>alert('${card.code}')); return false;">링크 복사</button>
              <button class="invite-btn-share" onclick="event.stopPropagation(); if(navigator.share){navigator.share({title:'p.2 초대장',text:'${shareText}'});}else{alert('${shareText}');}">공유하기</button>
            </div>
          </div>
        `;
      } else {
        // Unused
        return `
          <div class="invite-card-slot state-unused">
            <div class="envelope-flap envelope-flap-top"></div>
            <div class="envelope-flap envelope-flap-bottom"></div>
            <div class="envelope-content">
              <div class="invite-number">${_ordSuffix(card.num)} Invitation</div>
              <div class="invite-circle">
                <i data-lucide="heart" style="width:20px; height:20px; color:#9B7FD4;"></i>
              </div>
              <button class="use-invite-btn" onclick="window.activateInvite(${card.num - 1})">사용하기</button>
            </div>
          </div>
        `;
      }
    }).join('');

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
  };

  window.renderInvitePage();
};

window.activateInvite = function (index) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  const code =
    chars[Math.floor(Math.random() * 26)] + chars[Math.floor(Math.random() * 26)] +
    nums[Math.floor(Math.random() * 10)] + nums[Math.floor(Math.random() * 10)] + '-' +
    chars[Math.floor(Math.random() * 26)] + chars[Math.floor(Math.random() * 26)] +
    nums[Math.floor(Math.random() * 10)] + nums[Math.floor(Math.random() * 10)];

  window.inviteCardStates[index].state = 1; // Active
  window.inviteCardStates[index].code = code;
  window.renderInvitePage();
};

window.openLibraryPage = function () {
  const mc = getModalContainer();
  mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 2000; background: var(--bg-color);">
      <div style="padding:20px 24px; display:flex; align-items:center; border-bottom:1px solid var(--border-color);">
        <button onclick="closeModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-dark);">←</button>
        <span style="flex:1;text-align:center;font-weight:600;font-size:17px;">라이브러리</span>
        <span style="width:32px;"></span>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height: calc(100vh - 100px); color:var(--text-muted);">
        <div style="font-size:18px; font-weight:600;">준비 중이에요 ☺️</div>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.openQuratedPage = function () {
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
         <div class="app-header" style="background:var(--bg-color); position: absolute; top: 0; width: 100%;">
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
