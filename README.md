# YouTube Learning Note Generator

AI를 활용하여 YouTube 영상을 학습 노트로 변환하는 웹 애플리케이션입니다.

## 주요 기능

- **AI 자동 분석**: Gemini AI가 YouTube 영상을 분석하여 핵심 내용을 추출
- **구조화된 노트**: 타임스탬프별 정리, 체크리스트, 핵심 개념 등으로 구조화
- **개인 API 키**: 자신의 API 키를 사용하여 안전하고 무료로 서비스 이용
- **마크다운 다운로드**: 생성된 노트를 마크다운 파일로 다운로드
- **노트 관리**: 생성한 모든 노트를 관리하고 검색

## 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Data**: YouTube Data API v3
- **Storage**: Browser localStorage
- **Deployment**: Vercel

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 환경 설정

사용자는 다음 API 키를 개별적으로 설정해야 합니다:

1. **Google Gemini API 키**
   - [Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급
   - AI 분석을 위해 필요

2. **YouTube Data API 키**
   - [Google Cloud Console](https://console.cloud.google.com/)에서 발급
   - YouTube 영상 정보 조회를 위해 필요

## 사용 방법

1. **설정**: 개인 API 키 설정
2. **생성**: YouTube URL 입력하여 노트 생성
3. **관리**: 생성된 노트 관리 및 다운로드

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx          # 홈페이지
│   ├── settings/         # API 키 설정
│   ├── create/           # 노트 생성
│   ├── my-notes/         # 노트 관리
│   └── layout.tsx        # 레이아웃
└── lib/
    └── note-generator.ts # 노트 생성 로직
```

## 배포

이 프로젝트는 Vercel에 배포할 수 있습니다:

1. GitHub에 코드 업로드
2. Vercel에서 프로젝트 연결
3. 자동 배포 완료

## 라이선스

MIT License