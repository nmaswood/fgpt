import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { MAX_FILE_SIZE_BYTES } from "@fgpt/precedent-iso";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import XHRUpload from "@uppy/xhr-upload";
import React from "react";

import { CLIENT_SETTINGS } from "../client-settings";

export const useUppy = (token: string, projectId: string) => {
  const uppy = React.useMemo(() => {
    const uppy = new Uppy({
      restrictions: {
        allowedFileTypes: [".pdf"],
        minFileSize: 1,
        maxFileSize: MAX_FILE_SIZE_BYTES,
      },
    });

    uppy.use(XHRUpload, {
      endpoint: `${CLIENT_SETTINGS.publicApiEndpoint}/api/v1/files/upload`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    uppy.use(Dashboard, {
      inline: false,
      proudlyDisplayPoweredByUppy: false,
      height: 470,
      browserBackButtonClose: false,
      theme: "dark",
    });

    return uppy;
  }, [token]);
  const openUppyModal = () => {
    const dashboard = uppy.getPlugin("Dashboard");
    if (dashboard) {
      (dashboard as any).openModal();
    }
  };

  React.useEffect(() => {
    uppy.cancelAll();

    uppy.on("file-added", (file) => {
      uppy.setFileMeta(file.id, {
        projectId,
      });
    });
  }, [uppy, projectId]);

  return {
    uppy,
    openUppyModal,
  };
};
