import React from "react";

export const DisplayAsset: React.FC<{
  signedUrl: string;
}> = ({ signedUrl }) => {
  return (
    <object
      data={`${signedUrl}#toolbar=0&view=FitH&zoom=page-width`}
      type="application/pdf"
      style={{ width: "100%", height: "100%" }}
    />
  );
};
