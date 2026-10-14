"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Link as LinkIcon, Sparkles, Check, X, RefreshCw, User } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { AVATAR_PRESETS, DEFAULT_AVATAR } from "@/lib/avatar-presets";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePictureModal({ isOpen, onClose }: ProfilePictureModalProps) {
  const { currentUser, actualUser, updateCurrentUserAvatar } = useUser();
  const [activeTab, setActiveTab] = useState<"preset" | "upload" | "url">("preset");
  const [previewAvatar, setPreviewAvatar] = useState<string>(currentUser.avatar || DEFAULT_AVATAR);
  const [customUrl, setCustomUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (PNG, JPG, WebP, GIF, SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 2MB limit. Please choose a smaller image.");
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPreviewAvatar(result);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) {
      setErrorMsg("Please enter an image URL.");
      return;
    }
    setErrorMsg("");
    setPreviewAvatar(customUrl.trim());
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const ok = await updateCurrentUserAvatar(previewAvatar);
      if (ok) {
        setSuccessMsg("Profile picture updated successfully!");
        setTimeout(() => {
          setSuccessMsg("");
          onClose();
        }, 1200);
      } else {
        setErrorMsg("Failed to update profile picture. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile picture");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    setPreviewAvatar(DEFAULT_AVATAR);
    setCustomUrl("");
    setErrorMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Update Profile Picture</span>
                <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.2 rounded text-slate-400">
                  {actualUser.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose a mascot, upload a custom photo, or link any web image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <img
                src={previewAvatar}
                alt="Profile Preview"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/50 shadow-md bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{actualUser.name}</span>
                <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
                  {actualUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{actualUser.email}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {actualUser.title || actualUser.department}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset to Default Mascot"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Default</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 text-xs font-medium space-x-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("preset");
              setErrorMsg("");
            }}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "preset"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Presets</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              setErrorMsg("");
            }}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "upload"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload From Computer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("url");
              setErrorMsg("");
            }}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "url"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
        </div>

        {/* TAB 1: CURATED PRESETS */}
        {activeTab === "preset" && (
          <div className="space-y-3">
            <div className="text-[11px] text-slate-400">
              Click any mascot or professional portrait to select:
            </div>

            {/* Cat Mascots */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-1.5">
                ServiceMeow Cat Mascots 🐾
              </span>
              <div className="grid grid-cols-6 gap-2.5">
                {AVATAR_PRESETS.filter((p) => p.category === "cat").map((preset) => {
                  const isSelected = previewAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPreviewAvatar(preset.url)}
                      className={`relative rounded-xl p-1 border transition-all cursor-pointer group flex flex-col items-center ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40"
                          : "border-slate-800 hover:border-slate-600 bg-slate-900"
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-11 h-11 rounded-lg object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Professional Portraits */}
            <div className="pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold block mb-1.5">
                Professional Human Avatars 👤
              </span>
              <div className="grid grid-cols-6 gap-2.5">
                {AVATAR_PRESETS.filter((p) => p.category === "human").map((preset) => {
                  const isSelected = previewAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPreviewAvatar(preset.url)}
                      className={`relative rounded-xl p-1 border transition-all cursor-pointer group flex flex-col items-center ${
                        isSelected
                          ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/40"
                          : "border-slate-800 hover:border-slate-600 bg-slate-900"
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-11 h-11 rounded-lg object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD FROM COMPUTER */}
        {activeTab === "upload" && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-white">Click to upload an image from your device</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PNG, JPG, WebP, GIF, SVG (up to 2MB).
              </p>
              <p className="text-[10px] text-emerald-400 mt-2 font-mono">
                Saved instantly into your user record!
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* TAB 3: IMAGE URL */}
        {activeTab === "url" && (
          <div className="space-y-3 text-xs">
            <label className="block text-slate-300 font-medium">Direct Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Preview
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              You can link any image from GitHub, Slack, Unsplash, or your corporate CDN.
            </p>
          </div>
        )}

        {/* Messages */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3.5 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Changes apply across the entire platform in real-time.
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile Picture</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
