import { AdvancedNoteGenerator } from '@/lib/advanced-note-generator';

interface ProgressCallback {
  (step: string, percentage: number, details?: string): void;
}

// 클라이언트에서 사용할 노트 생성 함수 - 고급 워크플로우 사용
export async function generateNote(
  videoId: string,
  geminiApiKey: string,
  youtubeApiKey: string,
  progressCallback: ProgressCallback
) {
  const generator = new AdvancedNoteGenerator((step: string, percentage: number, details?: string) => {
    progressCallback(step, percentage, details);
  });

  return await generator.generateNote(videoId, geminiApiKey, youtubeApiKey);
}