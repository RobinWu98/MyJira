export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
