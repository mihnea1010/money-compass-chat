import { createFileRoute } from "@tanstack/react-router";
import { handleExplanation } from "@/lib/ai/explain.server";

export const Route = createFileRoute("/api/explain")({
  server: { handlers: { POST: ({ request }) => handleExplanation(request) } },
});