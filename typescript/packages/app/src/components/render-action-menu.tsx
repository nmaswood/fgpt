import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { IconButton, Menu, MenuItem } from "@mui/joy";
import React from "react";

import { useSetShowCaseFile } from "../hooks/use-set-show-case-file";

export const RenderActionMenu: React.FC<{
  // stupid hack to keep the height consistent
  hidden: boolean;
  fileReferenceId: string;
  mutate: () => void;
}> = ({ hidden, fileReferenceId, mutate }) => {
  const buttonRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const { trigger, isMutating } = useSetShowCaseFile();

  return (
    <>
      <IconButton
        ref={buttonRef}
        variant="plain"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={{ visibility: hidden ? "hidden" : "visible" }}
      >
        <MoreVertOutlinedIcon />
      </IconButton>
      <Menu
        anchorEl={buttonRef.current}
        open={open}
        onClose={() => setOpen(false)}
        placement="left-end"
      >
        <MenuItem
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
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
