import { useRouter } from "next/router";
import React from "react";
import { z } from "zod";

const ZFileTab = z.enum(["progress", "report", "chat", "debug", "tables"]);
type FileTab = z.infer<typeof ZFileTab>;

export const useTabState = () => {
  const router = useRouter();
  const [tab, setTab] = React.useState<FileTab>(() => {
    const fileTab = ZFileTab.safeParse(router.query.fileTab);
    if (fileTab.success) {
      return fileTab.data;
    }
    return "report";
  });

  React.useEffect(() => {
    if (
      router.query.fileTab === tab ||
      (router.query.fileTab === undefined && tab === "report")
    ) {
      return;
    }
    router.query.fileTab = tab;
    router.replace(router);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return [tab, setTab] as const;
};
