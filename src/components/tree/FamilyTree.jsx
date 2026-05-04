import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { Box, Snackbar, Alert } from '@mui/material';

import { PersonNode } from '../nodes/PersonNode';
import { UnionNode } from '../nodes/UnionNode';
import { PersonForm } from '../editing/PersonForm';
import { EditPanel } from '../editing/EditPanel';
import { Sidebar } from '../layout/Sidebar';
import { SpouseEdge } from '../edges/SpouseEdge';
import { SpouseConnectionLine } from '../edges/SpouseConnection';
import { ParentChildConnectionLine } from '../edges/ParentChildConnection';
import { ComingSoonDialog } from '../dialogs/ComingSoonDialog';
import { FeedbackDialog } from '../dialogs/FeedbackDialog';

import {
  loadFamilyData,
  saveFamilyData,
  createSeedFamilyModel,
  clearFamilyData,
} from '../../data/familyData';
import { getLayoutedElements } from '../../utils/layoutUtils';
import getThemeConfig from '../../theme';
import { initPlusUtil, handleAddPerson } from '../../utils/handleAddPerson';
import { createPersonFromFormData } from '../../utils/appHelpers';
import { useModalBlur } from '../../hooks/useModalBlur';
import { useAuth } from '../../context/AuthContext';
import { buildReactFlowGraph } from '../../domain/buildReactFlowGraph';
import {
  addPerson,
  applyConnectionsForNewPerson,
  connectSpouses,
  linkChildToParent,
  deletePerson,
} from '../../domain/familyMutations';
import { serializeFamilyModel } from '../../utils/serializeFamilyModel';
import { writeSessionDraft, readSessionDraft, clearSessionDraft } from '../../utils/sessionFamilyDraft';
import {
  MAX_PEOPLE_IN_TREE,
  MIN_MS_BETWEEN_CLOUD_SAVES,
  countPeople,
  isAtOrOverPersonLimit,
} from '../../config/treePolicy';
import { GUEST_DRAFT_USER_ID } from '../../constants/guest';

const nodeTypes = { personNode: PersonNode, unionNode: UnionNode };
const edgeTypes = { spouse: SpouseEdge };

const DRAFT_DEBOUNCE_MS = 500;

export const FamilyTree = ({ currentTheme, onThemeToggle, isGuest = false }) => {
  const themeConfig = getThemeConfig(currentTheme);
  const openModal = useModalBlur();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [familyModel, setFamilyModel] = useState(() => createSeedFamilyModel());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraggingSpouse, setIsDraggingSpouse] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine);
  const [dirty, setDirty] = useState(false);
  const [saveCooldownUntil, setSaveCooldownUntil] = useState(0);
  const [cooldownClock, setCooldownClock] = useState(0);
  const [toast, setToast] = useState(null);

  const [addPersonState, setAddPersonState] = useState({
    open: false,
    data: null,
    connections: [],
    onAddPerson: null,
  });
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleAddPersonRef = useRef(null);
  const lastCloudSerializedRef = useRef('');
  const pendingPositionsRef = useRef(null);
  const draftPositionsAppliedRef = useRef(false);
  const draftDebounceRef = useRef(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId && n.type === 'personNode') ?? null,
    [nodes, selectedId],
  );

  const availablePeople = useMemo(
    () =>
      Object.values(familyModel.people).map((p) => ({
        id: p.id,
        label: p.goesBy || p.firstName || 'Unnamed',
      })),
    [familyModel.people],
  );

  const atPersonLimit = isAtOrOverPersonLimit(familyModel);

  useEffect(() => {
    initPlusUtil((open, payload) => setAddPersonState({ open, ...payload }));
  }, []);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  useEffect(() => {
    if (saveCooldownUntil <= Date.now()) return undefined;
    const id = window.setInterval(() => setCooldownClock((c) => c + 1), 1000);
    return () => window.clearInterval(id);
  }, [saveCooldownUntil]);

  const handleNodeClick = useCallback(
    (nodeId) => {
      setNodes((currentNodes) => {
        const live = currentNodes.find((n) => n.id === nodeId);
        if (live?.type === 'personNode') {
          openModal(() => setSelectedId(nodeId));
        }
        return currentNodes;
      });
    },
    [openModal, setNodes],
  );

  const attachNodeCallbacks = useCallback(
    (node) => {
      if (node.type === 'unionNode') return node;
      return {
        ...node,
        data: {
          ...node.data,
          onClick: () => handleNodeClick(node.id),
          addPersonCallback: (connections) => {
            openModal(() =>
              setAddPersonState({ open: true, data: null, connections, onAddPerson: null }),
            );
          },
        },
      };
    },
    [handleNodeClick, openModal],
  );

  /** Sync graph structure from model; keep existing node positions (manual layout). */
  const syncGraphFromModel = useCallback(() => {
    const { nodes: raw, edges: nextEdges } = buildReactFlowGraph(familyModel, themeConfig);
    setEdges(nextEdges);
    setNodes((prev) => {
      const posById = new Map(prev.map((n) => [n.id, n.position]));
      const pending = pendingPositionsRef.current;
      if (!draftPositionsAppliedRef.current && pending && typeof pending === 'object') {
        for (const [id, pos] of Object.entries(pending)) {
          if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
            posById.set(id, { x: pos.x, y: pos.y });
          }
        }
        draftPositionsAppliedRef.current = true;
        pendingPositionsRef.current = null;
      }
      let i = 0;
      return raw.map((n) => {
        const pos =
          posById.get(n.id) ??
          (() => {
            const idx = i++;
            return { x: 80 + (idx % 5) * 200, y: 60 + Math.floor(idx / 5) * 120 };
          })();
        return attachNodeCallbacks({ ...n, position: pos });
      });
    });
  }, [familyModel, themeConfig, attachNodeCallbacks, setNodes, setEdges]);

  useEffect(() => {
    syncGraphFromModel();
  }, [syncGraphFromModel]);

  useEffect(() => {
    if (isGuest) {
      setDirty(false);
      return;
    }
    setDirty(serializeFamilyModel(familyModel) !== lastCloudSerializedRef.current);
  }, [familyModel, isGuest]);

  useEffect(() => {
    if (isLoading) return undefined;

    const draftUserId = isGuest ? GUEST_DRAFT_USER_ID : user?.id;
    if (!draftUserId) return undefined;

    if (draftDebounceRef.current) window.clearTimeout(draftDebounceRef.current);
    draftDebounceRef.current = window.setTimeout(() => {
      const positions = {};
      for (const n of nodes) {
        positions[n.id] = { x: n.position.x, y: n.position.y };
      }
      writeSessionDraft(draftUserId, { familyModel, positions });
    }, DRAFT_DEBOUNCE_MS);
    return () => {
      if (draftDebounceRef.current) window.clearTimeout(draftDebounceRef.current);
    };
  }, [familyModel, nodes, isLoading, user?.id, isGuest]);

  useEffect(() => {
    if (isGuest) {
      const draft = readSessionDraft(GUEST_DRAFT_USER_ID);
      const seed = createSeedFamilyModel();
      lastCloudSerializedRef.current = serializeFamilyModel(seed);
      if (draft?.familyModel) {
        lastCloudSerializedRef.current = serializeFamilyModel(draft.familyModel);
        pendingPositionsRef.current = draft.positions || {};
        draftPositionsAppliedRef.current = false;
        setFamilyModel(draft.familyModel);
      } else {
        draftPositionsAppliedRef.current = true;
        pendingPositionsRef.current = null;
        setFamilyModel(seed);
      }
      setIsLoading(false);
      return;
    }

    if (!user?.id) return;

    let cancelled = false;
    const loadData = async () => {
      try {
        const remoteModel = await loadFamilyData();
        if (cancelled) return;
        const remoteSnap = serializeFamilyModel(remoteModel);
        lastCloudSerializedRef.current = remoteSnap;

        const draft = readSessionDraft(user.id);
        if (draft && serializeFamilyModel(draft.familyModel) !== remoteSnap) {
          pendingPositionsRef.current = draft.positions || {};
          draftPositionsAppliedRef.current = false;
          setFamilyModel(draft.familyModel);
        } else {
          pendingPositionsRef.current = null;
          draftPositionsAppliedRef.current = true;
          setFamilyModel(remoteModel);
          if (draft && serializeFamilyModel(draft.familyModel) === remoteSnap) {
            clearSessionDraft(user.id);
          }
        }
      } catch (err) {
        console.error('Failed to load family data:', err);
        if (cancelled) return;
        setToast({
          severity: 'error',
          message:
            err?.message?.includes('fetch') || err?.message?.toLowerCase()?.includes('network')
              ? 'Could not load your tree from the server. Check your connection and reload.'
              : 'Could not load your tree from the server. You can keep editing; try Save when things look stable.',
        });
        const seed = createSeedFamilyModel();
        lastCloudSerializedRef.current = serializeFamilyModel(seed);
        setFamilyModel(seed);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [isGuest, user?.id]);

  const updateModel = useCallback((fn) => {
    setFamilyModel((m) => fn(m));
  }, []);

  const handleSaveToCloud = useCallback(async () => {
    if (isGuest) {
      setToast({
        severity: 'warning',
        message: 'Guest mode cannot save to the cloud. Sign in from the login page to keep a copy online.',
      });
      return;
    }
    if (!user?.id) {
      setToast({
        severity: 'error',
        message: 'You are not signed in. Open Sign in / Account and sign in, then try Save again.',
      });
      return;
    }
    if (!online) {
      setToast({ severity: 'warning', message: 'You are offline. Stay on this page; use Save when you are back online.' });
      return;
    }
    if (!dirty) {
      setToast({ severity: 'info', message: 'Nothing new to save.' });
      return;
    }
    if (Date.now() < saveCooldownUntil) {
      const wait = Math.ceil((saveCooldownUntil - Date.now()) / 1000);
      setToast({ severity: 'info', message: `Please wait ${wait}s between cloud saves.` });
      return;
    }

    const result = await saveFamilyData(familyModel, { expectedUserId: user.id });
    if (result.ok) {
      lastCloudSerializedRef.current = serializeFamilyModel(familyModel);
      setSaveCooldownUntil(Date.now() + MIN_MS_BETWEEN_CLOUD_SAVES);
      setDirty(false);
      clearSessionDraft(user.id);
      setToast({ severity: 'success', message: 'Saved to cloud.' });
    } else {
      setToast({
        severity: 'error',
        message: result.userMessage || result.error?.message || 'Save failed. Try again.',
      });
    }
  }, [isGuest, online, dirty, familyModel, user?.id, saveCooldownUntil]);

  const handleAddPersonLocal = useCallback(
    ({ formData, connections = [] }) => {
      if (isAtOrOverPersonLimit(familyModel)) {
        window.alert(
          `This tree can have at most ${MAX_PEOPLE_IN_TREE} people (client limit; adjustable later with the backend).`,
        );
        return;
      }
      const person = createPersonFromFormData(formData);
      setFamilyModel((m) => {
        let next = addPerson(m, person);
        next = applyConnectionsForNewPerson(next, person.id, connections);
        return next;
      });
      setAddPersonState({ open: false, data: null, connections: [], onAddPerson: null });
    },
    [familyModel],
  );

  handleAddPersonRef.current = handleAddPersonLocal;

  const handleDeletePerson = useCallback((personId) => {
    setFamilyModel((m) => deletePerson(m, personId));
    setSelectedId(null);
  }, []);

  const onConnectStart = useCallback((_, { handleId }) => {
    setIsDraggingSpouse(handleId?.startsWith('spouse') ?? false);
  }, []);

  const onConnectEnd = useCallback(() => {
    setIsDraggingSpouse(false);
  }, []);

  const isValidConnection = useCallback((connection) => {
    if (connection.source === connection.target) return false;
    const tid = String(connection.target || '');
    return !tid.startsWith('union:');
  }, []);

  const onConnect = useCallback(
    (params) => {
      const isSpouse = params.sourceHandle?.startsWith('spouse');
      const isParent = params.sourceHandle === 'parent-source';

      if (isSpouse) {
        const a = params.source;
        const b = params.target;
        setFamilyModel((m) => connectSpouses(m, a, b));
      } else if (isParent) {
        const parentId = params.target;
        const childId = params.source;
        setFamilyModel((m) => linkChildToParent(m, childId, parentId));
      } else {
        const parentId = params.source;
        const childId = params.target;
        setFamilyModel((m) => linkChildToParent(m, childId, parentId));
      }
      setIsDraggingSpouse(false);
    },
    [],
  );

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all data? This cannot be undone.')) return;

    if (isGuest) {
      clearSessionDraft(GUEST_DRAFT_USER_ID);
      const seed = createSeedFamilyModel();
      lastCloudSerializedRef.current = serializeFamilyModel(seed);
      setSaveCooldownUntil(0);
      draftPositionsAppliedRef.current = true;
      pendingPositionsRef.current = null;
      setFamilyModel(seed);
      setSelectedId(null);
      return;
    }

    await clearFamilyData();
    clearSessionDraft(user.id);
    const seed = createSeedFamilyModel();
    lastCloudSerializedRef.current = serializeFamilyModel(seed);
    setSaveCooldownUntil(0);
    draftPositionsAppliedRef.current = true;
    pendingPositionsRef.current = null;
    setFamilyModel(seed);
    setSelectedId(null);
  };

  const handleAutoLayout = useCallback(() => {
    const { nodes: raw, edges: nextEdges } = buildReactFlowGraph(familyModel, themeConfig);
    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(raw, nextEdges);
    setEdges(layoutedEdges);
    setNodes(layouted.map(attachNodeCallbacks));
  }, [familyModel, themeConfig, attachNodeCallbacks, setNodes, setEdges]);

  const handleImport = useCallback(
    (model) => {
      if (countPeople(model) > MAX_PEOPLE_IN_TREE) {
        window.alert(
          `That file has too many people (max ${MAX_PEOPLE_IN_TREE}). Trim the tree or raise the limit in code/backend.`,
        );
        return;
      }
      draftPositionsAppliedRef.current = true;
      pendingPositionsRef.current = null;
      setFamilyModel(model);
    },
    [],
  );

  void cooldownClock;
  let saveDisabledReason = '';
  if (!isGuest) {
    if (!online) saveDisabledReason = 'Offline — open this tab when online to save.';
    else if (!dirty) saveDisabledReason = 'No unsaved changes.';
    else {
      const left = saveCooldownUntil - Date.now();
      if (left > 0) saveDisabledReason = `Save available in ${Math.ceil(left / 1000)}s.`;
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isGuest && (
        <Alert severity="info" sx={{ borderRadius: 0, py: 0.5 }}>
          Guest mode: your tree stays in this browser tab only (session storage for refresh). It is not saved to the
          server and is removed when you close the tab. Use Sign in to keep a cloud copy.
        </Alert>
      )}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <Sidebar
        onAddPerson={() => {
          if (atPersonLimit) {
            window.alert(
              `You reached the maximum of ${MAX_PEOPLE_IN_TREE} people. Remove someone or raise the limit later.`,
            );
            return;
          }
          openModal(() =>
            handleAddPerson({
              onAddPerson: (...args) => handleAddPersonRef.current?.(...args),
            }),
          );
        }}
        onAutoLayout={handleAutoLayout}
        onReset={handleReset}
        isGuest={isGuest}
        showCloudSave={!isGuest}
        onSaveToCloud={handleSaveToCloud}
        saveDisabled={Boolean(saveDisabledReason)}
        saveTooltip={saveDisabledReason || 'Save tree to cloud'}
        onNavigateToLogin={isGuest ? () => navigate('/login') : undefined}
        addPersonDisabled={atPersonLimit}
        addPersonDisabledTitle={`This tree allows at most ${MAX_PEOPLE_IN_TREE} people (see src/config/treePolicy.js; align with backend later).`}
        familyModel={familyModel}
        onImport={handleImport}
        currentTheme={currentTheme}
        onThemeToggle={onThemeToggle}
        onOpenFeedback={() => openModal(() => setFeedbackOpen(true))}
        onOpenComingSoon={() => openModal(() => setComingSoonOpen(true))}
      />

      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={
            isDraggingSpouse ? SpouseConnectionLine : ParentChildConnectionLine
          }
          deleteKeyCode={null}
          connectionMode="loose"
          fitView
        >
          <Controls />
          <MiniMap />
          <Background {...themeConfig.flowBackgroundConfig} />
        </ReactFlow>
      </Box>

      {selectedNode && (
        <EditPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedId(null)}
          onSave={(updatedNode) => {
            setFamilyModel((m) => ({
              ...m,
              people: {
                ...m.people,
                [updatedNode.id]: { ...m.people[updatedNode.id], ...updatedNode.data, id: updatedNode.id },
              },
            }));
          }}
          onDelete={handleDeletePerson}
          familyModel={familyModel}
          onUpdateModel={updateModel}
        />
      )}

      <PersonForm
        open={addPersonState.open}
        initialData={addPersonState.data}
        initialConnections={addPersonState.connections ?? []}
        availablePeople={availablePeople}
        addBlocked={atPersonLimit}
        addBlockedMessage={`Maximum ${MAX_PEOPLE_IN_TREE} people reached.`}
        onClose={() =>
          setAddPersonState({ open: false, data: null, connections: [], onAddPerson: null })
        }
        onSave={({ formData, connections }) => {
          handleAddPersonLocal({ formData, connections });
        }}
      />

      <ComingSoonDialog open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : null}
      </Snackbar>
      </Box>
    </Box>
  );
};
