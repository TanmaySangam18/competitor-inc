// A friendly animated agent that greets visitors on the landing — our clay agent character (ink body,
// blinking eyes, a coral waving hand), floating, with a speech bubble in the conviction voice.
// Pure SVG + CSS keyframes (in globals.css); honors prefers-reduced-motion via the global rule.

export function AgentWelcome() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="ag-bubble clay-panel absolute right-2 top-0 z-10 max-w-[220px] px-4 py-3">
        <p className="text-sm font-medium leading-snug">Hey — I&apos;m your co-founder.</p>
        <p className="mt-0.5 text-sm leading-snug text-muted">Let&apos;s prove your idea tonight.</p>
        <span
          className="absolute -bottom-1.5 left-7 h-3 w-3 rotate-45 border-b border-r"
          style={{ background: "#fffdf6", borderColor: "rgba(20,19,14,0.08)" }}
        />
      </div>

      <svg viewBox="0 0 220 250" className="w-full" role="img" aria-label="A friendly agent waving hello">
        <ellipse cx="110" cy="238" rx="56" ry="9" fill="#14130e" opacity="0.12" />
        <g className="ag-float">
          <rect x="59" y="150" width="14" height="46" rx="7" fill="#14130e" />
          <ellipse cx="110" cy="168" rx="48" ry="56" fill="#14130e" />
          <circle cx="110" cy="172" r="9" fill="#ff5a36" />
          <circle cx="110" cy="92" r="42" fill="#14130e" />
          <g className="ag-blink">
            <ellipse cx="96" cy="88" rx="5.5" ry="7.5" fill="#ffffff" />
            <ellipse cx="124" cy="88" rx="5.5" ry="7.5" fill="#ffffff" />
          </g>
          <path d="M92 106 Q110 122 128 106" stroke="#f2ecd8" strokeWidth="4" fill="none" strokeLinecap="round" />
          <g className="ag-wave">
            <rect x="150" y="96" width="13" height="48" rx="6.5" fill="#14130e" />
            <circle cx="156" cy="91" r="12" fill="#ff5a36" />
          </g>
        </g>
      </svg>
    </div>
  );
}
