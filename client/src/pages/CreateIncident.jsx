import { useState } from 'react';
import { useNavigate }   from 'react-router-dom';
import LocationPicker    from '../components/LocationPicker';
import PhotoUploader     from '../components/PhotoUploader';
import { api }           from '../api';
import { useError }      from '../context/ErrorContext';

const CATEGORIES = [
  { value: 'WATER',       label: 'Water',       emoji: '💧',
    desc: 'Leaks, flooding, supply issues' },
  { value: 'ELECTRICITY', label: 'Electricity', emoji: '⚡',
    desc: 'Outages, damaged lines, streetlights' },
  { value: 'ROAD',        label: 'Road',        emoji: '🛣️',
    desc: 'Potholes, blocked roads, signs' },
  { value: 'SAFETY',      label: 'Safety',      emoji: '🚨',
    desc: 'Hazards, crime, unsafe areas' },
  { value: 'SANITATION',  label: 'Sanitation',  emoji: '🗑️',
    desc: 'Garbage, sewage, pest issues' },
];

const STEPS = ['Category', 'Details', 'Location', 'Photos'];

export default function CreateIncident() {
  const navigate          = useNavigate();
  const { showError, showSuccess } = useError();

  const [step,      setStep]      = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category:    '',
    title:       '',
    description: '',
    lat:         28.6139,
    lng:         77.2090,
    locationLabel: 'New Delhi (default)',
    photoUrls:   [],
  });

  const update = (key, value) =>
    setForm(f => ({ ...f, [key]: value }));

  // Validate current step before advancing
  const canAdvance = () => {
    if (step === 0) return !!form.category;
    if (step === 1) return form.title.length >= 5 &&
                          form.description.length >= 10;
    if (step === 2) return form.lat !== null && form.lng !== null;
    return true;   // photos are optional
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await api.createIncident({
        category:    form.category,
        title:       form.title,
        description: form.description,
        lat:         form.lat,
        lng:         form.lng,
        photoUrls:   form.photoUrls,
      });
      showSuccess('Report submitted. Thank you!');
      // Navigate to the newly created incident detail page
      navigate(`/incident/${response.incident.id}`);
    } catch (err) {
      showError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-3.5rem-4rem)]
                    sm:min-h-0 sm:max-w-lg sm:mx-auto sm:px-4 sm:py-8">

      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2 sm:px-0 sm:pt-0">
        <div className="flex items-center gap-1.5 mb-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-all duration-300
                ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
              <span className={`text-[10px] font-semibold
                ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-0 space-y-4 pb-6">

        {/* Step 0: Category */}
        {step === 0 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <h2 className="text-lg font-semibold text-gray-900">
              What type of issue?
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => {
                    update('category', cat.value);
                    // Auto-advance after selection on mobile
                    setTimeout(() => setStep(1), 150);
                  }}
                  className={`flex items-center gap-4 px-4 py-3.5
                    rounded-2xl border-2 text-left transition-all
                    active:scale-[0.98]
                    ${form.category === cat.value
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <span className="text-2xl flex-shrink-0" role="img" aria-label={cat.label}>
                    {cat.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {cat.label}
                    </p>
                    <p className="text-xs text-gray-450 mt-0.5 font-medium text-slate-500">
                      {cat.desc}
                    </p>
                  </div>
                  {form.category === cat.value && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-blue-500
                                    flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Title + description */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Describe the issue
            </h2>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Short title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Broken streetlight on MG Road"
                maxLength={120}
                // font-size 16px prevents iOS zoom on focus
                className="w-full px-4 py-3 text-[16px] sm:text-sm
                           border border-gray-200 rounded-xl bg-white
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500/20 focus:border-blue-400 font-medium"
              />
              <p className="text-xs text-gray-400 text-right font-medium">
                {form.title.length}/120
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe the problem in detail — how long has it been there, what's the impact…"
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 text-[16px] sm:text-sm
                           border border-gray-200 rounded-xl bg-white
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500/20 focus:border-blue-400
                           resize-none font-medium"
              />
              <p className="text-xs text-gray-400 text-right font-medium">
                {form.description.length}/1000
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pin the location
            </h2>
            <LocationPicker
              value={{ lat: form.lat, lng: form.lng, label: form.locationLabel }}
              onChange={(loc) => {
                update('lat', loc.lat);
                update('lng', loc.lng);
                update('locationLabel', loc.label);
              }}
            />
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Add photos
              <span className="text-sm font-normal text-gray-400 ml-2">
                (optional)
              </span>
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Photos significantly increase credibility. Add up to 5.
            </p>
            <PhotoUploader
              onChange={urls => update('photoUrls', urls)}
            />
          </div>
        )}
      </div>

      {/* Fixed bottom action bar */}
      <div className="sticky bottom-0 px-4 py-3 bg-white border-t
                      border-gray-100 sm:px-0 sm:border-0 sm:pt-6 z-10">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border border-gray-200
                         text-sm font-semibold text-gray-650
                         hover:bg-gray-50 active:bg-gray-100
                         transition-colors"
            >
              Back
            </button>
          )}

          {step < STEPS.length - 1
            ? <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white
                           text-sm font-semibold hover:bg-blue-700
                           disabled:opacity-40 disabled:cursor-not-allowed
                           active:scale-[0.98] transition-all"
              >
                Continue
              </button>
            : <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white
                           text-sm font-semibold hover:bg-blue-700
                           disabled:opacity-60
                           active:scale-[0.98] transition-all"
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
