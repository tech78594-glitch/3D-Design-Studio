import * as THREE from 'three';
import { CADMaterial, MaterialType } from '../types/cad';

export interface TextureGenerationOptions {
  prompt: string;
  presetStyle?: 'carbon' | 'brushed_metal' | 'wood_grain' | 'pcb_grid' | 'anodized' | 'leather' | 'marble' | 'cyber_hex';
  resolution?: number; // 256, 512, 1024
  roughness?: number;
  metalness?: number;
  colorHex?: string;
}

export interface GeneratedTextureResult {
  material: CADMaterial;
  textureDataUrl: string;
  canvasTexture: THREE.CanvasTexture;
  promptUsed: string;
}

// Procedurally generate a texture canvas based on style and color
export function generateProceduralCanvas(
  style: TextureGenerationOptions['presetStyle'] = 'carbon',
  baseColorHex: string = '#3b82f6',
  resolution: number = 512
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, resolution, resolution);

  const res = resolution;

  switch (style) {
    case 'carbon': {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      const step = res / 16;
      for (let i = 0; i < res; i += step * 2) {
        for (let j = 0; j < res; j += step * 2) {
          ctx.fillRect(i, j, step, step);
          ctx.fillRect(i + step, j + step, step, step);
        }
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < res; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, res);
        ctx.stroke();
      }
      break;
    }

    case 'brushed_metal': {
      const imgData = ctx.getImageData(0, 0, res, res);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 0.8;
      for (let y = 0; y < res; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(res, y + (Math.random() * 2 - 1));
        ctx.stroke();
      }
      break;
    }

    case 'wood_grain': {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 3;
      for (let i = -res; i < res * 2; i += 12) {
        ctx.beginPath();
        ctx.arc(res / 2, res / 2, Math.abs(i), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'pcb_grid': {
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      const step = res / 16;
      for (let x = 0; x < res; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, res);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, x);
        ctx.lineTo(res, x);
        ctx.stroke();
      }
      ctx.fillStyle = '#f59e0b';
      for (let x = step; x < res; x += step * 2) {
        for (let y = step; y < res; y += step * 2) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'cyber_hex': {
      const radius = res / 16;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      const h = radius * Math.sqrt(3);
      for (let y = 0; y < res + h; y += h) {
        for (let x = 0; x < res + radius * 3; x += radius * 3) {
          const xOffset = (Math.floor(y / h) % 2) * radius * 1.5;
          ctx.beginPath();
          for (let side = 0; side < 6; side++) {
            const angle = (side * Math.PI) / 3;
            const px = x + xOffset + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            if (side === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }

    default: {
      // Anodized / Soft Grain
      const imgData = ctx.getImageData(0, 0, res, res);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }

  return canvas;
}

// Generate PBR Texture entirely via the procedural canvas generator above.
// No AI backend, network call, or API token is used.
export async function generateAutoTexture(
  options: TextureGenerationOptions
): Promise<GeneratedTextureResult> {
  const resolution = options.resolution || 512;
  const baseColor = options.colorHex || '#38bdf8';

  const canvas = generateProceduralCanvas(options.presetStyle || 'carbon', baseColor, resolution);
  const dataUrl = canvas.toDataURL('image/png');
  const canvasTexture = new THREE.CanvasTexture(canvas);
  canvasTexture.wrapS = THREE.RepeatWrapping;
  canvasTexture.wrapT = THREE.RepeatWrapping;
  canvasTexture.repeat.set(2, 2);

  let materialType: MaterialType = 'anodized_aluminum';
  if (options.presetStyle === 'carbon') materialType = 'carbon_fiber';
  else if (options.presetStyle === 'brushed_metal') materialType = 'polished_metal';
  else if (options.presetStyle === 'wood_grain') materialType = 'warm_wood';
  else if (options.presetStyle === 'pcb_grid') materialType = 'pcb_green';

  const newMaterial: CADMaterial = {
    id: `mat_gen_${Date.now()}`,
    name: `Procedural Texture (${options.presetStyle || 'custom'})`,
    type: materialType,
    color: baseColor,
    roughness: options.roughness ?? 0.35,
    metalness: options.metalness ?? 0.6,
    texturePattern: options.presetStyle === 'carbon' ? 'carbon' : options.presetStyle === 'pcb_grid' ? 'pcb_grid' : 'brushed',
  };

  return {
    material: newMaterial,
    textureDataUrl: dataUrl,
    canvasTexture,
    promptUsed: options.prompt,
  };
}
