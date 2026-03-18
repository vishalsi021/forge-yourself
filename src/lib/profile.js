import { supabase } from './supabase';

export async function updateProfile(userId, patch) {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: inserted, error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch }, { onConflict: 'id' })
    .select()
    .single();

  if (upsertError) throw upsertError;
  return inserted;
}

export async function mergeProfileQuizAnswers(userId, updater) {
  const { data: profile, error: fetchError } = await supabase.from('profiles').select('quiz_answers').eq('id', userId).single();
  if (fetchError) throw fetchError;

  const nextQuizAnswers = updater(profile?.quiz_answers ?? {});
  return updateProfile(userId, { quiz_answers: nextQuizAnswers });
}

export async function uploadToBucket({ bucket, path, file }) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}
