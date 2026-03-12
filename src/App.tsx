import './App.css';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';

function App() {
  return (
    <div className="app-container">
      <Toolbar />
      <Canvas />
      <PropertiesPanel />
    </div>
  );
}

export default App;
