import React, { useState, useEffect } from "react";
import { User, Building2, Save, Loader2, Sparkles } from "lucide-react";
import {
  FIELD_LIMITS,
  PROFILE_BUSINESS,
  PROFILE_PERSONAL,
  ProfileCategory,
  ProfileFormData,
  ValidationErrors,
  getUtf8ByteLength,
  validateProfileForm,
} from "../utils/validation";
import { ProfileCard } from "./ProfileCard";

interface ProfileFormProps {
  initialData?: ProfileFormData;
  walletAddress?: string | null;
  isEditMode?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  onCancel?: () => void;
}

const DEFAULT_FORM: ProfileFormData = {
  name: "",
  headline: "",
  bio: "",
  email: "",
  website: "",
  socialHandle: "",
  location: "",
  profileType: PROFILE_PERSONAL,
};

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  walletAddress,
  isEditMode = false,
  isSubmitting = false,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<ProfileFormData>(initialData || DEFAULT_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const isBusiness = form.profileType === PROFILE_BUSINESS;

  const handleFieldChange = (
    field: keyof ProfileFormData,
    value: string | ProfileCategory
  ) => {
    const updated = { ...form, [field]: value } as ProfileFormData;
    setForm(updated);
    if (touched) {
      setErrors(validateProfileForm(updated).errors);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const result = validateProfileForm(form);
    setErrors(result.errors);
    if (!result.valid) return;
    await onSubmit(form);
  };

  const renderCharCounter = (value: string, max: number) => {
    const len = getUtf8ByteLength(value);
    const over = len > max;
    return (
      <span
        className={`text-[11px] font-mono ${
          over ? "text-rose-400 font-semibold" : "text-slate-400"
        }`}
      >
        {len}/{max}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form */}
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/90 space-y-6"
      >
        {/* Profile Category Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
            Select Profile Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleFieldChange("profileType", PROFILE_PERSONAL)}
              className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                form.profileType === PROFILE_PERSONAL
                  ? "bg-violet-600/20 border-violet-500 text-white shadow-glow"
                  : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl ${
                  form.profileType === PROFILE_PERSONAL
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Personal Card</div>
                <div className="text-xs text-slate-400">Individual identity &amp; bio</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFieldChange("profileType", PROFILE_BUSINESS)}
              className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                form.profileType === PROFILE_BUSINESS
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-glow-blue"
                  : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl ${
                  form.profileType === PROFILE_BUSINESS
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Business Card</div>
                <div className="text-xs text-slate-400">Company, DAO, or brand</div>
              </div>
            </button>
          </div>
        </div>

        {/* Name / Business Name */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="botcard-name"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              {isBusiness ? "Business Name *" : "Full Name *"}
            </label>
            {renderCharCounter(form.name, FIELD_LIMITS.name)}
          </div>
          <input
            id="botcard-name"
            type="text"
            value={form.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            placeholder={
              isBusiness ? "e.g., Nexus Protocol Labs" : "e.g., Elena Rostova"
            }
            className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:outline-none text-sm text-white placeholder-slate-500"
          />
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
        </div>

        {/* Headline / Business Category */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="botcard-headline"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              {isBusiness ? "Business Category / Headline" : "Professional Headline"}
            </label>
            {renderCharCounter(form.headline, FIELD_LIMITS.headline)}
          </div>
          <input
            id="botcard-headline"
            type="text"
            value={form.headline}
            onChange={(e) => handleFieldChange("headline", e.target.value)}
            placeholder={
              isBusiness
                ? "e.g., Decentralized Infrastructure & Smart Contract Auditing"
                : "e.g., Senior Solidity Engineer & DeFi Researcher"
            }
            className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:outline-none text-sm text-white placeholder-slate-500"
          />
          {errors.headline && (
            <p className="text-xs text-rose-400 mt-1">{errors.headline}</p>
          )}
        </div>

        {/* Biography / Business Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="botcard-bio"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              {isBusiness ? "Business Description" : "Short Biography"}
            </label>
            {renderCharCounter(form.bio, FIELD_LIMITS.bio)}
          </div>
          <textarea
            id="botcard-bio"
            rows={4}
            value={form.bio}
            onChange={(e) => handleFieldChange("bio", e.target.value)}
            placeholder={
              isBusiness
                ? "Describe your products, mission, and services on Botchain..."
                : "Share a concise summary of your background, skills, and Web3 focus..."
            }
            className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:outline-none text-sm text-white placeholder-slate-500 resize-y"
          />
          {errors.bio && <p className="text-xs text-rose-400 mt-1">{errors.bio}</p>}
        </div>

        {/* Email & Website */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="botcard-email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                {isBusiness ? "Business Email" : "Email"}
              </label>
              {renderCharCounter(form.email, FIELD_LIMITS.email)}
            </div>
            <input
              id="botcard-email"
              type="email"
              value={form.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              placeholder={isBusiness ? "contact@company.io" : "you@domain.com"}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:outline-none text-sm text-white placeholder-slate-500"
            />
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="botcard-website"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                {isBusiness ? "Business Website" : "Website"}
              </label>
              {renderCharCounter(form.website, FIELD_LIMITS.website)}
            </div>
            <input
              id="botcard-website"
              type="url"
              value={form.website}
              onChange={(e) => handleFieldChange("website", e.target.value)}
              placeholder="https://yourwebsite.io"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:outline-none text-sm text-white placeholder-slate-500"
            />
            {errors.website && (
              <p className="text-xs text-rose-400 mt-1">{errors.website}</p>
            )}
          </div>
        </div>

        {/* Social Handle & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="botcard-social"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Social Handle
              </label>
              {renderCharCounter(form.socialHandle, FIELD_LIMITS.socialHandle)}
            </div>
            <input
              id="botcard-social"
              type="text"
              value={form.socialHandle}
              onChange={(e) => handleFieldChange("socialHandle", e.target.value)}
              placeholder="@handle or https://x.com/handle"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:outline-none text-sm text-white placeholder-slate-500"
            />
            {errors.socialHandle && (
              <p className="text-xs text-rose-400 mt-1">{errors.socialHandle}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="botcard-location"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                {isBusiness ? "Business Location" : "Location"}
              </label>
              {renderCharCounter(form.location, FIELD_LIMITS.location)}
            </div>
            <input
              id="botcard-location"
              type="text"
              value={form.location}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              placeholder="e.g., Singapore / Remote"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:outline-none text-sm text-white placeholder-slate-500"
            />
            {errors.location && (
              <p className="text-xs text-rose-400 mt-1">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Submit & Cancel */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for Blockchain Confirmation...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditMode ? "Update Profile On-Chain" : "Save Profile"}</span>
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Right Column: Live Card Preview */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live On-Chain Card Preview</span>
          </span>
          <span className="text-xs text-slate-400">
            {isBusiness ? "Category: Business (1)" : "Category: Personal (0)"}
          </span>
        </div>

        <ProfileCard
          profile={{
            ...form,
            exists: isEditMode,
            walletAddress: walletAddress || undefined,
          }}
          walletAddress={walletAddress || undefined}
          isPreview={true}
          isVerifiedOnChain={isEditMode}
        />
      </div>
    </div>
  );
};

