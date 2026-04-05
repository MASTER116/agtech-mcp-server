export function toolResult(data: unknown) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

export function toolError(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

export function formatToolHandler(fn: () => Promise<unknown>) {
  return fn()
    .then(data => toolResult(data))
    .catch(err => toolError(err instanceof Error ? err.message : String(err)));
}
