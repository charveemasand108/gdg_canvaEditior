import { useEffect, useCallback } from 'react';
import { useCanvas } from '../store/CanvasContext';
import { ElementNode } from './ElementNode';

export const Canvas: React.FC = () => {
  const { state, dispatch } = useCanvas();

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'html2canvas-target' || (e.target as HTMLElement).classList.contains('workspace')) {
      dispatch({ type: 'SELECT_ELEMENT', id: null });
    }
  };

  // Keyboard hooks for Del, Dup, Undo/Redo
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      return;
    }

    if (state.selectedIds.length > 0) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        dispatch({ type: 'DELETE_ELEMENTS', ids: state.selectedIds });
      }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        dispatch({ type: 'DUPLICATE_ELEMENTS', ids: state.selectedIds });
      }
    }

    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      dispatch({ type: 'UNDO' });
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      dispatch({ type: 'REDO' });
    }
  }, [state.selectedIds, dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="workspace" onClick={handleBackgroundClick}>
      <div className="canvas-board" id="html2canvas-target">
        {state.elements.map(el => (
          <ElementNode
            key={el.id}
            element={el}
            isSelected={state.selectedIds.includes(el.id)}
            onSelect={(e) => {
              dispatch({ 
                type: 'SELECT_ELEMENT', 
                id: el.id, 
                multi: e.ctrlKey || e.shiftKey 
              });
            }}
          />
        ))}
      </div>
    </div>
  );
};
