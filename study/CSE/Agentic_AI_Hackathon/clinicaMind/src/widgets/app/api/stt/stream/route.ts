import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

export async function POST(request: Request) {
  const apiKey = process.env.DEEPGRAM_API_KEY || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'DEEPGRAM_API_KEY is not defined in server environment variables (.env.local).'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Instantiate Official Deepgram Node.js SDK Client
  const deepgram = createClient(apiKey.trim());

  // Setup Official Deepgram SDK Live Transcription Session
  const dgConnection = deepgram.listen.live({
    model: 'nova-2-medical',
    smart_format: true,
    diarize: true,
    interim_results: true,
    punctuate: true,
    encoding: 'webm'
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Stream controller closed
        }
      };

      // Bind Official Deepgram SDK Event Listeners
      dgConnection.on(LiveTranscriptionEvents.Open, () => {
        console.log('✅ [Official Deepgram SDK Live Connection Opened]');
        sendEvent({ type: 'status', message: 'Official Deepgram SDK Connected' });
      });

      dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const channel = data.channel;
        const transcript = channel?.alternatives?.[0]?.transcript;

        if (transcript && transcript.trim().length > 0) {
          const words = channel?.alternatives?.[0]?.words || [];
          const speakerId = words[0]?.speaker !== undefined ? words[0].speaker : 0;
          const speakerLabel = speakerId === 0 ? 'Doctor' : 'Patient';
          const isFinal = Boolean(data.is_final);
          const confidence = channel?.alternatives?.[0]?.confidence || 0.95;

          sendEvent({
            type: 'transcript',
            text: transcript.trim(),
            isFinal,
            speaker: speakerLabel,
            confidence: parseFloat(confidence.toFixed(2)),
            rawJsonSnippet: JSON.stringify(data).substring(0, 150)
          });
        }
      });

      dgConnection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error('❌ [Official Deepgram SDK Live Error]:', err);
        sendEvent({ type: 'error', message: err?.message || 'Deepgram Live SDK Connection Error' });
      });

      dgConnection.on(LiveTranscriptionEvents.Close, (event) => {
        console.log('🚪 [Official Deepgram SDK Live Connection Closed]:', event);
        sendEvent({ type: 'close', message: 'Deepgram Live Connection Closed' });
      });

      // Forward audio stream chunks from browser to official Deepgram SDK
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

            // Send chunk via official Deepgram SDK live client!
            try {
              dgConnection.send(value.buffer as ArrayBuffer);
            } catch (err) {
              console.warn('Deepgram SDK send notice:', err);
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
