/** Timestamps render in the visitor's time zone. The server's text differs, so hydration is told to expect that. */
export function LocalTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} className="sm mut" suppressHydrationWarning>
      {new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}
