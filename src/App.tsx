import { useAppContext } from './context/AppContext';
import type { ViewName } from './types';
import BottomNav from './components/nav/BottomNav';
import HomeView from './views/HomeView';
import ItineraryView from './views/ItineraryView';
import BudgetView from './views/BudgetView';
import CustomizeView from './views/CustomizeView';
import MapView from './views/MapView';
import AllPhotosView from './views/AllPhotosView';
import MemoryView from './views/MemoryView';
import RecapView from './views/RecapView';
import MyTripsView from './views/MyTripsView';
import ProfileView from './views/ProfileView';
import BudgetTrackerView from './views/BudgetTrackerView';
import TripDetailsView from './views/TripDetailsView';
import DocumentsView from './views/DocumentsView';
import StopFormModal from './components/modals/StopFormModal';
import PasteLinkModal from './components/modals/PasteLinkModal';
import MemoryCollectionModal from './components/modals/MemoryCollectionModal';
import ConfirmDeletePhotoModal from './components/modals/ConfirmDeletePhotoModal';
import EditProfileModal from './components/modals/EditProfileModal';
import ConfirmClearModal from './components/modals/ConfirmClearModal';
import JoinTripRoomModal from './components/modals/JoinTripRoomModal';
import EditTripDatesModal from './components/modals/EditTripDatesModal';
import TripCreatedModal from './components/modals/TripCreatedModal';
import PackingChecklistModal from './components/modals/PackingChecklistModal';
import ThemeSkyTransition from './components/shared/ThemeSkyTransition';
import AppHeader from './components/shared/AppHeader';
import AnimatedTravelBackground from './components/shared/AnimatedTravelBackground';

// The bottom tab bar only makes sense on screens reached directly from it.
// Everything else is a "pushed" screen (reached by drilling in further) and
// should hide the tab bar and rely on that screen's own back button instead —
// same pattern as a native app's navigation stack.
const PRIMARY_TAB_VIEWS: ViewName[] = ['home', 'itinerary', 'map', 'profile'];

function renderView(view: ViewName) {
  switch (view) {
    case 'home':
      return <HomeView />;
    case 'itinerary':
      return <ItineraryView />;
    case 'budget':
      return <BudgetView />;
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
    case 'mytrips':
      return <MyTripsView />;
    case 'profile':
      return <ProfileView />;
    case 'budgetTracker':
      return <BudgetTrackerView />;
    case 'tripDetails':
      return <TripDetailsView />;
    case 'documents':
      return <DocumentsView />;
    default:
      return <HomeView />;
  }
}

function App() {
  const { state } = useAppContext();

  return (
    <div className={`app${state.currentView === 'map' ? ' map-active' : ''}`}>
      <div className="app-glow" />
      <AnimatedTravelBackground />
      <ThemeSkyTransition />
      {state.currentView !== 'profile' && <AppHeader />}

      {renderView(state.currentView)}

      <StopFormModal />
      <PasteLinkModal />
      <MemoryCollectionModal />
      <ConfirmDeletePhotoModal />
      <EditProfileModal />
      <ConfirmClearModal />
      <JoinTripRoomModal />
      <EditTripDatesModal />
      <TripCreatedModal />
      <PackingChecklistModal />

      {PRIMARY_TAB_VIEWS.includes(state.currentView) && <BottomNav />}
    </div>
  );
}

export default App;
