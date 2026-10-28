import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BookOpen, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageResponse } from "@/components/ai-elements/message";
import { popupPosition } from "@/lib/explanation";

type SelectionInfo = { text: string; rect: { left: number; top: number; bottom: number } };

const transport = new DefaultChatTransport({
  api: "/api/explain",
  prepareSendMessagesRequest: ({ messages }) => ({
    body: { text: messages.at(-1)?.parts.filter((part) => part.type === "text").map((part) => part.text).join("") ?? "" },
  }),
});

export function SelectionExplanation() {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [expanded, setExpanded] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { messages, status, error, sendMessage, stop, setMessages, clearError } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    let frame = 0;
    const readSelection = () => {
      const selected = window.getSelection();
      const node = selected?.anchorNode;
      const element = node instanceof Element ? node : node?.parentElement;
      if (element?.closest('[data-selection-explanation], input, textarea, [contenteditable="true"]')) return;
      const text = selected?.toString().trim();
      if (!text || !selected?.rangeCount) {
        if (!expanded) setSelection(null);
        return;
      }
      const rects = selected.getRangeAt(0).getClientRects();
      const rect = rects.item(rects.length - 1);
      if (!rect) return;
      void stop();
      setExpanded(false);
      setSelection({ text, rect: { left: rect.left, top: rect.top, bottom: rect.bottom } });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(readSelection); };
    const close = () => { void stop(); setSelection(null); setExpanded(false); };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const pointerdown = (event: PointerEvent) => {
      if (event.target instanceof Node && !popupRef.current?.contains(event.target)) close();
    };
    const scroll = (event: Event) => {
      if (event.target instanceof Node && popupRef.current?.contains(event.target)) return;
      close();
    };
    document.addEventListener("selectionchange", schedule);
    document.addEventListener("pointerup", schedule);
    document.addEventListener("keydown", keydown);
    document.addEventListener("pointerdown", pointerdown);
    document.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", close);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", schedule);
      document.removeEventListener("pointerup", schedule);
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("pointerdown", pointerdown);
      document.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", close);
    };
  }, [expanded, stop]);

  useEffect(() => { void stop(); setSelection(null); setExpanded(false); }, [location.pathname, stop]);

  if (!selection) return null;
  const text = messages.filter((message) => message.role === "assistant").flatMap((message) => message.parts).filter((part) => part.type === "text").map((part) => part.text).join("");
  const tooLong = selection.text.length > 1200;
  return createPortal(
    <div ref={popupRef} data-selection-explanation role={expanded ? "dialog" : undefined} aria-label={expanded ? "Explicație pe scurt" : undefined}
      className="fixed z-[100] overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
      style={popupPosition(selection.rect, window.innerWidth, window.innerHeight, expanded)}>
      {!expanded ? (
        <Button variant="ghost" className="w-full justify-start" onPointerDown={(event) => event.preventDefault()} onClick={() => {
          setMessages([]); clearError(); setExpanded(true);
          if (!tooLong) void sendMessage({ text: selection.text });
        }}><BookOpen /> Explică-mi asta</Button>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><BookOpen className="size-4 text-primary" /> Pe scurt</span>
            <Button variant="ghost" size="icon-sm" aria-label="Închide explicația" title="Închide explicația" onClick={() => { void stop(); setSelection(null); setExpanded(false); }}><X /></Button>
          </div>
          <div className="space-y-3 p-4 text-sm leading-relaxed">
            <p className="line-clamp-2 break-words border-l-2 border-primary pl-2 text-xs text-muted-foreground">{selection.text}</p>
            <div aria-live="polite" className="break-words">
              {tooLong ? <p>Selectează un fragment mai scurt, de cel mult 1.200 de caractere.</p> : error ? <p role="alert" className="text-destructive">{error.message}</p> : text ? <MessageResponse>{text}</MessageResponse> : busy ? <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> Clarific…</p> : <p>Nu am primit o explicație pentru acest fragment.</p>}
            </div>
          </div>
        </>
      )}
    </div>, document.body,
  );
}