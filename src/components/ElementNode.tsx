import { useRef, useEffect } from 'react';
import { useCanvas } from '../store/CanvasContext';
import type { CanvasElement } from '../store/CanvasContext';

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
}

export const ElementNode: React.FC<Props> = ({ element, isSelected, onSelect }) => {
  const { dispatch } = useCanvas();
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const startElemPos = useRef({ x: element.x, y: element.y });

  // History optimization
  const elementsBeforeDrag = useRef<CanvasElement[]>([]);
  const hasMoved = useRef(false);

  // Resize State
  const isResizing = useRef(false);
  const resizeHandle = useRef<string | null>(null);
  const startElemSize = useRef({ w: element.width, h: element.height });

  useEffect(() => {
    // If element props update from external, we don't need to do much here
    // since we use bounding box from element state.
  }, [element]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(e);
    
    // Save state before drag/resize for history
    elementsBeforeDrag.current = useCanvas.prototype ? [] : []; // We need a way to see ALL elements state here, but we can't easily. 
    // We will pull the current document state via a special effect if we have to, or just dispatch and let context access state.
    
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      isResizing.current = true;
      resizeHandle.current = target.dataset.dir || null;
      startElemSize.current = { w: element.width, h: element.height };
      startElemPos.current = { x: element.x, y: element.y };
    } else {
      isDragging.current = true;
      startElemPos.current = { x: element.x, y: element.y };
    }
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current && !isResizing.current) return;
    
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (isDragging.current) {
      if (dx !== 0 || dy !== 0) hasMoved.current = true;
      dispatch({
        type: 'UPDATE_ELEMENT',
        id: element.id,
        updates: {
          x: startElemPos.current.x + dx,
          y: startElemPos.current.y + dy,
        },
        skipHistory: true
      });
    } else if (isResizing.current) {
      if (dx !== 0 || dy !== 0) hasMoved.current = true;
      let newW = startElemSize.current.w;
      let newH = startElemSize.current.h;
      let newX = startElemPos.current.x;
      let newY = startElemPos.current.y;
      
      const dir = resizeHandle.current;
      
      if (dir?.includes('e')) newW += dx;
      if (dir?.includes('s')) newH += dy;
      if (dir?.includes('w')) {
        newW -= dx;
        newX += dx;
      }
      if (dir?.includes('n')) {
        newH -= dy;
        newY += dy;
      }
      
      // Min sizes
      if (newW < 20) {
        newX += (newW - 20) * (dir?.includes('w') ? 1 : 0);
        newW = 20;
      }
      if (newH < 20) {
        newY += (newH - 20) * (dir?.includes('n') ? 1 : 0);
        newH = 20;
      }

      dispatch({
        type: 'UPDATE_ELEMENT',
        id: element.id,
        updates: {
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        },
        skipHistory: true
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (hasMoved.current) {
       // We trigger a "fake" full update without skipHistory so history gets pushed correctly
       // Or we can just let context take care of it if we provide the right payload
       dispatch({
         type: 'UPDATE_ELEMENT',
         id: element.id,
         updates: {} // empty updates trigger history snap of current position
       });
    }

    isDragging.current = false;
    isResizing.current = false;
    hasMoved.current = false;
    resizeHandle.current = null;
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);
  };

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <div
      ref={nodeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        top: element.y,
        left: element.x,
        width: element.width,
        height: element.height,
        backgroundColor: element.type === 'rectangle' ? (element.fill || '#3b82f6') : 'transparent',
        border: isSelected ? '2px solid var(--accent-color)' : (element.type === 'rectangle' ? 'none' : '1px solid transparent'),
        zIndex: element.zIndex,
        boxSizing: 'border-box',
        cursor: isDragging.current ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: element.fill || '#000',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {element.type === 'text' && (
        <span style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          {element.text || 'Double click to edit'}
        </span>
      )}
      
      {element.type === 'image' && (
        <img 
          src={element.src || 'https://via.placeholder.com/150'} 
          alt="canvas element" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
        />
      )}

      {/* Resize Handles */}
      {isSelected && handles.map((dir) => (
        <div
          key={dir}
          data-dir={dir}
          className="resize-handle"
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            backgroundColor: '#fff',
            border: '2px solid var(--accent-color)',
            borderRadius: '50%',
            cursor: `${dir}-resize`,
            ...getHandlePosition(dir)
          }}
        />
      ))}
    </div>
  );
};

function getHandlePosition(dir: string): React.CSSProperties {
  const props: React.CSSProperties = {};
  if (dir.includes('n')) {
    props.top = -6;
  } else if (dir.includes('s')) {
    props.bottom = -6;
  } else {
    props.top = 'calc(50% - 5px)';
  }

  if (dir.includes('w')) {
    props.left = -6;
  } else if (dir.includes('e')) {
    props.right = -6;
  } else {
    props.left = 'calc(50% - 5px)';
  }
  return props;
}
