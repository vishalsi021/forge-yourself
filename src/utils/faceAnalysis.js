export function suggestFaceShapeFromFrame({ width, height }) {
  const safeWidth = Number(width || 0);
  const safeHeight = Number(height || 0);

  if (!safeWidth || !safeHeight) {
    return {
      shape: 'Oval',
      confidence: 'low',
      basis: 'We could not read enough image metadata to make even a weak suggestion, so start with Oval and confirm it manually.',
    };
  }

  const ratio = Number((safeWidth / safeHeight).toFixed(2));

  if (ratio >= 0.88) {
    return {
      shape: 'Round',
      confidence: 'low',
      basis: `This suggestion comes from the photo framing ratio (${ratio}). A wider portrait often maps closer to a round silhouette, but you should confirm it manually.`,
    };
  }

  if (ratio >= 0.8) {
    return {
      shape: 'Square',
      confidence: 'low',
      basis: `This is a framing-based guess from the upload ratio (${ratio}). It points toward a squarer outline, not a verified face scan.`,
    };
  }

  if (ratio >= 0.72) {
    return {
      shape: 'Oval',
      confidence: 'low',
      basis: `The framing ratio (${ratio}) sits near the most balanced portrait crop, so Oval is the best low-confidence starting point.`,
    };
  }

  if (ratio >= 0.66) {
    return {
      shape: 'Heart',
      confidence: 'low',
      basis: `The upload ratio (${ratio}) trends longer and narrower, which loosely fits a heart-style heuristic. Confirm or correct it before we personalize anything.`,
    };
  }

  return {
    shape: 'Oblong',
    confidence: 'low',
    basis: `The portrait ratio (${ratio}) is notably tall, so Oblong is the best framing-based suggestion. This is still a manual-confirmation flow, not facial recognition.`,
  };
}

export async function readImageDimensions(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Unable to read image dimensions.'));
      element.src = objectUrl;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
