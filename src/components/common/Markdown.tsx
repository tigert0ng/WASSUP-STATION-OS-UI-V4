import React, { useRef } from "react";
import { Bold, Italic, Underline, List } from "lucide-react";

// Component Markdown dùng chung toàn dự án (shared/design-ux-guidelines.md §8.2)
// — quick toolbar đúng 4 nút Đậm/Nghiêng/Gạch chân/Bullet, lưu Markdown thuần
// (gạch chân biểu diễn bằng <u>...</u> theo quy ước dự án). Không dùng
// dangerouslySetInnerHTML — MarkdownRenderer tokenize thủ công rồi render JSX,
// nên không có đường chèn HTML/script tùy ý nào ngoài <u> đã escape trước.

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

  const applyFormat = (type: "bold" | "italic" | "underline" | "bullet") => {
    const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement | null);
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
    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = start + replacement.length - suffix.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  // Ctrl/Cmd+B/I/U trên vùng đang bôi đen phải bọc markdown quanh đúng phần
  // đã chọn — giống hành vi mọi trình soạn thảo khác (Docs/Notion/GitHub).
  // Không chặn Ctrl/Cmd+A và các phím khác — chỉ preventDefault đúng 3 tổ hợp
  // này để không ăn cả các shortcut trình duyệt/OS khác trên textarea.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      applyFormat("bold");
    } else if (key === "i") {
      e.preventDefault();
      applyFormat("italic");
    } else if (key === "u") {
      e.preventDefault();
      applyFormat("underline");
    }
  };

  return (
    <div className={`flex flex-col border border-stone-200 bg-white rounded-xl overflow-hidden focus-within:border-matte-black transition-colors ${className}`}>
      <div className="flex items-center gap-1 bg-stone-50 border-b border-stone-200 px-2.5 py-1.5 select-none">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          title="In đậm (Bold)"
          className="p-1.5 text-stone-500 hover:text-matte-black hover:bg-stone-150 rounded transition cursor-pointer flex items-center justify-center border-0 bg-transparent"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          title="In nghiêng (Italic)"
          className="p-1.5 text-stone-500 hover:text-matte-black hover:bg-stone-150 rounded transition cursor-pointer flex items-center justify-center border-0 bg-transparent"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("underline")}
          title="Gạch chân (Underline)"
          className="p-1.5 text-stone-500 hover:text-matte-black hover:bg-stone-150 rounded transition cursor-pointer flex items-center justify-center border-0 bg-transparent"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-stone-200 mx-1" />
        <button
          type="button"
          onClick={() => applyFormat("bullet")}
          title="Danh sách gạch đầu dòng (Bullet list)"
          className="p-1.5 text-stone-500 hover:text-matte-black hover:bg-stone-150 rounded transition cursor-pointer flex items-center justify-center border-0 bg-transparent"
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 text-xs font-sans text-matte-black bg-white border-0 outline-none focus:ring-0 focus:outline-none resize-y min-h-[80px]"
      />
    </div>
  );
}

export function MarkdownRenderer({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className={`space-y-1.5 leading-relaxed text-mid-gray font-sans ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        if (isBullet) {
          const content = trimmed.substring(2);
          return (
            <ul key={idx} className="list-disc pl-4 space-y-0.5">
              <li>{parseInlineMarkdown(content)}</li>
            </ul>
          );
        }
        if (trimmed === "") return <p key={idx} className="min-h-[0.5rem]" />;
        return <p key={idx}>{parseInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

// Parser inline cho **đậm**, *nghiêng*, <u>gạch chân</u> — tokenize thủ công,
// không dùng regex HTML injection, an toàn theo thiết kế (không có
// dangerouslySetInnerHTML ở đâu trong file này).
function parseInlineMarkdown(text: string): React.ReactNode[] {
  let tokens: Array<{ type: "text" | "bold" | "italic" | "underline"; text: string }> = [{ type: "text", text }];

  tokens = tokens.flatMap((token) => {
    if (token.type !== "text") return token;
    const parts = token.text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => ({ type: i % 2 === 1 ? ("bold" as const) : ("text" as const), text: part }));
  });
  tokens = tokens.flatMap((token) => {
    if (token.type !== "text") return token;
    const parts = token.text.split(/\*(.*?)\*/g);
    return parts.map((part, i) => ({ type: i % 2 === 1 ? ("italic" as const) : ("text" as const), text: part }));
  });
  tokens = tokens.flatMap((token) => {
    if (token.type !== "text") return token;
    const parts = token.text.split(/<u>(.*?)<\/u>/g);
    return parts.map((part, i) => ({ type: i % 2 === 1 ? ("underline" as const) : ("text" as const), text: part }));
  });

  return tokens
    .filter((t) => t.text !== "")
    .map((token, i) => {
      switch (token.type) {
        case "bold":
          return (
            <strong key={i} className="font-extrabold text-matte-black">
              {token.text}
            </strong>
          );
        case "italic":
          return (
            <em key={i} className="italic">
              {token.text}
            </em>
          );
        case "underline":
          return (
            <span key={i} className="underline decoration-stone-400">
              {token.text}
            </span>
          );
        default:
          return token.text;
      }
    });
}
