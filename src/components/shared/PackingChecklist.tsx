import { useRef, useState, type FormEvent } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { Trip } from '../../types';

export default function PackingChecklist({ trip }: { trip: Trip }) {
  const { state, dispatch } = useAppContext();
  const [newItem, setNewItem] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎒');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const km = state.language === 'km';
  const items = trip.packingItems ?? [];
  const remaining = items.filter((item) => !item.packed).length;
  const emojiOptions = km
    ? [
        { emoji: '🎒', text: 'កាបូបស្ពាយ' },
        { emoji: '👕', text: 'សម្លៀកបំពាក់' },
        { emoji: '👟', text: 'ស្បែកជើង' },
        { emoji: '🪥', text: 'សម្ភារៈអនាម័យ' },
        { emoji: '💊', text: 'ថ្នាំពេទ្យ' },
        { emoji: '🔌', text: 'ឆ្នាំងសាក' },
        { emoji: '📷', text: 'កាមេរ៉ា' },
        { emoji: '🛂', text: 'លិខិតឆ្លងដែន' },
        { emoji: '🎀', text: 'របស់មិត្តស្រី' },
        { emoji: '🧢', text: 'របស់មិត្តប្រុស' },
      ]
    : [
        { emoji: '🎒', text: 'Backpack' },
        { emoji: '👕', text: 'Clothes' },
        { emoji: '👟', text: 'Shoes' },
        { emoji: '🪥', text: 'Toiletries' },
        { emoji: '💊', text: 'Medicine' },
        { emoji: '🔌', text: 'Charger' },
        { emoji: '📷', text: 'Camera' },
        { emoji: '🛂', text: 'Passport' },
        { emoji: '🎀', text: "Girlfriend's items" },
        { emoji: '🧢', text: "Boyfriend's items" },
      ];
  const suggestions = km
    ? [{ text: 'លិខិតឆ្លងដែន', emoji: '🛂' }, { text: 'ឆ្នាំងសាក', emoji: '🔌' }, { text: 'ថ្នាំពេទ្យ', emoji: '💊' }]
    : [{ text: 'Passport', emoji: '🛂' }, { text: 'Charger', emoji: '🔌' }, { text: 'Medication', emoji: '💊' }];

  function addItem(text: string, emoji = newEmoji) {
    const cleanText = text.trim();
    if (!cleanText || items.some((item) => item.text.toLocaleLowerCase() === cleanText.toLocaleLowerCase())) return;
    dispatch({ type: 'ADD_PACKING_ITEM', item: { id: Date.now(), text: cleanText, packed: false, emoji } });
    setNewItem('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    addItem(newItem);
  }

  function suggestItem(emoji: string, text: string) {
    setNewEmoji(emoji);
    setNewItem(text);
    inputRef.current?.focus();
  }

  return (
    <div className="packing-checklist">
      <div className="packing-header">
        <div className="packing-title-wrap">
          <div className="packing-icon" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 7V5a5 5 0 0 1 10 0v2M5 7h14l1 14H4L5 7Z" />
            </svg>
          </div>
          <div>
            <div className="packing-title">{km ? 'បញ្ជីរបស់ត្រូវយក' : 'Packing checklist'}</div>
            <div className="packing-subtitle">{km ? 'រៀបចំឥឡូវ ធ្វើដំណើរដោយស្ងប់ចិត្ត' : 'Pack now, relax later.'}</div>
          </div>
        </div>
        {items.length > 0 && (
          <span className={`packing-count${remaining === 0 ? ' complete' : ''}`}>
            {remaining === 0
              ? km ? 'រួចរាល់' : 'Ready'
              : km ? `នៅសល់ ${remaining}` : `${remaining} left`}
          </span>
        )}
      </div>

      <div className="packing-emoji-picker" aria-label={km ? 'ជ្រើសរើសរូបសញ្ញា' : 'Choose an emoji'}>
        {emojiOptions.map((option) => (
          <button
            type="button"
            key={option.emoji}
            className={option.emoji === newEmoji ? 'active' : ''}
            onClick={() => suggestItem(option.emoji, option.text)}
            aria-label={`${option.text} ${option.emoji}`}
            aria-pressed={option.emoji === newEmoji}
          >
            {option.emoji}
          </button>
        ))}
      </div>

      <form className="packing-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="packing-input"
          type="text"
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          placeholder={km ? 'បន្ថែមរបស់ដែលត្រូវយក' : 'Add something to bring'}
          aria-label={km ? 'របស់ដែលត្រូវយក' : 'Packing item'}
        />
        <button className="packing-add" type="submit" disabled={!newItem.trim()} aria-label={km ? 'បន្ថែម' : 'Add item'}>
          <span aria-hidden="true">+</span>
        </button>
      </form>

      {items.length > 0 ? (
        <div className="packing-list">
          {items.map((item) => (
            <div className={`packing-item${item.packed ? ' packed' : ''}`} key={item.id}>
              <button
                type="button"
                className="packing-check"
                onClick={() => dispatch({ type: 'TOGGLE_PACKING_ITEM', itemId: item.id })}
                aria-label={item.packed ? `Mark ${item.text} unpacked` : `Mark ${item.text} packed`}
                aria-pressed={item.packed}
              >
                {item.packed && <span aria-hidden="true">✓</span>}
              </button>
              <span className="packing-item-emoji" aria-hidden="true">{item.emoji ?? '🎒'}</span>
              <span className="packing-item-text">{item.text}</span>
              <button
                type="button"
                className="packing-remove"
                onClick={() => dispatch({ type: 'REMOVE_PACKING_ITEM', itemId: item.id })}
                aria-label={km ? `លុប ${item.text}` : `Remove ${item.text}`}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="packing-suggestions">
          <span>{km ? 'សាកល្បង៖' : 'Try:'}</span>
          {suggestions.map((suggestion) => (
            <button type="button" key={suggestion.text} onClick={() => addItem(suggestion.text, suggestion.emoji)}>
              <span aria-hidden="true">{suggestion.emoji}</span> {suggestion.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
