import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[YouTube API] Enhanced 자막 추출 요청 시작');
    const { videoId } = await request.json();
    
    if (!videoId) {
      console.error('[YouTube API] 비디오 ID 누락');
      return NextResponse.json({ error: '비디오 ID가 필요합니다.' }, { status: 400 });
    }

    console.log('[YouTube API] 비디오 ID:', videoId);

    // Enhanced fetch with better headers
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'YouTube 비디오를 찾을 수 없습니다.' }, { status: 404 });
    }

    const html = await response.text();
    
    // 자막 정보 추출
    console.log('[YouTube API] HTML 응답 길이:', html.length);
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    
    // Enhanced metadata extraction
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/);
    const descMatch = html.match(/"shortDescription":"([^"]*)/);
    const channelMatch = html.match(/"ownerChannelName":"([^"]*)/);
    const durationMatch = html.match(/"lengthSeconds":"([^"]*)/);
    const viewsMatch = html.match(/"viewCount":"([^"]*)/);
    
    // Extract enhanced metadata
    const videoTitle = titleMatch ? titleMatch[1].replace(' - YouTube', '') : '';
    const videoDesc = descMatch ? descMatch[1] : '';
    const channelName = channelMatch ? channelMatch[1] : '';
    const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : 0;
    const viewCount = viewsMatch ? parseInt(viewsMatch[1]) : 0;
    
    // Format duration
    const formatDuration = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const enhancedFallbackData = {
      title: videoTitle,
      description: videoDesc,
      channel: channelName,
      duration: formatDuration(durationSeconds),
      durationSeconds,
      viewCount,
      extractedKeywords: extractKeywords(videoTitle, videoDesc),
      estimatedTopics: estimateTopics(videoTitle, videoDesc)
    };

    if (!captionMatch) {
      console.warn('[YouTube API] captionTracks를 찾을 수 없음 - 메타데이터 기반 처리');
      console.log('[YouTube API] Enhanced 메타데이터 추출:', enhancedFallbackData);
      
      return NextResponse.json({ 
        transcripts: [],
        fallbackData: enhancedFallbackData,
        message: '자막을 사용할 수 없지만 메타데이터 기반으로 고품질 노트를 생성할 수 있습니다.',
        metadataQuality: 'high'
      });
    }

    const captionTracks = JSON.parse(captionMatch[1]);
    console.log('[YouTube API] 발견된 자막 트랙 수:', captionTracks.length);
    
    // 한국어 또는 자동 생성 자막 찾기
    const koreanTrack = captionTracks.find((track: any) => 
      track.languageCode === 'ko' || track.languageCode === 'ko-KR'
    );
    
    const autoTrack = captionTracks.find((track: any) => 
      track.kind === 'asr'
    );
    
    const selectedTrack = koreanTrack || autoTrack || captionTracks[0];
    console.log('[YouTube API] 선택된 자막 언어:', selectedTrack?.languageCode, 'Kind:', selectedTrack?.kind);
    
    if (!selectedTrack || !selectedTrack.baseUrl) {
      console.warn('[YouTube API] 자막 URL을 찾을 수 없음 - 메타데이터 기반 처리');
      return NextResponse.json({ 
        transcripts: [],
        fallbackData: enhancedFallbackData,
        message: '자막 URL을 찾을 수 없지만 메타데이터 기반으로 고품질 노트를 생성할 수 있습니다.',
        metadataQuality: 'high'
      });
    }

    // 자막 XML 가져오기
    console.log('[YouTube API] 자막 URL:', selectedTrack.baseUrl?.substring(0, 100) + '...');
    const transcriptResponse = await fetch(selectedTrack.baseUrl);
    const transcriptXml = await transcriptResponse.text();
    console.log('[YouTube API] 자막 XML 길이:', transcriptXml.length);
    
    // XML 파싱
    const segments: any[] = [];
    const textMatches = transcriptXml.matchAll(/<text start="([^"]*)" dur="([^"]*)"[^>]*>([^<]*)<\/text>/g);
    
    let matchCount = 0;
    for (const match of textMatches) {
      matchCount++;
      const start = parseFloat(match[1]);
      const duration = parseFloat(match[2]);
      let text = match[3];
      
      // HTML 엔티티 디코딩
      text = text.replace(/&amp;/g, '&')
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&quot;/g, '"')
                 .replace(/&#39;/g, "'")
                 .replace(/&nbsp;/g, ' ');
      
      segments.push({
        text: text.trim(),
        start,
        duration
      });
    }
    
    console.log('[YouTube API] 파싱된 자막 세그먼트 수:', matchCount, '실제 배열 길이:', segments.length);
    console.log('[YouTube API] 첫 번째 세그먼트:', segments[0]);
    console.log('[YouTube API] 마지막 세그먼트:', segments[segments.length - 1]);

    // If no segments found, use enhanced fallback data
    if (segments.length === 0) {
      console.warn('[YouTube API] 세그먼트 파싱 실패 - Enhanced 메타데이터 기반 처리');
      console.log('[YouTube API] Enhanced 메타데이터:', enhancedFallbackData);
      
      return NextResponse.json({ 
        transcripts: [],
        fallbackData: enhancedFallbackData,
        message: '자막 처리에 실패했지만 메타데이터 기반으로 고품질 노트를 생성할 수 있습니다.',
        metadataQuality: 'high',
        language: selectedTrack.languageCode || 'auto'
      });
    }

    return NextResponse.json({ 
      transcripts: segments,
      language: selectedTrack.languageCode || 'auto',
      fallbackData: enhancedFallbackData
    });

  } catch (error) {
    console.error('YouTube 자막 추출 오류:', error);
    return NextResponse.json({ 
      error: '자막 추출 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// Enhanced utility functions for metadata analysis
function extractKeywords(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const keywords = [];
  
  // Common Korean tech/educational keywords
  const techKeywords = ['ai', 'claude', 'gpt', 'mcp', '인공지능', '개발', '프로그래밍', '코딩', '투자', '분석', '자동화'];
  const educationKeywords = ['강의', '튜토리얼', '배우기', '학습', '공부', '강좌', '교육'];
  const actionKeywords = ['만들기', '구현', '생성', '활용', '방법', '실습', '실전'];
  
  // Extract matching keywords
  [...techKeywords, ...educationKeywords, ...actionKeywords].forEach(keyword => {
    if (text.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  // Extract emojis and special markers
  const emojiMatches = title.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
  if (emojiMatches) {
    keywords.push(...emojiMatches.slice(0, 3));
  }
  
  return keywords.slice(0, 10); // Limit to 10 keywords
}

function estimateTopics(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const topics: string[] = [];
  
  // Topic mapping
  const topicMap = {
    'AI/기술': ['ai', 'claude', 'gpt', 'mcp', '인공지능', '자동화', '프로그래밍'],
    '투자/경제': ['투자', '주식', '경제', '분석', '리포트', '시장'],
    '교육/학습': ['강의', '튜토리얼', '배우기', '학습', '공부', '교육'],
    '개발/코딩': ['개발', '코딩', '프로그래밍', '구현', '코드'],
    '생산성/도구': ['자동화', '효율', '생산성', '도구', '활용'],
    '콘텐츠 제작': ['영상', '제작', '콘텐츠', '크리에이터']
  };
  
  Object.entries(topicMap).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      topics.push(topic);
    }
  });
  
  return topics.length > 0 ? topics : ['일반'];
}