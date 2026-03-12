import { useCanvas } from '../store/CanvasContext';
import { Square, Type, Image as ImageIcon, Download, Undo, Redo } from 'lucide-react';
import html2canvas from 'html2canvas';

export const Toolbar: React.FC = () => {
  const { state, dispatch } = useCanvas();

  const handleAddRect = () => {
    dispatch({
      type: 'ADD_ELEMENT',
      element: {
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        fill: '#6366f1',
      }
    });
  };

  const handleAddText = () => {
    dispatch({
      type: 'ADD_ELEMENT',
      element: {
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        text: 'Hello Canvas',
        fill: '#000000',
      }
    });
  };

  const handleAddImage = () => {
    dispatch({
      type: 'ADD_ELEMENT',
      element: {
        type: 'image',
        x: 150,
        y: 150,
        width: 200,
        height: 200,
        src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=200',
      }
    });
  };

  const exportCanvas = async () => {
    const canvasNode = document.getElementById('html2canvas-target');
    if (!canvasNode) return;

    // Deselect elements to hide handles before export
    dispatch({ type: 'SELECT_ELEMENT', id: null });

    // Wait for state to apply
    setTimeout(async () => {
      try {
        const renderedCanvas = await html2canvas(canvasNode, {
          backgroundColor: '#ececec',
          scale: 2,
        });
        const link = document.createElement('a');
        link.download = 'canvas-export.png';
        link.href = renderedCanvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Failed to export', err);
      }
    }, 100);
  };

  return (
    <div className="toolbar-panel glass-panel">
      <button className="tool-btn" onClick={handleAddRect} title="Add Rectangle">
        <Square size={20} />
      </button>
      <button className="tool-btn" onClick={handleAddText} title="Add Text">
        <Type size={20} />
      </button>
      <button className="tool-btn" onClick={handleAddImage} title="Add Image Placeholder">
        <ImageIcon size={20} />
      </button>
      <div style={{ width: 1, background: 'var(--border-color)', margin: '4px' }} />
      <button 
        className="tool-btn" 
        onClick={() => dispatch({ type: 'UNDO' })} 
        title="Undo"
        disabled={state.past.length === 0}
        style={{ opacity: state.past.length === 0 ? 0.5 : 1 }}
      >
        <Undo size={20} />
      </button>
      <button 
        className="tool-btn" 
        onClick={() => dispatch({ type: 'REDO' })} 
        title="Redo"
        disabled={state.future.length === 0}
        style={{ opacity: state.future.length === 0 ? 0.5 : 1 }}
      >
        <Redo size={20} />
      </button>
      <div style={{ width: 1, background: 'var(--border-color)', margin: '4px' }} />
      <button className="tool-btn" onClick={exportCanvas} title="Export PNG">
        <Download size={20} />
      </button>
    </div>
  );
};
