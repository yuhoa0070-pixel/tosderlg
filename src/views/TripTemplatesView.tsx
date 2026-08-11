import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TRIP_TEMPLATES, tripTemplateDays, tripTemplateTags, type TripTemplate } from '../lib/tripTemplates';
import PhotoPlaceholderIcon from '../components/shared/PhotoPlaceholderIcon';
import type { Trip } from '../types';

const TAG_LABELS: Record<string, { en: string; km: string }> = {
  popular: { en: 'Popular', km: 'ពេញនិយម' },
  '3days': { en: '3 days', km: '៣ ថ្ងៃ' },
  nature: { en: 'Nature', km: 'ធម្មជាតិ' },
  beach: { en: 'Beach', km: 'ឆ្នេរ' },
  adventure: { en: 'Adventure', km: 'ផ្សងព្រេង' },
  culture: { en: 'Culture', km: 'វប្បធម៌' },
};

function tagLabel(tag: string, km: boolean): string {
  const entry = TAG_LABELS[tag];
  if (!entry) return tag;
  return km ? entry.km : entry.en;
}

export default function TripTemplatesView() {
  const { state, dispatch } = useAppContext();
  const km = state.language === 'km';
  const tags = tripTemplateTags(TRIP_TEMPLATES);
  const [activeTag, setActiveTag] = useState(tags[0] ?? '');

  const templates = TRIP_TEMPLATES.filter((template) => template.tags.includes(activeTag));

  function useTemplate(template: TripTemplate) {
    const days = tripTemplateDays(template);
    const trip: Trip = {
      id: Date.now(),
      destination: template.destination,
      label: km ? `${days.length} ថ្ងៃ` : `${days.length} day${days.length === 1 ? '' : 's'}`,
      startDate: null,
      endDate: null,
      center: template.center,
      tripDays: days,
      photos: {},
      packingItems: [],
    };
    dispatch({ type: 'CREATE_TRIP', trip });
  }

  return (
    <section id="view-trip-templates" className="active">
      <div className="tsh-top-row" style={{ marginBottom: 22 }}>
        <div className="icon-btn glass" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'home' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>
        <div className="tsh-title-meta">
          <h2 className="tsh-title">{km ? 'គំរូដំណើរ' : 'Trip templates'}</h2>
          <p className="tsh-subtitle">{km ? 'កម្មវិធីដំណើរដែលបានរៀបចំរួចជាមុន' : 'Hand-picked itineraries to start from'}</p>
        </div>
      </div>

      <div className="day-tabs" style={{ marginBottom: 18 }}>
        {tags.map((tag) => (
          <div
            key={tag}
            className={`day-tab${tag === activeTag ? ' active' : ''}`}
            onClick={() => setActiveTag(tag)}
          >
            {tagLabel(tag, km)}
          </div>
        ))}
      </div>

      <div className="tpl-list">
        {templates.map((template) => (
          <div className="tpl-card" key={template.id}>
            <div className="tpl-cover">
              <PhotoPlaceholderIcon className="photo-placeholder-icon" />
            </div>
            <div className="tpl-body">
              <h3 className="tpl-title">{template.title}</h3>
              <p className="tpl-destination">{template.destinationLabel}</p>
              <p className="tpl-route">{template.routeSummary}</p>
              <button type="button" className="btn btn-primary tpl-use-btn" onClick={() => useTemplate(template)}>
                {km ? 'ប្រើគំរូនេះ' : 'Use this'}
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="trip-details-documents-empty">
            {km ? 'មិនទាន់មានគំរូសម្រាប់ចំណាត់ថ្នាក់នេះទេ។' : 'No templates match this filter yet.'}
          </p>
        )}
      </div>
    </section>
  );
}
