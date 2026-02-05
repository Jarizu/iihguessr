"use client";

interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <span className="group relative inline-block cursor-help ml-1">
      <span className="text-gray-400 hover:text-gray-300 text-xs">ⓘ</span>
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-2 text-sm text-white bg-gray-900 border border-gray-700 rounded-lg shadow-lg -left-28">
        {content}
      </div>
    </span>
  );
}
