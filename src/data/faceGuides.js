export const faceShapeGuides = {
  Oval: {
    analysis: 'Balanced proportions give you the widest styling range. The goal is refinement, not correction.',
    tips: ['Most cuts work well for you.', 'Prioritize skin quality and clean grooming.', 'A short, well-kept beard usually adds structure.', 'Use a modern textured cut rather than an overly flat style.'],
    hairstyles: ['Textured quiff', 'Mid-fade crop'],
    beards: ['Full beard', 'Short boxed beard'],
  },
  Square: {
    analysis: 'A square face already carries strength. Softer styling usually balances the jawline best.',
    tips: ['Use texture rather than harsh geometry.', 'Avoid adding too much width on the sides.', 'Rounded beard lines soften the face.', 'Hydration and skin clarity matter because structure is already strong.'],
    hairstyles: ['Soft wavy cut', 'Textured crop'],
    beards: ['Rounded beard', 'Circle beard'],
  },
  Round: {
    analysis: 'Your best visual upgrades create length and sharper angles through styling and grooming.',
    tips: ['Add vertical volume on top.', 'Keep the sides tighter.', 'Facial hair that elongates the chin usually helps.', 'Reduce puffiness with sleep, hydration, and a cleaner diet.'],
    hairstyles: ['High fade with volume', 'Slick back'],
    beards: ['Goatee', 'Balbo'],
  },
  Heart: {
    analysis: 'You want balance between forehead width and jaw presence.',
    tips: ['Styles with movement can soften the forehead.', 'A boxed beard can add jaw weight.', 'Avoid excessive top volume.', 'SPF matters because the forehead catches light and irritation quickly.'],
    hairstyles: ['Curtain fringe', 'Low textured crop'],
    beards: ['Boxed beard', 'Full beard'],
  },
  Diamond: {
    analysis: 'Cheekbones are your strongest feature, so the right style should frame them instead of hiding them.',
    tips: ['Use cuts that respect your cheekbone structure.', 'Keep beard lines clean and intentional.', 'Texture and shape balance matter more than volume.', 'Consistent skincare pays off heavily for this face shape.'],
    hairstyles: ['Textured crop', 'Natural curls'],
    beards: ['Short stubble', 'Balbo'],
  },
  Oblong: {
    analysis: 'The aim is usually to add width while avoiding extra vertical emphasis.',
    tips: ['Avoid tall quiffs.', 'Use side movement or medium texture.', 'Facial hair on the sides can help balance the face.', 'Choose haircuts that broaden, not lengthen.'],
    hairstyles: ['Side-swept cut', 'Wavy medium length'],
    beards: ['Full sides', 'Short boxed beard'],
  },
};

export const faceShapeOptions = Object.keys(faceShapeGuides);
