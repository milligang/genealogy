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
import { Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { PersonNode } from '../nodes/PersonNode';
import { UnionNode } from '../nodes/UnionNode';
import { PersonForm } from '../editing/PersonForm';
import { EditPanel } from '../editing/EditPanel';
import { Sidebar } from '../layout/Sidebar';
import { SpouseEdge } from '../edges/SpouseEdge';
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

/** Matches initial `familyModel` state so first dirty check is not true against ref ''. */
const INITIAL_SEED_SNAPSHOT = serializeFamilyModel(createSeedFamilyModel());

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
  const lastCloudSerializedRef = useRef(INITIAL_SEED_SNAPSHOT);
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
      if (node.type === 'unionNode') {
        return {
          ...node,
          data: {
            ...node.data,
            onAddChild: ({ unionId }) => {
              openModal(() =>
                setAddPersonState({
                  open: true,
                  data: null,
                  // Pre-wire the new person as a child of this specific union.
                  // We pass the union's first spouse as the 'parent' connection
                  // so applyConnectionsForNewPerson creates the child under the
                  // correct union rather than a new solo-parent union.
                  connections: [{ nodeId: unionId, type: 'unionChild' }],
                  onAddPerson: null,
                  unionId,
                }),
              );
            },
          },
        };
      }
      return {
        ...node,
        data: {
          ...node.data,
          onClick: () => handleNodeClick(node.id),
          onAction: ({ type, nodeId }) => {
            if (type === 'parent' || type === 'spouse') {
              // Straightforward — open form pre-connected to this person
              openModal(() =>
                setAddPersonState({
                  open: true,
                  data: null,
                  connections: [{ nodeId, type }],
                  onAddPerson: null,
                }),
              );
              return;
            }
            if (type === 'child') {
              // Find all unions this person is a spouse of
              const personUnions = familyModel.unionSpouses
                .filter((s) => s.personId === nodeId)
                .map((s) => s.unionId);

              if (personUnions.length <= 1) {
                // Zero or one union — no ambiguity, open form directly
                openModal(() =>
                  setAddPersonState({
                    open: true,
                    data: null,
                    connections: [{ nodeId, type: 'child' }],
                    onAddPerson: null,
                  }),
                );
              } else {
                // Multiple unions — need to ask which family
                openModal(() =>
                  setAddPersonState({
                    open: true,
                    data: null,
                    connections: [{ nodeId, type: 'child' }],
                    onAddPerson: null,
                    disambiguateUnions: personUnions,
                    disambiguatePersonId: nodeId,
                  }),
                );
              }
            }
          },
        },
      };
    },
    [handleNodeClick, openModal, familyModel.unionSpouses],
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
        const remotePeopleCount = countPeople(remoteModel);
        const draftPeopleCount = draft?.familyModel ? countPeople(draft.familyModel) : 0;
        const draftDiffersFromRemote =
          draft && serializeFamilyModel(draft.familyModel) !== remoteSnap;
        const draftLooksCorruptEmpty = draftDiffersFromRemote && draftPeopleCount === 0 && remotePeopleCount > 0;

        if (draftLooksCorruptEmpty) {
          clearSessionDraft(user.id);
          pendingPositionsRef.current = null;
          draftPositionsAppliedRef.current = true;
          setFamilyModel(remoteModel);
        } else if (draftDiffersFromRemote) {
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

        for (const conn of connections) {
          if (conn.type === 'unionChild') {
            // Add as child of a specific union directly — avoids creating a
            // duplicate solo-parent union when the family already exists.
            next = {
              ...next,
              unionChildren: [
                ...next.unionChildren,
                { unionId: conn.nodeId, childPersonId: person.id },
              ],
            };
          } else {
            next = applyConnectionsForNewPerson(next, person.id, [conn]);
          }
        }
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

  // Drag-to-connect is disabled — all connections are made via the
  // hover action buttons on PersonNode and UnionNode. This avoids
  // ambiguous untyped edges and removes the visible handle circles.

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
    if (isLoading) {
      saveDisabledReason = 'Loading your tree…';
    } else if (!online) {
      saveDisabledReason = 'Offline — open this tab when online to save.';
    } else if (!dirty) {
      saveDisabledReason = 'No unsaved changes.';
    } else {
      const left = saveCooldownUntil - Date.now();
      if (left > 0) saveDisabledReason = `Save available in ${Math.ceil(left / 1000)}s.`;
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isGuest && isLoading && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.92),
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {isGuest && (
        <Alert severity="info" sx={{ borderRadius: 0, py: 0.5 }}>
          <strong>Log in</strong> to save work.
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
        onNavigateToLogin={isGuest ? () => navigate('/login?from=guest') : undefined}
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
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable
          nodesConnectable={false}
          deleteKeyCode={null}
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