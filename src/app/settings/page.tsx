'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [isTestingYoutube, setIsTestingYoutube] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'none' | 'success' | 'error'>('none');
  const [youtubeStatus, setYoutubeStatus] = useState<'none' | 'success' | 'error'>('none');

  useEffect(() => {
    // 저장된 API 키 불러오기
    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    const savedYoutubeKey = localStorage.getItem('youtube_api_key');
    
    if (savedGeminiKey) setGeminiApiKey(savedGeminiKey);
    if (savedYoutubeKey) setYoutubeApiKey(savedYoutubeKey);
  }, []);

  const saveApiKeys = () => {
    localStorage.setItem('gemini_api_key', geminiApiKey);
    localStorage.setItem('youtube_api_key', youtubeApiKey);
    alert('API 키가 저장되었습니다!');
  };

  const testGeminiApi = async () => {
    if (!geminiApiKey) {
      alert('Gemini API 키를 입력해주세요.');
      return;
    }

    setIsTestingGemini(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "안녕하세요"
            }]
          }]
        })
      });

      if (response.ok) {
        setGeminiStatus('success');
      } else {
        setGeminiStatus('error');
      }
    } catch (error) {
      setGeminiStatus('error');
    }
    setIsTestingGemini(false);
  };

  const testYoutubeApi = async () => {
    if (!youtubeApiKey) {
      alert('YouTube API 키를 입력해주세요.');
      return;
    }

    setIsTestingYoutube(true);
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${youtubeApiKey}`);
      
      if (response.ok) {
        setYoutubeStatus('success');
      } else {
        setYoutubeStatus('error');
      }
    } catch (error) {
      setYoutubeStatus('error');
    }
    setIsTestingYoutube(false);
  };

  const clearData = () => {
    if (confirm('모든 저장된 데이터를 삭제하시겠습니까?')) {
      localStorage.clear();
      setGeminiApiKey('');
      setYoutubeApiKey('');
      setGeminiStatus('none');
      setYoutubeStatus('none');
      alert('모든 데이터가 삭제되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">⚙️ API 키 설정</h1>
            <Link href="/" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
              홈으로
            </Link>
          </div>
          <p className="text-gray-600">
            YouTube Learning Note Generator를 사용하기 위해 필요한 API 키를 설정해주세요.
            <br />
            <strong className="text-red-600">모든 API 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.</strong>
          </p>
        </div>

        {/* API Key Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-4">📖 API 키 획득 가이드</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-blue-800 mb-2">🤖 Google Gemini API</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                <li><a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>에 접속</li>
                <li>Google 계정으로 로그인</li>
                <li>"Create API Key" 클릭</li>
                <li>생성된 API 키 복사</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-bold text-blue-800 mb-2">🎬 YouTube Data API</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                <li><a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a>에 접속</li>
                <li>새 프로젝트 생성 또는 기존 프로젝트 선택</li>
                <li>"YouTube Data API v3" 활성화</li>
                <li>"API 및 서비스" → "사용자 인증 정보"에서 API 키 생성</li>
              </ol>
            </div>
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-8">
          {/* Gemini API */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 Google Gemini API 키</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 키 입력
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={testGeminiApi}
                  disabled={isTestingGemini || !geminiApiKey}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isTestingGemini ? '테스트 중...' : 'API 키 테스트'}
                </button>
                
                {geminiStatus === 'success' && (
                  <div className="flex items-center text-green-600">
                    <span className="mr-2">✅</span>
                    API 키가 유효합니다!
                  </div>
                )}
                
                {geminiStatus === 'error' && (
                  <div className="flex items-center text-red-600">
                    <span className="mr-2">❌</span>
                    API 키가 유효하지 않습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* YouTube API */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎬 YouTube Data API 키</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 키 입력
                </label>
                <input
                  type="password"
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={testYoutubeApi}
                  disabled={isTestingYoutube || !youtubeApiKey}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isTestingYoutube ? '테스트 중...' : 'API 키 테스트'}
                </button>
                
                {youtubeStatus === 'success' && (
                  <div className="flex items-center text-green-600">
                    <span className="mr-2">✅</span>
                    API 키가 유효합니다!
                  </div>
                )}
                
                {youtubeStatus === 'error' && (
                  <div className="flex items-center text-red-600">
                    <span className="mr-2">❌</span>
                    API 키가 유효하지 않습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={saveApiKeys}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              💾 API 키 저장
            </button>
            
            <Link 
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              🎬 노트 생성하러 가기
            </Link>
            
            <button
              onClick={clearData}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              🗑️ 모든 데이터 삭제
            </button>
          </div>
        </div>

        {/* Usage Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-yellow-800 mb-2">💰 API 사용량 안내</h3>
          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• <strong>Gemini API:</strong> 월 1,000,000 토큰 무료 (일반적으로 월 100-200개 영상 분석 가능)</li>
            <li>• <strong>YouTube Data API:</strong> 일 10,000 할당량 무료 (일 약 100개 영상 정보 조회 가능)</li>
            <li>• 개인 사용 목적으로는 충분한 할당량입니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}