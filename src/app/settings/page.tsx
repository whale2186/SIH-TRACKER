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
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Gemini Settings */}
        <section className="bg-white rounded border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Gemini Configuration</h2>
          <div className="flex items-start gap-3">
            {geminiConfig.configured ? (
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
            ) : (
              <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {geminiConfig.configured ? "Connected" : "Not configured"}
              </p>
              <p className="text-sm text-gray-500 mt-1">{geminiConfig.message}</p>
              {!geminiConfig.configured && (
                <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700">
                  <p className="mb-2">To enable AI summarization, you must configure the Gemini API key in your server environment.</p>
                  <ol className="list-decimal pl-4 space-y-1">
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
        <section className="bg-white rounded border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Competition Thresholds</h2>
          <p className="text-sm text-gray-500 mb-4">
            These thresholds determine how the competition level is calculated based on application count.
            Updating these will recalculate all existing problem statements.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Low</label>
              <input
                type="number"
                value={thresholds.low}
                onChange={(e) => setThresholds({ ...thresholds, low: parseInt(e.target.value) || 0 })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 max-w-[150px]"
              />
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Medium</label>
              <input
                type="number"
                value={thresholds.medium}
                onChange={(e) => setThresholds({ ...thresholds, medium: parseInt(e.target.value) || 0 })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 max-w-[150px]"
              />
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-gray-700">High</label>
              <input
                type="number"
                value={thresholds.high}
                onChange={(e) => setThresholds({ ...thresholds, high: parseInt(e.target.value) || 0 })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 max-w-[150px]"
              />
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Very High</label>
              <input
                type="number"
                value={thresholds.veryHigh}
                onChange={(e) => setThresholds({ ...thresholds, veryHigh: parseInt(e.target.value) || 0 })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 max-w-[150px]"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm">
                {saveStatus === "success" && <span className="text-green-600">Saved successfully!</span>}
                {saveStatus === "error" && <span className="text-red-600">Failed to save.</span>}
              </div>
              <button
                onClick={handleSaveThresholds}
                disabled={saving}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
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