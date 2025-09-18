import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();
    
    if (!videoId) {
      return NextResponse.json({ error: '비디오 ID가 필요합니다.' }, { status: 400 });
    }

    // YouTube 페이지를 서버에서 fetch
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'YouTube 비디오를 찾을 수 없습니다.' }, { status: 404 });
    }

    const html = await response.text();
    
    // 자막 정보 추출
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    
    if (!captionMatch) {
      return NextResponse.json({ 
        transcripts: [],
        message: '자막을 사용할 수 없습니다.'
      });
    }

    const captionTracks = JSON.parse(captionMatch[1]);
    
    // 한국어 또는 자동 생성 자막 찾기
    const koreanTrack = captionTracks.find((track: any) => 
      track.languageCode === 'ko' || track.languageCode === 'ko-KR'
    );
    
    const autoTrack = captionTracks.find((track: any) => 
      track.kind === 'asr'
    );
    
    const selectedTrack = koreanTrack || autoTrack || captionTracks[0];
    
    if (!selectedTrack || !selectedTrack.baseUrl) {
      return NextResponse.json({ 
        transcripts: [],
        message: '자막 URL을 찾을 수 없습니다.'
      });
    }

    // 자막 XML 가져오기
    const transcriptResponse = await fetch(selectedTrack.baseUrl);
    const transcriptXml = await transcriptResponse.text();
    
    // XML 파싱
    const segments: any[] = [];
    const textMatches = transcriptXml.matchAll(/<text start="([^"]*)" dur="([^"]*)"[^>]*>([^<]*)<\/text>/g);
    
    for (const match of textMatches) {
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

    return NextResponse.json({ 
      transcripts: segments,
      language: selectedTrack.languageCode || 'auto'
    });

  } catch (error) {
    console.error('YouTube 자막 추출 오류:', error);
    return NextResponse.json({ 
      error: '자막 추출 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}