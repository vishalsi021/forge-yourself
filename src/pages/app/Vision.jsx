import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { faceShapeGuides, faceShapeOptions } from '@/data/faceGuides';
import { useAuth } from '@/hooks/useAuth';
import { buildPollinationsUrl, preloadImage } from '@/lib/pollinations';
import { mergeProfileQuizAnswers, updateProfile, uploadToBucket } from '@/lib/profile';
import { useUiStore } from '@/stores/uiStore';
import { readImageDimensions, suggestFaceShapeFromFrame } from '@/utils/faceAnalysis';

export default function VisionPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const [tab, setTab] = useState('face');
  const [preview, setPreview] = useState(profile?.quiz_answers?.visionPreviewUrl || '');
  const [generated, setGenerated] = useState(profile?.quiz_answers?.bestVersionUrl || '');
  const [selectedShape, setSelectedShape] = useState(profile?.face_shape || profile?.quiz_answers?.visionAnalysis?.shape || 'Oval');
  const [analysis, setAnalysis] = useState(profile?.quiz_answers?.visionAnalysis || null);
  const [uploading, setUploading] = useState(false);
  const completion = Math.min(100, Math.round(((profile?.quiz_answers?.analysis?.archScores ? 1 : 0) + (profile?.onboarding_complete ? 1 : 0) + (profile?.mission_statement ? 1 : 0) + (profile?.selected_values?.length ? 1 : 0)) * 25));
  const fitnessScore = profile?.arch_scores?.fitness || 5;
  const confirmedShape = profile?.face_shape || '';
  const guide = faceShapeGuides[confirmedShape || selectedShape] || faceShapeGuides.Oval;
  const bodyType = fitnessScore < 4 ? 'Endomorph' : fitnessScore < 7 ? 'Ectomorph' : 'Mesomorph';

  const confirmShapeMutation = useMutation({
    mutationFn: async () => {
      await updateProfile(user.id, { face_shape: selectedShape });
      await mergeProfileQuizAnswers(user.id, (current) => ({
        ...current,
        visionAnalysis: {
          ...(current.visionAnalysis || {}),
          ...(analysis || {}),
          shape: selectedShape,
          confirmed: true,
        },
      }));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
      pushToast({ title: 'Face shape confirmed', variant: 'success' });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to save face shape', variant: 'error' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Photorealistic professional portrait of a confident person with ${(confirmedShape || selectedShape).toLowerCase()} face shape, ${bodyType.toLowerCase()} body type, ${completion}% journey completion, clean skin, improved grooming, refined posture, cinematic lighting, premium editorial look`;
      const url = buildPollinationsUrl({ prompt });
      await preloadImage(url);
      await mergeProfileQuizAnswers(user.id, (current) => ({ ...current, bestVersionUrl: url }));
      return url;
    },
    onSuccess: async (url) => {
      setGenerated(url);
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
    onError: () => {
      pushToast({ title: 'Image generation fell back to the styled preview. Try again in a moment.', variant: 'error' });
    },
  });

  const uploadPhoto = async (file) => {
    setUploading(true);

    try {
      const extension = file.name.split('.').pop();
      const path = `${user.id}/vision.${extension}`;
      const metadata = await readImageDimensions(file);
      const suggestion = suggestFaceShapeFromFrame(metadata);
      const publicUrl = await uploadToBucket({ bucket: 'vision', path, file });

      setPreview(publicUrl);
      setSelectedShape(suggestion.shape);
      setAnalysis({ ...suggestion, ...metadata, confirmed: false });

      await mergeProfileQuizAnswers(user.id, (current) => ({
        ...current,
        visionPreviewUrl: publicUrl,
        visionAnalysis: {
          ...suggestion,
          ...metadata,
          confirmed: false,
        },
      }));
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
      pushToast({ title: 'Photo uploaded. Confirm or correct the suggested shape before generating.', variant: 'success' });
    } catch (error) {
      pushToast({ title: error.message || 'Unable to upload your vision photo', variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const unlocks = useMemo(
    () =>
      [
        [10, 'Best hairstyle for face shape'],
        [20, 'Cleaner skin texture'],
        [30, 'Leaner, more defined physique'],
        [40, 'Groomed and styled beard'],
        [50, 'Better posture and presence'],
        [60, 'Sharper jawline definition'],
        [70, 'Brighter, rested eyes'],
        [80, 'Confident body language'],
        [90, 'Peak grooming alignment'],
        [100, 'Final form unlocked'],
      ].map(([value, label]) => ({ value, label })),
    [],
  );

  return (
    <PageWrapper>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          ['face', 'Face Analysis'],
          ['body', 'Body & Fitness'],
          ['best', 'AI Best Version'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`border px-3 py-2 font-condensed text-xs font-bold uppercase tracking-[0.18em] ${tab === id ? 'border-forge-gold bg-forge-gold/10 text-forge-gold' : 'border-forge-border text-forge-muted2'}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'face' ? (
        <>
          <Card className="p-5">
            <div className="section-label mb-2">Face analysis</div>
            <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-forge-border p-8 text-center text-sm text-forge-muted2">
              {preview ? <img src={preview} alt="Uploaded" className="mb-4 h-48 w-full object-cover" /> : 'Upload a clear front-facing photo'}
              <span>{uploading ? 'Uploading and reading image metadata...' : 'Tap to upload photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadPhoto(event.target.files[0])} />
            </label>
          </Card>
          <Card className="mt-4 p-5">
            <div className="section-label mb-2">Suggested face shape</div>
            <p className="text-sm leading-6 text-forge-muted2">
              FORGE currently uses an honest on-device framing heuristic, not facial recognition. We suggest a shape from your upload metadata, then you confirm or correct it before we personalize styling advice.
            </p>
            {analysis ? (
              <div className="mt-4 border border-forge-border bg-forge-bg3 px-4 py-4 text-sm leading-6 text-forge-muted2">
                <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-gold">Low-confidence suggestion</div>
                <div className="mt-2 font-display text-4xl text-forge-text">{analysis.shape}</div>
                <p className="mt-3">{analysis.basis}</p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {faceShapeOptions.map((shape) => (
                <button
                  key={shape}
                  type="button"
                  className={`border px-3 py-2 font-condensed text-xs font-bold uppercase tracking-[0.16em] ${selectedShape === shape ? 'border-forge-gold bg-forge-gold/10 text-forge-gold' : 'border-forge-border text-forge-muted2'}`}
                  onClick={() => setSelectedShape(shape)}
                >
                  {shape}
                </button>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => confirmShapeMutation.mutate()} disabled={!preview || confirmShapeMutation.isPending}>
              {confirmedShape === selectedShape ? 'Face Shape Confirmed' : 'Confirm Face Shape'}
            </Button>
            <p className="mt-3 text-xs leading-5 text-forge-muted2">
              Current confirmed shape: <span className="text-forge-text">{confirmedShape || 'Not confirmed yet'}</span>
            </p>
            <p className="mt-4 text-sm leading-6 text-forge-muted2">{guide.analysis}</p>
            <div className="mt-4 grid gap-2 text-sm leading-6 text-forge-muted2">
              {guide.tips.map((tip) => <div key={tip}>- {tip}</div>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Card className="bg-forge-bg3 p-4">
                <div className="section-label mb-2">Best hairstyles</div>
                {guide.hairstyles.map((item) => <div key={item} className="text-sm text-forge-muted2">- {item}</div>)}
              </Card>
              <Card className="bg-forge-bg3 p-4">
                <div className="section-label mb-2">Best beard styles</div>
                {guide.beards.map((item) => <div key={item} className="text-sm text-forge-muted2">- {item}</div>)}
              </Card>
            </div>
          </Card>
        </>
      ) : null}

      {tab === 'body' ? (
        <>
          <Card className="p-5">
            <div className="section-label mb-2">Body & fitness</div>
            <h1 className="display-title text-5xl">{bodyType}</h1>
            <p className="mt-3 text-sm leading-6 text-forge-muted2">Your current fitness score suggests a {bodyType.toLowerCase()} leaning. Use consistent training, sufficient protein, and sleep to sharpen the physical side of the protocol.</p>
          </Card>
          <Card className="mt-4 p-5">
            <div className="section-label mb-2">Exercise grid</div>
            <div className="grid grid-cols-2 gap-3 text-sm text-forge-muted2">
              {['Push-ups', 'Pull-ups', 'Squat', 'Deadlift', 'HIIT sprint', 'Dips', 'Plank', 'Farmer walk'].map((item) => <Card key={item} className="bg-forge-bg3 p-4">{item}</Card>)}
            </div>
          </Card>
          <Card className="mt-4 p-5">
            <div className="section-label mb-2">Nutrition protocol</div>
            <div className="grid gap-2 text-sm leading-6 text-forge-muted2">
              <div>- Protein target: 1.6-2.2g per kg bodyweight.</div>
              <div>- Hydration: 3L minimum, front-load the first 500ml.</div>
              <div>- Eliminate frequent ultra-processed food and late-night junk meals.</div>
              <div>- Add daily fruit, fiber, and a reliable protein anchor meal.</div>
              <div>- Keep meal timing boring enough to stay consistent.</div>
            </div>
          </Card>
        </>
      ) : null}

      {tab === 'best' ? (
        <>
          <Card className="p-5 text-center">
            <div className="section-label mb-2">Completion</div>
            <div className="font-display text-7xl text-forge-gold">{completion}%</div>
            <p className="mt-3 text-sm text-forge-muted2">Your best-version image reflects the progress signals currently stored in your account.</p>
          </Card>
          <Card className="mt-4 p-5">
            <div className="aspect-[3/4] border border-forge-border bg-forge-bg3">
              {generated ? (
                <img src={generated} alt="AI best version" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-forge-muted2">
                  Upload your photo, confirm your face shape, and generate your best version.
                </div>
              )}
            </div>
            <Button className="mt-4 w-full" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !preview || !confirmedShape}>
              {generated ? 'Regenerate AI Best Version' : 'Generate AI Best Version'}
            </Button>
            {!confirmedShape ? <p className="mt-3 text-xs leading-5 text-forge-muted2">Confirm your face shape first so the prompt uses something you actually approved.</p> : null}
          </Card>
          <Card className="mt-4 p-5">
            <div className="section-label mb-2">Unlock path</div>
            <div className="grid gap-2">
              {unlocks.map((item) => (
                <div key={item.value} className={`flex items-center justify-between border px-3 py-3 text-sm ${completion >= item.value ? 'border-forge-green bg-forge-green/10 text-forge-green' : 'border-forge-border text-forge-muted2'}`}>
                  <span>{item.value}%</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </PageWrapper>
  );
}
