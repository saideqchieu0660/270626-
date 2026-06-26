const fs = require('fs');

const code = fs.readFileSync('src/pages/ApiHealthMonitor.tsx', 'utf8');

const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('Gemini API Keys Section'));
const endIdx = lines.findIndex(l => l.includes('if (activeTab === "logs")'));

const newGrid = `
          {/* UNIFIED KEY GRID */}
          <div className="space-y-4">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h3 className="text-xl font-bold font-display text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Cpu className="w-5 h-5 animate-pulse" />
                Unified Hybrid Rotation Pool (Live & Mock Blended)
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-mono">
                  {keys.length + groqKeys.length + openRouterKeys.length + mockKeys.length} total keys
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                A massive load-balanced pool containing real operational keys and simulated ghost keys.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
                 ...keys.map(k => ({ ...k, providerLabel: "Google Cloud Studio Key" })),
                 ...groqKeys.map(k => ({ ...k, providerLabel: "Cerebras Premium Key" })),
                 ...openRouterKeys.map(k => ({ ...k, providerLabel: "OpenRouter Multi-Key" })),
                 ...deepInfraKeys.map(k => ({ ...k, providerLabel: "DeepInfra Backup Key" })),
                 ...mockKeys
              ].sort((a, b) => ((a.index * 13) % 100) - ((b.index * 13) % 100)).map((k) => {
                 let ringColor = "border-zinc-200 dark:border-zinc-800";
                 if (k.providerLabel === "Cerebras Premium Key" && k.index === currentGroqIndex) ringColor = "ring-2 ring-orange-500 border-orange-500";
                 if (k.providerLabel === "Google Cloud Studio Key" && k.index === currentIndex) ringColor = "ring-2 ring-blue-500 border-blue-500";
                 if (k.providerLabel === "OpenRouter Multi-Key" && k.index === currentOpenRouterIndex) ringColor = "ring-2 ring-emerald-500 border-emerald-500";
                 
                 const historyData = k.providerLabel === "Legacy API Key" 
                      ? (usageHistory[k.index] || Array(20).fill(0))
                      : k.providerLabel === "Cerebras Premium Key" ? (usageHistory[k.index + 200] || Array(20).fill(0))
                      : k.providerLabel === "OpenRouter Multi-Key" ? (usageHistory[k.index + 100] || Array(20).fill(0))
                      : (usageHistory[k.index] || Array(20).fill(0));

                 return (
                <div
                  key={k.index + k.providerLabel}
                  className={\`card-3d p-5 rounded-xl border flex flex-col gap-4 \${ringColor}\`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 rounded-md line-clamp-1 max-w-[140px]" title={k.providerLabel}>
                      {k.providerLabel} #{k.index}
                    </span>
                    <div className="flex items-center gap-2">
                      <D3Sparkline
                        data={historyData}
                        color={
                          k.status === "rate_limited"
                            ? "#f59e0b"
                            : k.status === "failed"
                              ? "#ef4444"
                              : k.status === "exhausted"
                                ? "#71717a"
                                : "#3b82f6"
                        }
                      />
                      {k.status === "active" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                      {k.status === "rate_limited" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                          LIMIT
                        </span>
                      )}
                      {k.status === "failed" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                          FAIL
                        </span>
                      )}
                      {(k.status === "HARD_LOCKED" || k.is_banned) && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-200 dark:bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/50">
                          BANNED
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 uppercase tracking-wider">
                      Masked Key
                    </div>
                    <div className="font-mono text-sm truncate">{k.maskedKey}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-auto border-t border-zinc-200 dark:border-zinc-800 pt-3">
                    <div>
                      <div className="text-zinc-500 text-xs">
                        Usage Count
                      </div>
                      <div className="font-medium text-lg">
                        {k.usageCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs">
                        Error Count
                      </div>
                      <div className="font-medium text-red-500 text-lg">
                        {k.errorCount}
                      </div>
                    </div>
                  </div>

                  <div className="mt-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Est. Daily Quota
                      </span>
                      <span className="font-medium">
                        {k.status === "rate_limited" ||
                        k.status === "exhausted" ||
                        k.status === "HARD_LOCKED"
                          ? "100%"
                          : \`\${Math.min(Math.round((k.usageCount / 1500) * 100), 100)}%\`}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={\`h-full rounded-full transition-all duration-500 \${
                          k.status === "active"
                            ? "bg-blue-600 dark:bg-blue-500"
                            : k.status === "rate_limited"
                              ? "bg-orange-500 w-full"
                              : "bg-red-500 w-full"
                        }\`}
                        style={{
                          width:
                            k.status === "rate_limited" ||
                            k.status === "exhausted" ||
                            k.status === "HARD_LOCKED"
                              ? "100%"
                              : \`\${Math.min((k.usageCount / 1500) * 100, 100)}%\`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      );
    }
`;

lines.splice(startIdx, endIdx - startIdx, newGrid);

fs.writeFileSync('src/pages/ApiHealthMonitor.tsx', lines.join('\n'));
console.log("Done");
