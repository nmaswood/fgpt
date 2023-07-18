export interface ThumbnailHandler {
  forPdf: () => Promise<void>;
}

export class ThumbnailHandlerImpl implements ThumbnailHandler {
  constructor() {}

  async forPdf(): Promise<void> {}
}
