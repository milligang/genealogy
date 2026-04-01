import React from 'react';
import { Paper, Box, Typography, Avatar, useTheme } from '@mui/material';
import { CalendarToday, Add } from '@mui/icons-material';
import { Handle, Position } from 'reactflow';
import dayjs from 'dayjs';
import { vintageColors } from '../theme/vintageTheme';
import { darkColors } from '../theme/darkTheme';
import { nodeStyles } from '../theme/sharedStyles';
import { handleAddPerson } from '../utils/handleAddPerson';

export const PersonNode = ({ data, selected }) => {
  if (!data) {
    console.error('PersonNode missing data!', data);
    return <Paper>Missing data</Paper>;
  }
  const theme = useTheme();

  const getAge = () => {
    if (!data.birthDate) return '';
    const birthYear = typeof data.birthDate === 'object'
      ? data.birthDate.year
      : dayjs(data.birthDate).year();
    const endYear = data.deathDate
      ? (typeof data.deathDate === 'object' ? data.deathDate.year : dayjs(data.deathDate).year())
      : dayjs().year();
    return endYear - birthYear;
  };

  const formatDate = (date) => {
    if (!date) return '??';
    if (typeof date === 'object' && date.year) return String(date.year);
    return dayjs(date).format('YYYY');
  };

  const getInitials = () => {
    const name = data.goesBy || data.firstName || '';
    return name.charAt(0).toUpperCase();
  };

  const getFullName = () => `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed';

  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const genderColors = data.gender
    ? colors.gender[data.gender.toLowerCase()] || colors.gender.other
    : colors.gender.other;

  const handleColor = theme.palette.mode === 'dark'
    ? theme.palette.primary.main
    : theme.palette.secondary.main;

  const nodeBaseStyles = {
    ...nodeStyles.base,
    border: '2px solid',
    borderColor: selected ? genderColors.border : genderColors.primary,
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    '&:hover .plus-btn': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  };

  const nodeId = data.id;

  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (data.onClick) data.onClick({ ...data, nodeId: data.id });
  };

  const plusBtnSx = (position) => ({
    ...nodeStyles.plusButton(theme, position),
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.15s ease',
  });

  return (
    <Paper
      elevation={selected ? 6 : 3}
      sx={{
        ...nodeBaseStyles,
        position: 'relative',
        cursor: data.onClick ? 'pointer' : 'default',
      }}
      onClick={handleNodeClick}
    >
      {/* Handles with explicit IDs */}
      <Handle id="target-top" type="target" position={Position.Top} style={{ background: handleColor, width: 10, height: 10 }} />
      <Handle id="source-bottom" type="source" position={Position.Bottom} style={{ background: handleColor, width: 10, height: 10 }} />

      <Box className="plus-btn" sx={plusBtnSx('top')} onClick={(e) => {
        e.stopPropagation();
        if (data.addPersonCallback) data.addPersonCallback([{ nodeId, type: 'parent' }]);
      }}>
        <Add fontSize="small" />
      </Box>
      <Box className="plus-btn" sx={plusBtnSx('bottom')} onClick={(e) => {
        e.stopPropagation();
        if (data.addPersonCallback) data.addPersonCallback([{ nodeId, type: 'child' }]);
      }}>
        <Add fontSize="small" />
      </Box>
      <Box className="plus-btn" sx={plusBtnSx('left')} onClick={(e) => {
        e.stopPropagation();
        if (data.addPersonCallback) data.addPersonCallback([{ nodeId, type: 'spouse' }]);
      }}>
        <Add fontSize="small" />
      </Box>
      <Box className="plus-btn" sx={plusBtnSx('right')} onClick={(e) => {
        e.stopPropagation();
        if (data.addPersonCallback) data.addPersonCallback([{ nodeId, type: 'spouse' }]);
      }}>
        <Add fontSize="small" />
      </Box>

      {/* Node content */}
      <Box sx={{ cursor: 'pointer' }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <Avatar
            src={data.photo}
            sx={{
              width: 40,
              height: 40,
              bgcolor: genderColors.primary,
              borderColor: genderColors.light,
              fontSize: '1.1rem',
              fontWeight: 600,
            }}
          >
            {!data.photo && getInitials()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {data.goesBy || data.firstName || 'Unnamed'}
            </Typography>
            {data.goesBy && data.goesBy !== data.firstName && (
              <Typography variant="caption" color="text.secondary">
                {getFullName()}
              </Typography>
            )}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5}>
          <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {formatDate(data.birthDate)}
            {data.deathDate ? ` - ${formatDate(data.deathDate)}` : ' - Present'}
            {getAge() && ` (${getAge()} yrs)`}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};