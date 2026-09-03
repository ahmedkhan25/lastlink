// Shape of the legal documents produced by the scripts/import-legal-* tools.
// Deliberately small: only the constructs the counsel-supplied documents use.

/** An inline span. `b` marks a bold lead-in (defined terms, list captions). */
export interface Run {
  t: string;
  b?: boolean;
}

export type Block =
  | { k: "h2"; n: string; t: string }   // "1. Information We Collect"
  | { k: "h3"; n: string; t: string }   // "1.1 Information You Provide Directly"
  | { k: "p"; runs: Run[] }
  | { k: "li"; runs: Run[] }
  | { k: "callout"; runs: Run[] }       // the tinted summary box at the top
  | { k: "table"; head: string[]; rows: string[][] };

export interface LegalDoc {
  meta: { title?: string; updated?: string; effective?: string };
  blocks: Block[];
}
