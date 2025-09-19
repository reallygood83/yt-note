import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();
    
    if (!videoId) {
      return NextResponse.json({ error: '비디오 ID가 필요합니다.' }, { status: 400 });
    }

    // Step 1: Fetch YouTube page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      }
    });
    
    const html = await response.text();
    
    // Try to find ytInitialPlayerResponse
    const ytPlayerMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/s);
    
    if (ytPlayerMatch) {
      try {
        const playerData = JSON.parse(ytPlayerMatch[1]);
        const captions = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (captions && captions.length > 0) {
          // Find best caption track
          const koreanTrack = captions.find((t: any) => t.languageCode === 'ko' || t.languageCode === 'ko-KR');
          const autoTrack = captions.find((t: any) => t.vssId?.includes('.asr') || t.kind === 'asr');
          const selectedTrack = koreanTrack || autoTrack || captions[0];
          
          console.log('Found caption track:', {
            language: selectedTrack.languageCode,
            name: selectedTrack.name?.simpleText,
            vssId: selectedTrack.vssId
          });

          // Fetch the caption XML
          const captionUrl = selectedTrack.baseUrl;
          console.log('Caption URL:', captionUrl);
          
          const captionResponse = await fetch(captionUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
          });
          
          console.log('Caption response status:', captionResponse.status);
          const captionXml = await captionResponse.text();
          
          console.log('Caption XML length:', captionXml.length);
          console.log('First 500 chars:', captionXml.substring(0, 500));
          
          // Parse with improved regex
          const segments = [];
          
          // Try multiple parsing patterns
          // Pattern 1: Standard XML format
          const pattern1 = /<text start="([^"]*)" dur="([^"]*)"[^>]*>([^<]*)<\/text>/g;
          let matches = [...captionXml.matchAll(pattern1)];
          
          if (matches.length === 0) {
            // Pattern 2: With CDATA
            const pattern2 = /<text start="([^"]*)" dur="([^"]*)"[^>]*><!\[CDATA\[(.*?)\]\]><\/text>/g;
            matches = [...captionXml.matchAll(pattern2)];
          }
          
          if (matches.length === 0) {
            // Pattern 3: Any content between text tags
            const pattern3 = /<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
            matches = [...captionXml.matchAll(pattern3)];
          }
          
          console.log('Matches found:', matches.length);
          
          for (const match of matches) {
            const start = parseFloat(match[1]);
            const duration = parseFloat(match[2]);
            let text = match[3];
            
            // Decode HTML entities
            text = text.replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#39;/g, "'")
                       .replace(/&nbsp;/g, ' ')
                       .replace(/\\n/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();
            
            if (text) {
              segments.push({
                text,
                start,
                duration
              });
            }
          }
          
          // If still no segments, try to extract any text content
          if (segments.length === 0) {
            const anyTextPattern = /<text[^>]*>(.*?)<\/text>/gs;
            const anyMatches = [...captionXml.matchAll(anyTextPattern)];
            console.log('Any text matches:', anyMatches.length);
            if (anyMatches.length > 0) {
              console.log('Sample text content:', anyMatches[0][1].substring(0, 200));
            }
          }
          
          return NextResponse.json({
            success: true,
            captionTracksCount: captions.length,
            selectedLanguage: selectedTrack.languageCode,
            captionUrl: captionUrl,
            captionResponseStatus: captionResponse.status,
            xmlLength: captionXml.length,
            segmentsFound: segments.length,
            segments: segments.slice(0, 10), // First 10 segments for testing
            totalText: segments.map(s => s.text).join(' ').substring(0, 500),
            debugInfo: {
              xmlStart: captionXml.substring(0, 1000),
              hasTextTags: captionXml.includes('<text'),
              textTagCount: (captionXml.match(/<text/g) || []).length,
              allCaptionTracks: captions.map((t: any) => ({
                lang: t.languageCode,
                name: t.name?.simpleText,
                baseUrl: t.baseUrl?.substring(0, 100) + '...'
              }))
            }
          });
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
    
    // Fallback: Try the old method
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (captionMatch) {
      return NextResponse.json({
        success: false,
        message: 'Found caption tracks with old method',
        tracks: JSON.parse(captionMatch[1])
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'No captions found',
      htmlLength: html.length
    });

  } catch (error) {
    console.error('Test YouTube API error:', error);
    return NextResponse.json({ 
      error: 'Error during testing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}