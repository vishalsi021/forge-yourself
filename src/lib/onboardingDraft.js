const KEY = 'forge-onboarding-draft';
const RESULT_KEY = 'forge-onboarding-result';

export function loadOnboardingDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveOnboardingDraft(nextDraft) {
  sessionStorage.setItem(KEY, JSON.stringify(nextDraft));
}

export function clearOnboardingDraft() {
  sessionStorage.removeItem(KEY);
}

export function loadOnboardingResult() {
  try {
    return JSON.parse(sessionStorage.getItem(RESULT_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveOnboardingResult(result) {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function clearOnboardingResult() {
  sessionStorage.removeItem(RESULT_KEY);
}
