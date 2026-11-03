const tokenPattern =
  /<\/?[A-Za-z][^>]*>|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/[^\n]*|\b(?:const|let|var|function|return|import|from|export|default|if|else|new|true|false|null)\b|\b\d+\b/g;

function tokenClass(token) {
  if (/^<\/?[A-Za-z]/.test(token)) return "text-sky-300";
  if (/^["'`]/.test(token)) return "text-emerald-300";
  if (/^\/\//.test(token)) return "text-slate-500";
  if (/^\d+$/.test(token)) return "text-amber-300";
  return "text-violet-300";
}

export default function CodeBlock({ code, compact = false }) {
  const parts = [];
  let lastIndex = 0;
  let match;

  tokenPattern.lastIndex = 0;
  while ((match = tokenPattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      parts.push(code.slice(lastIndex, match.index));
    }
    parts.push(
      <span className={tokenClass(match[0])} key={`${match.index}-${match[0]}`}>
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < code.length) parts.push(code.slice(lastIndex));

  return (
    <pre
      className={`overflow-x-auto rounded-lg border border-white/[0.07] bg-[#080e18] p-4 font-mono text-[11px] leading-6 text-slate-300 ${
        compact ? "max-h-48" : ""
      }`}
    >
      <code>{parts}</code>
    </pre>
  );
}
