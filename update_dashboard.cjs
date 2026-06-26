const fs = require('fs');

let code = fs.readFileSync('src/pages/ApiHealthMonitor.tsx', 'utf8');

// Update Heading
code = code.replace(
  `Emergency API Circuit Breaker (Bộ ngắt mạch khẩn cấp)`,
  `Cấu hình Luồng API Dự phòng (API Provider Controls)`
);

// Update Google Gemini Switch
code = code.replace(
  `<Cpu className="w-4 h-4 text-blue-500" /> Google AI Studio Pool`,
  `<Cpu className="w-4 h-4 text-blue-500" /> Gemini Fallback Tier`
);
code = code.replace(
  `{geminiEnabled
                      ? "🟢 Đang hoạt động (Dịch thuật, bài tập, cốt lõi)"
                      : "🔴 Đã ngắt mạch (Các cuộc gọi bị chặn từ đầu)"}`,
  `{geminiEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`
);
code = code.replace(
  `<div className="text-[11px] text-zinc-500">
                    {geminiEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`,
  `<div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-1">
                    {geminiEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`
);

// Update Cerebras Switch
code = code.replace(
  `<Zap className="w-4 h-4 text-orange-500" /> Cerebras API
                    Pool`,
  `<Zap className="w-4 h-4 text-orange-500" /> Cerebras High-Speed Tier`
);
code = code.replace(
  `{groqEnabled
                      ? "🟢 Đang hoạt động (Llama3-70B Cực tốc, phản hồi tức thời)"
                      : "🔴 Đã ngắt mạch (Tạm ngắt, định hướng sang Gemini)"}`,
  `{groqEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`
);
code = code.replace(
  `<div className="text-[11px] text-zinc-500">
                    {groqEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`,
  `<div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-1">
                    {groqEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`
);

// Update OpenRouter Switch
code = code.replace(
  `<Server className="w-4 h-4 text-emerald-500" /> OpenRouter Edge Pool`,
  `<Server className="w-4 h-4 text-emerald-500" /> OpenRouter Backup Tier`
);
code = code.replace(
  `{openRouterEnabled
                      ? "🟢 Đang hoạt động (Trích xuất văn bản sơ cấp, ổn định)"
                      : "🔴 Đã ngắt mạch (Chặn tránh dính spam vòng ngoài)"}`,
  `{openRouterEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`
);
code = code.replace(
  `<div className="text-[11px] text-zinc-500">
                    {openRouterEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`,
  `<div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-1">
                    {openRouterEnabled
                      ? <><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span className="font-mono text-green-700 dark:text-green-400 font-bold">ACTIVE / READY</span></>
                      : <><span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span><span className="font-mono text-zinc-500 font-bold">DISABLED / ISOLATED</span></>}`
);

// Update Key rendering logic
code = code.replace(
  `                 ...keys.map(k => ({ ...k, providerLabel: "Google-Cloud-Studio-Node-B2" })),
                 ...groqKeys.map(k => ({ ...k, providerLabel: "Cerebras-Compute-Cluster-A1" })),
                 ...openRouterKeys.map(k => ({ ...k, providerLabel: "OpenRouter-Multi-Node-X" })),
                 ...deepInfraKeys.map(k => ({ ...k, providerLabel: "DeepInfra-Fallback-Node-Z" })),`,
  `                 ...keys.map((k, i) => ({ ...k, providerLabel: \`Google-Cloud-Studio-Node-B\${i+1}\` })),
                 ...groqKeys.map((k, i) => ({ ...k, providerLabel: \`Cerebras-Compute-Cluster-A\${i+1}\` })),
                 ...openRouterKeys.map((k, i) => ({ ...k, providerLabel: \`OpenRouter-Multi-Node-\${i+1}\` })),
                 ...deepInfraKeys.map((k, i) => ({ ...k, providerLabel: \`DeepInfra-Fallback-Node-\${i+1}\` })),`
);

// Update ringColor comparisons
code = code.replace(
  `                 if (k.providerLabel === "Cerebras-Compute-Cluster-A1" && k.index === currentGroqIndex) ringColor = "ring-2 ring-orange-500 border-orange-500";
                 if (k.providerLabel === "Google-Cloud-Studio-Node-B2" && k.index === currentIndex) ringColor = "ring-2 ring-blue-500 border-blue-500";
                 if (k.providerLabel === "OpenRouter-Multi-Node-X" && k.index === currentOpenRouterIndex) ringColor = "ring-2 ring-emerald-500 border-emerald-500";`,
  `                 if (k.providerLabel.startsWith("Cerebras") && k.index === currentGroqIndex) ringColor = "ring-2 ring-orange-500 border-orange-500";
                 if (k.providerLabel.startsWith("Google") && k.index === currentIndex) ringColor = "ring-2 ring-blue-500 border-blue-500";
                 if (k.providerLabel.startsWith("OpenRouter") && k.index === currentOpenRouterIndex) ringColor = "ring-2 ring-emerald-500 border-emerald-500";`
);

code = code.replace(
  `                 const historyData = k.providerLabel === "Ghost-Simulation-Node" 
                      ? (usageHistory[k.index] || Array(20).fill(0))
                      : k.providerLabel === "Cerebras-Compute-Cluster-A1" ? (usageHistory[k.index + 200] || Array(20).fill(0))
                      : k.providerLabel === "OpenRouter-Multi-Node-X" ? (usageHistory[k.index + 100] || Array(20).fill(0))
                      : (usageHistory[k.index] || Array(20).fill(0));

                 return (
                <div
                  key={k.index + k.providerLabel}
                  className={\`card-3d p-5 rounded-xl border flex flex-col gap-4 \${ringColor}\`}
                >`,
  `                 const historyData = k.providerLabel === "Ghost-Simulation-Node" 
                      ? (usageHistory[k.index] || Array(20).fill(0))
                      : k.providerLabel.startsWith("Cerebras") ? (usageHistory[k.index + 200] || Array(20).fill(0))
                      : k.providerLabel.startsWith("OpenRouter") ? (usageHistory[k.index + 100] || Array(20).fill(0))
                      : (usageHistory[k.index] || Array(20).fill(0));

                 const isProviderDisabled = (k.providerLabel.startsWith("Cerebras") && !groqEnabled) || (k.providerLabel.startsWith("Google") && !geminiEnabled) || (k.providerLabel.startsWith("OpenRouter") && !openRouterEnabled) || (k.providerLabel.startsWith("DeepInfra") && !deepInfraEnabled);
                 const cardOpacityClass = isProviderDisabled ? "opacity-50 grayscale" : "";

                 return (
                <div
                  key={k.index + k.providerLabel}
                  className={\`card-3d p-5 rounded-xl border flex flex-col gap-4 \${ringColor} \${cardOpacityClass}\`}
                >`
);

fs.writeFileSync('src/pages/ApiHealthMonitor.tsx', code);
