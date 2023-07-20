export interface ScanHandler {
  forPdf: () => Promise<void>;
}

export class ScanHandlerImpl implements ScanHandler {
  async forPdf(): Promise<void> {}
}
