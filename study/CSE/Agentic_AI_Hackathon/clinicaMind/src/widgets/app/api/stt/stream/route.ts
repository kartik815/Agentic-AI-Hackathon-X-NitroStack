import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const deepgramKey = process.env.DEEPGRAM_API_KEY || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  if (!deepgramKey || deepgramKey.trim() === '') {
    return NextResponse.json(
      {
        status: 'error',
        message: 'DEEPGRAM_API_KEY is not defined in server environment variables. Please add DEEPGRAM_API_KEY to your .env.local file.'
      },
      { status: 400 }
    );
  }

  // Set up Server-Sent Events (SSE) Stream to browser
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          console.warn('SSE Controller enqueue notice:', e);
        }
      };

      try {
        const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2-medical&smart_format=true&diarize=true&interim_results=true`;
        console.log('🌐 [Server STT Proxy Opening Deepgram WebSocket]:', wsUrl);

        sendEvent({ type: 'status', serverStatus: 'connecting', message: 'Server opening Deepgram WebSocket...' });

        const ws = new WebSocket(wsUrl, ['token', deepgramKey.trim()]);
        let isWsOpen = false;
        const pendingChunks: Uint8Array[] = [];

        ws.onopen = () => {
          isWsOpen = true;
          console.log('✅ [Server STT Proxy Deepgram WebSocket Connected]');
          sendEvent({ type: 'status', serverStatus: 'connected', message: 'Server connected to Deepgram WebSocket' });

          // Flush any buffered chunks received before ws.onopen completed
          while (pendingChunks.length > 0) {
            const chunk = pendingChunks.shift();
            if (chunk && ws.readyState === WebSocket.OPEN) {
              ws.send(chunk);
            }
          }
        };

        ws.onmessage = (event) => {
          try {
            const received = JSON.parse(event.data.toString());
            const channel = received.channel;
            const transcript = channel?.alternatives?.[0]?.transcript;

            if (transcript && transcript.trim().length > 0) {
              const words = channel?.alternatives?.[0]?.words || [];
              const speakerId = words[0]?.speaker !== undefined ? words[0].speaker : 0;
              const speakerLabel = speakerId === 0 ? 'Doctor' : 'Patient';
              const isFinal = Boolean(received.is_final);
              const confidence = channel?.alternatives?.[0]?.confidence || 0.95;

              sendEvent({
                type: 'transcript',
                text: transcript.trim(),
                isFinal,
                speaker: speakerLabel,
                confidence: parseFloat(confidence.toFixed(2)),
                rawJsonSnippet: event.data.toString().substring(0, 150)
              });
            }
          } catch (err: any) {
            console.error('Error parsing Deepgram WS message:', err);
          }
        };

        ws.onerror = (error: any) => {
          console.error('❌ [Server STT Proxy WebSocket Error]:', error);
          sendEvent({ type: 'error', message: 'Server-side Deepgram WebSocket error. Check API key validity.' });
        };

        ws.onclose = (event) => {
          console.log('🚪 [Server STT Proxy WebSocket Closed]: Code=', event.code, 'Reason=', event.reason);
          sendEvent({ type: 'close', code: event.code, reason: event.reason || 'Server Deepgram WS Closed' });
        };

        // Read incoming browser audio stream chunks from request.body
        if (request.body) {
          const reader = request.body.getReader();
          let packetsCount = 0;
          let bytesCount = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value && value.byteLength > 0) {
              packetsCount += 1;
              bytesCount += value.byteLength;

              if (isWsOpen && ws.readyState === WebSocket.OPEN) {
                // Flush pending queue first
                while (pendingChunks.length > 0) {
                  const pending = pendingChunks.shift();
                  if (pending) ws.send(pending);
                }
                ws.send(value);
              } else {
                pendingChunks.push(value);
              }

              sendEvent({
                type: 'audio_stats',
                packetsCount,
                bytesCount,
                lastChunkSize: value.byteLength
              });
            }
          }
        }
      } catch (err: any) {
        console.error('❌ [Server STT Proxy Fatal Exception]:', err);
        sendEvent({ type: 'error', message: err.message || 'Server STT proxy exception' });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
