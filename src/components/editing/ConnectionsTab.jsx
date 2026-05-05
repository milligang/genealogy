import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import {
  connectSpouses,
  linkChildToParent,
  removeSpousePartnership,
  unlinkParentFromChild,
  unlinkChildFromUnion,
  findUnionContainingBoth,
  listRelationsForPerson,
} from '../../domain/familyMutations';

const NEW_PERSON_SELECT_VALUE = '__new_person__';

export const ConnectionsTab = ({
  currentNodeId,
  familyModel,
  onUpdateModel,
  onOpenAddConnectedPerson,
}) => {
  const [selectedPerson, setSelectedPerson] = useState('');
  const [connectionType, setConnectionType] = useState('child');

  const relations = currentNodeId ? listRelationsForPerson(familyModel, currentNodeId) : [];

  useEffect(() => {
    setSelectedPerson('');
  }, [connectionType]);

  const getPersonDisplayName = (personId) => {
    const p = familyModel.people[personId];
    if (!p) return 'Unknown';
    return p.goesBy || p.firstName || 'Unnamed';
  };

  const getAvailablePeople = () => {
    if (!currentNodeId) return Object.keys(familyModel.people);
    const ids = Object.keys(familyModel.people).filter((id) => id !== currentNodeId);

    if (connectionType === 'spouse') {
      return ids.filter((id) => !findUnionContainingBoth(familyModel, currentNodeId, id));
    }

    if (connectionType === 'parent') {
      const parentIds = new Set(relations.filter((r) => r.relation === 'parent').map((r) => r.otherId));
      return ids.filter((id) => !parentIds.has(id));
    }

    if (connectionType === 'child') {
      const childIds = new Set(relations.filter((r) => r.relation === 'child').map((r) => r.otherId));
      return ids.filter((id) => !childIds.has(id));
    }

    return ids;
  };

  const handleAddConnection = () => {
    if (!selectedPerson || !currentNodeId) return;

    if (selectedPerson === NEW_PERSON_SELECT_VALUE) {
      if (typeof onOpenAddConnectedPerson === 'function') {
        onOpenAddConnectedPerson({
          anchorPersonId: currentNodeId,
          connectionType,
        });
        setSelectedPerson('');
      }
      return;
    }

    if (connectionType === 'spouse') {
      onUpdateModel((m) => connectSpouses(m, currentNodeId, selectedPerson));
    } else if (connectionType === 'child') {
      onUpdateModel((m) => linkChildToParent(m, selectedPerson, currentNodeId));
    } else {
      onUpdateModel((m) => linkChildToParent(m, currentNodeId, selectedPerson));
    }
    setSelectedPerson('');
  };

  const handleRemoveRelation = (rel) => {
    if (rel.relation === 'spouse') {
      onUpdateModel((m) => removeSpousePartnership(m, currentNodeId, rel.otherId));
    } else if (rel.relation === 'parent') {
      onUpdateModel((m) => unlinkParentFromChild(m, currentNodeId, rel.otherId));
    } else if (rel.relation === 'child') {
      onUpdateModel((m) => unlinkChildFromUnion(m, currentNodeId, rel.otherId));
    }
  };

  const getRelationChipColor = (type) => {
    switch (type) {
      case 'spouse':
        return 'secondary';
      case 'parent':
        return 'primary';
      case 'child':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" mb={2}>
        Add Connection
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Person</InputLabel>
          <Select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            label="Person"
            MenuProps={{
              PaperProps: { sx: { maxHeight: 320 } },
            }}
          >
            {typeof onOpenAddConnectedPerson === 'function' && (
              <MenuItem value={NEW_PERSON_SELECT_VALUE}>
                <Typography component="span" fontWeight={600}>
                  Create new person…
                </Typography>
              </MenuItem>
            )}
            {getAvailablePeople().map((id) => (
              <MenuItem key={id} value={id}>
                {getPersonDisplayName(id)}
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
        disabled={
          !selectedPerson ||
          (selectedPerson === NEW_PERSON_SELECT_VALUE && typeof onOpenAddConnectedPerson !== 'function')
        }
        fullWidth
        sx={{ mb: 3 }}
      >
        {selectedPerson === NEW_PERSON_SELECT_VALUE ? 'Create person & connect' : 'Add Connection'}
      </Button>

      <Typography variant="subtitle2" mb={1}>
        Current Connections
      </Typography>
      <List>
        {relations.map((rel) => (
          <ListItem key={rel.edgeKey} dense>
            <ListItemText primary={getPersonDisplayName(rel.otherId)} />
            <Chip
              label={rel.relation}
              size="small"
              color={getRelationChipColor(rel.relation)}
              sx={{ mr: 1 }}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" size="small" onClick={() => handleRemoveRelation(rel)}>
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {relations.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: 'center' }}
          >
            No connections yet
          </Typography>
        )}
      </List>
    </Box>
  );
};
