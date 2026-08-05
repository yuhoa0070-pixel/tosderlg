import { useAppContext } from './context/AppContext';
import type { ViewName } from './types';
import BottomNav from './components/nav/BottomNav';
import HomeView from './views/HomeView';
import ItineraryView from './views/ItineraryView';
import CustomizeView from './views/CustomizeView';
import MapView from './views/MapView';
import PackingView from './views/PackingView';
import AllPhotosView from './views/AllPhotosView';
import MemoryView from './views/MemoryView';
import RecapView from './views/RecapView';
import MyTripsView from './views/MyTripsView';
import ProfileView from './views/ProfileView';
import StopFormModal from './components/modals/StopFormModal';
import PasteLinkModal from './components/modals/PasteLinkModal';
import MemoryCollectionModal from './components/modals/MemoryCollectionModal';
import ConfirmDeletePhotoModal from './components/modals/ConfirmDeletePhotoModal';
import EditProfileModal from './components/modals/EditProfileModal';
import ConfirmClearModal from './components/modals/ConfirmClearModal';
import ThemeSkyTransition from './components/shared/ThemeSkyTransition';
import AppHeader from './components/shared/AppHeader';

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
    case 'packing':
      return <PackingView />;
    case 'all-photos':
      return <AllPhotosView />;
    case 'memory':
      return <MemoryView />;
    case 'recap':
      return <RecapView />;
    case 'mytrips':
      return <MyTripsView />;
    case 'profile':
      return <ProfileView />;
    default:
      return <HomeView />;
  }
}

function App() {
  const { state } = useAppContext();

  return (
    <div className="app">
      <div className="app-glow" />
      <ThemeSkyTransition />
      <AppHeader />

      {renderView(state.currentView)}

      <StopFormModal />
      <PasteLinkModal />
      <MemoryCollectionModal />
      <ConfirmDeletePhotoModal />
      <EditProfileModal />
      <ConfirmClearModal />

      <BottomNav />
    </div>
  );
}

export default App;
