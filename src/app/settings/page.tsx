"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, CheckCircle, AlertTriangle } from "lucide-react";

function SettingsPage() {
  const [thresholds, setThresholds] = useState({ low: 0, medium: 100, high: 250, veryHigh: 500 });
  const [geminiConfig, setGeminiConfig] = useState({ configured: false, message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setThresholds(data.competitionThresholds);
        setGeminiConfig(data.gemini);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  async function handleSaveThresholds() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionThresholds: thresholds }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-20 lg:pb-6 max-w-3xl mx-auto">
      <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Settings</h1>

      <div className="space-y-4 sm:space-y-6">
        {/* Gemini Settings */}
        <section className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4 pb-2 border-b border-gray-100">Gemini Configuration</h2>
          <div className="flex items-start gap-3">
            {geminiConfig.configured ? (
              <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
            ) : (
              <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
            )}
            <div className="min-w-0">
              <p className="font-medium text-gray-900">
                {geminiConfig.configured ? "Connected" : "Not configured"}
              </p>
              <p className="text-sm text-gray-500 mt-1">{geminiConfig.message}</p>
              {!geminiConfig.configured && (
                <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700">
                  <p className="mb-2">To enable AI summarization, configure the Gemini API key in your server environment.</p>
                  <ol className="list-decimal pl-4 space-y-1 text-xs">
                    <li>Get an API key from Google AI Studio</li>
                    <li>Open <code className="bg-white px-1 rounded border border-gray-200">.env</code> in the project root</li>
                    <li>Add <code className="bg-white px-1 rounded border border-gray-200">GEMINI_API_KEY=your_key_here</code></li>
                    <li>Restart the server</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Competition Thresholds */}
        <section className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4 pb-2 border-b border-gray-100">Competition Thresholds</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            These thresholds determine how the competition level is calculated based on application count.
            Updating these will recalculate all existing problem statements.
          </p>

          <div className="space-y-3">
            {[
              { key: "low", label: "Low" },
              { key: "medium", label: "Medium" },
              { key: "high", label: "High" },
              { key: "veryHigh", label: "Very High" },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-sm font-medium text-gray-700 w-full sm:w-[80px] flex-shrink-0">{label}</label>
                <input
                  type="number"
                  value={thresholds[key as keyof typeof thresholds]}
                  onChange={(e) => setThresholds({ ...thresholds, [key]: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            ))}

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm">
                {saveStatus === "success" && <span className="text-green-600">Saved successfully!</span>}
                {saveStatus === "error" && <span className="text-red-600">Failed to save.</span>}
              </div>
              <button
                onClick={handleSaveThresholds}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2 min-h-0"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Thresholds
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;