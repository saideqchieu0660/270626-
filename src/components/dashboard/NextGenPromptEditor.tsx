import React, { useState, useEffect } from "react";
import { Save, Settings, ShieldAlert, Cpu } from "lucide-react";
import { nextGenPromptManager } from "../../services/next_gen/promptManager";

export function NextGenPromptEditor({ adminKey }: { adminKey: string }) {
  const [ingestionPrompt, setIngestionPrompt] = useState("");
  const [safetyDictionary, setSafetyDictionary] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // We already fetch in constructor, but wait a moment to ensure it's loaded
    const load = () => {
      setIngestionPrompt(nextGenPromptManager.getIngestionPrompt());
      setSafetyDictionary(nextGenPromptManager.getSafetyDictionary());
    };
    
    // Simple load logic
    load();
    // Fetch directly from DB to get freshest
    nextGenPromptManager.fetchFromDatabase().then(() => {
      load();
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await nextGenPromptManager.saveToDatabase({
      ingestionPrompt,
      safetyDictionary
    }, adminKey);
    setIsSaving(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 mt-6">
      <div className="flex items-center justify-between mb-6 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="font-bold text-xl font-display flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" /> Quản Lý Hệ Thống Câu Lệnh AI (Dynamic Prompt Control)
          </h3>
          <p className="text-zinc-500 text-sm mt-1">Cấu hình prompt và bộ lọc từ ngữ cho Unified Ingestion Engine V2.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? <span className="animate-pulse">Đang đồng bộ...</span> : <><Save className="w-4 h-4" /> Đồng bộ Hệ thống (Save & Sync)</>}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 font-bold text-zinc-700 mb-2">
            <Cpu className="w-4 h-4 text-zinc-400" /> Flashcard Ingestion System Prompt
          </label>
          <textarea
            value={ingestionPrompt}
            onChange={(e) => setIngestionPrompt(e.target.value)}
            className="w-full h-40 p-4 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Nhập prompt xử lý flashcard..."
          />
          <p className="text-xs text-zinc-500 mt-2 font-mono">Lưu ý: Đoạn text gốc sẽ được nối tự động vào cuối (Text: [Nội dung]).</p>
        </div>

        <div>
          <label className="flex items-center gap-2 font-bold text-zinc-700 mb-2">
            <ShieldAlert className="w-4 h-4 text-red-400" /> Safety & Profanity Interceptor Dictionary
          </label>
          <textarea
            value={safetyDictionary}
            onChange={(e) => setSafetyDictionary(e.target.value)}
            className="w-full h-40 p-4 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
            placeholder="Nhập danh sách từ cấm (mỗi từ một dòng)..."
          />
          <p className="text-xs text-zinc-500 mt-2 font-mono">Mỗi từ cấm nằm trên một dòng. Viết hoa/thường không phân biệt.</p>
        </div>
      </div>
    </div>
  );
}
