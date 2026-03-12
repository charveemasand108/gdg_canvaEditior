import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'rectangle' | 'text' | 'image';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  text?: string;
  src?: string;
  zIndex: number;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  past: CanvasElement[][];
  future: CanvasElement[][];
}

type Action =
  | { type: 'ADD_ELEMENT'; element: Omit<CanvasElement, 'id' | 'zIndex'> }
  | { type: 'UPDATE_ELEMENT'; id: string; updates: Partial<CanvasElement>; skipHistory?: boolean }
  | { type: 'DELETE_ELEMENTS'; ids: string[] }
  | { type: 'SELECT_ELEMENT'; id: string | null; multi?: boolean }
  | { type: 'BRING_FORWARD'; id: string }
  | { type: 'SEND_BACKWARD'; id: string }
  | { type: 'DUPLICATE_ELEMENTS'; ids: string[] }
  | { type: 'SAVE_HISTORY'; oldElements: CanvasElement[] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const initialState: CanvasState = {
  elements: [],
  selectedIds: [],
  past: [],
  future: [],
};

const getNextZIndex = (elements: CanvasElement[]) => {
  if (elements.length === 0) return 1;
  return Math.max(...elements.map((el) => el.zIndex)) + 1;
};

// Helper to push history
const pushHistory = (state: CanvasState, newElements: CanvasElement[]): CanvasState => {
  return {
    ...state,
    past: [...state.past, state.elements],
    future: [],
    elements: newElements,
  };
};

function canvasReducer(state: CanvasState, action: Action): CanvasState {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      const newElement: CanvasElement = {
        ...action.element,
        id: uuidv4(),
        zIndex: getNextZIndex(state.elements),
      };
      const newElements = [...state.elements, newElement];
      return pushHistory(
        { ...state, selectedIds: [newElement.id] },
        newElements
      );
    }
    case 'UPDATE_ELEMENT': {
      const newElements = state.elements.map((el) =>
        el.id === action.id ? { ...el, ...action.updates } : el
      );
      if (action.skipHistory) {
        return { ...state, elements: newElements };
      }
      return pushHistory(state, newElements);
    }
    case 'SAVE_HISTORY': {
      return {
        ...state,
        past: [...state.past, action.oldElements],
        future: [],
      };
    }
    case 'DELETE_ELEMENTS': {
      const newElements = state.elements.filter(
        (el) => !action.ids.includes(el.id)
      );
      return pushHistory(
        { ...state, selectedIds: [] },
        newElements
      );
    }
    case 'DUPLICATE_ELEMENTS': {
      const elementsToDup = state.elements.filter((el) => action.ids.includes(el.id));
      let currentZIndex = getNextZIndex(state.elements);
      const newElementsToAdd = elementsToDup.map(el => ({
        ...el,
        id: uuidv4(),
        x: el.x + 20,
        y: el.y + 20,
        zIndex: currentZIndex++
      }));
      const newElements = [...state.elements, ...newElementsToAdd];
      return pushHistory(
        { ...state, selectedIds: newElementsToAdd.map(el => el.id) },
        newElements
      );
    }
    case 'SELECT_ELEMENT': {
      if (action.id === null) return { ...state, selectedIds: [] };
      if (action.multi) {
        const isSelected = state.selectedIds.includes(action.id);
        return {
          ...state,
          selectedIds: isSelected
            ? state.selectedIds.filter((id) => id !== action.id)
            : [...state.selectedIds, action.id],
        };
      }
      return { ...state, selectedIds: [action.id] };
    }
    case 'BRING_FORWARD': {
      const maxZIndex = getNextZIndex(state.elements);
      const newElements = state.elements.map((el) =>
        el.id === action.id ? { ...el, zIndex: maxZIndex } : el
      );
      return pushHistory(state, newElements);
    }
    case 'SEND_BACKWARD': {
      const minZIndex = Math.min(...state.elements.map(e => e.zIndex)) - 1;
      const newElements = state.elements.map((el) =>
        el.id === action.id ? { ...el, zIndex: minZIndex } : el
      );
      return pushHistory(state, newElements);
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        ...state,
        past: newPast,
        future: [state.elements, ...state.future],
        elements: previous,
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        ...state,
        past: [...state.past, state.elements],
        future: newFuture,
        elements: next,
      };
    }
    default:
      return state;
  }
}

const CanvasContext = createContext<{
  state: CanvasState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  return (
    <CanvasContext.Provider value={{ state, dispatch }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};
