import React from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Close, CameraAlt } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ConnectionsTab } from './ConnectionsTab';
import { getPersonDisplayName, getPersonInitials } from '../utils/appHelpers';
import optimizeImage from '../utils/imageOptimization';

export const EditPanel = ({
  selectedNode,
  onClose,
  tabValue,
  onTabChange,
  onSave,
  onUpdate,
  nodes,
  edges,
  onUpdateConnections,
}) => {
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const optimizedImage = await optimizeImage(file);
        onUpdate({
          ...selectedNode,
          data: { ...selectedNode.data, photo: optimizedImage }
        });
      } catch (error) {
        console.error('Error optimizing image:', error);
      }
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
          <Typography variant="h6">
            Edit {getPersonDisplayName(selectedNode.data)}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Tabs 
          value={tabValue} 
          onChange={(e, v) => onTabChange(v)} 
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Details" />
          <Tab label="Connections" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <Avatar 
                src={selectedNode.data.photo} 
                sx={{ 
                  width: 100, 
                  height: 100,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                  fontWeight: 600
                }}
              >
                {!selectedNode.data.photo && getPersonInitials(selectedNode.data)}
              </Avatar>
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<CameraAlt />}
              >
                {selectedNode.data.photo ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </Button>
            </Box>

            <TextField
              label="First Name"
              fullWidth
              value={selectedNode.data.firstName || ''}
              onChange={(e) => {
                onUpdate({
                  ...selectedNode,
                  data: { ...selectedNode.data, firstName: e.target.value }
                });
              }}
            />

            <TextField
              label="Middle Name"
              fullWidth
              value={selectedNode.data.middleName || ''}
              onChange={(e) => {
                onUpdate({
                  ...selectedNode,
                  data: { ...selectedNode.data, middleName: e.target.value }
                });
              }}
            />

            <TextField
              label="Last Name"
              fullWidth
              value={selectedNode.data.lastName || ''}
              onChange={(e) => {
                onUpdate({
                  ...selectedNode,
                  data: { ...selectedNode.data, lastName: e.target.value }
                });
              }}
            />

            <TextField
              label="Goes By"
              fullWidth
              value={selectedNode.data.goesBy || ''}
              onChange={(e) => {
                onUpdate({
                  ...selectedNode,
                  data: { ...selectedNode.data, goesBy: e.target.value }
                });
              }}
              required
              helperText="Required - the name this person is known by"
            />

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={selectedNode.data.gender || ''}
                onChange={(e) => {
                  onUpdate({
                    ...selectedNode,
                    data: { ...selectedNode.data, gender: e.target.value }
                  });
                }}
                label="Gender"
              >
                <MenuItem value="">
                  <em>Prefer not to say</em>
                </MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <Box display="flex" gap={2}>
              <DatePicker
                label="Birth Date"
                value={selectedNode.data.birthDate ? dayjs(selectedNode.data.birthDate) : null}
                onChange={(date) => {
                  onUpdate({
                    ...selectedNode,
                    data: { ...selectedNode.data, birthDate: date ? date.toISOString() : null }
                  });
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="Death Date"
                value={selectedNode.data.deathDate ? dayjs(selectedNode.data.deathDate) : null}
                onChange={(date) => {
                  onUpdate({
                    ...selectedNode,
                    data: { ...selectedNode.data, deathDate: date ? date.toISOString() : null }
                  });
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
            
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={4}
              value={selectedNode.data.notes || ''}
              onChange={(e) => {
                onUpdate({
                  ...selectedNode,
                  data: { ...selectedNode.data, notes: e.target.value }
                });
              }}
              placeholder="Any additional information..."
            />
            <Button
              variant="contained"
              onClick={() => onSave(selectedNode)}
            >
              Save Changes
            </Button>
          </Box>
        )}

        {tabValue === 1 && (
          <ConnectionsTab
            currentNodeId={selectedNode.id}
            nodes={nodes}
            edges={edges}
            onUpdateConnections={onUpdateConnections}
          />
        )}
      </Box>
    </Paper>
  );
};