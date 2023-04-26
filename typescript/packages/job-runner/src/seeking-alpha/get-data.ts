export interface PaginateTranscript {}

interface TranscriptLink {
  displayName: string;
  ticker: string;
  publishDate: Date;
  title: string;
  link: string;
}

interface TranscriptLinksGenerator {
  getLinks(): AsyncGenerator<TranscriptLink>;
}
