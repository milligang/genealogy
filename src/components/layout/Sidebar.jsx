import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Switch,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountTree,
  PersonAdd,
  RestartAlt,
  Download,
  Upload,
  AccountCircle,
  ChevronLeft,
  ChevronRight,
  WbSunny,
  DarkMode,
  ChatBubbleOutline,
  AutoAwesome,
  AutoFixHigh,
} from '@mui/icons-material';
import { THEMES } from '../../theme';
import { useTreeIO } from '../../hooks/useTreeIO';
import { useAuth } from '../../context/AuthContext';
import { FeedbackDialog } from '../dialogs/FeedbackDialog';
import { ComingSoonDialog } from '../dialogs/ComingSoonDialog';

const EXPANDED_WIDTH = 200;
const COLLAPSED_WIDTH = 56;

export const Sidebar = ({
  onAddPerson,
  onAutoLayout,
  onReset,
  nodes,
  edges,
  onImport,
  currentTheme,
  onThemeToggle,
}) => {
  const { user, signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const pendingImport = useRef(null);
  const fileInputRef = useRef(null);

  const { exportTree } = useTreeIO(nodes, edges, onImport);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        pendingImport.current = parsed;
        if (window.confirm('Replace your tree with this file?')) {
          const { nodes, edges } = pendingImport.current;
          onImport(nodes, edges);
          pendingImport.current = null;
        }
      } catch {
        alert('Invalid file — please upload a family tree JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isVintage = currentTheme === THEMES.VINTAGE;

  const SidebarButton = ({ icon, label, onClick, color, disabled }) => (
    <Tooltip title={expanded ? '' : label} placement="right" arrow>
      <Button
        fullWidth
        onClick={onClick}
        disabled={disabled}
        color={color || 'inherit'}
        sx={{
          justifyContent: expanded ? 'flex-start' : 'center',
          minWidth: 0,
          px: expanded ? 1.5 : 0,
          py: 1,
          gap: 1.5,
          color: color ? undefined : 'text.primary',
          textTransform: 'none',
          borderRadius: 1.5,
          transition: 'all 0.2s',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {icon}
        {expanded && (
          <Typography variant="body2" noWrap fontFamily="inherit">
            {label}
          </Typography>
        )}
      </Button>
    </Tooltip>
  );

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'space-between' : 'center',
            px: expanded ? 1.5 : 0,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 52,
          }}
        >
          {expanded && (
            <Box display="flex" alignItems="center" gap={1}>
              <AccountTree fontSize="small" color="primary" />
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                Family Tree
              </Typography>
            </Box>
          )}
          <IconButton size="small" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        </Box>

        {/* Top buttons */}
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <SidebarButton
            icon={<PersonAdd fontSize="small" />}
            label="Add Person"
            onClick={onAddPerson}
          />
          <SidebarButton
            icon={<Download fontSize="small" />}
            label="Download backup"
            onClick={exportTree}
          />
          <SidebarButton
            icon={<Upload fontSize="small" />}
            label="Upload tree"
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".json"
            onChange={handleFileChange}
          />
          <SidebarButton
            icon={<AutoFixHigh fontSize="small" />}
            label="Auto layout"
            onClick={onAutoLayout}
          />
          <SidebarButton
            icon={<RestartAlt fontSize="small" />}
            label="Reset data"
            onClick={onReset}
          />
        </Box>

        <Divider />

        {/* Bottom buttons */}
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Theme toggle */}
          <Tooltip
            title={expanded ? '' : isVintage ? 'Switch to dark' : 'Switch to vintage'}
            placement="right"
            arrow
          >
            <Box
              onClick={onThemeToggle}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: expanded ? 'space-between' : 'center',
                px: expanded ? 1.5 : 0,
                py: 0.75,
                borderRadius: 1.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {expanded ? (
                <>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    {isVintage
                      ? <WbSunny fontSize="small" sx={{ color: 'text.primary' }} />
                      : <DarkMode fontSize="small" sx={{ color: 'text.primary' }} />
                    }
                    <Typography variant="body2" noWrap fontFamily="inherit" color="text.primary">
                      {isVintage ? 'Vintage' : 'Dark'}
                    </Typography>
                  </Box>
                  <Switch
                    checked={!isVintage}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    onChange={onThemeToggle}
                    sx={{ pointerEvents: 'none' }}
                  />
                </>
              ) : (
                isVintage
                  ? <WbSunny fontSize="small" sx={{ color: 'text.primary' }} />
                  : <DarkMode fontSize="small" sx={{ color: 'text.primary' }} />
              )}
            </Box>
          </Tooltip>

          {/* Coming Soon */}
          <SidebarButton
            icon={<AutoAwesome fontSize="small" />}
            label="Coming soon"
            onClick={() => setComingSoonOpen(true)}
          />

          {/* Feedback / Feature Request */}
          <SidebarButton
            icon={<ChatBubbleOutline fontSize="small" />}
            label="Feedback"
            onClick={() => setFeedbackOpen(true)}
          />
        </Box>

        <Box sx={{ flex: 1 }} />
        <Divider />

        {/* Account */}
        <Box sx={{ p: 1 }}>
          <SidebarButton
            icon={<AccountCircle fontSize="small" />}
            label="Account"
            onClick={(e) => setAccountAnchor(e.currentTarget)}
          />
        </Box>
      </Paper>

      {/* Account menu */}
      <Menu
        anchorEl={accountAnchor}
        open={Boolean(accountAnchor)}
        onClose={() => setAccountAnchor(null)}
      >
        <MenuItem disabled>{user?.email}</MenuItem>
        <MenuItem onClick={async () => { await signOut(); setAccountAnchor(null); }}>
          Logout
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <ComingSoonDialog open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
};