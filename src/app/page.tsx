import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🎬 YouTube Learning Note Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            YouTube 영상을 AI로 분석하여 체계적인 학습 노트로 변환해드립니다.
            자신의 API 키로 무료로 사용하세요!
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI 자동 분석</h3>
            <p className="text-gray-600">
              Gemini AI가 YouTube 영상을 분석하여 핵심 내용을 추출합니다.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-2">구조화된 노트</h3>
            <p className="text-gray-600">
              타임스탬프별 정리, 체크리스트, 핵심 개념 등으로 구조화된 노트를 생성합니다.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-2">개인 API 키</h3>
            <p className="text-gray-600">
              자신의 API 키를 사용하여 안전하고 무료로 서비스를 이용하세요.
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">🚀 시작하기</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
              <span>API 키 설정 (Gemini AI + YouTube Data API)</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
              <span>YouTube URL 입력</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
              <span>AI 학습 노트 생성 완료!</span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Link href="/settings" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
              API 키 설정하러 가기
            </Link>
            <p className="text-sm text-gray-500">
              * API 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
            </p>
          </div>
        </div>

        {/* Sample Note Preview */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">📋 생성 예시</h2>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto text-left">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-lg mb-2">📍 [0:00-2:30] 인공지능 개요</h3>
              <p className="text-gray-600 mb-2">
                <strong>핵심 내용:</strong> 인공지능의 정의와 발전 과정을 설명...
              </p>
              <p className="text-blue-600">
                <strong>💡 핵심 개념:</strong> 머신러닝, 딥러닝, 신경망
              </p>
              <p className="text-green-600">
                <strong>⚡ 액션 포인트:</strong> 기본 개념 복습하기
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}