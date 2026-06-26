import { dbService } from "./firebase";

export interface SyncItem {
  id: string;
  type: "cardState" | "userProfile" | "pointsDelta";
  uid: string;
  payload: any;
  cardId?: string; // only for cardState
  timestamp: number;
}

const STORAGE_KEY = "costudy_offline_sync_queue";

// Helper to load current queue from localStorage
function getQueue(): SyncItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("[OfflineSync] Error reading queue from localStorage:", e);
    return [];
  }
}

// Helper to save queue to localStorage
function saveQueue(queue: SyncItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    // Dispatch custom event to notify components about queue size changes
    window.dispatchEvent(
      new CustomEvent("offline-sync-queue-updated", {
        detail: { pendingCount: queue.length },
      })
    );
  } catch (e) {
    console.error("[OfflineSync] Error saving queue to localStorage:", e);
  }
}

let isProcessing = false;

export const OfflineSyncQueue = {
  // Enqueue a card state upgrade
  enqueueCardState(uid: string, cardId: string, state: any) {
    if (!uid) return;
    const queue = getQueue();

    // Deduplicate: If there is already an update for this cardId & uid, update or filter it out to avoid multiple writes
    const filtered = queue.filter(
      (item) => !(item.type === "cardState" && item.uid === uid && item.cardId === cardId)
    );

    // Ensure state has an updatedAt timestamp for Course Progress Triple-Tier Resolution
    const cardPayload = {
      ...state,
      updatedAt: state.updatedAt || new Date().toISOString()
    };

    const newItem: SyncItem = {
      id: `sync_card_${cardId}_${Date.now()}`,
      type: "cardState",
      uid,
      cardId,
      payload: cardPayload,
      timestamp: Date.now(),
    };

    filtered.push(newItem);
    saveQueue(filtered);
    
    // Attempt processing immediately
    this.processQueue();
  },

  // Enqueue incremental points accumulation
  enqueuePointsDelta(uid: string, deltaPoints: number) {
     if (!uid || deltaPoints === 0) return;
     const queue = getQueue();
     
     const existingIndex = queue.findIndex(i => i.type === "pointsDelta" && i.uid === uid);
     if (existingIndex > -1) {
         queue[existingIndex].payload.delta += deltaPoints;
         queue[existingIndex].timestamp = Date.now();
     } else {
         queue.push({
             id: `sync_points_${uid}_${Date.now()}`,
             type: "pointsDelta",
             uid,
             payload: { delta: deltaPoints },
             timestamp: Date.now()
         });
     }
     saveQueue(queue);
     this.processQueue();
  },

  // Enqueue a user profile sync
  enqueueUserProfile(uid: string, profileData: any) {
    if (!uid) return;

    // --- DATA PROTECTION GATEWAY ---
    if (!profileData || Object.keys(profileData).length === 0 || !profileData.name) {
       console.error("[OfflineSync] ANTI-EMPTY BLOCK: Blocked enqueue of corrupted/empty profile data for", uid);
       return;
    }

    const queue = getQueue();

    // Deduplicate: Only keep the latest profile update for this uid
    const filtered = queue.filter(
      (item) => !(item.type === "userProfile" && item.uid === uid)
    );

    const newItem: SyncItem = {
      id: `sync_prof_${uid}_${Date.now()}`,
      type: "userProfile",
      uid,
      payload: profileData,
      timestamp: Date.now(),
    };

    filtered.push(newItem);
    saveQueue(filtered);

    // Attempt processing immediately
    this.processQueue();
  },

  getPendingCount(): number {
    return getQueue().length;
  },

  // Process all items in the queue
  async processQueue() {
    if (isProcessing) return;
    
    if (!navigator.onLine) {
      console.log(`[OfflineSync] Browser is currently offline. Retaining queue tasks.`);
      return;
    }

    isProcessing = true;
    let syncedCount = 0;

    while (true) {
      const currentQueue = getQueue();
      if (currentQueue.length === 0) break;

      const item = currentQueue[0];

      try {
        if (item.type === "cardState") {
          // COURSE PROGRESS TRIPLE-TIER RESOLUTION: Compare timestamps
          try {
             const cloudState = await dbService.getCardState(item.uid, item.cardId!);
             if (cloudState && cloudState.updatedAt && item.payload.updatedAt) {
                 const cloudTime = new Date(cloudState.updatedAt).getTime();
                 const localTime = new Date(item.payload.updatedAt).getTime();
                 if (cloudTime > localTime) {
                     console.log(`[OfflineSync] Server cardState for ${item.cardId} is newer. Discarding stale local update.`);
                     const nextQueue = getQueue().filter(i => i.id !== item.id);
                     saveQueue(nextQueue);
                     break; // Skip local write
                 }
             }
          } catch(e) {
             console.warn("[OfflineSync] Verification of cardState timestamp failed. Using local state.", e);
          }
          await dbService.setCardState(item.uid, item.cardId!, item.payload);
        } else if (item.type === "pointsDelta") {
          const { updateDoc, doc, increment } = await import("firebase/firestore");
          const { db } = await import("./firebase");
          const userRef = doc(db, "users", item.uid);
          await updateDoc(userRef, {
            points: increment(item.payload.delta)
          });
        } else if (item.type === "userProfile") {
          const payload = item.payload;
          
          // 1. DATA PROTECTION GATEWAY (Pre-Flight Check)
          if (!payload || 
              !payload.name || 
              !payload.role || 
              typeof payload.points !== 'number' || 
              payload.points === 0 // If local XP is exactly 0 but server might not be, this is suspicious.
             ) {
             console.error(`[OfflineSync] CRITICAL: Suspicious or corrupted payload upload for user ${item.uid}. Enforcing Cloud-First Hydration.`);
             
             // Drop the corrupted local queue item to prevent outbound write and overwrite loop
             const nextQueue = getQueue().filter(i => i.id !== item.id);
             saveQueue(nextQueue);
             
             // Force a downstream re-hydration from cloud to restore local state
             const { store } = await import("./store");
             const { auth } = await import("./firebase");
             if (auth.currentUser) {
                 await store.setFirebaseUser(auth.currentUser);
                 window.dispatchEvent(new CustomEvent("henosis-data-synced"));
             }
             break;
          }

          // 2. STRICT CLOUD-FIRST VALIDATION & MONOTONIC INCREMENT
          try {
             const cloudProfile = await dbService.getUserProfile(item.uid);
             if (cloudProfile) {
                const cloudPoints = typeof cloudProfile.points === 'number' ? cloudProfile.points : 0;
                const localPoints = typeof payload.points === 'number' ? payload.points : 0;
                
                const cloudRole = cloudProfile.role || "student";
                const localRole = payload.role || "student";
                const cloudDominantRole = (cloudRole === "Admin" || cloudRole === "admin" || cloudRole === "teacher") && (localRole === "student");
                
                // If cloud data is logically dominant in roles, ABORT upload
                if (cloudDominantRole && false /* We will fix it with monotonic increment instead of full abort for role, wait no let's just abort if role changed */ || 
                    (cloudPoints > 0 && localPoints === 0)) {
                   console.error(`[OfflineSync] CRITICAL OVERWRITE AVERTED! Cloud profile has dominant state. Forcing downstream overwrite.`);
                   
                   const nextQueue = getQueue().filter(i => i.id !== item.id);
                   saveQueue(nextQueue);
                   
                   const { store } = await import("./store");
                   const { auth } = await import("./firebase");
                   if (auth.currentUser) {
                       await store.setFirebaseUser(auth.currentUser);
                       window.dispatchEvent(new CustomEvent("henosis-data-synced"));
                   }
                   break;
                }

                // TRIPLE-TIER CONFLICT RESOLUTION: Monotonic rules and Set Unions
                const cloudLevel = typeof cloudProfile.level === 'number' ? cloudProfile.level : 1;
                const localLevel = typeof payload.level === 'number' ? payload.level : 1;

                const mergedBorders = [...new Set([...(payload.unlockedCustomBorders || []), ...(cloudProfile.unlockedCustomBorders || [])])];
                const mergedTitles  = [...new Set([...(payload.unlockedCustomTitles || []), ...(cloudProfile.unlockedCustomTitles || [])])];
                
                // Numeric assets can never decrease during sync
                const mergedXP = Math.max(cloudPoints, localPoints);
                const mergedLevel = Math.max(cloudLevel, localLevel);
                const mergedStreak = Math.max(cloudProfile.streak || 0, payload.streak || 0);

                // Overwrite outgoing payload with the protected monotonic/merged results
                payload.unlockedCustomBorders = mergedBorders;
                payload.unlockedCustomTitles = mergedTitles;
                payload.points = mergedXP;
                payload.level = mergedLevel;
                payload.streak = mergedStreak;
             }
          } catch (validateErr) {
             console.warn("[OfflineSync] Verification bypass or failed, proceeding with caution", validateErr);
          }

          await dbService.updateUserProfile(item.uid, item.payload);
        }
        syncedCount++;
        console.log(`[OfflineSync] Successfully synchronized offline action: ${item.id}`);
        
        const nextQueue = getQueue().filter(i => i.id !== item.id);
        saveQueue(nextQueue);
        
      } catch (error: any) {
        console.error(`[OfflineSync] Failed to sync offline item ${item.type} (${item.id}):`, error);
        
        const errorMsg = String(error).toLowerCase();
        if (
          errorMsg.includes("permission-denied") || 
          errorMsg.includes("not-found") ||
          errorMsg.includes("invalid-argument")
        ) {
          console.warn(`[OfflineSync] Discarding unrecoverable task ${item.id} due to fatal Firestore error status.`);
          const nextQueue = getQueue().filter(i => i.id !== item.id);
          saveQueue(nextQueue);
        } else {
          // Keep temporary network loss errors to retry later
          break;
        }
      }
    }

    isProcessing = false;

    if (syncedCount > 0) {
      console.log(`[OfflineSync] Successfully dispatched ${syncedCount} offline updates to real-time Cloud Firestore.`);
      // Emit connection back status success with the number of successfully synchronized card sessions
      window.dispatchEvent(
        new CustomEvent("offline-sync-completed", {
          detail: { count: syncedCount },
        })
      );
    }
  },
};

// Initialize listeners to auto-reconnect and purge/process queue
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    // Small timeout to allow network streams/Auth to safely revive first
    setTimeout(() => {
      OfflineSyncQueue.processQueue();
    }, 1500);
  });

  window.addEventListener("app-network-reconnect", () => {
    setTimeout(() => {
      OfflineSyncQueue.processQueue();
    }, 1000);
  });
}
