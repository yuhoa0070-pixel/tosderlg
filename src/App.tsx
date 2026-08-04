import { useAppContext } from './context/AppContext';
import type { ViewName } from './types';
import BottomNav from './components/nav/BottomNav';
import HomeView from './views/HomeView';
import ItineraryView from './views/ItineraryView';
import CustomizeView from './views/CustomizeView';
import MapView from './views/MapView';
import AllPhotosView from './views/AllPhotosView';
import MemoryView from './views/MemoryView';
import RecapView from './views/RecapView';
import StopFormModal from './components/modals/StopFormModal';
import PasteLinkModal from './components/modals/PasteLinkModal';
import MemoryCollectionModal from './components/modals/MemoryCollectionModal';
import ConfirmDeletePhotoModal from './components/modals/ConfirmDeletePhotoModal';

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
    case 'itinerary':
      return <ItineraryView />;
    case 'customize':
      return <CustomizeView />;
    case 'map':
      return <MapView />;
    case 'all-photos':
      return <AllPhotosView />;
    case 'memory':
      return <MemoryView />;
    case 'recap':
      return <RecapView />;
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

      <StopFormModal />
      <PasteLinkModal />
      <MemoryCollectionModal />
      <ConfirmDeletePhotoModal />

      <BottomNav />
    </div>
  );
}

export default App;
