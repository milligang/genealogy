import React from 'react';
import { Box, Avatar, Typography } from '@mui/material';

/**
 * The avatar + name block at the top of a PersonNode card.
 */
export const PersonNodeAvatar = ({ data, genderColors }) => {
  const getInitials = () => {
    const name = data.goesBy || data.firstName || '';
    return name.charAt(0).toUpperCase();
  };

  const getFullName = () =>
    `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed';

  return (
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
  );
};