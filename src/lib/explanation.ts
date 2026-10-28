import { z } from "zod";

export const explanationInput = z.object({ text: z.string().trim().min(1).max(1200) });

export function popupPosition(rect: { left: number; bottom: number; top: number }, width: number, height: number, expanded: boolean) {
  const popupWidth = Math.min(expanded ? 360 : 180, width - 24);
  const popupHeight = expanded ? 260 : 44;
  const below = rect.bottom + 8;
  return {
    left: Math.max(12, Math.min(rect.left, width - popupWidth - 12)),
    top: below + popupHeight <= height - 12 ? below : Math.max(12, rect.top - popupHeight - 8),
    width: popupWidth,
    maxHeight: Math.max(100, height - 24),
  };
}