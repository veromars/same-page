console.log('app loaded');

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
  { id: 1, chapter: 1, text: "상대를 설레게 하는 나의 매력" },
  { id: 2, chapter: 1, text: "나의 하루 그리고 나의 휴일" },
  { id: 3, chapter: 1, text: "나의 소울 푸드" },
  { id: 4, chapter: 1, text: "나의 힐링 스팟" },
  { id: 5, chapter: 1, text: "나만의 초능력" },
  { id: 6, chapter: 1, text: "내가 사랑하는 영화/드라마와 그 속의 한 장면" },
  { id: 7, chapter: 1, text: "연인에게 들려주고 싶은 나의 플레이리스트" },
  { id: 8, chapter: 1, text: "어린시절, 가장 행복했던 기억의 한 장면" },
  { id: 9, chapter: 1, text: "5년 뒤, 내가 그리는 나의 모습" },
  // Chapter 2 · 사랑
  { id: 10, chapter: 2, text: "나를 설레게 하는 상대의 매력" },
  { id: 11, chapter: 2, text: "나만 아는 나의 플러팅 스킬" },
  { id: 12, chapter: 2, text: "연애 성향 체크 (연락/만남 빈도)" },
  { id: 13, chapter: 2, text: "연애 가치관 체크 (애정표현/파트너 친구)" },
  { id: 14, chapter: 2, text: "사랑하고 있다고 느끼는 순간 & 사랑받고 있다고 느끼는 순간" },
  { id: 15, chapter: 2, text: "연애 안정기, 우리 관계의 필수 요소 3가지" },
  { id: 16, chapter: 2, text: "다투었을 때 내가 원하는 해결 방법" },
  { id: 17, chapter: 2, text: "이 사람과 헤어질 수도 있겠다고 느끼는 순간" },
  { id: 18, chapter: 2, text: "이 사람과 함께하는 미래를 떠올리게 되는 순간" },
  // Chapter 3 · 관계
  { id: 19, chapter: 3, text: "파트너로서 나의 매력" },
  { id: 20, chapter: 3, text: "내가 파트너에게 원하는 3가지" },
  { id: 21, chapter: 3, text: "함께하기 전 꼭 확인하고 싶은 3가지" },
  { id: 22, chapter: 3, text: "함께하는 삶 (집/경제관리/수면/반려동물/아이)" },
  { id: 23, chapter: 3, text: "살고 싶은 동네는?" },
  { id: 24, chapter: 3, text: "차/소파/신발에 쓸 수 있는 최대 금액" },
  { id: 25, chapter: 3, text: "내가 원하는 집안일 분담" },
  { id: 26, chapter: 3, text: "파트너와 꼭 함께하고 싶은 일상의 한 장면" },
  { id: 27, chapter: 3, text: "내가 생각하는 함께하는 삶이란" }
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
      13: { text: "연락은 자주보단 깊게. 만남은 질 중심" },
      14: { text: "같이 걷다가 손 잡아줄 때요 🤍" },
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

// 24 user photos pool (consistent assignment across app)
const USER_PHOTOS = [
  "https://images.unsplash.com/photo-1704731267944-c93c8d059cdc?w=400", // 1 Heej
  "https://images.unsplash.com/photo-1566139884643-d6c62cc13b49?w=400", // 2 s
  "https://images.unsplash.com/photo-1708533296070-b3e49fbdb08e?w=400", // 3 달
  "https://images.unsplash.com/photo-1602421110952-01a3057d8987?w=400", // 4 bora
  "https://images.unsplash.com/photo-1719306625386-3e610c3dd5ae?w=400", // 5 밍
  "https://images.unsplash.com/photo-1713751429134-3d049a83b694?w=400", // 6
  "https://images.unsplash.com/photo-1653196709875-427673568d12?w=400", // 7
  "https://images.unsplash.com/photo-1632242219460-938944e38947?w=400", // 8
  "https://images.unsplash.com/photo-1599314785151-49a35a619b1b?w=400", // 9
  "https://images.unsplash.com/photo-1570441102939-ca93df98ffdb?w=400", // 10
  "https://images.unsplash.com/photo-1679628751127-7706cced9819?w=400", // 11
  "https://images.unsplash.com/photo-1737041315827-5d9ceda7f27e?w=400", // 12
  "https://images.unsplash.com/photo-1704731268191-e744c6d96b26?w=400", // 13
  "https://images.unsplash.com/photo-1691068013523-0f653e498f10?w=400", // 14
  "https://images.unsplash.com/photo-1669026481679-268f2fd919bf?w=400", // 15
  "https://images.unsplash.com/photo-1565150860083-2257da1fbf23?w=400", // 16
  "https://images.unsplash.com/photo-1572288236082-e363d5121568?w=400", // 17
  "https://images.unsplash.com/photo-1698252980771-4bbf18c4439a?w=400", // 18
  "https://images.unsplash.com/photo-1762954419103-43708f0cf893?w=400", // 19
  "https://images.unsplash.com/photo-1620216977705-df5ba73ca1a1?w=400", // 20
  "https://images.unsplash.com/photo-1523177311887-ad300abe97cc?w=400", // 21
  "https://images.unsplash.com/photo-1739010577139-6f904e57fe41?w=400", // 22
  "https://images.unsplash.com/photo-1543204607-75cad6df85c3?w=400", // 23
  "https://images.unsplash.com/photo-1565050831300-833bcdc08d3b?w=400", // 24
];

const MOCK_MEETUPS = [
  {
    id: 1, title: "선데이 필름나이트", date: "일요일 저녁 7시", timestamp: "2026-04-26T19:00:00",
    desc: "'타오르는 여인의 초상' 감상 후 와인 한 잔 🍷", type: "🎬 문화생활", maxCap: 6, currentCap: 5, 
    hostName: "bora", hostType: "개인", hostPublic: true, hostBio: "영화와 와인을 사랑하는 큐레이터 보라입니다.",
    styleTrait: "무관", fee: "1만 5천원 (와인/간식)", tags: ["#영화", "#와인", "#소규모"],
    rules: "주류가 포함된 모임으로 과도한 음주는 자제해주세요.",
    isRecommended: true, isSaved: false, hasRSVPd: false, shortLocation: "마포구 (홍대)", fullAddress: "서울 마포구 와우산로 29길 26, 2층 씨네라운지",
    participants: [USER_PHOTOS[0], USER_PHOTOS[1], USER_PHOTOS[2], USER_PHOTOS[3], USER_PHOTOS[4]]
  },
  {
    id: 2, title: "남산 나이트 하이크", date: "금요일 저녁 8시", timestamp: "2026-04-24T20:00:00",
    desc: "초보 환영, 강아지 환영 🐾", type: "🏃 액티비티", maxCap: 10, currentCap: 8, 
    hostName: "s", hostType: "개인", hostPublic: false, hostBio: "",
    styleTrait: "무관", fee: "무료", tags: ["#등산", "#야경", "#반려견"],
    rules: "편한 운동화와 개인 생수를 지참해주세요.",
    isRecommended: false, isSaved: false, hasRSVPd: false, shortLocation: "용산구 (남산)", fullAddress: "서울 용산구 남산공원길 105, 북측 주차장 앞",
    participants: [USER_PHOTOS[6], USER_PHOTOS[7], USER_PHOTOS[8], USER_PHOTOS[9], USER_PHOTOS[10], USER_PHOTOS[11]]
  },
  {
    id: 3, title: "퀴어 문학 읽기 모임", date: "4/20 월요일 오후 3시", timestamp: "2026-04-20T15:00:00",
    desc: "이번 달 책: 버지니아 울프 '올랜도' 📖", type: "📚 스터디", maxCap: 8, currentCap: 6, 
    hostName: "무지개 북스", hostType: "단체", hostLogo: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100", 
    hostBio: "다양한 목소리를 담는 독립 서점, 무지개 북스입니다.",
    styleTrait: "무관", fee: "5천원 (공간 대여료)", tags: ["#독서", "#퀴어문학", "#성수"],
    rules: "읽어올 분량을 꼭 읽어와주세요. 서로의 의견을 존중합니다.",
    reviews: [
      { nickname: "민트", date: "2026.03.15", text: "정말 깊이 있는 대화를 나눌 수 있었어요. 다음에도 꼭 참여하고 싶습니다." },
      { nickname: "바다", date: "2026.03.01", text: "공간도 예쁘고 호스트분들도 친절하셔서 편하게 이야기했습니다." }
    ],
    isRecommended: true, isSaved: false, hasRSVPd: false, shortLocation: "성동구 (성수)", fullAddress: "서울 성동구 서울숲2길 32-14, 북라운지",
    participants: [USER_PHOTOS[12], USER_PHOTOS[13], USER_PHOTOS[14], USER_PHOTOS[15], USER_PHOTOS[16]]
  },
  {
    id: 4, title: "성수동 카페 브런치", date: "일요일 오전 11시", timestamp: "2026-04-26T11:00:00",
    desc: "새로 생긴 카페 같이 가요 ☕", type: "🍽️ 식도락", maxCap: 6, currentCap: 3, 
    hostName: "밍", hostType: "개인", hostPublic: true, hostBio: "카페 투어가 취미인 밍입니다. 맛있는 브런치 먹어요!",
    styleTrait: "무관", fee: "개인 부담", tags: ["#브런치", "#카페", "#성수"],
    rules: "예약 없이 방문하므로 노쇼는 절대 금지입니다.",
    isRecommended: true, isSaved: false, hasRSVPd: false, shortLocation: "성동구 (성수)", fullAddress: "서울 성동구 연무장길 11, 카페 모노",
    participants: [USER_PHOTOS[18], USER_PHOTOS[19], USER_PHOTOS[20]]
  },
  {
    id: 5, title: "이쪽 바에서 칵테일 한 잔 🍸", date: "5/2 토요일 저녁 9시", timestamp: "2026-05-02T21:00:00",
    desc: "프라이빗한 공간에서 편하게 한 잔 해요", type: "✨ 소셜", maxCap: 8, currentCap: 4, 
    hostName: "mina", hostType: "개인", hostPublic: false, hostBio: "",
    styleTrait: '<span style="background: linear-gradient(transparent 60%, rgba(200,159,219,0.6) 60%); padding: 0 3px;">일스</span>', fee: "개인 부담", tags: ["#칵테일", "#소셜", "#대구"],
    rules: "과도한 음주는 자제해주세요.",
    isRecommended: false, isSaved: false, hasRSVPd: false, shortLocation: "중구 (대구)", fullAddress: "대구광역시 중구 국채보상로 643, B1\n그레이 (GREY)",
    participants: [USER_PHOTOS[0], USER_PHOTOS[4], USER_PHOTOS[8], USER_PHOTOS[12]]
  },
  {
    id: 6, title: "퀴어 법률 토크 — 우리가 알아야 할 권리", date: "다음주 토요일 오후 2시", timestamp: "2026-05-02T14:00:00",
    desc: "동성 파트너십, 법적 보호, 의료 결정권 등 실생활에서 꼭 알아야 할 법률 정보를 함께 나눠요. 질문 환영합니다.", 
    type: "📚 스터디", maxCap: 20, currentCap: 12, 
    hostName: "레즈비언인권위원회", hostType: "단체", hostLogo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=100", 
    hostBio: "성소수자 권리 증진을 위해 활동하는 단체입니다",
    styleTrait: "무관", fee: "무료", tags: ["#법률", "#권리", "#강연", "#퀴어"],
    rules: "녹화 및 촬영은 금지입니다.",
    reviews: [
      { nickname: "", date: "2주 전", text: "몰랐던 내용을 많이 알게 됐어요. 다음에도 꼭 참석할게요." },
      { nickname: "", date: "1달 전", text: "실용적인 정보가 많았어요. 강추합니다!" }
    ],
    isRecommended: true, isSaved: false, hasRSVPd: false, shortLocation: "종로구 (혜화)", fullAddress: "서울 종로구 대학로 116, 혜화 세미나실",
    participants: [USER_PHOTOS[4], USER_PHOTOS[6], USER_PHOTOS[8], USER_PHOTOS[10], USER_PHOTOS[12], USER_PHOTOS[14], USER_PHOTOS[0], USER_PHOTOS[2], USER_PHOTOS[5], USER_PHOTOS[7], USER_PHOTOS[9], USER_PHOTOS[11]]
  },
  {
    id: 7, title: "FC빠세 🌈 주말 풋살", date: "이번주 토요일 오전 10시", timestamp: "2026-04-25T10:00:00",
    desc: "실력 무관, 처음이어도 환영해요! 함께 뛰고 땀 흘리고 밥 먹어요 ⚽ 운동화와 긍정 에너지만 챙겨오세요.", 
    type: "🏃 액티비티", maxCap: 12, currentCap: 8, 
    hostName: "FC빠세", hostType: "단체", hostLogo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100", 
    hostBio: "레즈비언 & 퀴어 여성 풋살 클럽",
    styleTrait: "무관", fee: "5,000원 (구장 대여비)", tags: ["#풋살", "#운동", "#초보환영", "#액티비티"],
    rules: "운동화 필참. cleats(축구화)는 착용 불가합니다.",
    isRecommended: false, isSaved: false, hasRSVPd: false, shortLocation: "마포구 (상암)", fullAddress: "서울 마포구 성산동 상암월드컵경기장 풋살구장",
    participants: [USER_PHOTOS[1], USER_PHOTOS[3], USER_PHOTOS[5], USER_PHOTOS[7], USER_PHOTOS[9], USER_PHOTOS[11], USER_PHOTOS[13], USER_PHOTOS[2]]
  }
];

const MOCK_CHATS = [
  {
    id: 1, name: "Heej", image: MOCK_PROFILES[0].image, source: "발견 매치", score: "98% 매칭", preview: "혹시 다음 필름나이트 가세요? 😊", time: "방금 전",
    messages: [
      { text: "안녕하세요! 저도 반가워요. 프로필 보니까 영화 좋아하시는 것 같네요!", type: "received" },
      { text: "안녕하세요! 매치돼서 반가워요 😊", type: "sent" },
      { text: "네! 혹시 최근에 영화 모임 가신 적 있나요?", type: "sent" },
      { text: "혹시 다음 필름나이트 가세요? 😊", type: "received" }
    ]
  },
  {
    id: 2, name: "달", image: MOCK_PROFILES[2].image, source: "북클럽", score: "87% 매칭", preview: "북클럽 같이 가요! 📚", time: "1시간 전",
    messages: [
      { text: "북클럽 같이 가요! 📚", type: "received" }
    ]
  },
  {
    id: 3, name: "bora", image: MOCK_PROFILES[3].image, source: "발견 매치", score: "83% 매칭", preview: "재즈바 추천해줄 수 있어요? 🎵", time: "어제",
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
let MY_ANSWERS = {
  1: { text: "눈웃음이요. 모르는 척하다가 터지는 웃음" },
  2: { text: "출근 전 커피 한 잔은 필수예요. 휴일엔 늦잠 자고 브런치 🥐" },
  3: { text: "엄마표 된장찌개. 냄새만 맡아도 집 생각나요" },
  6: { text: "타오르는 여인의 초상. 눈이 마주치는 장면에서 멈췄어요 🎬", polaroid: "https://www.artinsight.co.kr/data/tmp/2405/20240528195507_qhlhtydd.jpg" },
  8: { text: "할머니 댁 마당에서 혼자 놀던 여름 오후" },
  9: { text: "지금보다 덜 바쁘고, 더 나다운 사람" },
  14: { text: "같이 걷다가 손 잡아줄 때요 🤍" },
  18: { text: "별것 아닌 일상을 같이 기억하고 싶을 때요" },
  26: { text: "아침에 각자 커피 내려서 같이 마시는 것" }
};

let swipeHistory = [];
window.likedPages = window.likedPages || {};
const chapterColors = { 1: '#E8FF90', 2: '#FFD5BD', 3: '#D3B2E2' };

window.discoverFilterType = '전체';
let discoverFeedList = [];
window.showLikedCollection = false;
window.showSavedMeetups = false;
window.bookmarkedMoims = {};
window.currentTab = 'home';
window.isDiscoverInitialized = false;

window.getCurrentPageId = function () { return window.__activePageId || null; };
window.getCurrentChapter = function () { return window.__activeChapter || 1; };

function handleLike(pageId, chapterNum) {
  if (!pageId) return;
  window.likedPages[pageId] = !window.likedPages[pageId];
  const isLiked = window.likedPages[pageId];
  const path = document.getElementById('heart-' + pageId);
  const color = chapterColors[chapterNum] || '#E8FF90';
  if (path) {
    if (isLiked) {
      path.setAttribute('fill', color);
      path.setAttribute('stroke', 'none');
    } else {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#ccc');
    }
  }
  const badges = document.querySelectorAll(`[data-page-id="${pageId}"] .card-liked-badge`);
  badges.forEach(badge => { badge.style.visibility = isLiked ? 'visible' : 'hidden'; });
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

window.bindCardInteractions = function () {
  // 1. Answer Cards / Teasers (via pageId)
  document.querySelectorAll('[data-page-id]').forEach(el => {
    const pid = el.dataset.pageId;
    el.style.cursor = 'pointer';
    // Remove if already exists to avoid doubles
    el.onclick = null;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openCard(pid);
    });
  });

  // 2. Profile Cards in Discover (via profile-id)
  document.querySelectorAll('[data-profile-id]').forEach(el => {
    if (el.dataset.pageId) return; // skip answer cards which have both
    const pid = el.dataset.profileId;
    el.style.cursor = 'pointer';
    el.onclick = null;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openProfileModal(parseInt(pid));
    });
  });

  // 3. Unanswered Grid Squares
  document.querySelectorAll('[data-input-qid]').forEach(el => {
    const qid = parseInt(el.dataset.inputQid);
    el.style.cursor = 'pointer';
    el.onclick = null;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openInputModal(qid);
    });
  });
};

// Age formatting: List -> "Name 26", Detail -> "26세 (01년생)"
function formatUserHeader(p, context) {
  const birthYear = p.birthYear || (2026 - (p.age || 28) + 1);
  const age = getAge(birthYear);
  const yearShort = getYearLabel(birthYear);
  if (context === 'list') {
    return `${p.name} <span class="card-age" style="font-size:16px; font-weight:400; color:var(--text-muted);">${age}</span>`;
  }
  return `${p.name} <span class="card-age" style="font-size:18px; font-weight:400; opacity:0.9;">${age}세 (${yearShort}년생)</span>`;
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
        
        <div style="display: flex; justify-content: center; margin-bottom: 40px;">
          <div class="avatar-upload" style="width: 100px; height: 100px; border: 2px dashed var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
            <i data-lucide="camera" style="width: 32px; height: 32px;"></i>
          </div>
        </div>
        
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
          아래 항목들은 선택이에요.<br/>
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
        <div class="nav-item active" data-tab="discover" onclick="switchTab('discover')"><i data-lucide="layers"></i><span>발견</span></div>
        <div class="nav-item" data-tab="meetups" onclick="switchTab('meetups')"><i data-lucide="calendar"></i><span>모임</span></div>
        <div class="nav-item" data-tab="messages" onclick="switchTab('messages')"><i data-lucide="message-circle"></i><span>메시지</span></div>
        <div class="nav-item" data-tab="profile" onclick="switchTab('profile')"><i data-lucide="user"></i><span>프로필</span></div>
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
function applyHighlights(text) {
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

  const mc = getModalContainer();
  mc.style.display = 'block';

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
        <div class="book-page-answer">${applyHighlights(ans.text)}</div>
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

    mc.innerHTML = `
      <div id="nb-modal" class="book-page-modal" style="background: ${bgGradient};">
        <!-- Header -->
        <div class="book-page-header">
          <button onclick="${isMyProfile ? 'closeModal()' : `openProfileModal(${p.id})`}" style="background:none;border:none;cursor:pointer;padding:4px;color:#bbb;display:flex;align-items:center;">
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
  };

  window.nbNav = function (newPage) { renderPage(newPage); };
  renderPage(currentPage);
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
      z-index: 999;
      transition: transform 0.15s ease-out;
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
    const row = elem.parentElement;
    row.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('selected'));
    elem.classList.add('selected');

    const textVal = elem.innerText.trim();
    if (type === 'loc') meetupFilterLocation = textVal;
    if (type === 'cat') meetupFilterCategory = textVal;

    if (currentTab === 'meetups') renderMeetupList();
  }

  // Form Modal Component logic handlers
  window.selectModalCategory = function (elem) {
    const grid = elem.parentElement;
    grid.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('selected'));
    elem.classList.add('selected');
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

  window.showPostOnboardingModal = function() {
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

  window.startProfileSetup = function() {
    dismissPostOnboardingModal();
    setTimeout(() => navigateTo('profile-setup-1'), 300);
  };

  window.skipProfileSetup = function() {
    window.profileIncomplete = true;
    dismissPostOnboardingModal();
    setTimeout(() => switchTab('discover'), 300);
  };

  window.showLockedProfileModal = function() {
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

  window.dismissLockedModal = function() {
    const modal = document.getElementById('locked-profile-modal');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s';
      setTimeout(() => modal.remove(), 300);
    }
  };

  window.dismissPostOnboardingModal = function() {
    const modal = document.getElementById('post-onboarding-modal');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s';
      setTimeout(() => modal.remove(), 300);
    }
  };

  window.skipSetupToDiscover = function() {
    window.profileIncomplete = true;
    switchTab('discover');
  };

  window.finalizeProfile = function() {
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
      discoverFeedList = [];
      const profileCards = MOCK_PROFILES.map(profile => ({ id: 'p' + profile.id, type: 'profile', profile }));
      for (let i = profileCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [profileCards[i], profileCards[j]] = [profileCards[j], profileCards[i]];
      }
      discoverFeedList = profileCards.slice(0, 5);
      renderDiscoverTab();
    } else if (tabName === 'meetups') {
      window.showSavedMeetups = false;
      contentArea.innerHTML = `
        <div class="content-padding scroll-y" style="padding-top: 10px; height: calc(100vh - 140px); background: var(--bg-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h2 style="margin:0;">모임</h2>
          <button id="meetup-collection-toggle" onclick="toggleSavedMeetups()" style="background: none; border: none; cursor: pointer; border-radius:50%; width:40px; height:40px; color: #9B72CC; display:flex; align-items:center; justify-content:center; transition: background 0.2s;">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" id="meetup-collection-toggle-icon">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
             </svg>
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
            ${['전체', '🎬 문화생활', '🏃 액티비티', '🍽️ 식도락', '📚 스터디', '🎨 크리에이티브', '✨ 소셜'].map(cat =>
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
      <div class="message-list" style="padding-top: 10px;">
        <h2 style="padding: 0 24px; margin-bottom: 8px;">메시지</h2>
        ${MOCK_CHATS.map(chat => {
        const p = MOCK_PROFILES.find(pr => pr.name === chat.name);
        return `
            <div class="message-item" onclick="openChat(${chat.id})">
              <div class="msg-avatar" style="background-image: url('${chat.image}')"></div>
              <div class="msg-info">
                <div class="msg-header-row">
                  <span class="msg-name" style="display:flex; align-items:center; gap:6px;">${chat.name} <span class="card-age" style="font-size:14px; font-weight:400; color:var(--text-muted);">${getAge(p ? p.birthYear : 2001)}</span></span>
                  <span class="msg-time">${chat.time}</span>
                </div>
                <div class="msg-preview">${chat.preview}</div>
                <div class="msg-source">${chat.source}</div>
              </div>
            </div>
          `;
      }).join('')}
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
      const gridHtml = renderAnswersGrid(MY_ANSWERS, true, 'myProfile');
      document.getElementById('my-answers-grid').innerHTML = gridHtml;
      bindCardInteractions();
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.renderMeetupList = function () {
    const container = document.getElementById('meetups-list-container');
    if (!container) return;

    let filtered = MOCK_MEETUPS.filter(m => {
      let locMatch = meetupFilterLocation === '전체' || m.fullAddress.includes(meetupFilterLocation);
      let catMatch = meetupFilterCategory === '전체' || m.type === meetupFilterCategory;
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
      const capPercent = (m.currentCap / m.maxCap) * 100;
      const isEndingSoon = (m.currentCap / m.maxCap) >= 0.8 && m.currentCap < m.maxCap;
      const isFull = m.currentCap >= m.maxCap;
      return `
            <div class="meetup-item fade-in ${m.hasRSVPd ? 'meetup-item-rsvpd' : ''}" onclick="openMeetupDetail(${m.id})">
              ${m.isRecommended ? `<div class="meetup-recommended-badge">나와 잘 맞아요 ✨</div>` : ''}
              <div class="meetup-bookmark-btn" id="bm-${m.id}" onclick="event.stopPropagation(); toggleBookmark(${m.id})">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" stroke="#9B72CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="${window.bookmarkedMoims[m.id] ? '#9B72CC' : 'none'}">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="meetup-header"><div class="meetup-chip">${m.type}</div></div>
              <div>
                <div class="meetup-date">${m.date}</div>
                <div class="meetup-title">${m.title}</div>
                <div class="meetup-location-preview">📍 ${m.shortLocation}</div>
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
                ${isFull && !m.hasRSVPd ? `<button class="rsvp-btn" disabled>마감</button>` : `<button class="rsvp-btn ${m.hasRSVPd ? 'rsvpd' : ''}" onclick="event.stopPropagation(); openMeetupDetail(${m.id})">${m.hasRSVPd ? '신청 완료 ✓' : 'RSVP'}</button>`}
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
        const pidStr = (profileId === 'myProfile' || profileId === 1) ? 'myProfile' : profileId;
        const pageId = `user${pidStr}_Q${q.id}`;
        if (ans) {
          if (isCurrentUser) {
            const chapBg = chapColors[q.chapter] || '#FAFAF8';
            const isNotebook = !ans.image && !ans.polaroid;
            gHtml += `
            <div class="grid-square answered-text ${isNotebook ? 'notebook-paper' : ''} interactable" 
                 data-page-id="${pageId}"
                 style="border-radius:12px; background: ${chapBg};">
               <div class="grid-q-badge" style="top:10px; left:10px; font-size:10px; color:#aaa;">Q.${q.id}</div>
               ${ans.polaroid ? `<div class="polaroid-frame" style="width: 80px; transform: scale(0.6) rotate(-2deg); margin: 0; position: absolute; top: 10px; right:-10px;"><img src="${ans.polaroid}" class="polaroid-img" /></div>` : ''}
               <div class="grid-ans-text" style="font-size:13px; color:#555; padding: 28px 10px 10px 10px; text-align:left; width:100%; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden;">${applyHighlights(ans.text)}</div>
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
            <div class="grid-square unanswered interactable" data-input-qid="${q.id}">
               <div class="grid-unans-text">${q.text}</div>
               <i data-lucide="plus" style="width:16px; height:16px; color:#BAB6AD; position:absolute; bottom:12px; left:50%; transform:translateX(-50%);"></i>
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
    let chapTitle = "";
    if (q.chapter === 1) chapTitle = "Chapter 1. 내가 생각하는 나";
    if (q.chapter === 2) chapTitle = "Chapter 2. 내가 생각하는 사랑";
    if (q.chapter === 3) chapTitle = "Chapter 3. 내가 생각하는 우리의 미래";

    mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--surface);">
       <div class="app-header" style="background:var(--surface);">
         <button class="back-btn" onclick="closeModal()"><i data-lucide="x"></i></button>
         <div style="font-weight:600; font-size:16px;">답변 작성</div>
         <div style="width:32px;"></div>
       </div>
       <div class="content-padding scroll-y">
         <div style="font-size:13px; color:var(--primary); font-weight:600; margin-bottom:12px;">${chapTitle}</div>
         <h2 style="font-size:20px; margin-bottom:32px;">Q${q.id}. ${q.text}</h2>
         
         <textarea id="temp-ans-${q.id}" class="input-field" style="height: 140px; resize: none; border-radius: 12px; font-size: 16px;" placeholder="편안하게 당신의 이야기를 들려주세요."></textarea>
         
         <button class="btn-secondary" style="margin-bottom: 24px; display:flex; gap:8px; justify-content:center;"><i data-lucide="image"></i> 사진 추가</button>
         
         <button class="btn-primary" onclick="saveAnswer(${q.id})">저장하기</button>
         <div style="text-align:center; margin-top:24px;">
           <span style="color:var(--text-muted); font-size:14px; text-decoration:underline; cursor:pointer;" onclick="closeModal()">건너뛰기</span>
         </div>
       </div>
    </div>
  `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  window.saveAnswer = function (qId) {
    const val = document.getElementById(`temp-ans-${qId}`).value.trim();
    if (val) {
      myAnswers[qId] = { text: val };
    }
    closeModal();
    switchTab('profile');
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

    // --- My Profile: rectangular placeholder ---
    const myPhotoSectionHTML = (() => {
      return `
      <div style="width:100%; height:220px; background:#F0F0EE; display:flex; align-items:center; justify-content:center; position:relative;">
        <i data-lucide="camera" style="width:40px; height:40px; color:#C2C2C0;"></i>
        <!-- Optional: photo overlay if we had userProfilePhoto -->
        ${userProfilePhoto ? `<div style="position:absolute; inset:0; background-image:url('${userProfilePhoto}'); background-size:cover; background-position:center;"></div>` : ''}
      </div>
    `;
    })();

    // --- Others' profile: full-width swipeable carousel ---
    const photoSectionHTML = (isMine || isPreview) ? myPhotoSectionHTML
      : photos.length > 1 ? `
    <div id="prof-carousel" style="position:relative; width:100%; height:450px; overflow:hidden;">
      <div id="prof-carousel-inner" style="display:flex; width:${photos.length * 100}%; height:100%; transition:transform 0.3s ease;">
        ${photos.map(ph => `<div style="flex:0 0 ${100 / photos.length}%; height:100%; background-image:url('${ph}'); background-size:cover; background-position:center;"></div>`).join('')}
      </div>
      <div style="position:absolute; bottom:12px; left:0; width:100%; display:flex; justify-content:center; gap:6px; z-index:5;">
        ${photos.map((_, pi) => `<div style="width:6px; height:6px; border-radius:50%; background:${pi === 0 ? '#FFF' : 'rgba(255,255,255,0.5)'}; transition:background 0.2s;" data-prof-dot="${pi}"></div>`).join('')}
      </div>
    </div>
  ` : `<div class="prof-modal-photo" style="background-image:url('${p.image}'); height:450px; background-size:cover; background-position:center;"></div>`;

    const locationStr = p.location || userLocation;
    const locationSpan = `<span style="font-size:18px; font-weight:400; opacity:0.9;"> · ${locationStr}</span>`;
    const headerContent = isMine ? `${formatUserHeader(p, 'detail')}${locationSpan} ${getRoleBadgeHTML(p.role)}` : 
      `${p.name} <span style="font-size:18px; font-weight:400; opacity:0.9;"> ${age}세 (${yearSuffix}년생) · ${locationStr}</span> ${getRoleBadgeHTML(p.role)}`;

    return `
    <div style="padding-bottom:120px;">
      ${photoSectionHTML}
      
      <div style="padding: 24px;">
        <div class="card-name" style="font-size:${(isMine || isPreview) ? '28px' : '18px'}; display:flex; align-items:center; gap:8px; font-weight:${(isMine || isPreview) ? '700' : '400'}; color:${(isMine || isPreview) ? 'var(--text-dark)' : '#777'}; flex-wrap:wrap;">
          ${headerContent}
        </div>

        <div class="card-tags" style="margin-top:16px;">
          ${(p.tags || []).map(t => `<div class="card-tag">${t}</div>`).join('')}
        </div>

        <div class="profile-badge" style="margin-top:24px; display:inline-block;">
          ${p.intent || '연애를 기대해요 ❤️'}
        </div>

        <div style="font-size:15px; margin-top:20px; line-height:1.5; color:var(--text-dark);">
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
      ${isMine ? `<p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">가치관을 보여줄 수 있는 27개의 질문에 답해보세요.</p>` : ''}
      
      <div id="my-answers-grid" class="answers-grid" style="column-gap:8px; row-gap:8px;">
      </div>

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
      chapterProgress: { c1: 0, c2: 0, c3: 0 }
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
       <div class="modal-fixed-bottom">
          <button class="btn-primary" style="box-shadow: 0 8px 24px rgba(188, 160, 206, 0.4);" onclick="sendLike()">좋아요 보내기 💜</button>
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
  }


  function getDetailDateString(timestamp) {
    if (!timestamp) return "";
    const dt = new Date(timestamp);
    const nextMonday = new Date("2026-04-27T00:00:00");
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const dayName = days[dt.getDay()];
    const hours = dt.getHours();
    const period = hours >= 12 ? '저녁' : '오전';
    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const timeStr = `${period} ${displayHour}시`;

    if (dt < nextMonday) {
      return `${dayName} ${timeStr}`;
    } else {
      return `${dt.getMonth() + 1}/${dt.getDate()} ${dayName} ${timeStr}`;
    }
  }

  window.openMeetupDetail = function (id) {
    const m = MOCK_MEETUPS.find(x => x.id === id);
    const mc = getModalContainer();
    const capPercent = (m.currentCap / m.maxCap) * 100;
    const isGroup = m.hostType === '단체';
    const isPrivate = m.hostType === '개인' && !m.hostPublic;

    mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color);">
       <div class="app-header" style="background:var(--bg-color);">
         <button class="back-btn" onclick="closeModal(); if(currentTab==='meetups') renderMeetupList();"><i data-lucide="chevron-left" style="width:28px;"></i></button>
         <div></div>
         <button id="detail-bm-${m.id}" onclick="event.stopPropagation(); toggleBookmark(${m.id})" style="background: none; border: none; cursor: pointer; color: #9B72CC; display:flex; align-items:center; justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="${window.bookmarkedMoims[m.id] ? '#9B72CC' : 'none'}">
               <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
         </button>
       </div>
       <div class="scroll-y" style="padding: 10px 24px 140px;">
          <div style="color:var(--primary); font-size:14px; font-weight:700; margin-bottom:8px;">${m.type} · ${getDetailDateString(m.timestamp)}</div>
          <h2 style="font-size: 26px; line-height: 1.3; margin-bottom: 8px; font-weight:800;">${m.title}</h2>
          
          ${!m.hasRSVPd ?
        `<div class="meetup-location-preview" style="margin-bottom: 24px; font-size:15px; color:#666;">📍 ${m.shortLocation}</div>` :
        `<div class="address-reveal-card" style="margin-bottom:24px;">
                <div class="address-reveal-card-title"><i data-lucide="map-pin" style="width:16px;"></i> 장소 안내</div>
                <div class="address-reveal-card-text" style="white-space: pre-wrap;">${m.fullAddress}</div>
                <div class="address-reveal-card-sub">참여 확정 후 공개되는 장소입니다</div>
              </div>`
      }

          <!-- New Info Fields -->
          <div style="margin-bottom: 32px; border-top: 1px solid #EEE; padding-top: 20px;">
            <div style="display:flex; margin-bottom:12px;">
              <div style="width:80px; font-size:14px; color:#888;">스타일</div>
              <div style="font-size:14px; color:var(--text-dark); font-weight:500;">${m.styleTrait || '무관'}</div>
            </div>
            <div style="display:flex;">
              <div style="width:80px; font-size:14px; color:#888;">참여비</div>
              <div style="font-size:14px; color:var(--text-dark); font-weight:500;">${m.fee || '무료'}</div>
            </div>
          </div>
          
          <!-- Host Section (Conditional) -->
          ${!isPrivate ? `
          <div style="display:flex; align-items:center; margin-bottom: 32px; padding: 16px; background:#F9F9F9; border-radius:16px;">
             ${isGroup ?
          `<div style="width:48px; height:48px; border-radius:12px; background-image:url('${m.hostLogo}'); background-size:cover; background-position:center;"></div>` :
          `<div class="attendee-avatar" style="width:48px; height:48px; background-image:url('${MOCK_PROFILES.find(p => p.name === m.hostName)?.image || USER_PHOTOS[0]}'); background-size:cover; background-position:center top;"></div>`
        }
             <div style="margin-left: 12px; flex:1;">
                <div style="font-size:15px; font-weight:700; display:flex; align-items:center; gap:6px;">
                  HOST: ${m.hostName} 
                  ${!isGroup ? getRoleBadgeHTML(MOCK_PROFILES.find(p => p.name === m.hostName)?.role) : ''}
                </div>
                <div style="font-size:13px; color:#777; margin-top:2px;">${m.hostBio}</div>
             </div>
          </div>
          ` : ''}
          
          <div style="font-size:16px; line-height:1.6; color:var(--text-dark); margin-bottom: 12px;">
            ${m.desc}
          </div>

          <!-- Hashtags -->
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:40px;">
            ${(m.tags || []).map(tag => `<div style="padding:4px 10px; border:1px solid #C89FDB; color:#9B72CC; border-radius:100px; font-size:12px; font-weight:500;">${tag}</div>`).join('')}
          </div>
          
          <div style="background:var(--surface); padding:20px; border-radius:16px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <div style="font-size:15px; font-weight:600; margin-bottom:12px;">참여자 (${m.currentCap}/${m.maxCap}명)</div>
            <div class="progress-track" style="margin-bottom: 24px;">
               <div class="progress-fill" style="width: ${capPercent}%;"></div>
            </div>
            <div class="attendee-stack" style="flex-wrap: wrap; gap:8px;">
               ${(m.participants || []).map(url => `
                 <div class="attendee-avatar" style="width:40px; height:40px; margin-left:0; border: ${isPrivate ? '2px solid #C89FDB' : 'none'}; background-image:url('${url}');background-size:cover;background-position:center top;"></div>
               `).join('')}
            </div>
          </div>

          <!-- Rules Section -->
          <div style="margin-top:24px; padding:20px; background:#F0F0F0; border-radius:16px;">
            <div style="font-size:14px; font-weight:700; margin-bottom:8px; color:#555;">주의사항</div>
            <div style="font-size:14px; color:#666; line-height:1.5;">${m.rules || '매너 있는 참여 부탁드립니다.'}</div>
          </div>

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
       <div class="modal-fixed-bottom" style="z-index: 50; pointer-events: none;">
          <button id="detail-rsvp-btn" class="btn-primary" style="pointer-events: auto; ${m.hasRSVPd ? 'background:#7BC47F; pointer-events:none; box-shadow: 0 8px 16px rgba(123, 196, 127, 0.4); border:none;' : 'box-shadow: 0 8px 24px rgba(188, 160, 206, 0.4);'}" onclick="submitRSVP(${m.id})">
             ${m.hasRSVPd ? '신청 완료 ✓' : '참여 신청하기'}
          </button>
       </div>
    </div>
  `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  window.openCreateMeetupModal = function () {
    const mc = getModalContainer();

    // Pickers payload generation arrays
    const hourOpts = [];
    for (let i = 6; i <= 11; i++) hourOpts.push(`오전 ${i}시`);
    hourOpts.push(`정오 12시`);
    for (let i = 1; i <= 11; i++) hourOpts.push(`오후 ${i}시`);

    const minOpts = ['00분', '30분'];

    const capOpts = [];
    for (let i = 2; i <= 30; i++) capOpts.push(`${i}명`);

    // Explicit calendar structural map mapping strictly to 2026/04 bounding
    const calendarDays = [];
    for (let i = 0; i < 3; i++) calendarDays.push(`<div class="calendar-day empty"></div>`);
    for (let i = 1; i <= 30; i++) {
      calendarDays.push(`<div class="calendar-day ${i === 18 ? 'selected' : ''}" onclick="selectCalendarDay(this, ${i})">${i}</div>`);
    }

    mc.innerHTML = `
    <div class="modal fade-in active" style="z-index: 100; background: var(--bg-color);">
       <div class="app-header" style="background:var(--bg-color);">
         <div style="font-weight:600; font-size:16px; margin:0 auto;">모임 열기</div>
       </div>
       <div class="scroll-y" style="padding: 20px 24px 120px;">
          
          <div style="font-size:14px; font-weight:600; margin-bottom:12px;">카테고리 선택</div>
          <div class="modal-category-grid">
            ${['🎬 문화생활', '🏃 액티비티', '🍽️ 식도락', '📚 스터디', '🎨 크리에이티브', '✨ 소셜'].map((cat, idx) =>
      `<div class="filter-chip ${idx === 0 ? 'selected' : ''}" onclick="selectModalCategory(this)" style="width:100%; border-radius:12px;">${cat}</div>`
    ).join('')}
          </div>

          <div style="font-size:14px; font-weight:600; margin-bottom:12px; margin-top:32px;">모임 이름</div>
          <input type="text" class="input-field" placeholder="모임 이름" style="margin-bottom: 24px;" />
          
          <div style="font-size:14px; font-weight:600; margin-bottom:12px; margin-top:8px;">장소</div>
          <input type="text" class="input-field" placeholder="장소명, 주소를 입력해주세요" style="margin-bottom: 24px;" />
          
          <div style="font-size:14px; font-weight:600; margin-bottom:12px; margin-top:8px;">날짜</div>
          <div class="calendar-wrapper">
             <div class="calendar-header">
                <i data-lucide="chevron-left" style="width:20px; color:var(--text-muted);"></i>
                <div id="cal-header-text">2026년 4월 18일 (토)</div>
                <i data-lucide="chevron-right" style="width:20px; color:var(--text-muted);"></i>
             </div>
             <div class="calendar-grid">
                <div class="calendar-day-header" style="color:#FF6B6B;">일</div>
                <div class="calendar-day-header">월</div><div class="calendar-day-header">화</div>
                <div class="calendar-day-header">수</div><div class="calendar-day-header">목</div>
                <div class="calendar-day-header">금</div><div class="calendar-day-header">토</div>
                ${calendarDays.join('')}
             </div>
          </div>

          <div style="font-size:14px; font-weight:600; margin-bottom:12px; margin-top:8px;">시간</div>
          <div class="picker-wrapper">
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
          
          <div style="font-size:14px; font-weight:600; margin-bottom:12px; margin-top:8px;">설명</div>
          <textarea class="input-field" style="height: 120px; resize: none; margin-bottom:24px;" placeholder="이 모임에 대해 구체적으로 알려주세요."></textarea>
          
          <div style="font-size:14px; font-weight:600; margin-bottom:12px; margin-top:8px;">정원 (명)</div>
          <div class="picker-wrapper" style="margin-bottom: 24px;">
             <div class="picker-wheel-container" onscroll="handleWheelScroll(this)">
                <div class="picker-spacer"></div>
                ${capOpts.map(c => `<div class="picker-item">${c}</div>`).join('')}
                <div class="picker-spacer"></div>
             </div>
             <div class="picker-overlay-bar"></div>
          </div>
          
          <button class="btn-primary" style="margin-top:24px;" onclick="closeModal()">모임 만들기</button>
          <div style="text-align:center; margin-top:20px;">
            <span style="color:var(--text-muted); font-size:15px; text-decoration:underline; cursor:pointer;" onclick="closeModal()">취소</span>
          </div>
       </div>
    </div>
  `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Instant snap initialization to centralize active variables 
    setTimeout(() => {
      const wheels = document.querySelectorAll('.picker-wheel-container');
      if (wheels.length >= 3) {
        // Hour index: target 오후 7시 (13th element down)
        wheels[0].scrollTop = 13 * 40;
        // Minute index: target 00분 (0th element)
        wheels[1].scrollTop = 0;
        // Capacity index: target 8 (6th element down inside 2...30 span)
        wheels[2].scrollTop = 6 * 40;

        wheels.forEach(w => window.handleWheelScroll(w));
      }
    }, 30);
  }

  window.closeModal = function () {
    const mc = document.getElementById('modal-container');
    if (mc) mc.innerHTML = '';
  }

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

  window.openChat = function (chatId) {
    const chat = MOCK_CHATS.find(c => c.id === chatId);
    if (!chat) return;

    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    const renderChatView = () => {
      contentArea.innerHTML = `
      <div style="position: absolute; top:-60px; left:0; width: 100%; height: calc(100vh - 84px); background: var(--bg-color); z-index: 50; display:flex; flex-direction:column;">
        <div class="chat-header">
          <button class="back-btn" onclick="switchTab('messages')"><i data-lucide="chevron-left" style="width:28px;"></i></button>
          <div class="chat-header-user-info" style="display:flex; align-items:center; cursor:pointer;" onclick="openChatProfile(${chatId})">
            <div class="chat-room-avatar" style="background-image: url('${chat.image}')"></div>
            <div style="display:flex; flex-direction: column;">
              <div class="chat-room-name" style="display:flex; align-items:center; gap:8px;">${chat.name}</div>
              <div style="font-size:11px; color:var(--primary); font-weight:600;">${chat.score}</div>
            </div>
          </div>
        </div>

        <div class="chat-scroller">
          ${chat.messages.map(m => `
            <div class="chat-bubble ${m.type}">${m.text}</div>
          `).join('')}
        </div>
        <div class="chat-input-bar">
          <button style="border:none; background:none; cursor:pointer; color: var(--text-muted);"><i data-lucide="plus" style="width: 24px;"></i></button>
          <input type="text" class="chat-input" placeholder="메시지 보내기..." />
          <button style="border:none; background:none; cursor:pointer; color: var(--primary);"><i data-lucide="send" style="width: 20px;"></i></button>
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
        <div class="modal-fixed-bottom" style="position:sticky; bottom:0;">
          <button class="btn-primary" style="box-shadow: 0 8px 24px rgba(188,160,206,0.4);" onclick="sendLike()">좋아요 보내기 💜</button>
        </div>
      </div>
    `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    renderChatView();
  }

  window.setDiscoverFilter = function (f) { discoverFilterType = f; renderDiscoverTab(); };
  window.toggleLikedCollection = function () { window.showLikedCollection = !window.showLikedCollection; renderDiscoverTab(); };
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
  window.restartDiscover = function () { swipeHistory = []; renderDiscoverTab(); };

  window.renderDiscoverTab = function () {
    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    const bgColors = ['#EDE8F5', '#E8E8F5', '#FAF5EB'];
    let colorIdx = 0;

    let activeFeed = [];
    
    if (window.showLikedCollection) {
      // Find profiles in swipeHistory with 'like' action
      const likedIds = swipeHistory
        .filter(s => s.action === 'like' && s.id.startsWith('p'))
        .map(s => s.id);
      
      // Get unique IDs in case of duplicates
      const uniqueLikedIds = [...new Set(likedIds)];
      
      activeFeed = uniqueLikedIds.map(id => {
        const pId = parseInt(id.replace('p', ''));
        const profile = MOCK_PROFILES.find(p => p.id === pId);
        return { id, type: 'profile', profile };
      }).filter(item => item.profile);
    } else {
      activeFeed = discoverFeedList.filter(item => !swipeHistory.find(s => s.id === item.id));
    }



    let feedHTML = '';
    if (activeFeed.length === 0) {
      if (window.showLikedCollection) {
        feedHTML = `
          <div class="discover-empty show" style="margin-top: 40px; height: 200px; display:flex; flex-direction:column; align-items:center;">
            <p style="text-align:center; color:var(--text-dark); margin-bottom:24px;">아직 발견을 못하셨군요.<br/>내일 새로운 프로필북이 기다리고 있어요. ☺️</p>
          </div>
        `;
      } else {
        feedHTML = `
          <div class="discover-empty show" style="margin-top: 40px; height: 200px; display:flex; flex-direction:column; align-items:center;">
            <i data-lucide="moon" style="width: 48px; height: 48px; color: var(--text-muted); opacity: 0.5; margin-bottom: 16px;"></i>
            <p style="text-align:center; color:var(--text-dark); margin-bottom:24px;">오늘은 여기까지예요 🌙<br/>내일 새로운 사람들이 기다리고 있어요.</p>
            <button class="btn-secondary" style="color:var(--primary); border:1px solid var(--primary); background:transparent;" onclick="restartDiscover()">처음부터 다시 보기</button>
          </div>
        `;
      }
    } else {
      activeFeed.forEach((item, i) => {
        if (item.type === 'profile') {
          const p = item.profile;
          const photos = p.photos || [p.image];
          const cardId = `card-${item.id}`;
          const photoCarouselHTML = photos.length > 1 ? `
          <div id="carousel-${item.id}" style="position:relative; flex:0 0 273px; height:273px; overflow:hidden;">
            <div id="carousel-inner-${item.id}" style="display:flex; width:${photos.length * 100}%; height:100%; transition:transform 0.3s ease;">
              ${photos.map(ph => `<div style="flex:0 0 ${100 / photos.length}%; height:100%; background-image:url('${ph}'); background-size:cover; background-position:center;"></div>`).join('')}
            </div>
            <div style="position:absolute; bottom:8px; left:0; width:100%; display:flex; justify-content:center; gap:5px; z-index:5;">
              ${photos.map((_, pi) => `<div class="photo-dot ${pi === 0 ? 'active' : ''}" data-carousel="${item.id}" data-idx="${pi}"></div>`).join('')}
            </div>
          </div>
        ` : `<div class="type-a-photo" style="background-image: url('${p.image}')"></div>`;

          feedHTML += `
          <div class="swipe-card type-a-card" id="${cardId}" data-id="${item.id}" onclick="handleCardClick(${p.id})">
             ${photoCarouselHTML}
              <div class="type-a-content">
                <div style="position:absolute; top:16px; left:16px; background:rgba(0,0,0,0.4); color:#FFF; font-size:12px; font-weight:700; padding:4px 10px; border-radius:12px;">${p.score}</div>
                <div class="card-name" style="font-size:22px; display:flex; align-items:center; gap:8px;">
                  ${formatUserHeader(p, 'list')} 
                  ${getRoleBadgeHTML(p.role)}
                </div>
                <div class="card-tags" style="margin-top:12px;">${p.tags.map(t => `<div class="card-tag">${t}</div>`).join('')}</div>
                <div class="card-bio" style="font-size:14px; margin-top:10px; line-height:1.4;">${p.bio}</div>
             </div>
             <div class="action-overlay overlay-like"><div class="like-stamp"><i data-lucide="heart" fill="#BCA0CE" style="color:#BCA0CE; width:32px;"></i></div></div>
             <div class="action-overlay overlay-nope"><div class="nope-stamp">X</div></div>
          </div>
        `;
        }
        else if (item.type === 'answer') {
          const p = item.profile;
          const qObj = QUESTIONS.find(q => q.id === item.qId);
          const ansObj = p.answers[item.qId];
          if (!qObj || !ansObj) return;

          const bgColors = ['#EDE8F5', '#E8E8F5', '#F5F0E8', '#E8F5F0'];
          const bg = bgColors[i % 4];
          const chapLabel = qObj.chapter === 1 ? '나' : (qObj.chapter === 2 ? '사랑' : '관계');
          const isNotebook = !ansObj.image && !ansObj.polaroid;
          const bgStyle = ansObj.polaroid ? `background-image: url('${ansObj.polaroid}'); background-size: cover; background-position: center; filter: blur(12px) brightness(0.85);` : '';

          const pidStr = p.id;
          const pageId = `user${pidStr}_Q${item.qId}`;

          feedHTML += `
          <div class="swipe-card type-b-card" 
               data-page-id="${pageId}"
               data-profile-id="${p.id}"
               style="background:${ansObj.polaroid ? 'transparent' : (isNotebook ? '#FFF' : bg)}; padding:0; display:flex; flex-direction:column;" 
               data-id="${item.id}"
               onclick="handleCardClick(${p.id}, ${item.qId})">
            ${ansObj.polaroid ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; ${bgStyle} z-index:1;"></div>` : ''}
            <div class="teaser-frosted-overlay" style="z-index:2;"></div>
            ${getLikedBadgeHTML(pageId)}
            
            <div style="display:flex; justify-content:space-between; padding: 20px; z-index:3;">
              <div style="font-size:11px; color:${ansObj.polaroid ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'}; font-weight:600;">Chapter ${qObj.chapter} &middot; ${chapLabel}</div>
              <div style="font-size:11px; color:${ansObj.polaroid ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'}; font-weight:600;">Q.${qObj.id}</div>
            </div>
            
            <div class="${isNotebook ? 'notebook-paper' : ''}" style="flex:1; display:flex; flex-direction:column; ${isNotebook ? 'align-items:flex-start; justify-content:flex-start; padding: 16px 24px; text-align:left;' : 'align-items:center; justify-content:center; padding: 0 32px; text-align:center;'} z-index:3;">
              <div class="ans-card-q-text" style="color:${ansObj.polaroid ? 'rgba(255,255,255,0.75)' : '#777'};">${qObj.text}</div>
              <div style="font-size:20px; font-weight:500; line-height:28px; color:${ansObj.polaroid ? '#FFF' : 'var(--text-dark)'}; ${ansObj.polaroid ? 'margin-bottom:20px;' : 'margin-top:20px;'}">${applyHighlights(ansObj.text)}</div>
              ${ansObj.polaroid ? `
      <div style="background:#FFF; padding:8px 8px 28px 8px; box-shadow:2px 3px 8px rgba(0,0,0,0.12); transform:rotate(-2deg); width:160px; margin:0 auto;">
                  <img src="${ansObj.polaroid}" style="width:100%; height:144px; object-fit:cover; display:block;" />
                </div>
              ` : ''}
            </div>

            <div style="padding: 24px; border-top: 1px solid ${ansObj.polaroid ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.03)'}; z-index:3;">
              <div style="display:flex; align-items:center;">
                <div style="width:32px; height:32px; border-radius:50%; background-image:url('${p.image}'); background-size:cover; margin-right:10px; ${ansObj.polaroid ? 'box-shadow:0 0 0 2px rgba(255,255,255,0.3);' : ''}"></div>
                <div class="card-name" style="font-size:16px; display:flex; align-items:center; gap:6px; ${ansObj.polaroid ? 'color:#FFF; text-shadow:0 1px 4px rgba(0,0,0,0.7);' : ''}">
                  ${formatUserHeader(p, 'list')} ${getRoleBadgeHTML(p.role)}
                </div>
              </div>
            </div>

            <div class="action-overlay overlay-like"><div class="like-stamp"><i data-lucide="heart" fill="#BCA0CE" style="color:#BCA0CE; width:32px;"></i></div></div>
            <div class="action-overlay overlay-nope"><div class="nope-stamp">X</div></div>
          </div>
        `;
        }
      });
    }

    contentArea.innerHTML = `
    <div id="discover-feed-container" class="content-padding scroll-y" style="padding-top: 10px; height: calc(100vh - 110px); background: #FAF9F6; overflow-y: auto; overflow-x: hidden; position: relative;">
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="margin-bottom:4px;">${window.showLikedCollection ? '좋아요 모음' : '발견'}</h2>
          <p style="margin-bottom: 24px; font-size:14px; color:var(--text-muted);">
            ${window.showLikedCollection ? '관심 표현한 프로필 모아보기' : '가치관, 취향이 맞는 사람을 만나보세요.'}
          </p>
        </div>
        <button onclick="toggleLikedCollection()" style="background: none; border: none; cursor: pointer; padding: 8px; color: #9B72CC;">
          <i data-lucide="heart" style="width: 24px; height: 24px;" ${window.showLikedCollection ? 'fill="#9B72CC"' : ''}></i>
        </button>
      </div>

      <div class="feed-layout-container" style="overflow: visible; padding-bottom: 80px;">
         ${feedHTML}
      </div>
    </div>
  `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    initSwipeCards();
    initPhotoCarousels();
    bindCardInteractions();
  };

  window.initSwipeCards = function () {
    const cards = document.querySelectorAll('.swipe-card:not(.meetup-card)');

    cards.forEach(card => {
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      card.addEventListener('pointerdown', (e) => {
        if (window.profileIncomplete && !window.profileComplete) return;
        isDragging = true;
        startX = e.clientX;
        card.classList.add('dragging');
        card.setPointerCapture(e.pointerId);
      });

      card.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.clientX - startX;
        let rotate = currentX * 0.05;
        card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

        const likeOver = card.querySelector('.overlay-like');
        const nopeOver = card.querySelector('.overlay-nope');
        if (currentX > 0) {
          if (likeOver) likeOver.style.opacity = Math.min(currentX / 100, 1);
          if (nopeOver) nopeOver.style.opacity = 0;
        } else {
          if (nopeOver) nopeOver.style.opacity = Math.min(Math.abs(currentX) / 100, 1);
          if (likeOver) likeOver.style.opacity = 0;
        }
      });

      const handlePointerEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('dragging');

        if (currentX > 80) {
          card.classList.add('swiped-right');
          swipeHistory.push({ id: card.getAttribute('data-id'), action: 'like' });
          setTimeout(() => renderDiscoverTab(), 250);
        } else if (currentX < -80) {
          card.classList.add('swiped-left');
          swipeHistory.push({ id: card.getAttribute('data-id'), action: 'pass' });
          setTimeout(() => renderDiscoverTab(), 250);
        } else {
          card.style.transform = '';
          const likeOver = card.querySelector('.overlay-like');
          const nopeOver = card.querySelector('.overlay-nope');
          if (likeOver) likeOver.style.opacity = 0;
          if (nopeOver) nopeOver.style.opacity = 0;
        }
        currentX = 0;
      };

      card.addEventListener('pointerup', handlePointerEnd);
      card.addEventListener('pointercancel', handlePointerEnd);
    });
  };

function startApp() {
  if (!appContainer) return;
  const splash = createScreen('splash', `
  <!-- Book spine: text reads top→bottom (writing-mode: vertical-lr) -->
  <div class="splash-spine">
    <span class="splash-spine-logo">p<svg viewBox="0 0 24 24" width="8" height="8" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:baseline;position:relative;top:-1px;left:-4px;transform:rotate(135deg);margin:0 1px;"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#C89FDB"/></svg>2</span>
    <span class="splash-spine-tagline">On the same page</span>
    <span class="splash-spine-studio">Versatile Studio</span>
  </div>

  <!-- Book cover: 3-zone flex column -->
  <div class="splash-cover">
    <!-- TOP: tagline -->
    <div class="splash-tagline-top">On the same page</div>
    <!-- CENTER: logo, fills remaining height -->
    <div class="splash-logo-wrap">
      <div class="cover-logo">p<svg class="logo-heart" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:baseline;position:relative;top:4px;left:-3px;transform:rotate(45deg);margin:0 1px;"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#E2FF74"/></svg>2</div>
    </div>
    <!-- BOTTOM: studio -->
    <div class="splash-studio">Versatile<br>Studio</div>
  </div>
`);
  splash.classList.add('active');
  splash.classList.remove('hidden-right');
  appContainer.appendChild(splash);

  let transitioned = false;
  const doTransition = () => {
    if (transitioned) return;
    transitioned = true;
    navigateTo('onboarding-0');
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
