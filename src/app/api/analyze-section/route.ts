import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[analyze-section] API 요청 수신');
    const body = await request.json();
    const { section, geminiApiKey } = body;
    
    console.log('[analyze-section] 요청 파라미터:', {
      hasSection: !!section,
      hasGeminiApiKey: !!geminiApiKey,
      sectionKeys: section ? Object.keys(section) : [],
      sectionTimeRange: section?.timeRange,
      sectionRawTextLength: section?.rawText?.length || 0,
      sectionKeyPointsCount: section?.keyPoints?.length || 0
    });
    
    if (!section || !geminiApiKey) {
      console.error('[analyze-section] 필수 매개변수 누락:', { hasSection: !!section, hasGeminiApiKey: !!geminiApiKey });
      return NextResponse.json({ 
        error: '필수 매개변수가 누락되었습니다.' 
      }, { status: 400 });
    }

    // section 객체 구조 검증
    if (!section.timeRange || !section.rawText || !section.keyPoints) {
      console.error('[analyze-section] section 객체 구조 오류:', {
        hasTimeRange: !!section.timeRange,
        hasRawText: !!section.rawText,
        hasKeyPoints: !!section.keyPoints
      });
      return NextResponse.json({ 
        error: 'section 객체의 구조가 올바르지 않습니다.' 
      }, { status: 400 });
    }

    const prompt = `
다음 영상 구간을 분석하여 구조화된 JSON 응답을 생성해주세요.

구간 정보:
- 시간: ${section.timeRange}
- 원문: ${section.rawText}
- 핵심 포인트: ${section.keyPoints.join(', ')}

다음 형식으로 JSON 응답을 생성해주세요:

{
  "timeRange": "${section.timeRange}",
  "title": "이 구간의 적절한 제목 (한국어)",
  "summary": "이 구간의 핵심 내용을 2-3문장으로 요약 (한국어)",
  "concepts": ["핵심개념1", "핵심개념2", "핵심개념3"],
  "actions": ["실행가능한액션1", "실행가능한액션2"]
}

요구사항:
1. title은 구간 내용을 잘 표현하는 명확한 제목
2. summary는 해당 구간의 핵심 내용을 2-3문장으로 요약
3. concepts는 중요한 개념이나 키워드 3개 이하
4. actions는 실제로 적용할 수 있는 구체적인 행동 2개 이하
5. 모든 내용은 한국어로 작성
6. JSON 형식을 정확히 지켜주세요
`;

    console.log('Section Analysis API 호출 시작...');
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
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
            maxOutputTokens: 1024,
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
      throw new Error(`Gemini API 요청 실패: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API 응답 데이터 수신 완료');
    
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
    
    const analysisResult = JSON.parse(jsonMatch[0]);
    console.log('파싱된 AI 응답:', analysisResult);

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('Section analysis API 오류:', error);
    return NextResponse.json({ 
      error: '구간 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}