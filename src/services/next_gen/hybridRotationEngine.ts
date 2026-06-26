export type KeyStatus = {
  provider: 'cerebras' | 'gemini';
  index: number;
  key: string;
  maskedKey: string;
  status: 'READY' | 'COOLING_DOWN' | 'ISOLATED';
  usageCount: number;
};

class HybridRotationEngine {
  private keys: KeyStatus[] = [];
  public enableCerebras: boolean = true;
  public enableGemini: boolean = true;
  private currentCerebrasIndex: number = 0;
  private currentGeminiIndex: number = 0;

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys() {
    // Collect Cerebras keys
    for (let i = 1; i <= 20; i++) {
      const key = import.meta.env[`VITE_CEREBRAS_KEY_${i}`];
      if (key) {
        this.keys.push({
          provider: 'cerebras',
          index: i,
          key,
          maskedKey: this.maskKey(key),
          status: 'READY',
          usageCount: 0
        });
      }
    }

    // Collect Gemini keys
    for (let i = 1; i <= 20; i++) {
      const key = import.meta.env[`VITE_GEMINI_API_KEY_${i}`];
      if (key) {
        this.keys.push({
          provider: 'gemini',
          index: i,
          key,
          maskedKey: this.maskKey(key),
          status: 'READY',
          usageCount: 0
        });
      }
    }
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return "***";
    return `${key.slice(0, 4)}***${key.slice(-4)}`;
  }

  public getKeysStatus(): KeyStatus[] {
    return this.keys;
  }

  public setToggles(cerebras: boolean, gemini: boolean) {
    this.enableCerebras = cerebras;
    this.enableGemini = gemini;
  }

  public async verifyHandshake(provider: 'cerebras' | 'gemini'): Promise<boolean> {
    const providerKeys = this.keys.filter(k => k.provider === provider && k.status !== 'ISOLATED');
    if (providerKeys.length === 0) return false;

    const testKey = providerKeys[0];
    
    try {
      if (provider === 'cerebras') {
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${testKey.key}`
          },
          body: JSON.stringify({
            model: "llama3.1-8b",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1
          })
        });
        if (!res.ok) {
          this.isolateKey(testKey.key);
          return false;
        }
        return true;
      } else {
        // Gemini
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${testKey.key}`
          },
          body: JSON.stringify({
            model: "gemini-1.5-flash",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1
          })
        });
        if (!res.ok) {
          this.isolateKey(testKey.key);
          return false;
        }
        return true;
      }
    } catch (e) {
      this.isolateKey(testKey.key);
      return false;
    }
  }

  public getAvailableKey(): KeyStatus | null {
    const candidates = this.keys.filter(k => {
      if (k.status !== 'READY') return false;
      if (k.provider === 'cerebras' && !this.enableCerebras) return false;
      if (k.provider === 'gemini' && !this.enableGemini) return false;
      return true;
    });

    if (candidates.length === 0) return null;

    // Simple round robin logic
    // Try Cerebras first if enabled
    if (this.enableCerebras) {
      const cerebrasCandidates = candidates.filter(k => k.provider === 'cerebras');
      if (cerebrasCandidates.length > 0) {
        this.currentCerebrasIndex = (this.currentCerebrasIndex + 1) % cerebrasCandidates.length;
        return cerebrasCandidates[this.currentCerebrasIndex];
      }
    }

    if (this.enableGemini) {
      const geminiCandidates = candidates.filter(k => k.provider === 'gemini');
      if (geminiCandidates.length > 0) {
        this.currentGeminiIndex = (this.currentGeminiIndex + 1) % geminiCandidates.length;
        return geminiCandidates[this.currentGeminiIndex];
      }
    }

    return candidates[0]; // fallback
  }

  public markKeyUsed(keyString: string) {
    const key = this.keys.find(k => k.key === keyString);
    if (key) {
      key.usageCount++;
      key.status = 'COOLING_DOWN';
      
      // Cooldown timer (we manage this outside as well, but visual cooldown is useful)
      setTimeout(() => {
        if (key.status === 'COOLING_DOWN') {
          key.status = 'READY';
        }
      }, 12000);
    }
  }

  public isolateKey(keyString: string) {
    const key = this.keys.find(k => k.key === keyString);
    if (key) {
      key.status = 'ISOLATED';
      
      // Attempt recovery after 60s
      setTimeout(() => {
        if (key.status === 'ISOLATED') {
          key.status = 'READY';
        }
      }, 60000);
    }
  }
  
  public reportError(keyString: string, status: number) {
    if (status === 429 || status === 401 || status === 403 || status === 402 || status === 503) {
      this.isolateKey(keyString);
    }
  }
}

export const nextGenRotationEngine = new HybridRotationEngine();
