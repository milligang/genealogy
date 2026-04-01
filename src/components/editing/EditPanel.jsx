import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import { Close, CameraAlt, DeleteForever } from '@mui/icons-material';
import { FlexibleDatePicker } from '../../utils/datePicker';
import { getPersonDisplayName, getPersonInitials } from '../../utils/appHelpers';
import optimizeImage from '../../utils/imageOptimization';
import { vintageColors } from '../../theme/vintageTheme';
import { darkColors } from '../../theme/darkTheme';
import { ConnectionsTab } from './ConnectionsTab';

export const EditPanel = ({
  selectedNode,
  onClose,
  onSave,
  onDelete,
  nodes,
  edges,
  onUpdateConnections,
  currentTheme,
}) => {
  const theme = useTheme();
  const colors = theme.palette.mode === 'dark' ? darkColors : vintageColors;
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState(selectedNode.data || {});

  // Muted destructive color — pulls from the palette rather than MUI's bold error red
  const deleteColor =
    theme.palette.mode === 'dark'
      ? { bg: '#6b3a3a', hover: '#7d4444', text: '#e8c4c4' }
      : { bg: '#8b5c52', hover: '#7a4f47', text: '#fff' };

  useEffect(() => {
    setFormData(selectedNode.data || {});
    setTabValue(0);
  }, [selectedNode]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const genderColors = formData.gender
    ? colors.gender[formData.gender.toLowerCase()] || colors.gender.other
    : colors.gender.other;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const optimizedImage = await optimizeImage(file);
        handleChange('photo', optimizedImage);
      } catch (error) {
        console.error('Error optimizing image:', error);
      }
    }
  };

  const handleDelete = () => {
    const name = getPersonDisplayName(formData) || 'this person';
    if (
      window.confirm(
        `Are you sure you want to delete ${name}? This will also remove all their connections and cannot be undone.`
      )
    ) {
      onDelete(selectedNode.id);
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        width: 400,
        height: '100vh',
        overflowY: 'auto',
        borderLeft: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Edit {getPersonDisplayName(formData)}</Typography>
          <Button onClick={onClose} startIcon={<Close />} size="small" />
        </Box>

        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Details" />
          <Tab label="Connections" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Avatar and photo upload */}
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <Avatar
                src={formData.photo}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: formData.photo ? 'primary.main' : genderColors.primary,
                  fontSize: '2.5rem',
                  fontWeight: 600,
                }}
              >
                {!formData.photo && getPersonInitials(formData)}
              </Avatar>
              <Button variant="outlined" component="label" startIcon={<CameraAlt />}>
                {formData.photo ? 'Change Photo' : 'Upload Photo'}
                <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
              </Button>
            </Box>

            <TextField
              label="First Name"
              fullWidth
              value={formData.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
            />
            <TextField
              label="Middle Name"
              fullWidth
              value={formData.middleName || ''}
              onChange={(e) => handleChange('middleName', e.target.value)}
            />
            <TextField
              label="Last Name"
              fullWidth
              value={formData.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
            />
            <TextField
              label="Goes By"
              fullWidth
              value={formData.goesBy || ''}
              onChange={(e) => handleChange('goesBy', e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender || ''}
                onChange={(e) => handleChange('gender', e.target.value)}
                label="Gender"
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Prefer not to say</MenuItem>
              </Select>
            </FormControl>

            <FlexibleDatePicker
              label="Birth Date"
              value={formData.birthDate}
              onChange={(date) => handleChange('birthDate', date)}
            />
            <FlexibleDatePicker
              label="Death Date"
              value={formData.deathDate}
              onChange={(date) => handleChange('deathDate', date)}
            />

            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information..."
            />

            <Button
              variant="contained"
              onClick={() => {
                onSave({ ...selectedNode, data: formData });
                onClose();
              }}
            >
              Save Changes
            </Button>

            <Divider />

            {/* Muted destructive button — same 'contained' shape, subdued palette color */}
            <Button
              variant="contained"
              startIcon={<DeleteForever />}
              onClick={handleDelete}
              sx={{
                mt: 0.5,
                backgroundColor: deleteColor.bg,
                color: deleteColor.text,
                '&:hover': {
                  backgroundColor: deleteColor.hover,
                },
                boxShadow: 'none',
              }}
            >
              Delete Person
            </Button>
          </Box>
        )}

        {tabValue === 1 && (
          <ConnectionsTab
            currentNodeId={selectedNode.id}
            nodes={nodes}
            edges={edges}
            onUpdateConnections={onUpdateConnections}
            currentTheme={currentTheme}
          />
        )}
      </Box>
    </Paper>
  );
};