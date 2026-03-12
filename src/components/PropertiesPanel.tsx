import { useCanvas } from '../store/CanvasContext';

export const PropertiesPanel: React.FC = () => {
  const { state, dispatch } = useCanvas();

  const selectedElements = state.elements.filter(el => state.selectedIds.includes(el.id));
  const el = selectedElements[0];

  if (!el) {
    return (
      <aside className="properties-panel">
        <div className="panel-header">Properties</div>
        <div className="panel-content">
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
            Select an element to edit properties
          </div>
        </div>
      </aside>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    let value: string | number = e.target.value;
    if (['x', 'y', 'width', 'height'].includes(key)) {
      value = parseInt(value) || 0;
    }
    
    dispatch({
      type: 'UPDATE_ELEMENT',
      id: el.id,
      updates: { [key]: value }
    });
  };

  return (
    <aside className="properties-panel">
      <div className="panel-header">Properties</div>
      <div className="panel-content">
        
        <div className="prop-group">
          <label>Position (X, Y)</label>
          <div className="prop-row">
            <input 
              type="number" 
              className="prop-input" 
              value={Math.round(el.x)} 
              onChange={e => handleChange(e, 'x')} 
            />
            <input 
              type="number" 
              className="prop-input" 
              value={Math.round(el.y)} 
              onChange={e => handleChange(e, 'y')} 
            />
          </div>
        </div>

        <div className="prop-group">
          <label>Size (W, H)</label>
          <div className="prop-row">
            <input 
              type="number" 
              className="prop-input" 
              value={Math.round(el.width)} 
              onChange={e => handleChange(e, 'width')} 
            />
            <input 
              type="number" 
              className="prop-input" 
              value={Math.round(el.height)} 
              onChange={e => handleChange(e, 'height')} 
            />
          </div>
        </div>

        {el.type === 'text' && (
          <div className="prop-group">
            <label>Text Content</label>
            <input 
              type="text" 
              className="prop-input" 
              value={el.text || ''} 
              onChange={e => handleChange(e, 'text')} 
            />
          </div>
        )}

        {(el.type === 'rectangle' || el.type === 'text') && (
          <div className="prop-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#000000', '#ffffff', 'transparent'].map(color => (
                <button
                  key={color}
                  onClick={() => dispatch({ type: 'UPDATE_ELEMENT', id: el.id, updates: { fill: color } })}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: color,
                    border: el.fill === color ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    boxSizing: 'border-box'
                  }}
                  title={color}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <input 
              type="color" 
              className="prop-input" 
              value={el.fill || '#000000'} 
              onChange={e => handleChange(e, 'fill')} 
              style={{ padding: '0px', height: '32px' }}
            />
          </div>
        )}

        <hr style={{ borderColor: 'var(--border-color)', margin: '10px 0' }} />
        
        <div className="prop-group">
          <label>Layers & Actions</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button 
              className="prop-input" 
              style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
              onClick={() => dispatch({ type: 'BRING_FORWARD', id: el.id })}
            >Bring Front</button>
            <button 
              className="prop-input" 
              style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
              onClick={() => dispatch({ type: 'SEND_BACKWARD', id: el.id })}
            >Send Back</button>
            <button 
              className="prop-input" 
              style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
              onClick={() => dispatch({ type: 'DUPLICATE_ELEMENTS', ids: [el.id] })}
            >Duplicate</button>
            <button 
              className="prop-input" 
              style={{ background: 'var(--danger-color)', color: 'white', border: 'none', cursor: 'pointer' }}
              onClick={() => dispatch({ type: 'DELETE_ELEMENTS', ids: [el.id] })}
            >Delete</button>
          </div>
        </div>

      </div>
    </aside>
  );
};
