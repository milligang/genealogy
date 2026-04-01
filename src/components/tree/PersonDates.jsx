import React from 'react';
import { Box, Typography } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import dayjs from 'dayjs';

/**
 * The birth/death date row at the bottom of a PersonNode card.
 */
export const PersonNodeDates = ({ birthDate, deathDate }) => {
  const formatDate = (date) => {
    if (!date) return '??';
    if (typeof date === 'object' && date.year) return String(date.year);
    return dayjs(date).format('YYYY');
  };

  const getAge = () => {
    if (!birthDate) return null;
    const birthYear =
      typeof birthDate === 'object' ? birthDate.year : dayjs(birthDate).year();
    const endYear = deathDate
      ? typeof deathDate === 'object'
        ? deathDate.year
        : dayjs(deathDate).year()
      : dayjs().year();
    return endYear - birthYear;
  };

  const age = getAge();

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
      <Typography variant="caption" color="text.secondary">
        {formatDate(birthDate)}
        {deathDate ? ` – ${formatDate(deathDate)}` : ' – Present'}
        {age != null && ` (${age} yrs)`}
      </Typography>
    </Box>
  );
};