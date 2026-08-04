import { useAppContext } from './context/AppContext';
import type { ViewName } from './types';
import BottomNav from './components/nav/BottomNav';
import HomeView from './views/HomeView';

function PlaceholderView({ name }: { name: string }) {
  return (
    <section className="active" style={{ padding: 24 }}>
      <p className="sub">The "{name}" view lands in a later phase.</p>
    </section>
  );
}

function renderView(view: ViewName) {
  switch (view) {
    case 'home':
      return <HomeView />;
    default:
      return <PlaceholderView name={view} />;
  }
}

function App() {
  const { state } = useAppContext();

  return (
    <div className="app">
      <div className="app-glow" />

      {renderView(state.currentView)}

      <BottomNav />
    </div>
  );
}

export default App;
