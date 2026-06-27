// ─── Spec Store — IR + Event Sourcing ────────────────────────────────────────
// Central store for the IR document. All mutations go through here, producing
// events for time-travel. This is THE source of truth for the component tree.

import { create } from "zustand";
import { devtools, subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { dexieStorage } from "./dexieStorage";
import type { IRDocument, IRNode, IRValue, MutationEvent, Branch } from "@/lib/ir/types";
import { generateNodeId } from "@/lib/ir/types";
import {
  insertNode,
  deleteNode,
  moveNode,
  updateNodeProps,
  createDefaultNode,
  findNodeById,
} from "@/lib/ir/mutations";
import { parseJsonRender, serializeToJsonRender } from "@/lib/ir/adapters/json-render";
import { parseA2UI, serializeToA2UI } from "@/lib/ir/adapters/a2ui";
import type { FormatType, CatalogDefinition } from "@/lib/types";
import { DEFAULT_CATALOG, getDefaultProps } from "@/lib/catalog";
import { DEFAULT_JSON_RENDER_SPEC, DEFAULT_A2UI_SPEC } from "@/lib/defaultSpecs";

// ─── State Shape ─────────────────────────────────────────────────────────────

export interface SpecState {
  // ─── Core IR State ──────────────────────────────────────────────────────
  /** The current IR document (single source of truth) */
  irDocument: IRDocument | null;
  /** Raw text displayed in Monaco (serialized from IR) */
  rawText: string;
  /** Active format */
  format: FormatType;
  /** Parsed spec from raw text (legacy compatibility) */
  parsedSpec: unknown | null;
  /** Validation error count */
  validationErrors: number;
  /** Currently selected node ID */
  selectedNodeId: string | null;
  /** Component catalog */
  catalog: CatalogDefinition;

  // ─── Event Sourcing ─────────────────────────────────────────────────────
  /** Append-only mutation event log */
  events: MutationEvent[];
  /** Current position in the event log (for time-travel) */
  eventIndex: number;
  /** Branches for variant exploration */
  branches: Branch[];
  /** Active branch */
  activeBranchId: string;

  // ─── Actions ────────────────────────────────────────────────────────────
  /** Initialize from raw text */
  initFromText: (text: string, format: FormatType) => void;
  /** Set the active format */
  setFormat: (format: FormatType) => void;
  /** Set raw text (from editor changes) */
  setRawText: (text: string) => void;
  /** Set parsed spec (legacy) */
  setParsedSpec: (spec: unknown | null) => void;
  /** Set validation error count */
  setValidationErrors: (count: number) => void;
  /** Select a node by ID */
  selectNode: (nodeId: string | null) => void;
  /** Insert a new component */
  insertComponent: (componentType: string, parentId?: string) => void;
  /** Delete a node */
  deleteComponent: (nodeId: string) => void;
  /** Update props on a node */
  updateProps: (nodeId: string, props: Record<string, IRValue>) => void;
  /** Move/reorder a node */
  moveComponent: (nodeId: string, toParentId: string, toIndex: number) => void;
  /** Import a catalog */
  importCatalog: (catalog: CatalogDefinition) => void;
  /** Sync IR → raw text */
  syncIRToText: () => void;
  /** Sync raw text → IR */
  syncTextToIR: () => void;

  // ─── Time Travel ────────────────────────────────────────────────────────
  /** Undo last mutation */
  undo: () => void;
  /** Redo next mutation */
  redo: () => void;
  /** Jump to a specific event index */
  jumpToEvent: (index: number) => void;
  /** Create a new branch from current state */
  createBranch: (name: string) => void;

  // ─── Computed ───────────────────────────────────────────────────────────
  /** Get the currently selected node */
  getSelectedNode: () => IRNode | null;
  /** Get element for legacy compatibility (returns type + props) */
  getSelectedElement: () => { type: string; props: Record<string, unknown> } | null;
  /** Check if undo is possible */
  canUndo: () => boolean;
  /** Check if redo is possible */
  canRedo: () => boolean;
}

// ─── Store Implementation ────────────────────────────────────────────────────

export const useSpecStore = create<SpecState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => {
      // Initialize with default json-render spec
      const initialText = DEFAULT_JSON_RENDER_SPEC;
      let initialParsed: unknown = null;
      let initialIR: IRDocument | null = null;
      try {
        initialParsed = JSON.parse(initialText);
        initialIR = parseJsonRender(initialParsed as Parameters<typeof parseJsonRender>[0]);
      } catch { /* ignore */ }

      return {
        // ─── Initial State ─────────────────────────────────────────────────
        irDocument: initialIR,
        rawText: initialText,
        format: "json-render",
        parsedSpec: initialParsed,
        validationErrors: 0,
        selectedNodeId: null,
        catalog: DEFAULT_CATALOG,
        events: [],
        eventIndex: -1,
        branches: [{ id: "main", name: "Main", parentBranchId: null, forkPoint: 0, createdAt: Date.now() }],
        activeBranchId: "main",

        // ─── Actions ───────────────────────────────────────────────────────

        initFromText: (text, format) => {
          try {
            const parsed = JSON.parse(text);
            const irDoc = format === "json-render"
              ? parseJsonRender(parsed)
              : parseA2UI(parsed);

            set({
              rawText: text,
              format,
              parsedSpec: parsed,
              irDocument: irDoc,
              selectedNodeId: null,
              validationErrors: 0,
              events: [],
              eventIndex: -1,
            });
          } catch {
            set({ rawText: text, format, parsedSpec: null, irDocument: null });
          }
        },

        setFormat: (format) => {
          const text = format === "json-render" ? DEFAULT_JSON_RENDER_SPEC : DEFAULT_A2UI_SPEC;
          get().initFromText(text, format);
        },

        setRawText: (text) => set({ rawText: text }),

        setParsedSpec: (spec) => set({ parsedSpec: spec }),

        setValidationErrors: (count) => set({ validationErrors: count }),

        selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

        insertComponent: (componentType, parentId) => {
          const { irDocument, catalog, activeBranchId, events, eventIndex } = get();
          if (!irDocument) return;

          const compDef = catalog.components[componentType];
          const defaults = getDefaultProps(componentType);
          const hasChildren = compDef?.hasChildren ?? false;

          const newNode = createDefaultNode(
            componentType,
            defaults,
            hasChildren,
            irDocument.sourceFormat
          );

          const result = insertNode(irDocument, newNode, parentId, undefined, activeBranchId);

          // Trim events after current index (discard redo stack on new mutation)
          const trimmedEvents = events.slice(0, eventIndex + 1);

          set({
            irDocument: result.document,
            events: [...trimmedEvents, result.event],
            eventIndex: trimmedEvents.length,
            selectedNodeId: result.insertedNodeId,
          });

          // Sync to text
          get().syncIRToText();
        },

        deleteComponent: (nodeId) => {
          const { irDocument, activeBranchId, events, eventIndex } = get();
          if (!irDocument) return;

          const result = deleteNode(irDocument, nodeId, activeBranchId);
          const trimmedEvents = events.slice(0, eventIndex + 1);

          set({
            irDocument: result.document,
            events: [...trimmedEvents, result.event],
            eventIndex: trimmedEvents.length,
            selectedNodeId: null,
          });

          get().syncIRToText();
        },

        updateProps: (nodeId, props) => {
          const { irDocument, activeBranchId, events, eventIndex } = get();
          if (!irDocument) return;

          const result = updateNodeProps(irDocument, nodeId, props, activeBranchId);
          const trimmedEvents = events.slice(0, eventIndex + 1);

          set({
            irDocument: result.document,
            events: [...trimmedEvents, result.event],
            eventIndex: trimmedEvents.length,
          });

          get().syncIRToText();
        },

        moveComponent: (nodeId, toParentId, toIndex) => {
          const { irDocument, activeBranchId, events, eventIndex } = get();
          if (!irDocument) return;

          const result = moveNode(irDocument, nodeId, toParentId, toIndex, activeBranchId);
          const trimmedEvents = events.slice(0, eventIndex + 1);

          set({
            irDocument: result.document,
            events: [...trimmedEvents, result.event],
            eventIndex: trimmedEvents.length,
          });

          get().syncIRToText();
        },

        importCatalog: (catalog) => set({ catalog }),

        syncIRToText: () => {
          const { irDocument, format } = get();
          if (!irDocument) return;

          try {
            let serialized: unknown;
            if (format === "json-render") {
              serialized = serializeToJsonRender(irDocument);
            } else {
              serialized = serializeToA2UI(irDocument);
            }

            const text = JSON.stringify(serialized, null, 2);
            set({ rawText: text, parsedSpec: serialized });
          } catch (e) {
            console.error("Failed to sync IR to text:", e);
          }
        },

        syncTextToIR: () => {
          const { rawText, format } = get();
          try {
            const parsed = JSON.parse(rawText);
            const irDoc = format === "json-render"
              ? parseJsonRender(parsed)
              : parseA2UI(parsed);

            set({ parsedSpec: parsed, irDocument: irDoc });
          } catch {
            set({ parsedSpec: null });
          }
        },

        // ─── Time Travel ───────────────────────────────────────────────────

        undo: () => {
          const { eventIndex } = get();
          if (eventIndex < 0) return;

          // For undo, we need to replay events up to eventIndex - 1
          // This is a simplified approach — replay from initial state
          const newIndex = eventIndex - 1;
          set({ eventIndex: newIndex });

          // Re-initialize and replay
          replayEvents(get, set, newIndex);
        },

        redo: () => {
          const { events, eventIndex } = get();
          if (eventIndex >= events.length - 1) return;

          const newIndex = eventIndex + 1;
          set({ eventIndex: newIndex });

          replayEvents(get, set, newIndex);
        },

        jumpToEvent: (index) => {
          set({ eventIndex: index });
          replayEvents(get, set, index);
        },

        createBranch: (name) => {
          const { branches, eventIndex, activeBranchId } = get();
          const newBranch: Branch = {
            id: generateNodeId(),
            name,
            parentBranchId: activeBranchId,
            forkPoint: eventIndex,
            createdAt: Date.now(),
          };

          set({
            branches: [...branches, newBranch],
            activeBranchId: newBranch.id,
          });
        },

        // ─── Computed ──────────────────────────────────────────────────────

        getSelectedNode: () => {
          const { irDocument, selectedNodeId } = get();
          if (!irDocument || !selectedNodeId) return null;
          return findNodeById(irDocument.root, selectedNodeId);
        },

        getSelectedElement: () => {
          const node = get().getSelectedNode();
          if (!node) return null;

          // Convert IR props to plain values for legacy PropsForm
          const plainProps: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(node.props)) {
            if (typeof val === "object" && val !== null) {
              const v = val as Record<string, unknown>;
              if ("__binding" in v) {
                plainProps[key] = `{{${(v.__binding as Record<string, unknown>).path}}}`;
              } else if ("__ref" in v) {
                plainProps[key] = v.__ref;
              } else if ("__expr" in v) {
                plainProps[key] = v.__expr;
              } else {
                plainProps[key] = val;
              }
            } else {
              plainProps[key] = val;
            }
          }

          return { type: node.type, props: plainProps };
        },

        canUndo: () => get().eventIndex >= 0,
        canRedo: () => get().eventIndex < get().events.length - 1,
      };
    }),
      {
        name: "genui-spec-store",
        storage: createJSONStorage(() => dexieStorage),
        partializer: (state) => ({
          irDocument: state.irDocument,
          rawText: state.rawText,
          format: state.format,
          parsedSpec: state.parsedSpec,
          events: state.events,
          eventIndex: state.eventIndex,
          branches: state.branches,
          activeBranchId: state.activeBranchId,
        }),
      }
    ),
    { name: "SpecStore" }
  )
);

// ─── Event Replay Helper ─────────────────────────────────────────────────────

function replayEvents(
  get: () => SpecState,
  set: (partial: Partial<SpecState>) => void,
  targetIndex: number
) {
  const { format } = get();

  // Re-initialize from default spec
  const defaultText = format === "json-render" ? DEFAULT_JSON_RENDER_SPEC : DEFAULT_A2UI_SPEC;
  try {
    const parsed = JSON.parse(defaultText);
    let irDoc = format === "json-render"
      ? parseJsonRender(parsed)
      : parseA2UI(parsed);

    // Replay events up to targetIndex
    const { events } = get();
    for (let i = 0; i <= targetIndex && i < events.length; i++) {
      const event = events[i];
      irDoc = applyEvent(irDoc, event);
    }

    // Serialize to text
    let serialized: unknown;
    if (format === "json-render") {
      serialized = serializeToJsonRender(irDoc);
    } else {
      serialized = serializeToA2UI(irDoc);
    }

    const text = JSON.stringify(serialized, null, 2);
    set({ irDocument: irDoc, rawText: text, parsedSpec: serialized });
  } catch (e) {
    console.error("Event replay failed:", e);
  }
}

function applyEvent(doc: IRDocument, event: MutationEvent): IRDocument {
  const payload = event.payload;
  switch (payload.type) {
    case "INSERT_NODE":
      return insertNode(doc, payload.node, payload.parentId, payload.index).document;
    case "DELETE_NODE":
      return deleteNode(doc, payload.nodeId).document;
    case "MOVE_NODE":
      return moveNode(doc, payload.nodeId, payload.toParentId, payload.toIndex).document;
    case "UPDATE_PROPS":
      return updateNodeProps(doc, payload.nodeId, payload.nextProps).document;
    case "SET_DOCUMENT":
      return payload.nextDocument;
    default:
      return doc;
  }
}
