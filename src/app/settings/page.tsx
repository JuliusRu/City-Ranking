"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  THEMES,
  DATE_FORMATS,
  CURRENCIES,
  DISTANCE_UNITS,
  TRIP_TYPES,
  BUDGET_LEVELS,
} from "@/config/constants";

const SORT_BY_OPTIONS = [
  { value: "createdAt", label: "Date Added" },
  { value: "startDate", label: "Start Date" },
  { value: "rating", label: "Rating" },
] as const;

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
] as const;

function Select({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[] | readonly string[];
  id: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const { user, mutate } = useUser();
  const { toast } = useToast();

  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Public profile form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [publicProfile, setPublicProfile] = useState(false);
  const [publicSaving, setPublicSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Settings form state
  const [theme, setTheme] = useState("dark");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [defaultSortBy, setDefaultSortBy] = useState("createdAt");
  const [defaultSortOrder, setDefaultSortOrder] = useState("desc");
  const [homeCurrency, setHomeCurrency] = useState("USD");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [defaultTripType, setDefaultTripType] = useState("");
  const [defaultBudget, setDefaultBudget] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Populate from user data
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setAvatarUrl(user.avatarUrl ?? null);
      setUsername(user.username ?? "");
      setBio(user.bio ?? "");
      setPublicProfile(user.publicProfile ?? false);
      if (user.settings) {
        setTheme(user.settings.theme);
        setDateFormat(user.settings.dateFormat);
        setDefaultSortBy(user.settings.defaultSortBy);
        setDefaultSortOrder(user.settings.defaultSortOrder);
        setHomeCurrency(user.settings.homeCurrency);
        setDistanceUnit(user.settings.distanceUnit);
        setDefaultTripType(user.settings.defaultTripType ?? "");
        setDefaultBudget(user.settings.defaultBudget ?? "");
      }
    }
  }, [user]);

  // Apply theme to <html> element
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }
  }, [theme]);

  async function handleProfileSave() {
    setProfileSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, avatarUrl }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Profile updated", "success");
        mutate();
      } else {
        toast(json.error ?? "Failed to update profile", "error");
      }
    } catch {
      toast("Failed to update profile", "error");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePublicSave() {
    setPublicSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          bio: bio.trim() || null,
          publicProfile,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Public profile saved", "success");
        mutate();
      } else {
        // Surface the first validation issue (e.g. reserved/format) or the
        // "username taken" 409 message.
        toast(json.issues?.[0]?.message ?? json.error ?? "Failed to save", "error");
      }
    } catch {
      toast("Failed to save public profile", "error");
    } finally {
      setPublicSaving(false);
    }
  }

  function handleCopyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSettingsSave() {
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          dateFormat,
          defaultSortBy,
          defaultSortOrder,
          homeCurrency,
          distanceUnit,
          defaultTripType: defaultTripType || null,
          defaultBudget: defaultBudget || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Preferences saved", "success");
        mutate();
      } else {
        toast(json.error ?? "Failed to save preferences", "error");
      }
    } catch {
      toast("Failed to save preferences", "error");
    } finally {
      setSettingsSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.ranking.place";
  const shareUrl = username ? `${origin}/@${username}` : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile section */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <div className="space-y-4">
          <ImageUpload
            value={avatarUrl}
            onChange={setAvatarUrl}
            folder="avatars"
            label="Profile picture"
            shape="circle"
          />
          <Input
            id="name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <div className="flex justify-end">
            <Button onClick={handleProfileSave} disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Public profile section */}
      <Card>
        <h2 className="mb-1 text-lg font-semibold">Public Profile</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Claim a handle and share your globe. While public, all your visited
          cities are visible to anyone with your link. Turn it off to take the
          page offline.
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-foreground"
            >
              Username
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">@</span>
              <input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                  )
                }
                placeholder="yourhandle"
                maxLength={20}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3–20 characters · lowercase letters, numbers, underscores
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-foreground"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A line about your travels"
              maxLength={280}
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-right text-xs text-muted-foreground">
              {bio.length}/280
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">
                Make profile public
              </p>
              <p className="text-xs text-muted-foreground">
                Anyone with your link can view your globe.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={publicProfile}
              aria-label="Make profile public"
              onClick={() => setPublicProfile((v) => !v)}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                publicProfile ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  publicProfile ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {shareUrl && publicProfile && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-accent/40 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-shrink-0 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handlePublicSave} disabled={publicSaving}>
              {publicSaving ? "Saving..." : "Save Public Profile"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Preferences section */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
        <div className="space-y-4">
          <Select
            id="theme"
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={THEMES}
          />
          <Select
            id="dateFormat"
            label="Date Format"
            value={dateFormat}
            onChange={setDateFormat}
            options={DATE_FORMATS}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="defaultSortBy"
              label="Default Sort By"
              value={defaultSortBy}
              onChange={setDefaultSortBy}
              options={SORT_BY_OPTIONS}
            />
            <Select
              id="defaultSortOrder"
              label="Sort Order"
              value={defaultSortOrder}
              onChange={setDefaultSortOrder}
              options={SORT_ORDER_OPTIONS}
            />
          </div>
          <Select
            id="homeCurrency"
            label="Home Currency"
            value={homeCurrency}
            onChange={setHomeCurrency}
            options={CURRENCIES}
          />
          <Select
            id="distanceUnit"
            label="Distance Unit"
            value={distanceUnit}
            onChange={setDistanceUnit}
            options={DISTANCE_UNITS}
          />
          <Select
            id="defaultTripType"
            label="Default Trip Type"
            value={defaultTripType}
            onChange={setDefaultTripType}
            options={[{ value: "", label: "None" }, ...TRIP_TYPES]}
          />
          <Select
            id="defaultBudget"
            label="Default Budget"
            value={defaultBudget}
            onChange={setDefaultBudget}
            options={[{ value: "", label: "None" }, ...BUDGET_LEVELS]}
          />
          <div className="flex justify-end">
            <Button onClick={handleSettingsSave} disabled={settingsSaving}>
              {settingsSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
