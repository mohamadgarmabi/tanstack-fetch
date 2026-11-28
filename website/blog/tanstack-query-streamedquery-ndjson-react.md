---
title: 'TanStack Query streamedQuery: NDJSON Streaming in React'
titleTemplate: false
description: 'Stream NDJSON responses into TanStack Query with experimental_streamedQuery and tanstack-fetch. Learn cancellation, refetch behavior, and reliability trade-offs.'
date: 2026-11-28
category: Tutorials
tags: ['TanStack Query', 'NDJSON', 'Streaming', 'React', 'TypeScript']
---

# TanStack Query streamedQuery: NDJSON streaming in React

<p class="blog-meta">November 28, 2026 · TanStack Query · NDJSON · React</p>

A normal JSON request gives the UI one result when the response is complete. That is the wrong feedback loop for an AI answer, a generated report, or a long-running export that can produce useful data before the server finishes.

You can consume a stream with a `for await` loop, but then you still need to decide where partial results live, how components subscribe to them, and what happens when a request is cancelled or restarted.

TanStack Query v5 has an experimental `streamedQuery` helper for turning an `AsyncIterable` into a query function. [tanstack-fetch](https://mohamadgarmabi.github.io/tanstack-fetch/) provides the HTTP side through its `tanstack-fetch/live` entry: `api.stream()` reads newline-delimited JSON (NDJSON) and yields typed chunks.

This tutorial connects the two, using a React assistant response as the example. The package is an independent community project, not an official TanStack package.

## What `streamedQuery` changes

`streamedQuery` consumes an `AsyncIterable` and writes each chunk into the query cache as it arrives. By default, the cached value is an array containing every chunk.

There are two useful state details:

- The query stays `pending` until the first chunk arrives. After that, it becomes `success`.
- Its `fetchStatus` remains `fetching` until the stream finishes.

That distinction matters in the UI. After the first token, the query has usable data, but the response is still being generated.

The helper is still marked experimental in the [TanStack Query API reference](https://tanstack.com/query/latest/docs/framework/react/reference/functions/experimental_streamedQuery). Treat it as an API that may change between Query releases.

## Choose the transport that matches the server

NDJSON is not a universal replacement for other live transports.

| Transport | Use it when | Client API |
| --- | --- | --- |
| Regular HTTP JSON | The server returns one complete resource | `api.get()` / `api.post()` |
| NDJSON over fetch | The server sends one JSON value per line, often in response to a request body | `api.stream()` |
| Server-Sent Events | The server pushes named events using SSE framing | `api.sse()` |
| WebSocket | The client and server both need to send messages | `api.ws()` |

`api.stream()` is useful when the request needs ordinary HTTP headers, a body, or a method other than GET. If the server already emits SSE frames, use the [SSE guide](/guide/sse) instead. If the feature is bidirectional, use WebSocket and the [React WebSocket walkthrough](/blog/websocket-tanstack-query-react-live-updates).

## Define a small NDJSON contract

The client expects one complete JSON value per line. For example, a text-generation endpoint could return:

~~~json
{"text":"The first part"}
{"text":" of the answer"}
{"text":" is ready."}
~~~

The response should use an NDJSON content type such as `application/x-ndjson`. The server must keep each line independently parseable; arbitrary fragments of one JSON document are not NDJSON.

`api.stream()` sends an `Accept: application/x-ndjson` header, buffers data until a line boundary is available, and parses each line as JSON when possible. A line that is not valid JSON is yielded as a string. The TypeScript generic describes the expected shape, but it does not validate untrusted response data at runtime.

## Create a streamed query

The current package exposes live transports from `tanstack-fetch/live`. The regular `tanstack-fetch` entry does not include `api.stream()`.

~~~ts
// src/lib/api.ts
import { createFetch } from 'tanstack-fetch/live'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
})
~~~

Now define the streamed query. This version accumulates text into a single string rather than keeping an array of tiny token objects.

~~~ts
// src/queries/assistant-stream.ts
import { experimental_streamedQuery as streamedQuery, queryOptions } from '@tanstack/react-query'
import { api } from '../lib/api'

type ChatChunk = {
  text: string
}

export const assistantStreamOptions = (requestId: string, prompt: string) =>
  queryOptions({
    // Use a fresh, non-secret ID for each generation. Do not put credentials in query keys.
    queryKey: ['assistant-stream', requestId],
    staleTime: Infinity,
    retry: false,
    queryFn: streamedQuery<ChatChunk, string>({
      streamFn: ({ signal }) =>
        api.stream<ChatChunk>('/chat/stream', {
          method: 'POST',
          headers: { 'Idempotency-Key': requestId },
          body: { prompt },
          signal,
        }),
      initialValue: '',
      reducer: (currentText, chunk) => currentText + chunk.text,
      refetchMode: 'reset',
    }),
  })
~~~

A few choices here are deliberate:

- `requestId` distinguishes one generation from another without copying the prompt into the query key. Generate a new ID for each user action.
- `Idempotency-Key` is an application-level contract. The server must store and enforce it; sending the header alone does not make a POST idempotent.
- `retry: false` disables Query-level retries, which avoids silently starting the same generation again after a transient stream failure. Transport interceptors can still retry failed HTTP handshakes, so configure those deliberately too.
- `staleTime: Infinity` prevents the completed generation from becoming immediately stale. A manual refetch still starts the query function again.
- `initialValue` and `reducer` are both required when you want a non-array result. Here, each chunk extends the accumulated text.
- `refetchMode: 'reset'` clears the previous result when a refetch begins. `append` can duplicate content if the server replays a stream; `replace` waits until the new stream ends before writing its accumulated result.

If the operation creates a durable job rather than a repeatable read, consider starting that job with a mutation and using `streamedQuery` to read the job's stream by ID. Query functions can be retried or refetched, so a side-effecting endpoint needs an idempotency or job-identity strategy.

## Render partial data in React

The component can render the accumulated string as soon as the first chunk arrives.

~~~tsx
import { useQuery } from '@tanstack/react-query'
import { assistantStreamOptions } from '../queries/assistant-stream'

type Props = {
  requestId: string
  prompt: string
}

export function AssistantAnswer({ requestId, prompt }: Props) {
  const { data, error, isError, isFetching, isPending } = useQuery(
    assistantStreamOptions(requestId, prompt),
  )

  return (
    <section>
      {isPending && <p>Waiting for the first chunk…</p>}
      <pre>{data ?? ''}</pre>
      {isFetching && <p>Generating…</p>}
      {isError && <p role="alert">The stream stopped: {error.message}</p>}
    </section>
  )
}
~~~

Once the first chunk arrives, `isPending` becomes false and the text can be displayed. `isFetching` stays true while more chunks are arriving. If the connection fails after some text has been received, keep the partial output visible and show the error so the user can decide whether to start a new generation.

## Cancellation and failure behavior

Always pass Query's `signal` to `api.stream()`. The live client combines it with its request timeout signal and cancels the underlying reader when the async iterator is stopped. This is important when the user changes the query key, cancels the query, or leaves the screen.

There are a few boundaries to understand:

1. **The request timeout is not a stream-duration limit.** `timeoutMs` covers waiting for response headers. Once the response body is streaming, use an application-level deadline or an `AbortController` if the operation must have a maximum duration.
2. **HTTP errors happen before the stream is consumed.** A non-2xx response is surfaced as a `FetchError`, so status-aware handling can use the normal [error utilities](/guide/errors).
3. **A mid-stream disconnect is not an automatic replay protocol.** `api.stream()` yields the chunks it receives; it does not add event IDs or resume from a cursor. If every event matters, design a server-side cursor and replay contract, or choose an SSE flow with the [resume plugin](/guide/sse#reconnects).
4. **Validate network data.** `api.stream<ChatChunk>()` is a TypeScript assertion, not a runtime schema check. Validate each value with your schema library before using it in business logic, especially when the stream can contain user-controlled or externally generated data.
5. **Keep cache growth intentional.** The default `streamedQuery` result is an array of all chunks. A reducer avoids retaining every token object, but the accumulated text still occupies memory. For very large streams, store bounded summaries or persist completed output outside the query cache.

For authenticated requests, configure the same `getToken`, headers, or interceptors you use for ordinary HTTP calls. In an SSR application, keep user-specific credentials in a request-scoped server client rather than a shared server singleton.

## When this pattern is not the right fit

- Use ordinary `useQuery` when the endpoint returns a complete JSON response.
- Use `api.sse()` when the server speaks SSE and you need event IDs or the SSE resume workflow.
- Use `api.ws()` when the client must send messages over the same live connection.
- Use a mutation to initiate a non-idempotent action, then stream a resource or job that already has a stable ID.

The important boundary is that Query owns the cached result, while the stream is only the delivery mechanism. `streamedQuery` does not make an endpoint resumable, guarantee exactly-once delivery, or replace server-side authorization and validation.

## Related guides

- [TanStack Query integration](/guide/tanstack-query): shared query options, mutations, and `AbortSignal`
- [WebSocket, WebTransport and NDJSON](/guide/websocket): all live transport APIs, including `api.stream()`
- [SSE](/guide/sse): event framing, authentication, and resumable streams
- [Errors](/guide/errors): typed `FetchError` and status handling
- [TanStack Query WebSocket in React](/blog/websocket-tanstack-query-react-live-updates): cache updates and reconnect recovery
