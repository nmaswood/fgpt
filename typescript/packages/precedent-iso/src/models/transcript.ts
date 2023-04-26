export interface TranscriptLink {
  title: string;
  tickers: string[];
  quarter: string;
  year: string;
  href: string;
}

export interface Transcript {
  id: string;
  ticker: string;
  publishDate: Date;
  blocks: TextBlock[];
}

export interface TextBlock {
  header: string;
  body: string;
}
