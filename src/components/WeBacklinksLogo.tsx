/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";

export default function WeBacklinksLogo({ className = "h-8 object-contain" }: { className?: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex items-center gap-2.5">
        <WeBacklinksOriginalLogo className="w-8 h-8 shrink-0" />
        <span className="font-sans font-bold text-lg text-slate-800 tracking-tight flex items-center select-none">
          <span className="text-blue-600">We</span>
          <span className="text-indigo-600">Backlinks</span>
        </span>
      </div>
    );
  }

  return (
    <img
      src="/api/logo.png"
      alt="WeBacklinks Logo"
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}

export function WeBacklinksSiteIcon({ className = "w-8 h-8 object-contain" }: { className?: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <WeBacklinksOriginalLogo className={className} />;
  }

  return (
    <img
      src="/api/site-icon.png"
      alt="WeBacklinks Site Icon"
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}

export function WeBacklinksOriginalLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#logo-grad)" />
      <path
        d="M35 42 C35 34 42 32 50 32 C58 32 65 38 65 46 C65 54 58 58 50 58 M65 58 C65 66 58 68 50 68 C42 68 35 62 35 54 C35 46 42 42 50 42"
        stroke="white"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 50 H60"
        stroke="white"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
