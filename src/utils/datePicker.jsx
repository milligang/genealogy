import React, { useState, useEffect } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

export const FlexibleDatePicker = ({ label, value, onChange }) => {
  const [mode, setMode] = useState('full');
  const [yearInput, setYearInput] = useState('');

  useEffect(() => {
    const isYearOnly = value && typeof value === 'object' && !value.month;
    setMode(isYearOnly ? 'year' : 'full');
    const year = typeof value === 'string' ? dayjs(value).year() : value?.year;
    setYearInput(year ? String(year) : '');
  }, [value]);

  const handleModeChange = (_, newMode) => {
    if (!newMode) return;
    setMode(newMode);
    if (newMode === 'year' && value) {
      const year = typeof value === 'string' ? dayjs(value).year() : value?.year;
      setYearInput(year ? String(year) : '');
      onChange(year ? { year } : null);
    } else if (newMode === 'full') {
      if (typeof value === 'string') return;
      const year = value?.year;
      onChange(year ? dayjs().year(year).startOf('year').toISOString() : null);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Box display="flex" alignItems="center" gap={1}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{ height: 24 }}
        >
          <ToggleButton value="year" sx={{ px: 1, py: 0, fontSize: '0.65rem' }}>
            Year
          </ToggleButton>
          <ToggleButton value="full" sx={{ px: 1, py: 0, fontSize: '0.65rem' }}>
            Full
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
      </Box>

      {mode === 'year' ? (
        <TextField
          fullWidth
          size="small"
          placeholder="YYYY"
          value={yearInput}
          inputProps={{ maxLength: 4 }}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setYearInput(val);
            if (val.length === 4) onChange({ year: parseInt(val) });
            if (val.length === 0) onChange(null);
          }}
          onBlur={() => {
            if (yearInput.length > 0 && yearInput.length < 4) {
              const padded = yearInput.padStart(4, '0');
              setYearInput(padded);
              onChange({ year: parseInt(padded) });
            }
          }}
        />
      ) : (
        <DatePicker
          views={['year', 'month', 'day']}
          value={
            !value ? null :
            typeof value === 'string' ? dayjs(value) :
            value?.year ? dayjs(`${value.year}-01-01`) : null
          }
          onChange={(date) => onChange(date ? date.toISOString() : null)}
          minDate={dayjs().year(0)}
          maxDate={dayjs()}
          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
        />
      )}
    </Box>
  );
};