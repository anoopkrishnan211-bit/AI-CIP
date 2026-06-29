import { useId } from "react";

export function AniraMark({
  className = "size-11",
  monochrome = false,
}: {
  className?: string;
  monochrome?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const gradientId = `anira-gradient-${id}`;
  const accentId = `anira-accent-${id}`;

  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label="ANIRA growth mark"
    >
      <defs>
        <linearGradient id={gradientId} x1="12" y1="82" x2="78" y2="12">
          <stop offset="0" stopColor={monochrome ? "currentColor" : "#7c3aed"} />
          <stop offset=".48" stopColor={monochrome ? "currentColor" : "#2563eb"} />
          <stop offset="1" stopColor={monochrome ? "currentColor" : "#14d8a5"} />
        </linearGradient>
        <linearGradient id={accentId} x1="22" y1="74" x2="84" y2="38">
          <stop stopColor={monochrome ? "currentColor" : "#22c7d9"} />
          <stop offset="1" stopColor={monochrome ? "currentColor" : "#35e29a"} />
        </linearGradient>
      </defs>
      <path
        d="M12 76 39 17c3.8-8.2 15.4-8.4 19.5-.4L85 68c3.2 6.2-1.3 13.5-8.2 13.5H64L48.8 50.8 36.2 76c-2 4-6.1 6.5-10.6 6.5h-7.8c-4.8 0-7.8-3.6-5.8-6.5Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M20 68c18-7 30-13.2 39-23 4.4 5 10.6 7.7 19 7.9-10.1 9-21.3 13.7-33.5 16.5C35.4 71.5 27.2 71 20 68Z"
        fill="#fff"
        opacity=".96"
      />
      <path
        d="M23 68c20.8-4.4 40.6-11.7 59-27-9 17.2-28.4 29.1-59 31Z"
        fill={`url(#${accentId})`}
      />
      <path d="M31 78V68h7v10h-7Zm10 0V63h7v15h-7Zm10 0V56h7v22h-7Z" fill="#fff" />
      <path
        d="m50 25 2.6 7.4L60 35l-7.4 2.6L50 45l-2.6-7.4L40 35l7.4-2.6L50 25Z"
        fill="#fff"
      />
    </svg>
  );
}

