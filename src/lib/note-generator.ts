interface ProgressCallback {
  (step: string, percentage: number): void;
}

interface YouTubeVideoInfo {
  title: string;
  channelTitle: string;
  duration: string;
  description: string;
}

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
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

// YouTube 비디오 정보 가져오기
async function getVideoInfo(videoId: string, apiKey: string): Promise<YouTubeVideoInfo> {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error('YouTube API 요청 실패');
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('비디오를 찾을 수 없습니다');
  }
  
  const video = data.items[0];
  const snippet = video.snippet;
  const contentDetails = video.contentDetails;
  
  // ISO 8601 duration을 분:초 형식으로 변환
  const duration = parseDuration(contentDetails.duration);
  
  return {
    title: snippet.title,
    channelTitle: snippet.channelTitle,
    duration: duration,
    description: snippet.description
  };
}

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

// 자막 가져오기 (YouTube Transcript API 대체 구현)
async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    // YouTube 내장 자막 API 시도
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // 자막 정보 추출 시도
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    
    if (captionMatch) {
      const captionTracks = JSON.parse(captionMatch[1]);
      
      // 한국어 또는 자동 생성 자막 찾기
      const koreanTrack = captionTracks.find((track: any) => 
        track.languageCode === 'ko' || track.languageCode === 'ko-KR'
      );
      
      const autoTrack = captionTracks.find((track: any) => 
        track.kind === 'asr'
      );
      
      const selectedTrack = koreanTrack || autoTrack || captionTracks[0];
      
      if (selectedTrack && selectedTrack.baseUrl) {
        const transcriptResponse = await fetch(selectedTrack.baseUrl);
        const transcriptXml = await transcriptResponse.text();
        
        // XML 파싱하여 세그먼트 추출
        const segments = parseTranscriptXml(transcriptXml);
        return segments;
      }
    }
    
    // 자막을 찾을 수 없는 경우 빈 배열 반환
    return [];
  } catch (error) {
    console.warn('자막 추출 실패:', error);
    return [];
  }
}

// 자막 XML 파싱
function parseTranscriptXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  
  // XML에서 text 태그 추출
  const textMatches = xml.matchAll(/<text start="([^"]*)" dur="([^"]*)"[^>]*>([^<]*)<\/text>/g);
  
  for (const match of textMatches) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = decodeHtmlEntities(match[3]);
    
    segments.push({
      text: text.trim(),
      start,
      duration
    });
  }
  
  return segments;
}

// HTML 엔티티 디코딩
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

// 자막을 시간대별로 그룹화
function groupTranscriptByTime(segments: TranscriptSegment[], totalDurationMinutes: number): string[] {
  if (segments.length === 0) {
    return ['자막을 사용할 수 없습니다. 영상의 주요 내용을 요약해 주세요.'];
  }
  
  // 5-10분 단위로 그룹화
  const groupDuration = Math.max(300, Math.min(600, (totalDurationMinutes * 60) / 8)); // 5-10분, 최대 8그룹
  const groups: string[] = [];
  let currentGroup = '';
  let currentGroupStart = 0;
  
  for (const segment of segments) {
    if (segment.start - currentGroupStart > groupDuration && currentGroup.length > 0) {
      groups.push(currentGroup.trim());
      currentGroup = segment.text + ' ';
      currentGroupStart = segment.start;
    } else {
      currentGroup += segment.text + ' ';
    }
  }
  
  if (currentGroup.trim()) {
    groups.push(currentGroup.trim());
  }
  
  return groups.length > 0 ? groups : ['자막을 사용할 수 없습니다. 영상의 주요 내용을 요약해 주세요.'];
}

// Gemini AI로 노트 생성
async function generateNoteWithAI(
  videoInfo: YouTubeVideoInfo,
  transcriptGroups: string[],
  apiKey: string,
  progressCallback: ProgressCallback
): Promise<GeneratedNote> {
  
  progressCallback('AI 분석 중...', 40);
  
  const prompt = `
다음 YouTube 영상을 분석하여 체계적인 학습 노트를 생성해주세요.

영상 정보:
- 제목: ${videoInfo.title}
- 채널: ${videoInfo.channelTitle}
- 길이: ${videoInfo.duration}

자막 내용 (시간순):
${transcriptGroups.map((group, index) => `
[구간 ${index + 1}]
${group}
`).join('\n')}

다음 형식으로 JSON 응답을 생성해주세요:

{
  "keyInsight": "이 영상의 가장 핵심적인 인사이트를 한 문장으로 요약",
  "sections": [
    {
      "timeRange": "0:00-5:30",
      "title": "구간 제목",
      "content": "이 구간의 핵심 내용을 상세히 설명",
      "keyConcepts": ["핵심개념1", "핵심개념2", "핵심개념3"],
      "actionPoints": ["실행가능한액션1", "실행가능한액션2"]
    }
  ]
}

요구사항:
1. keyInsight는 영상의 가장 중요한 메시지를 담아주세요
2. sections는 ${transcriptGroups.length}개 구간으로 나누어주세요
3. 각 구간의 timeRange는 대략적인 시간을 표시해주세요
4. content는 해당 구간의 핵심 내용을 2-3문장으로 요약해주세요
5. keyConcepts는 중요한 개념이나 키워드 3개 정도
6. actionPoints는 실제로 적용할 수 있는 구체적인 행동 2개 정도
7. 모든 내용은 한국어로 작성해주세요
8. JSON 형식을 정확히 지켜주세요
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API 요청 실패');
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    progressCallback('노트 구조화 중...', 80);
    
    // JSON 응답 파싱
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 응답에서 JSON을 찾을 수 없습니다');
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    return {
      title: videoInfo.title,
      channelTitle: videoInfo.channelTitle,
      duration: videoInfo.duration,
      keyInsight: parsedResponse.keyInsight,
      sections: parsedResponse.sections
    };
    
  } catch (error) {
    console.error('AI 분석 오류:', error);
    
    // AI 분석 실패 시 기본 노트 생성
    const fallbackSections: NoteSection[] = transcriptGroups.map((group, index) => ({
      timeRange: `${Math.floor(index * 5)}:00-${Math.floor((index + 1) * 5)}:00`,
      title: `구간 ${index + 1}`,
      content: group.length > 200 ? group.substring(0, 200) + '...' : group,
      keyConcepts: ['키워드1', '키워드2'],
      actionPoints: ['실행항목1', '실행항목2']
    }));
    
    return {
      title: videoInfo.title,
      channelTitle: videoInfo.channelTitle,
      duration: videoInfo.duration,
      keyInsight: '이 영상을 통해 새로운 지식과 인사이트를 얻을 수 있습니다.',
      sections: fallbackSections
    };
  }
}

// 메인 노트 생성 함수
export async function generateNote(
  videoId: string,
  geminiApiKey: string,
  youtubeApiKey: string,
  progressCallback: ProgressCallback
): Promise<GeneratedNote> {
  
  try {
    progressCallback('영상 정보 수집 중...', 10);
    
    // 1. YouTube 비디오 정보 가져오기
    const videoInfo = await getVideoInfo(videoId, youtubeApiKey);
    
    progressCallback('자막 추출 중...', 20);
    
    // 2. 자막 가져오기
    const transcriptSegments = await getTranscript(videoId);
    
    progressCallback('자막 분석 중...', 30);
    
    // 3. 자막을 시간대별로 그룹화
    const durationParts = videoInfo.duration.split(':');
    const totalMinutes = durationParts.length === 3 
      ? parseInt(durationParts[0]) * 60 + parseInt(durationParts[1])
      : parseInt(durationParts[0]);
    
    const transcriptGroups = groupTranscriptByTime(transcriptSegments, totalMinutes);
    
    // 4. AI로 노트 생성
    const note = await generateNoteWithAI(videoInfo, transcriptGroups, geminiApiKey, progressCallback);
    
    progressCallback('노트 생성 완료!', 100);
    
    return note;
    
  } catch (error) {
    console.error('노트 생성 오류:', error);
    throw error;
  }
}