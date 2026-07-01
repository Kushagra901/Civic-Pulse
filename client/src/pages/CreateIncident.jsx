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
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isListening, setIsListening] = useState(false);
  
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

  // AI Categorization Suggestion
  const suggestCategory = (title) => {
    const t = title.toLowerCase();
    if (t.includes('water') || t.includes('leak') || t.includes('pipe') || t.includes('drain') || t.includes('sewage') || t.includes('overflow') || t.includes('clog')) return 'WATER';
    if (t.includes('light') || t.includes('electricity') || t.includes('wire') || t.includes('power') || t.includes('outage') || t.includes('shock') || t.includes('transformer')) return 'ELECTRICITY';
    if (t.includes('road') || t.includes('pothole') || t.includes('pavement') || t.includes('street') || t.includes('crack') || t.includes('block') || t.includes('barrier')) return 'ROAD';
    if (t.includes('safe') || t.includes('hazard') || t.includes('crime') || t.includes('alert') || t.includes('danger') || t.includes('police') || t.includes('dark')) return 'SAFETY';
    if (t.includes('garbage') || t.includes('trash') || t.includes('dump') || t.includes('waste') || t.includes('dirty') || t.includes('odor') || t.includes('clean') || t.includes('litter')) return 'SANITATION';
    return null;
  };

  const handleTitleChange = (val) => {
    update('title', val);
    const suggested = suggestCategory(val);
    if (suggested && form.category !== suggested) {
      setAiSuggestion(suggested);
    } else {
      setAiSuggestion(null);
    }
  };

  // Voice Reporting Accessibility feature
  const toggleVoiceListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showError("Voice input API not supported in this browser. Running simulation.");
      setIsListening(true);
      setTimeout(() => {
        const fallbackText = "Verification required for damaged public pipeline causing local overflow.";
        update('description', form.description + (form.description ? ' ' : '') + fallbackText);
        setIsListening(false);
        showSuccess('Voice simulation transcribed successfully.');
      }, 1500);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
      showError("Speech recognition error occurred.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      update('description', form.description + (form.description ? ' ' : '') + transcript);
      showSuccess('Voice input transcribed!');
    };

    recognition.start();
  };

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
      navigate(`/incident/${response.incident.id}`);
    } catch (err) {
      showError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] pb-12 sm:max-w-2xl sm:mx-auto sm:px-4 sm:py-8 space-y-6">

      {/* Progress header */}
      <div className="px-4 pt-4 pb-2 sm:px-0 sm:pt-0">
        <div className="flex items-center gap-1.5 mb-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`h-1.5 w-full rounded-full transition-all duration-300
                ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider
                ${i === step ? 'text-blue-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-0 space-y-4 pb-6">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-5">

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Select Incident Category
                </h2>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Choosing the appropriate category routes your report to the correct department team.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      update('category', cat.value);
                      setTimeout(() => setStep(1), 250);
                    }}
                    className={`flex items-center gap-4 px-5 py-4
                      rounded-xl border-2 text-left transition-all duration-200
                      active:scale-[0.98]
                      ${form.category === cat.value
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                      }`}
                  >
                    <span className="text-3xl flex-shrink-0" role="img" aria-label={cat.label}>
                      {cat.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {cat.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                        {cat.desc}
                      </p>
                    </div>
                    {form.category === cat.value && (
                      <div className="ml-auto w-6 h-6 rounded-full bg-blue-600
                                      flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Incident Information
                </h2>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Describe the issue clearly. High credibility reports have strong titles and detailed descriptions.
                </p>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="field-label">Short Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. Water leak and local flooding on Park Street"
                  maxLength={120}
                  className="field"
                />
                <div className="flex justify-between items-center text-xs">
                  <div>
                    {form.category && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Current Category: {form.category}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-semibold">{form.title.length}/120</span>
                </div>
              </div>

              {/* AI Suggestion Alert Box */}
              {aiSuggestion && form.category !== aiSuggestion && (
                <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-800 animate-in slide-in-from-top duration-300">
                  <span>🤖 AI detected keywords. Update category to <strong>{aiSuggestion}</strong>?</span>
                  <button 
                    type="button"
                    onClick={() => {
                      update('category', aiSuggestion);
                      setAiSuggestion(null);
                      showSuccess(`Category updated to ${aiSuggestion}`);
                    }}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold min-h-0 min-w-0 shadow-sm"
                  >
                    Update
                  </button>
                </div>
              )}

              {/* Description textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="field-label">Detailed Description</label>
                  <button
                    type="button"
                    onClick={toggleVoiceListening}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all min-h-0 min-w-0
                      ${isListening
                        ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse ring-2 ring-rose-500/10'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-350'}`}
                  >
                    <span>{isListening ? '🎙️ Recording...' : '🎙️ Dictate Mode'}</span>
                  </button>
                </div>
                <textarea
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Tell us what needs attention, how long the issue has persisted, and any safety hazards it presents..."
                  rows={5}
                  maxLength={1000}
                  className="field resize-none"
                />
                <p className="text-xs text-slate-400 text-right font-semibold">
                  {form.description.length}/1000
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Geotag Location
                </h2>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Click on the map or use GPS location. Verified geo-coordinates increase report credibility score.
                </p>
              </div>
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
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Upload Visual Proof
                  <span className="text-xs font-normal text-slate-400 ml-2 uppercase tracking-wider">
                    (Recommended)
                  </span>
                </h2>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Uploading real, unedited photos of the location allows engineers to assess priority and raises credibility index by +10.
                </p>
              </div>
              <PhotoUploader
                onChange={urls => update('photoUrls', urls)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="sticky bottom-0 px-4 py-4 bg-white/95 backdrop-blur border-t border-slate-200/80 sm:px-0 sm:border-0 sm:pt-4 z-10 rounded-2xl sm:bg-transparent">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-350 transition-colors"
            >
              Back
            </button>
          )}

           {step < STEPS.length - 1
            ? <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex-1 py-3 rounded-xl bg-accent text-slate-900 text-sm font-bold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
              >
                Continue
              </button>
            : <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-accent text-slate-900 text-sm font-bold hover:bg-accent-hover disabled:opacity-60 transition-all hover:scale-[1.01]"
              >
                {submitting ? 'Submitting Report…' : 'Submit to Ward Office'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
