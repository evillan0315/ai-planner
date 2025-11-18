  it('should stream content correctly, parsing SSE format into StreamEvent sequence', async () => {
    // Mock SSE stream content using REAL Gemini API chunk structure
    // Data contains partial GenerateContentResponse objects
    const sseContent = 
      'data: {"candidates":[{"content":{"parts":[{"text":"Hello "}]}]}'+ 
      '\n\n' +
      'data: {"candidates":[{"content":{"parts":[{"text":"world"}]}], "usageMetadata": {"promptTokenCount": 5}}' + 
      '\n\n' +
      'data: [DONE]' +
      '\n\n';

    // Mock fetch response
    mockFetch.mockResolvedValue(new Response(createMockStream(sseContent), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    }));

    const body = { contents: [] };
    // Use the low-level streaming function which is being repaired
    const stream = service.streamGenerateContent(MOCK_ENDPOINT, body);

    const events: StreamEvent[] = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(mockFetch).toHaveBeenCalledTimes(1);
    // Expect 3 events: Chunk 1, Chunk 2 (potentially with metadata), End
    expect(events).toHaveLength(3); 

    // 1. Chunk event (First text part)
    expect(events[0].type).toBe('chunk');
    expect((events[0] as StreamEventTypeChunk).chunk.delta).toBe('Hello ');

    // 2. Chunk event (Second text part, may contain extra metadata fields)
    expect(events[1].type).toBe('chunk');
    expect((events[1] as StreamEventTypeChunk).chunk.delta).toBe('world');

    // 3. End event
    expect(events[2].type).toBe('end');
  });