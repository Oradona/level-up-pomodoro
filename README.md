# level-up-pomodoro

Intelligent Pomodoro timer with AI-powered motivation and learning analytics.

집중할수록 레벨이 오르는 게임형 뽀모도로 타이머입니다. Next.js 14 App Router + TypeScript + Tailwind CSS로 만들어졌고, 모든 데이터는 브라우저 `localStorage`에 저장됩니다 (백엔드 불필요).

## 기능

- **뽀모도로 타이머** — 집중 25분 / 짧은 휴식 5분, 4회마다 긴 휴식 15분. 시작·일시정지·리셋·건너뛰기 지원.
- **커스텀 시간 설정** — 집중 15~60분, 짧은 휴식 1~15분, 긴 휴식 10~30분, 사이클 길이(2~8), 자동 시작 옵션.
- **XP & 레벨** — 뽀모도로 1개 = 25 XP, 100 XP마다 레벨 업(= 4 뽀모도로). XP 바와 퍼센트 표시.
- **AI 응원 메시지** — 레벨 업 시 모달로 표시. `lib/aiMessages.ts`의 목(mock) 생성기가 레벨을 기준으로 24개 이상의 한국어 명언을 순환시킵니다. 실제 `@github/copilot-api` 호출은 인증이 필요하므로 동일한 async 인터페이스(`requestLevelUpMessage`)로 대체했습니다.
- **통계 대시보드** — 오늘 / 이번 주 / 최고 연속일 / 총 누적 시간, 최근 7일 막대 그래프, 24시간 시간대별 생산성 분석 (CSS 차트).
- **백색소음** — 빗소리·파도소리·카페·숲속. Web Audio API로 실시간 합성(오디오 파일 없음), 볼륨 조절, 집중 세션에서만 재생되고 휴식에는 자동 정지.
- **친구 시스템** — 이메일/사용자명으로 요청 전송, 받은 요청 수락·거절, 친구별 레벨·주간 뽀모도로·총 XP·최고 연속일 비교, XP 랭킹.

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 프로덕션 빌드
npm run lint
```

## 구조

```
app/            레이아웃, 메인 페이지(4개 탭: 타이머 / 통계 / 설정 / 친구)
components/     Timer, XPBar, Settings, Stats, Friends, LevelUpModal, WhiteNoise
hooks/          usePomodoro, useXP, useStats, useFriends
lib/            storage(localStorage), aiMessages(mock AI), audioEngine(Web Audio), types
```
