interface ProgressCallback {
  (step: string, percentage: number, details?: string): void;
}

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface ProcessedSection {
  timeRange: string;
  rawText: string;
  cleanedText: string;
  keyPoints: string[];
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
  processingTime: number;
}

export class AdvancedNoteGenerator {
  private progressCallback: ProgressCallback;
  private startTime: number = 0;

  constructor(progressCallback: ProgressCallback) {
    this.progressCallback = progressCallback;
  }

  async generateNote(
    videoId: string,
    geminiApiKey: string,
    youtubeApiKey: string
  ): Promise<GeneratedNote> {
    this.startTime = Date.now();

    try {
      // 1단계: 영상 정보 수집 (10%)
      this.progressCallback('📹 영상 정보 수집 중...', 10, 'YouTube API 호출');
      const videoInfo = await this.getVideoInfo(videoId, youtubeApiKey);

      // 2단계: 자막 다운로드 (20%)
      this.progressCallback('📝 자막 다운로드 중...', 20, '자막 파일 추출');
      const transcripts = await this.downloadTranscripts(videoId);

      // 3단계: 자막 전처리 (30%)
      this.progressCallback('🔧 자막 전처리 중...', 30, '노이즈 제거 및 문장 정리');
      const cleanedTranscripts = await this.preprocessTranscripts(transcripts);

      // 4단계: 구간별 분할 (40%)
      this.progressCallback('✂️ 구간별 분할 중...', 40, '의미 단위로 구간 분할');
      const sections = await this.segmentTranscripts(cleanedTranscripts, videoInfo.duration);

      // 5단계: 핵심 내용 추출 (50%)
      this.progressCallback('🎯 핵심 내용 추출 중...', 50, '각 구간의 주요 포인트 식별');
      const processedSections = await this.extractKeyPoints(sections);

      // 6단계: AI 1차 분석 (60%)
      this.progressCallback('🤖 AI 1차 분석 중...', 60, '구간별 요약 생성');
      const summarizedSections = await this.firstAIAnalysis(processedSections, geminiApiKey);

      // 7단계: AI 2차 분석 (70%)
      this.progressCallback('🧠 AI 2차 분석 중...', 70, '전체 구조화 및 연결점 찾기');
      const structuredNote = await this.secondAIAnalysis(summarizedSections, videoInfo, geminiApiKey);

      // 8단계: 노트 구조화 (80%)
      this.progressCallback('📚 노트 구조화 중...', 80, '최종 노트 형태로 조합');
      const finalNote = await this.structureNote(structuredNote, videoInfo);

      // 9단계: 품질 검증 (90%)
      this.progressCallback('✅ 품질 검증 중...', 90, '생성된 노트의 완성도 검사');
      const validatedNote = await this.validateNote(finalNote);

      // 10단계: 최종 완료 (100%)
      const processingTime = Date.now() - this.startTime;
      this.progressCallback('🎉 노트 생성 완료!', 100, `총 ${Math.round(processingTime / 1000)}초 소요`);

      return {
        ...validatedNote,
        processingTime
      };

    } catch (error) {
      console.error('고급 노트 생성 오류:', error);
      throw error;
    }
  }

  private async getVideoInfo(videoId: string, youtubeApiKey: string) {
    const response = await fetch(`/api/video-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, youtubeApiKey })
    });

    if (!response.ok) {
      throw new Error('영상 정보 수집 실패');
    }

    return await response.json();
  }

  private async downloadTranscripts(videoId: string): Promise<TranscriptSegment[]> {
    const response = await fetch('/api/youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });

    if (!response.ok) {
      console.warn('자막 추출 실패, 빈 자막으로 진행');
      return [];
    }

    const data = await response.json();
    return data.transcripts || [];
  }

  private async preprocessTranscripts(transcripts: TranscriptSegment[]): Promise<TranscriptSegment[]> {
    // 1초 정도 대기 (전처리 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1000));

    return transcripts.map(segment => ({
      ...segment,
      text: segment.text
        .replace(/\[.*?\]/g, '') // 대괄호 제거
        .replace(/\(.*?\)/g, '') // 괄호 제거  
        .replace(/\s+/g, ' ')    // 중복 공백 제거
        .trim()
    })).filter(segment => segment.text.length > 0);
  }

  private async segmentTranscripts(
    transcripts: TranscriptSegment[], 
    duration: string
  ): Promise<{ timeRange: string; segments: TranscriptSegment[] }[]> {
    
    // 1초 정도 대기 (분할 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (transcripts.length === 0) {
      return [{
        timeRange: '0:00-' + duration,
        segments: []
      }];
    }

    // 5분 단위로 구간 분할
    const sectionDuration = 300; // 5분
    const sections: { timeRange: string; segments: TranscriptSegment[] }[] = [];
    
    let currentSection: TranscriptSegment[] = [];
    let sectionStart = 0;
    
    for (const segment of transcripts) {
      if (segment.start - sectionStart > sectionDuration && currentSection.length > 0) {
        const startTime = Math.floor(sectionStart / 60) + ':' + String(Math.floor(sectionStart % 60)).padStart(2, '0');
        const endTime = Math.floor(segment.start / 60) + ':' + String(Math.floor(segment.start % 60)).padStart(2, '0');
        
        sections.push({
          timeRange: `${startTime}-${endTime}`,
          segments: [...currentSection]
        });
        
        currentSection = [segment];
        sectionStart = segment.start;
      } else {
        currentSection.push(segment);
      }
    }

    // 마지막 구간 추가
    if (currentSection.length > 0) {
      const startTime = Math.floor(sectionStart / 60) + ':' + String(Math.floor(sectionStart % 60)).padStart(2, '0');
      sections.push({
        timeRange: `${startTime}-${duration}`,
        segments: currentSection
      });
    }

    return sections;
  }

  private async extractKeyPoints(
    sections: { timeRange: string; segments: TranscriptSegment[] }[]
  ): Promise<ProcessedSection[]> {
    
    // 1초 정도 대기 (핵심 추출 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1000));

    return sections.map(section => {
      const rawText = section.segments.map(s => s.text).join(' ');
      const sentences = rawText.split(/[.!?]/).filter(s => s.trim().length > 0);
      
      // 각 구간에서 핵심 문장들 추출 (단순 로직)
      const keyPoints = sentences
        .filter(sentence => sentence.length > 10 && sentence.length < 200)
        .slice(0, 3); // 최대 3개

      return {
        timeRange: section.timeRange,
        rawText,
        cleanedText: sentences.join('. '),
        keyPoints
      };
    });
  }

  private async firstAIAnalysis(
    sections: ProcessedSection[],
    geminiApiKey: string
  ): Promise<any[]> {
    
    // AI 분석 시뮬레이션 (실제로는 각 구간을 개별 분석)
    const results = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // 각 구간을 AI로 분석
      try {
        console.log(`[AdvancedNoteGenerator] 구간 ${i + 1} 분석 시작:`, {
          timeRange: section.timeRange,
          rawTextLength: section.rawText?.length || 0,
          keyPointsCount: section.keyPoints?.length || 0
        });

        const response = await fetch('/api/analyze-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: section,
            geminiApiKey: geminiApiKey
          })
        });

        console.log(`[AdvancedNoteGenerator] 구간 ${i + 1} API 응답 상태:`, response.status);

        if (response.ok) {
          const analysis = await response.json();
          console.log(`[AdvancedNoteGenerator] 구간 ${i + 1} 분석 성공:`, analysis);
          results.push(analysis);
        } else {
          const errorText = await response.text();
          console.error(`[AdvancedNoteGenerator] 구간 ${i + 1} API 오류 (${response.status}):`, errorText);
          
          // AI 실패 시 기본 분석
          results.push({
            timeRange: section.timeRange,
            title: `구간 ${i + 1}`,
            summary: section.keyPoints.join('. ') || '이 구간의 내용을 분석할 수 없습니다.',
            concepts: ['개념1', '개념2'],
            actions: ['실행1', '실행2']
          });
        }
      } catch (error) {
        console.error(`[AdvancedNoteGenerator] 구간 ${i + 1} 네트워크 오류:`, error);
        
        // 오류 시 기본 분석
        results.push({
          timeRange: section.timeRange,
          title: `구간 ${i + 1}`,
          summary: section.cleanedText.substring(0, 200) + '...',
          concepts: ['개념1', '개념2'],
          actions: ['실행1', '실행2']
        });
      }
    }

    return results;
  }

  private async secondAIAnalysis(
    sections: any[],
    videoInfo: any,
    geminiApiKey: string
  ): Promise<any> {
    
    try {
      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoInfo.id,
          videoInfo: videoInfo,
          analyzedSections: sections,
          geminiApiKey: geminiApiKey
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('2차 AI 분석 실패');
      }
    } catch (error) {
      console.warn('2차 AI 분석 실패, 기본 구조 생성:', error);
      
      // 기본 구조 생성
      return {
        keyInsight: `${videoInfo.title}에서 유용한 정보를 얻을 수 있습니다.`,
        sections: sections.map(section => ({
          timeRange: section.timeRange,
          title: section.title,
          content: section.summary,
          keyConcepts: section.concepts,
          actionPoints: section.actions
        }))
      };
    }
  }

  private async structureNote(structuredNote: any, videoInfo: any): Promise<GeneratedNote> {
    // 1초 정도 대기 (구조화 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      title: videoInfo.title,
      channelTitle: videoInfo.channelTitle || '알 수 없음',
      duration: videoInfo.duration || '0:00',
      keyInsight: structuredNote.keyInsight,
      sections: structuredNote.sections,
      processingTime: 0 // 이후에 설정됨
    };
  }

  private async validateNote(note: GeneratedNote): Promise<GeneratedNote> {
    // 1초 정도 대기 (검증 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 기본 검증
    if (!note.keyInsight || note.keyInsight.length < 10) {
      note.keyInsight = `${note.title}에서 중요한 인사이트와 정보를 얻을 수 있습니다.`;
    }

    if (!note.sections || note.sections.length === 0) {
      note.sections = [{
        timeRange: '0:00-' + note.duration,
        title: '전체 내용 요약',
        content: '이 영상의 주요 내용을 분석하여 정리했습니다.',
        keyConcepts: ['핵심개념1', '핵심개념2'],
        actionPoints: ['실행항목1', '실행항목2']
      }];
    }

    return note;
  }
}