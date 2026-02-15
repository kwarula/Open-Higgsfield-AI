
export const imageModels = [
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Nano Banana Pro',
    description: 'Highest quality image generation with Gemini 3 Pro.',
    capabilities: ['aspect_ratio', 'image_size'],
    defaults: {
      aspect_ratio: '1:1',
      image_size: '1K'
    }
  },
  {
    id: 'gemini-2.5-flash-image',
    name: 'Nano Banana',
    description: 'Fast image generation with Gemini 2.5 Flash.',
    capabilities: ['aspect_ratio'],
    defaults: {
      aspect_ratio: '1:1'
    }
  }
];

export const videoModels = [
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1',
    description: 'High-fidelity video generation.',
    capabilities: ['resolution', 'audio']
  },
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    description: 'Faster video generation with good quality.',
    capabilities: ['resolution', 'audio']
  },
  {
    id: 'veo-2.0-generate-001',
    name: 'Veo 2.0',
    description: 'Stable legacy model.',
    capabilities: []
  }
];

export const getAspectRatiosForModel = (modelId) => {
  return ['1:1', '16:9', '9:16', '4:3', '3:4'];
};

export const getResolutionsForModel = (modelId) => {
  if (modelId === 'gemini-3-pro-image-preview') {
    return ['1K', '2K', '4K'];
  }
  return ['1K'];
};

export const getVideoResolutions = () => {
  return ['720p', '1080p'];
};

export const getImageModelById = (id) => imageModels.find(m => m.id === id);
export const getVideoModelById = (id) => videoModels.find(m => m.id === id);
