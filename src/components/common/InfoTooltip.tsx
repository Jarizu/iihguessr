"use client";

interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <span className="group relative inline-block cursor-help ml-1">
      <span className="text-neutral-400 hover:text-neutral-300 text-xs">ⓘ</span>
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-2 text-sm text-white bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg -left-28">
        {content}
      </div>
    </span>
  );
}
