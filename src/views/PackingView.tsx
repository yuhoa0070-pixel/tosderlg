import PackingChecklist from '../components/shared/PackingChecklist';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';

export default function PackingView() {
  const { state } = useAppContext();
  const trip = useActiveTrip();
  const km = state.language === 'km';
  const destination = trip?.destination.split(',')[0] ?? '';

  return (
    <section id="view-packing" className="active">
      <p className="eyebrow">{km ? 'ត្រៀមសម្រាប់ដំណើរ' : 'Get trip-ready'}</p>
      <h1>{km ? `រៀបចំសម្រាប់ ${destination}` : `Pack for ${destination}`}</h1>
      <p className="sub">
        {trip?.readOnly
          ? km ? 'មើលបញ្ជីរបស់ដែលមិត្តរបស់អ្នកបានចែករំលែក។' : 'View the packing list your friend shared.'
          : km ? 'គូសធីករបស់ដែលបានរៀបចំ ដើម្បីកុំឱ្យភ្លេចអ្វីមួយ។' : 'Check things off as you pack, so nothing gets left behind.'}
      </p>
      {trip && <PackingChecklist trip={trip} />}
    </section>
  );
}
