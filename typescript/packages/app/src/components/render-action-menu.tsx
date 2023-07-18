import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { IconButton, Menu, MenuItem } from "@mui/joy";
import React from "react";
import { useSetCIM } from "../hooks/use-set-cim";

export const RenderActionMenu: React.FC<{ fileReferenceId: string }> = ({
  fileReferenceId,
}) => {
  const buttonRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const { trigger, isMutating } = useSetCIM();

  return (
    <>
      <IconButton ref={buttonRef} variant="plain" onClick={() => setOpen(true)}>
        <MoreVertOutlinedIcon />
      </IconButton>
      <Menu
        anchorEl={buttonRef.current}
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom-end"
      >
        <MenuItem
          onClick={async () => {
            await trigger({ fileReferenceId });
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
