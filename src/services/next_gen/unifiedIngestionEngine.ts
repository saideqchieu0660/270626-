import { nextGenRotationEngine, KeyStatus } from "./hybridRotationEngine";
import { toast } from "sonner";

const SAFETY_PATTERNS = [
  /ignore all previous instructions/i,
  /system override/i,
  /forget your previous prompts/i,
  /bypass safety/i,
  /you are now a/i,
  /act as a/i,
  /\bfuck\b/i,
  /\bshit\b/i,
  /\bbitch\b/i,
  /\basshole\b/i,
  /\bđụ\b/i,
  /\bđịt\b/i,
  /\blồn\b/i,
  /\bcặc\b/i,
  /\bchó đẻ\b/i
];

function checkContentSafety(text: string): boolean {
  for (const pattern of SAFETY_PATTERNS) {
    if (pattern.test(text)) {
      return false;
    }
  }
  return true;
}

export interface IngestionChunk {
  id: string;
  text: string;
  retryCount: number;
}

export interface IngestedCard {
  front: string;
  back: string;
  ipa?: string;
  example?: string;
}

export interface IngestionState {
  pendingChunks: IngestionChunk[];
  processedCards: IngestedCard[];
  failedChunks: IngestionChunk[];
}

export type IngestionEventCallback = (state: IngestionState, currentProcessing: number) => void;

class UnifiedIngestionEngine {
  private queue: IngestionChunk[] = [];
  private activeThreads: number = 0;
  private readonly MAX_CONCURRENCY = 1; // Strict cap of 1
  private processedCards: IngestedCard[] = [];
  private failedChunks: IngestionChunk[] = [];
  
  private isRunning: boolean = false;
  private onStateChange: IngestionEventCallback | null = null;
  private nextAllowedDispatchTime: number = 0;

  constructor() {
    this.loadCheckpoint();
  }

  public setOnStateChange(callback: IngestionEventCallback) {
    this.onStateChange = callback;
  }

  private notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        pendingChunks: [...this.queue],
        processedCards: [...this.processedCards],
        failedChunks: [...this.failedChunks]
      }, this.activeThreads);
    }
    this.saveCheckpoint();
  }

  private saveCheckpoint() {
    const state = {
      queue: this.queue,
      processedCards: this.processedCards,
      failedChunks: this.failedChunks
    };
    try {
      localStorage.setItem("nextgen_ingestion_checkpoint", JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save ingestion checkpoint", e);
    }
  }

  private loadCheckpoint() {
    try {
      const saved = localStorage.getItem("nextgen_ingestion_checkpoint");
      if (saved) {
        const state = JSON.parse(saved);
        this.queue = state.queue || [];
        this.processedCards = state.processedCards || [];
        this.failedChunks = state.failedChunks || [];
      }
    } catch (e) {
      console.warn("Failed to load ingestion checkpoint", e);
    }
  }

  public clearCheckpoint() {
    this.queue = [];
    this.processedCards = [];
    this.failedChunks = [];
    localStorage.removeItem("nextgen_ingestion_checkpoint");
    this.notifyState();
  }

  public enqueueChunks(texts: string[]) {
    const newChunks = texts.map(text => ({
      id: crypto.randomUUID(),
      text,
      retryCount: 0
    }));
    this.queue.push(...newChunks);
    this.notifyState();
    this.start();
  }

  public start() {
    if (!this.isRunning) {
      this.isRunning = true;
    }
    this.processQueue();
  }

  public stop() {
    this.isRunning = false;
  }
  
  public resume() {
    this.start();
  }

  private async enforceThrottlingDelay() {
    const now = Date.now();
    if (now < this.nextAllowedDispatchTime) {
      const waitTime = this.nextAllowedDispatchTime - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    // Random delay between 10s and 12s
    const delay = 10000 + Math.random() * 2000;
    this.nextAllowedDispatchTime = Date.now() + delay;
  }

  private async processQueue() {
    if (!this.isRunning || this.queue.length === 0) return;
    if (this.activeThreads >= this.MAX_CONCURRENCY) return;

    const chunk = this.queue.shift();
    if (!chunk) return;

    if (!checkContentSafety(chunk.text)) {
      toast.error("Policy Violation: Nội dung vi phạm chính sách hoặc chứa lệnh không hợp lệ.");
      this.failedChunks.push(chunk);
      this.notifyState();
      if (this.isRunning && this.queue.length > 0) {
        this.processQueue();
      }
      return;
    }

    this.activeThreads++;
    this.notifyState();

    let dispatchError = false;

    try {
      // 1. Mandatory Delay
      await this.enforceThrottlingDelay();

      // 2. Select Key
      const key = nextGenRotationEngine.getAvailableKey();
      if (!key) {
        throw new Error("NO_KEYS_AVAILABLE");
      }
      
      nextGenRotationEngine.markKeyUsed(key.key);

      // 3. Execution
      const cards = await this.executeExtraction(chunk.text, key);
      
      // 4. Validation
      if (!this.validateExtraction(cards)) {
        throw new Error("INVALID_RESPONSE_SCHEMA");
      }

      // 5. Success Checkpoint
      this.processedCards.push(...cards);
      
    } catch (err: any) {
      console.error(`[NextGen] Chunk failed (Attempt ${chunk.retryCount + 1}):`, err.message);
      dispatchError = true;
      
      if (err.message === "NO_KEYS_AVAILABLE") {
        this.queue.unshift(chunk);
        this.stop(); // Stop loop and allow resume
      } else {
        chunk.retryCount++;
        if (chunk.retryCount < 3) {
          this.queue.unshift(chunk); // push back to front
        } else {
          this.failedChunks.push(chunk);
        }
      }
    } finally {
      this.activeThreads--;
      this.notifyState();
      
      if (this.isRunning && this.queue.length > 0 && !dispatchError) {
        this.processQueue();
      }
    }
  }

  private validateExtraction(cards: any[]): boolean {
    if (!Array.isArray(cards) || cards.length === 0) return false;
    for (const c of cards) {
      if (!c.front || !c.back) return false;
    }
    return true;
  }

  private async executeExtraction(text: string, keyStatus: KeyStatus): Promise<IngestedCard[]> {
    const prompt = `Extract flashcards from the following text. Return a JSON array of objects exactly like this:
[
  { "front": "word/phrase", "back": "translation/meaning", "ipa": "pronunciation", "example": "example sentence" }
]
Only output the raw JSON array, no extra text.
Text: ${text}`;

    if (keyStatus.provider === "cerebras") {
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keyStatus.key}`
        },
        body: JSON.stringify({
          model: "llama3.1-8b",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) {
        nextGenRotationEngine.reportError(keyStatus.key, res.status);
        throw new Error(`Cerebras API Error: ${res.status}`);
      }

      const data = await res.json();
      return this.parseResponse(data.choices[0].message.content);

    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keyStatus.key}`
        },
        body: JSON.stringify({
          model: "gemini-1.5-flash",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) {
        nextGenRotationEngine.reportError(keyStatus.key, res.status);
        throw new Error(`Gemini API Error: ${res.status}`);
      }

      const data = await res.json();
      return this.parseResponse(data.choices[0].message.content);
    }
  }

  private parseResponse(content: string): IngestedCard[] {
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
      }
      
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.cards && Array.isArray(parsed.cards)) return parsed.cards;
      if (parsed.flashcards && Array.isArray(parsed.flashcards)) return parsed.flashcards;
      
      throw new Error("Unknown schema");
    } catch (e) {
      throw new Error("JSON Parse Error");
    }
  }
}

export const nextGenIngestionEngine = new UnifiedIngestionEngine();
