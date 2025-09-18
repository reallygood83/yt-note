interface ProgressCallback {
  (step: string, percentage: number): void;
}

interface NoteSection {
  timeRange: string;
  title: string;
  content: string;
  keyConcepts?: string[];
  actionPoints?: string[];
}

interface GeneratedNote {
  title: string;
  channelTitle: string;
  duration: string;
  keyInsight: string;
  sections: NoteSection[];
}

// 클라이언트에서 사용할 노트 생성 함수
export async function generateNote(
  videoId: string,
  geminiApiKey: string,
  youtubeApiKey: string,
  progressCallback: ProgressCallback
): Promise<GeneratedNote> {
  
  try {
    progressCallback('영상 정보 수집 중...', 10);
    
    // 1. 서버 API를 통해 YouTube 자막 가져오기
    progressCallback('자막 추출 중...', 20);
    const transcriptResponse = await fetch('/api/youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId })
    });

    if (!transcriptResponse.ok) {
      console.warn('자막을 가져올 수 없습니다. 자막 없이 진행합니다.');
    }

    const transcriptData = await transcriptResponse.json();
    const transcripts = transcriptData.transcripts || [];

    progressCallback('AI 분석 중...', 40);
    
    // 2. 서버 API를 통해 노트 생성
    const noteResponse = await fetch('/api/generate-note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId,
        transcripts,
        geminiApiKey,
        youtubeApiKey
      })
    });

    if (!noteResponse.ok) {
      const errorData = await noteResponse.json();
      throw new Error(errorData.error || '노트 생성 실패');
    }

    progressCallback('노트 구조화 중...', 80);
    
    const note = await noteResponse.json();
    
    progressCallback('노트 생성 완료!', 100);
    
    return note;
    
  } catch (error) {
    console.error('노트 생성 오류:', error);
    throw error;
  }
}