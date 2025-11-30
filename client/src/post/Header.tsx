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

interface HeaderProps {
  showEditor: boolean;
  clickButton: () => void;
}

const Header = ({ showEditor, clickButton }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { del } = useLoadingContext();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCleanup = async () => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    await del(`${apiUrl}/api/files/clean-orphaned-files`);
    setAnchorEl(null);
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
          <MenuItem onClick={handleCleanup}>Clean Orphaned Files</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
