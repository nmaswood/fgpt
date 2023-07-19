import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { IconButton, Menu, MenuItem } from "@mui/joy";
import React from "react";

import { useSetShowCaseFile } from "../hooks/use-set-show-case-file";

export const RenderActionMenu: React.FC<{
  fileReferenceId: string;
  mutate: () => void;
}> = ({ fileReferenceId, mutate }) => {
  const buttonRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const { trigger, isMutating } = useSetShowCaseFile();

  return (
    <>
      <IconButton ref={buttonRef} variant="plain" onClick={() => setOpen(true)}>
        <MoreVertOutlinedIcon />
      </IconButton>
      <Menu
        anchorEl={buttonRef.current}
        open={open}
        onClose={() => setOpen(false)}
        placement="left-end"
      >
        <MenuItem
          onClick={async () => {
            await trigger({ fileReferenceId });
            mutate();
            setOpen(false);
          }}
          disabled={isMutating}
        >
          Use as CIM
        </MenuItem>
      </Menu>
    </>
  );
};
