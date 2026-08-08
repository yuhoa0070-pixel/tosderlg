import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useStartNewTrip } from '../hooks/useStartNewTrip';
import HeroGreeting from '../components/home/HeroGreeting';
import HeroGallery from '../components/home/HeroGallery';
import TripDashboardCard from '../components/home/TripDashboardCard';
import TripList from '../components/home/TripList';
import MemoriesGallery from '../components/home/MemoriesGallery';

export default function HomeView() {
  const { state } = useAppContext();
  const activeTrip = useActiveTrip();
  const startNewTrip = useStartNewTrip();
  const km = state.language === 'km';

  return (
    <section id="view-home" className="active">
      {activeTrip ? (
        <>
          <TripDashboardCard trip={activeTrip} />
          <div className="discover-heading">
            <p className="eyebrow" style={{ margin: 0 }}>{km ? 'ស្វែងរកបន្ថែម' : 'Discover more'}</p>
          </div>
          <HeroGallery />
        </>
      ) : (
        <HeroGreeting>
          <HeroGallery />
        </HeroGreeting>
      )}
      <TripList />
      <MemoriesGallery />

      <div className="plan-next-trip">
        <h2 className="trip-dash-section-title">{km ? 'រៀបចំដំណើរបន្ទាប់' : 'Plan your next trip'}</h2>
        <button type="button" className="itin-add-activity" onClick={startNewTrip}>
          + {km ? 'ចាប់ផ្ដើមរៀបចំ' : 'Start planning'}
        </button>
      </div>
    </section>
  );
}
