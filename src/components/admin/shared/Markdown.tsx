import React, { useRef } from "react";
import { Bold, Italic, Underline, List } from "lucide-react";

interface MarkdownTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  id: string;
}

export function MarkdownTextarea({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className = "",
  rows = 4,
  id,
}: MarkdownTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToolbarClick = (type: "bold" | "italic" | "underline" | "bullet") => {
    const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let prefix = "";
    let suffix = "";
    let replacement = "";

    switch (type) {
      case "bold":
        prefix = "**";
        suffix = "**";
        replacement = prefix + (selectedText || "chữ đậm") + suffix;
        break;
      case "italic":
        prefix = "*";
        suffix = "*";
        replacement = prefix + (selectedText || "chữ nghiêng") + suffix;
        break;
      case "underline":
        prefix = "<u>";
        suffix = "</u>";
        replacement = prefix + (selectedText || "gạch chân") + suffix;
        break;
      case "bullet":
        prefix = "\n- ";
        suffix = "";
        replacement = prefix + (selectedText || "mục mới") + suffix;
        break;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Refocus and place cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = start + replacement.length - suffix.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  return (
    <div className={`flex flex-col border border-stone-200 bg-white rounded-xl overflow-hidden focus-within:border-stone-950 transition-colors ${className}`}>
      {/* Quick Toolbar */}
      <div className="flex items-center gap-1 bg-stone-50 border-b border-stone-200 px-2.5 py-1.5 select-none">
        <button
          type="button"
          onClick={() => handleToolbarClick("bold")}
          title="In đậm (Bold)"
          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-150 rounded transition cursor-pointer flex items-center justify-center"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleToolbarClick("italic")}
          title="In nghiêng (Italic)"
          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-150 rounded transition cursor-pointer flex items-center justify-center"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleToolbarClick("underline")}
          title="Gạch chân (Underline)"
          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-150 rounded transition cursor-pointer flex items-center justify-center"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-stone-200 mx-1" />
        <button
          type="button"
          onClick={() => handleToolbarClick("bullet")}
          title="Danh sách dấu tròn (Bullet List)"
          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-150 rounded transition cursor-pointer flex items-center justify-center"
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs text-stone-800 bg-white border-0 outline-none focus:ring-0 focus:outline-none resize-y min-h-[80px]"
      />
    </div>
  );
}

export function MarkdownRenderer({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;

  // Render text lines, recognizing basic Markdown blocks like lists and inline formatting
  const lines = text.split("\n");

  return (
    <div className={`space-y-1.5 leading-relaxed text-stone-600 ${className}`}>
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");

        if (isBullet) {
          const content = trimmed.substring(2);
          return (
            <ul key={idx} className="list-disc pl-4 space-y-0.5">
              <li>{parseInlineMarkdown(content)}</li>
            </ul>
          );
        }

        // Standard text paragraph
        return (
          <p key={idx} className="min-h-[0.5rem]">
            {parseInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

// Inline Markdown parser for **bold**, *italic*, <u>underline</u>, and `code`
function parseInlineMarkdown(text: string): React.ReactNode[] {
  let tokens: Array<{ type: "text" | "bold" | "italic" | "underline" | "code"; text: string }> = [
    { type: "text", text }
  ];

  // Parse Bold: \*\*(.*?)\*\*
  tokens = tokens.flatMap(token => {
    if (token.type !== "text") return token;
    const parts = token.text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => ({
      type: i % 2 === 1 ? ("bold" as const) : ("text" as const),
      text: part
    }));
  });

  // Parse Italic: \*(.*?)\*
  tokens = tokens.flatMap(token => {
    if (token.type !== "text") return token;
    const parts = token.text.split(/\*(.*?)\*/g);
    return parts.map((part, i) => ({
      type: i % 2 === 1 ? ("italic" as const) : ("text" as const),
      text: part
    }));
  });

  // Parse Underline: <u>(.*?)</u>
  tokens = tokens.flatMap(token => {
    if (token.type !== "text") return token;
    const parts = token.text.split(/<u>(.*?)<\/u>/g);
    return parts.map((part, i) => ({
      type: i % 2 === 1 ? ("underline" as const) : ("text" as const),
      text: part
    }));
  });

  // Parse Code: `(.*?)`
  tokens = tokens.flatMap(token => {
    if (token.type !== "text") return token;
    const parts = token.text.split(/`([^`]+)`/g);
    return parts.map((part, i) => ({
      type: i % 2 === 1 ? ("code" as const) : ("text" as const),
      text: part
    }));
  });

  return tokens.map((token, i) => {
    switch (token.type) {
      case "bold":
        return <strong key={i} className="font-extrabold text-stone-900">{token.text}</strong>;
      case "italic":
        return <em key={i} className="italic">{token.text}</em>;
      case "underline":
        return <span key={i} className="underline decoration-stone-400">{token.text}</span>;
      case "code":
        return <code key={i} className="bg-stone-100 text-rose-600 px-1 py-0.5 rounded text-[10px]">{token.text}</code>;
      default:
        return token.text;
    }
  });
}
