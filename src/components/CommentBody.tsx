"use client";

import ReactMarkdown from "react-markdown";

export function CommentBody({ body }: { body: string }) {
  return (
    <div className="prose-review text-sm">
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}
