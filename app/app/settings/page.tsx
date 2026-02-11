"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, CreditCard, Users, Palette, Globe, Save, Loader2, Check } from "lucide-react";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        bio: "",
    });

    const [settings, setSettings] = useState({
        notifications: {
            agentCompletions: true,
            teamUpdates: true,
            weeklyReports: false,
            marketingEmails: false,
        },
        theme: "system" as "light" | "dark" | "system",
        accentColor: "blue",
        security: {
            twoFactor: true,
            sessionTimeout: false,
        },
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                const data = await res.json();
                if (data.profile) {
                    setProfile({
                        firstName: data.profile.firstName || "",
                        lastName: data.profile.lastName || "",
                        email: data.profile.email || "",
                        bio: data.settings?.bio || "",
                    });
                }
                if (data.settings) {
                    setSettings((prev) => ({
                        ...prev,
                        ...data.settings,
                        notifications: { ...prev.notifications, ...data.settings.notifications },
                        security: { ...prev.security, ...data.settings.security },
                    }));
                }
            } catch (err) {
                console.error("Failed to load settings:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveStatus("idle");
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    profile,
                    settings: { ...settings, bio: profile.bio }
                }),
            });
            if (res.ok) {
                setSaveStatus("success");
                setTimeout(() => setSaveStatus("idle"), 3000);
            } else {
                setSaveStatus("error");
            }
        } catch (err) {
            console.error("Error saving settings:", err);
            setSaveStatus("error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Settings
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage your account and application preferences
                    </p>
                </div>

                {/* Settings Sections */}
                <div className="space-y-6">
                    {/* Profile */}
                    <SettingsSection
                        icon={<User className="h-5 w-5" />}
                        title="Profile"
                        description="Update your personal information"
                    >
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <InputField
                                    label="First Name"
                                    placeholder="John"
                                    value={profile.firstName}
                                    onChange={(val) => setProfile({ ...profile, firstName: val })}
                                />
                                <InputField
                                    label="Last Name"
                                    placeholder="Doe"
                                    value={profile.lastName}
                                    onChange={(val) => setProfile({ ...profile, lastName: val })}
                                />
                            </div>
                            <InputField
                                label="Email"
                                type="email"
                                placeholder="john@example.com"
                                value={profile.email}
                                disabled
                                onChange={() => { }}
                            />
                            <InputField
                                label="Bio"
                                type="textarea"
                                placeholder="Tell us about yourself..."
                                value={profile.bio}
                                onChange={(val) => setProfile({ ...profile, bio: val })}
                            />
                        </div>
                    </SettingsSection>

                    {/* Notifications */}
                    <SettingsSection
                        icon={<Bell className="h-5 w-5" />}
                        title="Notifications"
                        description="Configure how you receive updates"
                    >
                        <div className="space-y-3">
                            <ToggleOption
                                label="Agent Completions"
                                description="Get notified when agents complete tasks"
                                checked={settings.notifications.agentCompletions}
                                onChange={(val) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, agentCompletions: val }
                                })}
                            />
                            <ToggleOption
                                label="Team Updates"
                                description="Receive updates about your team's activity"
                                checked={settings.notifications.teamUpdates}
                                onChange={(val) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, teamUpdates: val }
                                })}
                            />
                            <ToggleOption
                                label="Weekly Reports"
                                description="Get weekly performance summaries"
                                checked={settings.notifications.weeklyReports}
                                onChange={(val) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, weeklyReports: val }
                                })}
                            />
                            <ToggleOption
                                label="Marketing Emails"
                                description="Receive product updates and tips"
                                checked={settings.notifications.marketingEmails}
                                onChange={(val) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, marketingEmails: val }
                                })}
                            />
                        </div>
                    </SettingsSection>

                    {/* Appearance */}
                    <SettingsSection
                        icon={<Palette className="h-5 w-5" />}
                        title="Appearance"
                        description="Customize the look and feel"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                    Theme
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <ThemeOption
                                        label="Light"
                                        active={settings.theme === "light"}
                                        onClick={() => setSettings({ ...settings, theme: "light" })}
                                    />
                                    <ThemeOption
                                        label="Dark"
                                        active={settings.theme === "dark"}
                                        onClick={() => setSettings({ ...settings, theme: "dark" })}
                                    />
                                    <ThemeOption
                                        label="System"
                                        active={settings.theme === "system"}
                                        onClick={() => setSettings({ ...settings, theme: "system" })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                    Accent Color
                                </label>
                                <div className="flex gap-2">
                                    {["blue", "purple", "pink", "green", "orange"].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSettings({ ...settings, accentColor: color })}
                                            className={`h-8 w-8 rounded-lg bg-${color}-500 hover:scale-110 transition-transform flex items-center justify-center`}
                                        >
                                            {settings.accentColor === color && <Check className="h-4 w-4 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SettingsSection>

                    {/* Security */}
                    <SettingsSection
                        icon={<Shield className="h-5 w-5" />}
                        title="Security"
                        description="Manage your security preferences"
                    >
                        <div className="space-y-3">
                            <ToggleOption
                                label="Two-Factor Authentication"
                                description="Add an extra layer of security"
                                checked={settings.security.twoFactor}
                                onChange={(val) => setSettings({
                                    ...settings,
                                    security: { ...settings.security, twoFactor: val }
                                })}
                            />
                            <ToggleOption
                                label="Session Timeout"
                                description="Automatically log out after inactivity"
                                checked={settings.security.sessionTimeout}
                                onChange={(val) => setSettings({
                                    ...settings,
                                    security: { ...settings.security, sessionTimeout: val }
                                })}
                            />
                        </div>
                    </SettingsSection>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                    {saveStatus === "success" && (
                        <span className="text-sm text-green-500 font-medium animate-in fade-in slide-in-from-right-2">
                            Settings saved successfully!
                        </span>
                    )}
                    {saveStatus === "error" && (
                        <span className="text-sm text-red-500 font-medium">
                            Failed to save settings.
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SettingsSection({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-start gap-3 mb-6">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

function InputField({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    disabled = false
}: {
    label: string;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                {label}
            </label>
            {type === "textarea" ? (
                <textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                    disabled={disabled}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none disabled:opacity-50"
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                />
            )}
        </div>
    );
}

function ToggleOption({
    label,
    description,
    checked,
    onChange
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
        </div>
    );
}

function ThemeOption({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${active
                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-500"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
        >
            {label}
        </button>
    );
}
