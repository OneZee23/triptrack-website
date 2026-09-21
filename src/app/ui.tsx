import { Loader2, TriangleAlert } from 'lucide-react';

export const ACCENT = '#EB571E';

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[#1e1e23]/65 py-16 justify-center" role="status">
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      <span className="text-[15px] font-medium">{label}</span>
    </div>
  );
}

/** Errors are shown in place, never as a browser dialog — and the text is
 *  always ours (see errors.ts), never the server's. */
export function ErrorNote({ message, onRetry, retryLabel }: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#EB571E]/20 bg-[#EB571E]/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3" role="alert">
      <TriangleAlert className="w-5 h-5 text-[#EB571E] shrink-0" aria-hidden="true" />
      <span className="text-[15px] text-[#1e1e23]/70 flex-1">{message}</span>
      {onRetry && retryLabel && (
        <button
          type="button"
          onClick={onRetry}
          className="text-[14px] font-bold text-[#EB571E] hover:underline self-start sm:self-auto"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
