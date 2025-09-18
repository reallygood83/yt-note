import { NextRequest, NextResponse } from 'next/server';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface VideoInfo {
  title: string;
  channelTitle: string;
  duration: string;
  description: string;
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

// YouTube 비디오 정보 가져오기
async function getVideoInfo(videoId: string, apiKey: string): Promise<VideoInfo> {
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
  
  const duration = parseDuration(contentDetails.duration);
  
  return {
    title: snippet.title,
    channelTitle: snippet.channelTitle,
    duration: duration,
    description: snippet.description
  };
}

// 자막을 시간대별로 그룹화
function groupTranscriptByTime(segments: TranscriptSegment[], totalDurationMinutes: number): string[] {
  if (segments.length === 0) {
    return ['자막을 사용할 수 없습니다. 영상의 주요 내용을 요약해 주세요.'];
  }
  
  // 5-10분 단위로 그룹화
  const groupDuration = Math.max(300, Math.min(600, (totalDurationMinutes * 60) / 8));
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

export async function POST(request: NextRequest) {
  try {
    const { videoId, transcripts, geminiApiKey, youtubeApiKey } = await request.json();
    
    if (!videoId || !geminiApiKey || !youtubeApiKey) {
      return NextResponse.json({ 
        error: '필수 매개변수가 누락되었습니다.' 
      }, { status: 400 });
    }

    // 1. YouTube 비디오 정보 가져오기
    const videoInfo = await getVideoInfo(videoId, youtubeApiKey);
    
    // 2. 자막을 시간대별로 그룹화
    const durationParts = videoInfo.duration.split(':');
    const totalMinutes = durationParts.length === 3 
      ? parseInt(durationParts[0]) * 60 + parseInt(durationParts[1])
      : parseInt(durationParts[0]);
    
    const transcriptGroups = groupTranscriptByTime(transcripts || [], totalMinutes);
    
    // 3. Gemini AI로 노트 생성
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

    // Gemini API 호출 (더 안정적인 1.0-pro 모델 사용)
    let aiGeneratedContent = null;
    let usesFallback = false;

    try {
      console.log('Gemini API 호출 시작...');
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${geminiApiKey}`,
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
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              topK: 40,
              topP: 0.95,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      console.log('Gemini API 응답 상태:', geminiResponse.status);

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API Error Response:', errorText);
        throw new Error(`Gemini API 요청 실패: ${geminiResponse.status} - ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      console.log('Gemini API 응답 데이터:', JSON.stringify(geminiData, null, 2));
      
      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        console.error('Gemini API 후보 응답이 비어있음');
        throw new Error('Gemini API 응답이 비어있습니다');
      }

      if (geminiData.candidates[0].finishReason === 'SAFETY') {
        console.error('Gemini API 안전 필터에 걸림');
        throw new Error('안전 필터로 인해 응답이 차단되었습니다');
      }

      const aiResponse = geminiData.candidates[0].content.parts[0].text;
      console.log('AI 응답 텍스트:', aiResponse);
      
      // JSON 응답 파싱
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('AI 응답에서 JSON을 찾을 수 없음:', aiResponse);
        throw new Error('AI 응답에서 JSON을 찾을 수 없습니다');
      }
      
      aiGeneratedContent = JSON.parse(jsonMatch[0]);
      console.log('파싱된 AI 응답:', aiGeneratedContent);

    } catch (error) {
      console.error('Gemini AI 처리 실패, Fallback 사용:', error);
      usesFallback = true;
      
      // AI 실패 시 기본 노트 생성
      aiGeneratedContent = {
        keyInsight: `${videoInfo.title}에서 유용한 정보와 인사이트를 얻을 수 있습니다.`,
        sections: transcriptGroups.map((group, index) => {
          const startTime = Math.floor((index * totalMinutes) / transcriptGroups.length);
          const endTime = Math.floor(((index + 1) * totalMinutes) / transcriptGroups.length);
          return {
            timeRange: `${startTime}:00-${endTime}:00`,
            title: `구간 ${index + 1}: 핵심 내용`,
            content: group.length > 300 ? group.substring(0, 300) + '...' : group,
            keyConcepts: ['주요개념1', '주요개념2', '주요개념3'],
            actionPoints: ['실행항목1', '실행항목2']
          };
        })
      };
    }
    
    return NextResponse.json({
      title: videoInfo.title,
      channelTitle: videoInfo.channelTitle,
      duration: videoInfo.duration,
      keyInsight: aiGeneratedContent.keyInsight,
      sections: aiGeneratedContent.sections,
      usedFallback: usesFallback
    });

  } catch (error) {
    console.error('노트 생성 오류:', error);
    return NextResponse.json({ 
      error: '노트 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}