export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <img
        src="/favicon.png"
        alt=""
        className="h-16 w-16 animate-pulse object-contain"
      />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
