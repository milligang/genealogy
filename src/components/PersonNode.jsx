import React from 'react';
import { Paper, Box, Typography, Avatar, useTheme } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { Handle, Position } from 'reactflow';
import dayjs from 'dayjs';
import { vintageColors } from '../theme/vintageTheme';
import { darkColors } from '../theme/darkTheme';

export const PersonNode = ({ data, selected }) => {
  const theme = useTheme();
  
  const getAge = () => {
    if (!data.birthDate) return '';
    const birthYear = typeof data.birthDate === 'object' ? data.birthDate.year : dayjs(data.birthDate).year();
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

  const getFullName = () => {
    return `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed';
  };

  // Get gender-specific colors
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const genderColors = data.gender 
    ? colors.gender[data.gender.toLowerCase()] || colors.gender.other
    : colors.gender.other;

  // Get handle color from theme
  const handleColor = theme.palette.mode === 'dark' 
    ? theme.palette.primary.main 
    : theme.palette.secondary.main;

  // Dynamic node styles based on theme and gender
  const nodeBaseStyles = {
    padding: '20px',
    minWidth: '180px',
    position: 'relative',
    border: '2px solid',
    borderColor: selected ? genderColors.border : genderColors.primary,
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.2s',
    '&:hover': {
      elevation: 6,
      transform: 'translateY(-2px)',
      borderColor: genderColors.border,
    },
  };

  // Add decorative border for vintage theme
  const vintageDecoration = theme.palette.mode === 'light' && theme.typography.fontFamily.includes('Georgia') ? {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '10px',
      left: '10px',
      right: '10px',
      bottom: '10px',
      border: '1px solid',
      borderColor: genderColors.primary,
      borderRadius: '4px',
      pointerEvents: 'none',
      opacity: 0.5,
    },
  } : {};

  return (
    <Paper
      elevation={selected ? 6 : 3}
      sx={{
        ...nodeBaseStyles,
        ...vintageDecoration,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: handleColor,
          width: 10,
          height: 10,
        }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: handleColor,
          width: 10,
          height: 10,
        }}
      />
      
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
          {data.deathDate
            ? ` - ${formatDate(data.deathDate)}`
            : ' - Present'}
          {getAge() && ` (${getAge()} yrs)`}
        </Typography>
      </Box>
    </Paper>
  );
};