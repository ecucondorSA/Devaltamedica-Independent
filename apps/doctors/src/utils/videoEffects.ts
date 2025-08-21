export interface VideoEffect {
  id: string;
  name: string;
  description: string;
  apply: (imageData: ImageData) => ImageData;
}

// Efecto de desenfoque gaussiano
export const applyBlurEffect = (imageData: ImageData, radius: number = 10): ImageData => {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  // Kernel gaussiano simplificado
  const kernel = [];
  const sigma = radius / 3;
  let sum = 0;
  
  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      const value = Math.exp(-(i * i + j * j) / (2 * sigma * sigma));
      kernel.push(value);
      sum += value;
    }
  }
  
  // Normalizar kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }
  
  // Aplicar convolución
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      let r = 0, g = 0, b = 0;
      let kernelIndex = 0;
      
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
          const weight = kernel[kernelIndex++];
          
          r += data[pixelIndex] * weight;
          g += data[pixelIndex + 1] * weight;
          b += data[pixelIndex + 2] * weight;
        }
      }
      
      const resultIndex = (y * width + x) * 4;
      result[resultIndex] = Math.round(r);
      result[resultIndex + 1] = Math.round(g);
      result[resultIndex + 2] = Math.round(b);
      result[resultIndex + 3] = data[resultIndex + 3]; // Mantener alpha
    }
  }
  
  return new ImageData(result, width, height);
};

// Efecto vintage/sepia
export const applyVintageEffect = (imageData: ImageData): ImageData => {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convertir a sepia
    const sepiaR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
    const sepiaG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
    const sepiaB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    
    // Añadir tinte cálido
    result[i] = Math.min(255, sepiaR * 1.1);
    result[i + 1] = Math.min(255, sepiaG * 0.9);
    result[i + 2] = Math.min(255, sepiaB * 0.8);
    result[i + 3] = data[i + 3]; // Mantener alpha
  }
  
  return new ImageData(result, width, height);
};

// Efecto blanco y negro
export const applyBlackAndWhiteEffect = (imageData: ImageData): ImageData => {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convertir a escala de grises usando luminancia
    const gray = (r * 0.299) + (g * 0.587) + (b * 0.114);
    
    result[i] = gray;
    result[i + 1] = gray;
    result[i + 2] = gray;
    result[i + 3] = data[i + 3]; // Mantener alpha
  }
  
  return new ImageData(result, width, height);
};

// Efecto de contraste
export const applyContrastEffect = (imageData: ImageData, factor: number = 1.5): ImageData => {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  for (let i = 0; i < data.length; i += 4) {
    result[i] = Math.min(255, Math.max(0, ((data[i] - 128) * factor) + 128));
    result[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * factor) + 128));
    result[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * factor) + 128));
    result[i + 3] = data[i + 3]; // Mantener alpha
  }
  
  return new ImageData(result, width, height);
};

// Efecto de brillo
export const applyBrightnessEffect = (imageData: ImageData, factor: number = 30): ImageData => {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  for (let i = 0; i < data.length; i += 4) {
    result[i] = Math.min(255, Math.max(0, data[i] + factor));
    result[i + 1] = Math.min(255, Math.max(0, data[i + 1] + factor));
    result[i + 2] = Math.min(255, Math.max(0, data[i + 2] + factor));
    result[i + 3] = data[i + 3]; // Mantener alpha
  }
  
  return new ImageData(result, width, height);
};

// Efecto de saturación
export const applySaturationEffect = (imageData: ImageData, factor: number = 1.5): ImageData => {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convertir a HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    if (max === min) {
      result[i] = r;
      result[i + 1] = g;
      result[i + 2] = b;
    } else {
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      // Aplicar factor de saturación
      const newS = Math.min(1, s * factor);
      
      // Convertir de vuelta a RGB
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + newS) : l + newS - l * newS;
      const p = 2 * l - q;
      
      result[i] = Math.round(hue2rgb(p, q, (r - min) / d));
      result[i + 1] = Math.round(hue2rgb(p, q, (g - min) / d));
      result[i + 2] = Math.round(hue2rgb(p, q, (b - min) / d));
    }
    
    result[i + 3] = data[i + 3]; // Mantener alpha
  }
  
  return new ImageData(result, width, height);
};

// Efecto de temperatura de color
export const applyColorTemperatureEffect = (imageData: ImageData, temperature: number): ImageData => {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  // temperature: -100 (frío/azul) a 100 (cálido/naranja)
  const factor = temperature / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    if (factor > 0) {
      // Cálido: aumentar rojo y verde
      r = Math.min(255, r + (factor * 30));
      g = Math.min(255, g + (factor * 15));
      b = Math.max(0, b - (factor * 10));
    } else {
      // Frío: aumentar azul
      r = Math.max(0, r + (factor * 10));
      g = Math.max(0, g + (factor * 5));
      b = Math.min(255, b - (factor * 30));
    }
    
    result[i] = Math.round(r);
    result[i + 1] = Math.round(g);
    result[i + 2] = Math.round(b);
    result[i + 3] = data[i + 3]; // Mantener alpha
  }
  
  return new ImageData(result, width, height);
};

// Biblioteca de efectos
export const videoEffects: VideoEffect[] = [
  {
    id: 'blur',
    name: 'Desenfoque',
    description: 'Aplica un desenfoque gaussiano al fondo',
    apply: (imageData) => applyBlurEffect(imageData, 15)
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Efecto sepia con tinte cálido',
    apply: applyVintageEffect
  },
  {
    id: 'bw',
    name: 'Blanco y Negro',
    description: 'Convierte a escala de grises',
    apply: applyBlackAndWhiteEffect
  },
  {
    id: 'contrast',
    name: 'Alto Contraste',
    description: 'Aumenta el contraste de la imagen',
    apply: (imageData) => applyContrastEffect(imageData, 2.0)
  },
  {
    id: 'brightness',
    name: 'Brillo',
    description: 'Aumenta el brillo de la imagen',
    apply: (imageData) => applyBrightnessEffect(imageData, 50)
  },
  {
    id: 'saturation',
    name: 'Saturación',
    description: 'Aumenta la saturación de colores',
    apply: (imageData) => applySaturationEffect(imageData, 2.0)
  },
  {
    id: 'warm',
    name: 'Temperatura Cálida',
    description: 'Aplica temperatura de color cálida',
    apply: (imageData) => applyColorTemperatureEffect(imageData, 50)
  },
  {
    id: 'cool',
    name: 'Temperatura Fría',
    description: 'Aplica temperatura de color fría',
    apply: (imageData) => applyColorTemperatureEffect(imageData, -50)
  }
];

// Función para obtener efecto por ID
export const getEffectById = (id: string): VideoEffect | undefined => {
  return videoEffects.find(effect => effect.id === id);
};

// Función para aplicar múltiples efectos
export const applyMultipleEffects = (imageData: ImageData, effectIds: string[]): ImageData => {
  let result = imageData;
  
  for (const effectId of effectIds) {
    const effect = getEffectById(effectId);
    if (effect) {
      result = effect.apply(result);
    }
  }
  
  return result;
}; 