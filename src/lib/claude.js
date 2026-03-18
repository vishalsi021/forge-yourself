import { getLocalTimeZone } from '@/utils/dateHelpers';

import { supabase } from './supabase';

async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    throw new Error(error.message || `Failed to invoke ${name}`);
  }

  return data;
}

export const claudeApi = {
  analyzeQuiz: (payload) => invokeFunction('analyze-quiz', payload),
  weeklyCoach: (payload) => invokeFunction('weekly-coach', payload),
  adaptTasks: (payload) => invokeFunction('adapt-tasks', payload),
  missedPattern: (payload) => invokeFunction('missed-pattern', payload),
  ensureDayState: (payload) => invokeFunction('ensure-day-state', { ...payload, timeZone: getLocalTimeZone() }),
  exportUserData: () => invokeFunction('export-user-data', {}),
  deleteAccount: (payload) => invokeFunction('delete-account', payload),
};
