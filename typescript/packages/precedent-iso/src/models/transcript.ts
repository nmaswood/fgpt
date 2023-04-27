export interface EarningsCallHref {
  title: string;
  tickers: string[];
  quarter: string;
  year: string;
  href: string;
}

export interface Transcript {
  blocks: TextBlock[];
}

export interface TextBlock {
  isStrong: boolean;
  text: string;
}
