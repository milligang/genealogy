import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  TextField,
  Button,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Close, CameraAlt } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { loadFamilyData } from '../data/people';
import optimizeImage from '../utils/imageOptimization';

export const PersonForm = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    goesBy: '',
    gender: '',
    birthDate: null,
    deathDate: null,
    photo: '',
    notes: '',
  });

  const [connections, setConnections] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [connectionType, setConnectionType] = useState('child');
  const [availableNodes, setAvailableNodes] = useState([]);

  // Load available nodes when dialog opens
  useEffect(() => {
    if (open) {
      const familyData = loadFamilyData();
      setAvailableNodes(familyData.nodes);
    }
  }, [open]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const optimizedImage = await optimizeImage(file);
        setFormData({ ...formData, photo: optimizedImage });
      } catch (error) {
        console.error('Error optimizing image:', error);
      }
    }
  };

  const handleAddConnection = () => {
    if (selectedPerson) {
      const node = availableNodes.find(n => n.id === selectedPerson);
      if (node) {
        setConnections([
          ...connections,
          {
            personId: selectedPerson,
            personName: node.data.goesBy || node.data.firstName || 'Unnamed',
            type: connectionType
          }
        ]);
        setSelectedPerson('');
      }
    }
  };

  const handleRemoveConnection = (personId) => {
    setConnections(connections.filter(c => c.personId !== personId));
  };

  const handleSubmit = () => {
    if (formData.goesBy) {
      onSave({ formData, connections });
      // Reset form
      setFormData({ 
        firstName: '', 
        middleName: '', 
        lastName: '', 
        goesBy: '', 
        gender: '',
        birthDate: null, 
        deathDate: null, 
        photo: '', 
        notes: '' 
      });
      setConnections([]);
    }
  };

  const getInitials = () => {
    return formData.goesBy ? formData.goesBy.charAt(0).toUpperCase() : '?';
  };

  const getAvailablePeople = () => {
    const connectedIds = connections.map(c => c.personId);
    return availableNodes.filter(n => !connectedIds.includes(n.id));
  };

  const getRelationChipColor = (type) => {
    switch(type) {
      case 'spouse': return 'secondary';
      case 'parent': return 'primary';
      case 'child': return 'success';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add New Person</Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <Avatar 
                src={formData.photo} 
                sx={{ 
                  width: 80, 
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 600
                }}
              >
                {!formData.photo && getInitials()}
              </Avatar>
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<CameraAlt />}
              >
                Upload Photo
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
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />

            <TextField
              label="Middle Name"
              fullWidth
              value={formData.middleName}
              onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
            />

            <TextField
              label="Last Name"
              fullWidth
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />

            <TextField
              label="Goes By"
              fullWidth
              value={formData.goesBy}
              onChange={(e) => setFormData({ ...formData, goesBy: e.target.value })}
              required
              helperText="Required - the name this person is known by"
            />

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                value={formData.birthDate}
                onChange={(date) => setFormData({ ...formData, birthDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="Death Date (Optional)"
                value={formData.deathDate}
                onChange={(date) => setFormData({ ...formData, deathDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
            
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
            />

            {availableNodes.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 0 }}>
                  Add Connections (Optional)
                </Typography>
                
                <Box display="flex" gap={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Person</InputLabel>
                    <Select
                      value={selectedPerson}
                      onChange={(e) => setSelectedPerson(e.target.value)}
                      label="Person"
                    >
                      {getAvailablePeople().map(node => (
                        <MenuItem key={node.id} value={node.id}>
                          {node.data.goesBy || node.data.firstName || 'Unnamed'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 130 }} size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={connectionType}
                      onChange={(e) => setConnectionType(e.target.value)}
                      label="Type"
                    >
                      <MenuItem value="spouse">Spouse</MenuItem>
                      <MenuItem value="parent">Parent</MenuItem>
                      <MenuItem value="child">Child</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Button 
                  variant="outlined" 
                  onClick={handleAddConnection}
                  disabled={!selectedPerson}
                  size="small"
                >
                  Add Connection
                </Button>

                {connections.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {connections.map((conn) => (
                      <Chip
                        key={conn.personId}
                        label={`${conn.personName} (${conn.type})`}
                        color={getRelationChipColor(conn.type)}
                        onDelete={() => handleRemoveConnection(conn.personId)}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={!formData.goesBy}
          >
            Add Person
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};