import { NextRequest, NextResponse } from 'next/server';

// ISO 8601 duration 파싱 (PT4M13S -> 4:13)
function parseDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, youtubeApiKey } = await request.json();
    
    if (!videoId || !youtubeApiKey) {
      return NextResponse.json({ 
        error: '필수 매개변수가 누락되었습니다.' 
      }, { status: 400 });
    }

    // YouTube Data API v3로 비디오 정보 가져오기
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${youtubeApiKey}`
    );
    
    if (!response.ok) {
      console.error('YouTube API Error:', response.status, response.statusText);
      throw new Error('YouTube API 요청 실패');
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        error: '비디오를 찾을 수 없습니다'
      }, { status: 404 });
    }
    
    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    
    const duration = parseDuration(contentDetails.duration);
    
    return NextResponse.json({
      id: videoId,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      duration: duration,
      description: snippet.description,
      publishedAt: snippet.publishedAt,
      thumbnails: snippet.thumbnails
    });

  } catch (error) {
    console.error('Video info API 오류:', error);
    return NextResponse.json({ 
      error: '비디오 정보 수집 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}