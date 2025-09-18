# 📑 PRD: YouTube Learning Note Generator (유튜브 학습 노트 생성기)

## 1. 제품 개요

### 1.1 제품명
**YouTube Learning Note Generator** (한국명: 유튜브 학습 노트 생성기)

### 1.2 비전
사용자가 자신의 API 키를 사용하여 YouTube 영상을 체계적인 학습 자료로 변환하는 무료 오픈소스 웹 서비스

### 1.3 핵심 가치
- **무료 제공**: 사용자가 자신의 API 키를 사용하여 비용 부담 없이 서비스 제공
- **오픈소스**: GitHub를 통한 커뮤니티 기여 및 개선
- **프라이버시**: 서버에 API 키를 저장하지 않고 브라우저 로컬 스토리지 활용

### 1.4 목표 사용자
- 온라인 강의를 듣는 학생/직장인
- YouTube로 자기계발하는 사람들
- 교육 콘텐츠를 정리하고 싶은 교육자
- ADHD 등으로 집중력 관리가 필요한 학습자
- 개발자 및 기술 애호가

## 2. 핵심 기능

### 2.1 API 키 관리 시스템 ⭐
```
기능:
- 사용자별 Gemini API 키 입력/저장 (로컬 스토리지)
- 사용자별 YouTube Data API 키 입력/저장
- API 키 유효성 검증
- API 키 안전한 관리 (암호화 저장)
- API 사용량 모니터링 대시보드
```

### 2.2 YouTube 분석 엔진
```
입력: YouTube URL
처리:
- YouTube Data API v3로 메타데이터 추출
- 자막/스크립트 추출 (YouTube Transcript API)
- Gemini API 기반 내용 분석
- 타임스탬프 구간 자동 식별 (8-12개)
출력: 구조화된 학습 노트
```

### 2.3 노트 생성 시스템
```
기능:
- 타임스탬프별 상세 정리
- 구간별 YouTube 임베드 링크
- 핵심 개념 및 액션 포인트 추출
- ADHD 친화적 체크리스트
- 한 줄 핵심 인사이트 생성
- 학습 진도 추적 시스템
```

### 2.4 공유 시스템
```
- 고유 공유 링크 생성
- 읽기 전용 공개 노트 (API 키 불필요)
- QR 코드 생성
- 소셜 미디어 공유
```

### 2.5 저장/내보내기 옵션
```
- Markdown (.md) 다운로드
- HTML 독립 파일 다운로드
- PDF 내보내기
- JSON 원본 데이터
- 로컬 브라우저 저장
```

## 3. 기술 스택

### 3.1 Frontend
```yaml
Framework: Next.js 14 (App Router)
언어: TypeScript
스타일링: Tailwind CSS
UI Components: shadcn/ui
상태관리: Zustand
데이터 저장: LocalStorage (API 키), IndexedDB (노트)
```

### 3.2 Backend
```yaml
API: Next.js API Routes
세션 저장: Vercel KV (선택적)
공유 노트: Vercel Blob Storage
Rate Limiting: Upstash
```

### 3.3 외부 API
```yaml
YouTube Data API v3: 메타데이터
YouTube Transcript: 자막 추출
Google Gemini API: AI 분석
```

### 3.4 배포
```yaml
저장소: GitHub
호스팅: Vercel (무료 티어)
도메인: vercel.app 서브도메인
모니터링: Vercel Analytics
```

## 4. 페이지 구조

### 4.1 홈페이지 (/)
```
- 서비스 소개
- YouTube URL 입력 박스
- 샘플 노트 미리보기
- "시작하기" 버튼 → 설정 페이지
```

### 4.2 설정 페이지 (/settings) ⭐
```
- Gemini API 키 입력/저장
- YouTube Data API 키 입력/저장
- API 키 획득 가이드 (링크 포함)
- API 키 유효성 테스트
- 사용량 확인
- 데이터 초기화 옵션
```

### 4.3 노트 생성 페이지 (/create)
```
- YouTube URL 입력
- 처리 상태 표시 (프로그레스 바)
- 에러 핸들링
- 생성된 노트 미리보기
```

### 4.4 노트 뷰어 (/note/[id])
```
- 구조화된 노트 표시
- 타임스탬프 네비게이션
- 체크박스 진도 관리
- 공유/다운로드 버튼
```

### 4.5 내 노트 (/my-notes)
```
- 로컬 저장된 노트 목록
- 검색/필터 기능
- 노트 삭제/관리
```

## 5. 사용자 플로우

### 5.1 초기 설정 플로우
```
1. 홈페이지 접속
2. "시작하기" 클릭
3. 설정 페이지 이동
4. API 키 획득 가이드 확인
5. Gemini API 키 입력 및 저장
6. YouTube API 키 입력 및 저장
7. API 키 유효성 테스트
8. 설정 완료
```

### 5.2 노트 생성 플로우
```
1. YouTube URL 입력
2. "노트 생성" 클릭
3. 처리 중 표시 (15-30초)
4. 생성된 노트 표시
5. 로컬 저장 자동 실행
6. 공유/다운로드 옵션 제공
```

## 6. API 키 관리 보안

### 6.1 클라이언트 사이드 보안
```javascript
// API 키 저장 (암호화)
const encryptedKey = encrypt(apiKey);
localStorage.setItem('gemini_api_key', encryptedKey);

// API 키 사용 (복호화)
const encryptedKey = localStorage.getItem('gemini_api_key');
const apiKey = decrypt(encryptedKey);
```

### 6.2 보안 원칙
- API 키는 서버로 전송하지 않음
- 모든 API 호출은 클라이언트에서 직접 수행
- 공유 노트에는 API 키 정보 포함하지 않음
- HTTPS 필수 사용

## 7. MVP 기능 목록

### Phase 1: Core (1주차)
- [x] Next.js 프로젝트 설정
- [ ] 기본 페이지 라우팅
- [ ] 설정 페이지 UI
- [ ] API 키 저장/관리 시스템
- [ ] YouTube URL 입력 UI

### Phase 2: Integration (2주차)
- [ ] YouTube Data API 연동
- [ ] YouTube Transcript 추출
- [ ] Gemini API 연동
- [ ] 노트 생성 로직

### Phase 3: Features (3주차)
- [ ] 노트 뷰어 UI
- [ ] 타임스탬프 네비게이션
- [ ] 체크박스 시스템
- [ ] 로컬 저장 기능
- [ ] Markdown 내보내기

### Phase 4: Polish (4주차)
- [ ] 공유 기능
- [ ] 노트 관리 페이지
- [ ] 에러 핸들링
- [ ] 반응형 디자인
- [ ] 배포 준비

## 8. 컴포넌트 구조

```
src/
├── app/
│   ├── page.tsx                 # 홈페이지
│   ├── settings/page.tsx        # 설정 페이지
│   ├── create/page.tsx          # 노트 생성
│   ├── note/[id]/page.tsx       # 노트 뷰어
│   └── my-notes/page.tsx        # 내 노트
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── settings/
│   │   ├── ApiKeyInput.tsx
│   │   └── ApiKeyGuide.tsx
│   ├── note/
│   │   ├── NoteViewer.tsx
│   │   ├── TimestampNav.tsx
│   │   └── ChecklistItem.tsx
│   └── common/
│       ├── Button.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── api/
│   │   ├── youtube.ts
│   │   └── gemini.ts
│   ├── utils/
│   │   ├── encryption.ts
│   │   └── storage.ts
│   └── types/
│       └── note.ts
└── styles/
    └── globals.css
```

## 9. 환경 변수 (.env.local)

```env
# Public Environment Variables (Safe to expose)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-side only (for future features)
ENCRYPTION_KEY=your-encryption-key-for-api-keys
```

## 10. 주요 기술적 구현

### 10.1 YouTube Transcript 추출
```typescript
async function getTranscript(videoId: string) {
  // 1. 자막 목록 가져오기
  const response = await youtube.captions.list({
    part: ['snippet'],
    videoId: videoId,
    key: userYoutubeApiKey
  });
  
  // 2. 자막 다운로드
  // 3. 타임스탬프 파싱
  return transcript;
}
```

### 10.2 Gemini 분석
```typescript
async function analyzeContent(transcript: string) {
  const genAI = new GoogleGenerativeAI(userGeminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `
    다음 YouTube 영상 스크립트를 분석하여 학습 노트를 생성해주세요:
    1. 8-12개 핵심 구간 분리
    2. 각 구간별 요약
    3. 핵심 개념 추출
    4. 실행 가능한 액션 포인트
    ${transcript}
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

## 11. 오픈소스 전략

### 11.1 라이센스
- MIT License
- 상업적 사용 가능
- 수정/배포 자유

### 11.2 기여 가이드
- Pull Request 환영
- Issue 템플릿 제공
- 기여자 인정

### 11.3 문서화
- README.md (설치/사용법)
- CONTRIBUTING.md
- API 문서
- 사용 예제

## 12. 성공 지표

### 12.1 사용자 지표
- GitHub 스타: 1,000개 (6개월)
- 일일 활성 사용자: 500명
- 생성된 노트: 일 100개

### 12.2 커뮤니티 지표
- Contributors: 10명
- Pull Requests: 월 5개
- Issues 해결률: 80%

## 13. 향후 확장 계획

### 13.1 단기 (3개월)
- 다국어 지원
- Chrome Extension
- 더 많은 LLM 지원 (Claude, OpenAI)

### 13.2 장기 (6개월)
- 팀 협업 기능
- 노트 동기화 (선택적 클라우드)
- AI 퀴즈 생성
- 플래시카드 기능

---

**작성일**: 2024년 12월
**버전**: 1.0
**작성자**: YouTube Learning Note Generator Team
**라이센스**: MIT