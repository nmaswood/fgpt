import { processWorkBook } from "@fgpt/precedent-iso";
import { read } from "xlsx";

addEventListener("message", async (event: MessageEvent<string>) => {
  const signedUrl = event.data;
  const response = await fetch(signedUrl);
  const data = await response.arrayBuffer();

  const xlsx = read(data, {});

  const processed = processWorkBook(xlsx.Sheets);
  postMessage(processed);
});
