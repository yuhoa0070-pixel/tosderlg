import HeroGreeting from '../components/home/HeroGreeting';
import HeroGallery from '../components/home/HeroGallery';
import TripList from '../components/home/TripList';
import MemoriesGallery from '../components/home/MemoriesGallery';
import TripForm from '../components/home/TripForm';

export default function HomeView() {
  return (
    <section id="view-home" className="active">
      <HeroGreeting>
        <HeroGallery />
      </HeroGreeting>
      <TripList />
      <MemoriesGallery />
      <TripForm />
    </section>
  );
}
