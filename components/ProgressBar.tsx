"use client";
import * as React from "react";
import * as Progress from "@radix-ui/react-progress";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label = "XP Progress",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <span className="text-sm text-gray-400">
          {value} / {max}
        </span>
      </div>
      <Progress.Root className="relative overflow-hidden bg-gray-800 rounded-full h-4 w-full">
        <Progress.Indicator
          className="bg-green-500 h-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </Progress.Root>
    </div>
  );
}
