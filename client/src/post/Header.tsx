import { useState } from "react";
import {
  Typography,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useLoadingContext } from "../context/LoadingContext";
import { cleanupOrphanedFiles } from "../github";
import { useToastContext, TOAST_TYPES } from "../context/ToastContext";

interface HeaderProps {
  showEditor: boolean;
  clickButton: () => void;
  onOpenSettings: () => void;
}

const Header = ({ showEditor, clickButton, onOpenSettings }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { loadingProcess } = useLoadingContext();
  const { showToast } = useToastContext();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCleanup = async () => {
    try {
      const result = (await loadingProcess(async () =>
        cleanupOrphanedFiles()
      )) as { deleted: string[]; errors: Array<{ file: string; error: string }> };
      showToast(
        `Cleanup completed. Deleted ${result.deleted.length} files.`,
        TOAST_TYPES.SUCCESS
      );
    } catch (error: any) {
      showToast(error?.message || "Cleanup failed", TOAST_TYPES.ERROR);
    }
    setAnchorEl(null);
  };

  const handleSettings = () => {
    setAnchorEl(null);
    onOpenSettings();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          GitHub Blog Editor
        </Typography>
        <Button color="inherit" onClick={clickButton}>
          {showEditor ? "View List" : "New Post"}
        </Button>
        <IconButton
          color="inherit"
          aria-label="more options"
          aria-controls={open ? "menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleSettings}>Settings</MenuItem>
          <MenuItem onClick={handleCleanup}>Clean Orphaned Files</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
