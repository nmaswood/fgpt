import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { IconButton, Menu, MenuItem } from "@mui/joy";
import React from "react";

export const RenderActionMenu: React.FC<{ fileReferenceId: string }> = () => {
  const buttonRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);

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
        <MenuItem onClick={() => {}}>Use as CIM</MenuItem>
      </Menu>
    </>
  );
};
