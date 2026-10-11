import React, { useState } from 'react';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
  Phone,
  BookOpen,
  Sparkles,
  Database,
  RotateCcw,
} from 'lucide-react';
import {
  INITIAL_PORTAL_STATE,
  MadarsaSettings,
  PortalState,
} from '../types/portal';
import { MadarsaLogo, removeLogoBackground } from './MadarsaLogo';

interface MadarsaSettingsPanelProps {
  state: PortalState;
  onUpdateState: (updater: (prev: PortalState) => PortalState, logAction?: string, logTarget?: string) => void;
}

export const MadarsaSettingsPanel: React.FC<MadarsaSettingsPanelProps> = ({
  state,
  onUpdateState,
}) => {
  const [form, setForm] = useState<MadarsaSettings>(() => ({
    ...INITIAL_PORTAL_STATE.madarsaSettings,
    ...(state.madarsaSettings || {}),
  }));
  const [savedNotice, setSavedNotice] = useState(false);

  // New stat box state
  const [newStatLabel, setNewStatLabel] = useState('');
  const [newStatValue, setNewStatValue] = useState('');

  // New program card state
  const [newProgTitle, setNewProgTitle] = useState('');
  const [newProgDesc, setNewProgDesc] = useState('');

  // New feature card state
  const [newFeatTitle, setNewFeatTitle] = useState('');
  const [newFeatDesc, setNewFeatDesc] = useState('');

  const handleSaveAll = () => {
    onUpdateState(
      (prev) => ({
        ...prev,
        madarsaSettings: form,
      }),
      'Updated Madarsa Master Settings',
      form.madarsaName
    );
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const addStatBox = () => {
    if (!newStatLabel.trim() || !newStatValue.trim()) return;
    setForm((prev) => ({
      ...prev,
      statsBoxes: [
        ...prev.statsBoxes,
        { id: `st-${Date.now()}`, label: newStatLabel.trim(), value: newStatValue.trim() },
      ],
    }));
    setNewStatLabel('');
    setNewStatValue('');
  };

  const removeStatBox = (id: string) => {
    setForm((prev) => ({
      ...prev,
      statsBoxes: prev.statsBoxes.filter((s) => s.id !== id),
    }));
  };

  const addProgramCard = () => {
    if (!newProgTitle.trim()) return;
    setForm((prev) => ({
      ...prev,
      programs: [
        ...prev.programs,
        {
          id: `pr-${Date.now()}`,
          num: prev.programs.length + 1,
          title: newProgTitle.trim(),
          desc: newProgDesc.trim() || 'Comprehensive Islamic and modern academic program',
        },
      ],
    }));
    setNewProgTitle('');
    setNewProgDesc('');
  };

  const removeProgramCard = (id: string) => {
    setForm((prev) => ({
      ...prev,
      programs: prev.programs.filter((p) => p.id !== id),
    }));
  };

  const addFeatureCard = () => {
    if (!newFeatTitle.trim()) return;
    setForm((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        {
          id: `ft-${Date.now()}`,
          title: newFeatTitle.trim(),
          desc: newFeatDesc.trim() || 'Quality education and moral training',
        },
      ],
    }));
    setNewFeatTitle('');
    setNewFeatDesc('');
  };

  const removeFeatureCard = (id: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#dee6e1] shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-[#11261d] flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#144734]" />
            Madarsa Master Settings & Website Control (Super Admin)
          </h1>
          <p className="text-xs sm:text-sm text-[#61786e] mt-0.5">
            Edit, add, change, or delete any detail of the Madarsa, Public Website, Contact Info, Programs, Features, and Portal Database.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] hover:opacity-95 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer flex-shrink-0"
        >
          <Save className="w-4 h-4" />
          Save All Madarsa Settings
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          All Madarsa details & public website settings have been saved to the database!
        </div>
      )}

      {/* 1. Identity & Hero Settings */}
      <div className="bg-white rounded-2xl border border-[#dee6e1] p-5 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#11261d] flex items-center gap-2 border-b border-[#edf2ee] pb-3">
          <Building2 className="w-5 h-5 text-[#144734]" />
          1. Madarsa Identity, Header & Hero Banner Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">Madarsa Full Name *</label>
            <input
              type="text"
              value={form.madarsaName}
              onChange={(e) => setForm({ ...form, madarsaName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] font-semibold"
            />
          </div>
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">Short Location / Subtitle</label>
            <input
              type="text"
              value={form.shortSubtitle}
              onChange={(e) => setForm({ ...form, shortSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">Bismillah / Top Badge Text</label>
            <input
              type="text"
              value={form.bismillahText}
              onChange={(e) => setForm({ ...form, bismillahText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">Motto / Tagline (Bullet Separated)</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">Principal / Mohtamim Name (For Grade & ID Cards)</label>
            <input
              type="text"
              value={form.principalName}
              onChange={(e) => setForm({ ...form, principalName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">Current Academic Year</label>
            <input
              type="text"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[#2d4239] mb-1">Hero Location / Subtitle Line</label>
            <input
              type="text"
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#f4f7f5] border border-[#d6e0da]">
            <div>
              <div className="font-extrabold text-[#11261d]">Online Admission Portal Status</div>
              <div className="text-[#61786e]">Enable or disable pre-login online admission applications</div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, admissionsOpen: !form.admissionsOpen })}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer ${
                form.admissionsOpen
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {form.admissionsOpen ? '✓ Admissions OPEN' : '✕ Admissions CLOSED'}
            </button>
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[#2d4239] mb-1">Admission Banner Announcement Text</label>
            <input
              type="text"
              value={form.admissionBannerText}
              onChange={(e) => setForm({ ...form, admissionBannerText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
        </div>
      </div>

      {/* 2. Contact & Address Details */}
      <div className="bg-white rounded-2xl border border-[#dee6e1] p-5 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#11261d] flex items-center gap-2 border-b border-[#edf2ee] pb-3">
          <Phone className="w-5 h-5 text-[#144734]" />
          2. Contact & Location Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block font-bold text-[#2d4239] mb-1">Full Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">Office Phone Number</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">WhatsApp Number</label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-bold text-[#2d4239] mb-1">Official Madarsa Email</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
        </div>
      </div>

      {/* 3. About Us & Highlight Stats Boxes */}
      <div className="bg-white rounded-2xl border border-[#dee6e1] p-5 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#11261d] flex items-center gap-2 border-b border-[#edf2ee] pb-3">
          <BookOpen className="w-5 h-5 text-[#144734]" />
          3. "About Us" Section & Stat Cards (Edit / Add / Delete)
        </h2>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">About Section Heading</label>
            <input
              type="text"
              value={form.aboutHeading}
              onChange={(e) => setForm({ ...form, aboutHeading: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#2d4239] mb-1">About Us Paragraph Description</label>
            <textarea
              rows={3}
              value={form.aboutDescription}
              onChange={(e) => setForm({ ...form, aboutDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
            />
          </div>

          <div className="pt-2">
            <label className="block font-bold text-[#2d4239] mb-2">Highlight Stat Boxes</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {form.statsBoxes.map((box, idx) => (
                <div key={box.id} className="p-3 rounded-xl border border-[#d6e0da] bg-[#f9fbf9] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#61786e]">Stat #{idx + 1}</span>
                    <button
                      onClick={() => removeStatBox(box.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      title="Delete Stat Box"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    value={box.value}
                    onChange={(e) => {
                      const updated = [...form.statsBoxes];
                      updated[idx] = { ...box, value: e.target.value };
                      setForm({ ...form, statsBoxes: updated });
                    }}
                    placeholder="Value (e.g. 1-5)"
                    className="w-full px-2 py-1 rounded border border-[#d6e0da] font-bold"
                  />
                  <input
                    value={box.label}
                    onChange={(e) => {
                      const updated = [...form.statsBoxes];
                      updated[idx] = { ...box, label: e.target.value };
                      setForm({ ...form, statsBoxes: updated });
                    }}
                    placeholder="Label (e.g. Classes)"
                    className="w-full px-2 py-1 rounded border border-[#d6e0da]"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={newStatValue}
                onChange={(e) => setNewStatValue(e.target.value)}
                placeholder="New Stat Value (e.g. 100%)"
                className="px-3 py-1.5 rounded-lg border border-[#d6e0da]"
              />
              <input
                value={newStatLabel}
                onChange={(e) => setNewStatLabel(e.target.value)}
                placeholder="New Stat Label (e.g. Result)"
                className="px-3 py-1.5 rounded-lg border border-[#d6e0da]"
              />
              <button
                onClick={addStatBox}
                className="px-3.5 py-1.5 rounded-lg bg-[#144734] text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stat Box
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Academic Programs Cards */}
      <div className="bg-white rounded-2xl border border-[#dee6e1] p-5 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#11261d] flex items-center gap-2 border-b border-[#edf2ee] pb-3">
          <Sparkles className="w-5 h-5 text-[#144734]" />
          4. Academic Programs / Classes Showcase (Edit / Add / Delete)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {form.programs.map((prog, idx) => (
            <div key={prog.id} className="p-3.5 rounded-xl border border-[#d6e0da] bg-[#f9fbf9] space-y-2">
              <div className="flex items-center justify-between">
                <input
                  value={prog.title}
                  onChange={(e) => {
                    const updated = [...form.programs];
                    updated[idx] = { ...prog, title: e.target.value };
                    setForm({ ...form, programs: updated });
                  }}
                  className="font-extrabold text-sm text-[#11261d] px-2 py-1 rounded border border-[#d6e0da] bg-white"
                />
                <button
                  onClick={() => removeProgramCard(prog.id)}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  title="Delete Program"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={prog.desc}
                onChange={(e) => {
                  const updated = [...form.programs];
                  updated[idx] = { ...prog, desc: e.target.value };
                  setForm({ ...form, programs: updated });
                }}
                className="w-full px-2.5 py-1.5 rounded border border-[#d6e0da] bg-white"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 text-xs">
          <input
            value={newProgTitle}
            onChange={(e) => setNewProgTitle(e.target.value)}
            placeholder="New Program Title (e.g. Hifz-ul-Quran)"
            className="px-3 py-2 rounded-lg border border-[#d6e0da]"
          />
          <input
            value={newProgDesc}
            onChange={(e) => setNewProgDesc(e.target.value)}
            placeholder="Program Description..."
            className="flex-1 px-3 py-2 rounded-lg border border-[#d6e0da]"
          />
          <button
            onClick={addProgramCard}
            className="px-4 py-2 rounded-lg bg-[#144734] text-white font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Program
          </button>
        </div>
      </div>

      {/* 5. Education Features Cards */}
      <div className="bg-white rounded-2xl border border-[#dee6e1] p-5 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#11261d] flex items-center gap-2 border-b border-[#edf2ee] pb-3">
          <Sparkles className="w-5 h-5 text-[#144734]" />
          5. "Why Choose Us / Education Features" Cards (Edit / Add / Delete)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {form.features.map((feat, idx) => (
            <div key={feat.id} className="p-3.5 rounded-xl border border-[#d6e0da] bg-[#f9fbf9] space-y-2">
              <div className="flex items-center justify-between">
                <input
                  value={feat.title}
                  onChange={(e) => {
                    const updated = [...form.features];
                    updated[idx] = { ...feat, title: e.target.value };
                    setForm({ ...form, features: updated });
                  }}
                  className="font-extrabold text-sm text-[#11261d] px-2 py-1 rounded border border-[#d6e0da] bg-white"
                />
                <button
                  onClick={() => removeFeatureCard(feat.id)}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  title="Delete Feature"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={feat.desc}
                onChange={(e) => {
                  const updated = [...form.features];
                  updated[idx] = { ...feat, desc: e.target.value };
                  setForm({ ...form, features: updated });
                }}
                className="w-full px-2.5 py-1.5 rounded border border-[#d6e0da] bg-white"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 text-xs">
          <input
            value={newFeatTitle}
            onChange={(e) => setNewFeatTitle(e.target.value)}
            placeholder="New Feature Title (e.g. Digital Smart Classes)"
            className="px-3 py-2 rounded-lg border border-[#d6e0da]"
          />
          <input
            value={newFeatDesc}
            onChange={(e) => setNewFeatDesc(e.target.value)}
            placeholder="Feature Description..."
            className="flex-1 px-3 py-2 rounded-lg border border-[#d6e0da]"
          />
          <button
            onClick={addFeatureCard}
            className="px-4 py-2 rounded-lg bg-[#144734] text-white font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Feature
          </button>
        </div>
      </div>

      {/* 6. Master Database Management */}
      <div className="bg-white rounded-2xl border border-[#dee6e1] p-5 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#11261d] flex items-center gap-2 border-b border-[#edf2ee] pb-3">
          <Database className="w-5 h-5 text-[#144734]" />
          6. Master Database & Portal Records Control
        </h2>
        <p className="text-xs text-[#61786e]">
          As Super Admin, you have full control over all portal collections. You can clear specific sections or restore default portal settings anytime.
        </p>

        <div className="flex flex-wrap gap-2.5 text-xs">
          <button
            onClick={() =>
              onUpdateState((prev) => ({ ...prev, logs: [] }), 'Cleared Activity Logs', 'All logs')
            }
            className="px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 cursor-pointer"
          >
            Clear Activity Logs ({state.logs.length})
          </button>
          <button
            onClick={() =>
              onUpdateState((prev) => ({ ...prev, feed: [] }), 'Cleared All Feed Posts', 'Feed')
            }
            className="px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 cursor-pointer"
          >
            Clear Feed Posts ({state.feed.length})
          </button>
          <button
            onClick={() => {
              setForm(INITIAL_PORTAL_STATE.madarsaSettings);
              onUpdateState(
                (prev) => ({
                  ...prev,
                  madarsaSettings: INITIAL_PORTAL_STATE.madarsaSettings,
                }),
                'Restored Default Website Settings',
                'Madarsa Gausiya Razviya'
              );
            }}
            className="px-3.5 py-2 rounded-lg border border-[#d6e0da] bg-[#f4f7f5] text-[#2d4239] font-bold hover:bg-[#e6ece8] flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore Default Website Text
          </button>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] hover:opacity-95 text-white text-sm font-extrabold flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save All Madarsa Settings to Database
        </button>
      </div>
    </div>
  );
};
