export interface TranscriptLink {
  displayName: string;
  ticker: string;
  publishDate: Date;
  title: string;
  link: string;
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
