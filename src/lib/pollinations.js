export function buildPollinationsUrl({ prompt, seed = Math.floor(Math.random() * 999999) }) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=768&seed=${seed}&nologo=true&model=flux&enhance=true`;
}

export async function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error('Image generation failed'));
    image.src = url;
  });
}
