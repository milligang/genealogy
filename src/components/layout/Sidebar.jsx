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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  CloudUpload,
  Login,
  Close,
} from '@mui/icons-material';
import { THEMES } from '../../theme';
import { useTreeIO } from '../../hooks/useTreeIO';
import { useAuth } from '../../context/AuthContext';
import { FeedbackDialog } from '../dialogs/FeedbackDialog';
import { ComingSoonDialog } from '../dialogs/ComingSoonDialog';

const EXPANDED_WIDTH = 200;
const COLLAPSED_WIDTH = 56;

/**
 * SidebarButton — wraps the inner <Button> in a <span> when disabled so that
 * MUI Tooltip can still listen for events (disabled elements fire no events).
 * The outer caller must NOT add its own wrapper for the disabled-tooltip case;
 * this component handles it internally and consistently.
 */
function SidebarButton({ expanded, icon, label, onClick, color, disabled, disabledTooltip }) {
  const button = (
    // span wrapper is always present so Tooltip always has a live event target,
    // whether or not the button is disabled.
    <span style={{ display: 'block', width: '100%' }}>
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
          // Keep full width even though it's inside a span
          width: '100%',
        }}
      >
        {icon}
        {expanded && (
          <Typography variant="body2" noWrap fontFamily="inherit">
            {label}
          </Typography>
        )}
      </Button>
    </span>
  );

  // Tooltip title priority:
  //  1. disabledTooltip — shown when disabled (explains why)
  //  2. label           — shown when collapsed (acts as a label replacement)
  //  3. ''              — expanded + enabled: no tooltip needed
  const tooltipTitle = disabled && disabledTooltip
    ? disabledTooltip
    : !expanded
      ? label
      : '';

  return (
    <Tooltip title={tooltipTitle} placement="right" arrow>
      {button}
    </Tooltip>
  );
}

export const Sidebar = ({
  onAddPerson,
  onAutoLayout,
  onReset,
  onSaveToCloud,
  saveDisabled = false,
  saveTooltip = 'Save tree to cloud',
  showCloudSave = true,
  isGuest = false,
  onNavigateToLogin,
  addPersonDisabled = false,
  addPersonDisabledTitle = '',
  familyModel,
  onImport,
  currentTheme,
  onThemeToggle,
}) => {
  const { user, signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const fileInputRef = useRef(null);

  const { exportTree, importTree } = useTreeIO(familyModel, (model) => {
    if (window.confirm('Replace your tree with this file?')) {
      onImport(model);
    }
  });

  const handleFileChange = (e) => {
    importTree(e);
    e.target.value = '';
  };

  const isVintage = currentTheme === THEMES.VINTAGE;

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          minHeight: 0,
          alignSelf: 'stretch',
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
            <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.25} minWidth={0}>
              <Box display="flex" alignItems="center" gap={1}>
                <AccountTree fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  Family Tree
                </Typography>
              </Box>
              {isGuest && (
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, pl: 3.5 }}>
                  Guest · local only
                </Typography>
              )}
            </Box>
          )}
          <IconButton size="small" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        </Box>

        {/* Top buttons */}
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <SidebarButton
            expanded={expanded}
            icon={<PersonAdd fontSize="small" />}
            label="Add Person"
            onClick={onAddPerson}
            disabled={addPersonDisabled}
            disabledTooltip={addPersonDisabledTitle}
          />
          <SidebarButton
            expanded={expanded}
            icon={<Download fontSize="small" />}
            label="Download backup"
            onClick={exportTree}
          />
          <SidebarButton
            expanded={expanded}
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
          {showCloudSave && (
            <SidebarButton
              expanded={expanded}
              icon={<CloudUpload fontSize="small" />}
              label="Save to cloud"
              onClick={onSaveToCloud}
              disabled={saveDisabled}
              disabledTooltip={saveTooltip}
            />
          )}
          <SidebarButton
            expanded={expanded}
            icon={<AutoFixHigh fontSize="small" />}
            label="Auto layout"
            onClick={onAutoLayout}
          />
          <SidebarButton
            expanded={expanded}
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

          <SidebarButton
            expanded={expanded}
            icon={<AutoAwesome fontSize="small" />}
            label="Coming soon"
            onClick={() => setComingSoonOpen(true)}
          />

          <SidebarButton
            expanded={expanded}
            icon={<ChatBubbleOutline fontSize="small" />}
            label="Feedback"
            onClick={() => setFeedbackOpen(true)}
          />
        </Box>

        <Box sx={{ flex: 1 }} />
        <Divider />

        {/* Account or guest sign-in */}
        <Box sx={{ p: 1 }}>
          {isGuest ? (
            <SidebarButton
              expanded={expanded}
              icon={<Login fontSize="small" />}
              label="Log in"
              onClick={() => onNavigateToLogin?.()}
            />
          ) : (
            <SidebarButton
              expanded={expanded}
              icon={<AccountCircle fontSize="small" />}
              label="Account"
              onClick={() => setProfileOpen(true)}
            />
          )}
        </Box>
      </Paper>

      {!isGuest && (
        <Dialog
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          fullWidth
          maxWidth="xs"
          aria-labelledby="profile-dialog-title"
        >
          <DialogTitle
            id="profile-dialog-title"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}
          >
            <Typography component="span" variant="h6" fontWeight={600}>
              Profile
            </Typography>
            <IconButton aria-label="Close" onClick={() => setProfileOpen(false)} size="small">
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Signed in as
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {user?.email ?? '—'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={async () => {
                await signOut();
                setProfileOpen(false);
              }}
            >
              Log out
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <ComingSoonDialog open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
};