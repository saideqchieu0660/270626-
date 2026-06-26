export const FEATURE_FLAGS = {
  PRIMITIVE_MODE: import.meta.env.VITE_PRIMITIVE_MODE === 'true' || false, 
  ENABLE_FLASHCARD_ONLY: true,
  ENABLE_FLASHCARDS: true,
  ENABLE_STUDY_ROOM: true,
  ENABLE_CO_STUDY: true,
  ENABLE_TEACHER_DASHBOARD: true,
  ENABLE_ADMIN_CREATE: true,
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_CYBERPUNK: true,
  ENABLE_RANKING: true,
  ENABLE_SKILL_TREE: true,
  ENABLE_HISTORY: true,
};

export const isFeatureEnabled = (featureKey: keyof typeof FEATURE_FLAGS) => {
  if (FEATURE_FLAGS.ENABLE_FLASHCARD_ONLY) {
    if (featureKey === 'ENABLE_FLASHCARDS') return true;
    if (featureKey === 'ENABLE_FLASHCARD_ONLY') return true;
    return false;
  }
  if (FEATURE_FLAGS.PRIMITIVE_MODE) {
    if (featureKey === 'ENABLE_FLASHCARDS') return true;
    return false;
  }
  return FEATURE_FLAGS[featureKey];
};
