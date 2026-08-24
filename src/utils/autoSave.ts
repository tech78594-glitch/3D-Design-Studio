/**
 * CAD Studio Auto-Save & Persistence Engine
 * Handles debounced auto-saving to browser localStorage,
 * version stamping, session restore, backup export, and storage diagnostics.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DesignSection,
  CADObject,
  DeviceConfig,
  BuildingConfig,
  CADLayer,
  CADTag,
  KinematicJoint,
  CADConstraint,
  PBRReviewSettings,
  CADMeasurement,
  CADCommentPin,
  DesignVersion,
  StudioThemeMode,
  RenderMode,
  LightingPreset,
} from '../types/cad';

export const AUTOSAVE_STORAGE_KEY = 'cad_studio_autosave_v2';
export const AUTOSAVE_BACKUP_KEY = 'cad_studio_backup_v2';

export const AUTOSAVE_INTERVAL_KEY = 'cad_studio_autosave_interval';

export type AutoSaveIntervalOption = 'off' | '15s' | '30s' | '1m' | '5m' | '10m';

export function getAutoSaveIntervalMs(opt: AutoSaveIntervalOption): number | null {
  switch (opt) {
    case '15s': return 15000;
    case '30s': return 30000;
    case '1m': return 60000;
    case '5m': return 300000;
    case '10m': return 600000;
    case 'off': return null;
    default: return 30000;
  }
}

export function loadAutoSaveIntervalPref(): AutoSaveIntervalOption {
  try {
    const val = localStorage.getItem(AUTOSAVE_INTERVAL_KEY);
    if (val && ['off', '15s', '30s', '1m', '5m', '10m'].includes(val)) {
      return val as AutoSaveIntervalOption;
    }
  } catch (e) {}
  return '30s';
}

export function saveAutoSaveIntervalPref(opt: AutoSaveIntervalOption): void {
  try {
    localStorage.setItem(AUTOSAVE_INTERVAL_KEY, opt);
  } catch (e) {}
}

export interface AutoSavePayload {
  version: number;
  timestamp: number;
  lastSavedIso: string;
  section: DesignSection;
  themeMode: StudioThemeMode;
  renderMode?: RenderMode;
  lightingPreset?: LightingPreset;
  deviceConfig: DeviceConfig;
  buildingConfig: BuildingConfig;
  techObjects: CADObject[];
  buildingObjects: CADObject[];
  layers: CADLayer[];
  tags: CADTag[];
  kinematicJoints: KinematicJoint[];
  techConstraints: CADConstraint[];
  pbrSettings?: PBRReviewSettings;
  measurements: CADMeasurement[];
  comments: CADCommentPin[];
  versionHistory: DesignVersion[];
  stats?: {
    totalParts: number;
    byteSizeEstimate: number;
    clientPlatform: string;
  };
}

export type AutoSaveData = AutoSavePayload;

/**
 * Persist current workspace state to LocalStorage
 */
export function saveStudioSession(
  data: Partial<AutoSavePayload> & {
    techObjects: CADObject[];
    buildingObjects: CADObject[];
    deviceConfig: DeviceConfig;
    buildingConfig: BuildingConfig;
    section: DesignSection;
  }
): {
  success: boolean;
  timestamp: number;
  byteSize: number;
} {
  try {
    const totalParts = (data.techObjects?.length || 0) + (data.buildingObjects?.length || 0);
    const payload: AutoSavePayload = {
      version: 2,
      timestamp: Date.now(),
      lastSavedIso: new Date().toISOString(),
      section: data.section,
      themeMode: data.themeMode || 'dark',
      renderMode: data.renderMode || 'shaded',
      lightingPreset: data.lightingPreset || 'studio',
      deviceConfig: data.deviceConfig,
      buildingConfig: data.buildingConfig,
      techObjects: data.techObjects,
      buildingObjects: data.buildingObjects,
      layers: data.layers || [],
      tags: data.tags || [],
      kinematicJoints: data.kinematicJoints || [],
      techConstraints: data.techConstraints || [],
      pbrSettings: data.pbrSettings,
      measurements: data.measurements || [],
      comments: data.comments || [],
      versionHistory: data.versionHistory || [],
      stats: {
        totalParts,
        byteSizeEstimate: 0,
        clientPlatform: typeof navigator !== 'undefined' ? navigator.platform : 'web',
      },
    };

    const jsonStr = JSON.stringify(payload);
    const byteSize = new Blob([jsonStr]).size;
    payload.stats!.byteSizeEstimate = byteSize;

    localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));

    return {
      success: true,
      timestamp: payload.timestamp,
      byteSize,
    };
  } catch (err) {
    console.error('Failed to auto-save studio session:', err);
    return {
      success: false,
      timestamp: Date.now(),
      byteSize: 0,
    };
  }
}

/**
 * Load auto-saved session if present
 */
export function loadStudioSession(): AutoSavePayload | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutoSavePayload;
    if (!parsed || !parsed.timestamp) return null;
    return parsed;
  } catch (err) {
    console.warn('Error reading auto-saved session:', err);
    return null;
  }
}

/**
 * Clear auto-saved cache
 */
export function clearStudioAutoSave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing auto-save:', err);
  }
}

export const clearAutoSavedSession = clearStudioAutoSave;

/**
 * Export full project backup as downloadable JSON file
 */
export function exportStudioBackupFile(payload: Partial<AutoSavePayload>): void {
  const jsonStr = JSON.stringify(
    {
      version: 2,
      exportDate: new Date().toISOString(),
      ...payload,
    },
    null,
    2
  );
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  a.href = url;
  a.download = `CAD_Studio_Project_Backup_${payload.section || 'assembly'}_${dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportBackupJSON = exportStudioBackupFile;

/**
 * Get human readable time distance (e.g., "just now", "12s ago", "2m ago")
 */
export function formatTimeAgo(timestampMs: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export interface UseAutoSaveOptions {
  techObjects: CADObject[];
  buildingObjects: CADObject[];
  deviceConfig: DeviceConfig;
  buildingConfig: BuildingConfig;
  section: DesignSection;
  layers?: CADLayer[];
  tags?: CADTag[];
  kinematicJoints?: KinematicJoint[];
  techConstraints?: CADConstraint[];
  pbrSettings?: PBRReviewSettings;
  measurements?: CADMeasurement[];
  comments?: CADCommentPin[];
  versionHistory?: DesignVersion[];
  themeMode?: StudioThemeMode;
  renderMode?: RenderMode;
  lightingPreset?: LightingPreset;
  debounceMs?: number;
}

/**
 * React Hook for seamless debounced Auto-Save
 */
export function useAutoSave(options: UseAutoSaveOptions) {
  const {
    techObjects,
    buildingObjects,
    deviceConfig,
    buildingConfig,
    section,
    layers = [],
    tags = [],
    kinematicJoints = [],
    techConstraints = [],
    pbrSettings,
    measurements = [],
    comments = [],
    versionHistory = [],
    themeMode = 'dark',
    renderMode = 'shaded',
    lightingPreset = 'studio',
    debounceMs = 1800,
  } = options;

  const [autoSaveState, setAutoSaveState] = useState<{
    lastSavedTime: number | null;
    isSaving: boolean;
    byteSize: number;
    error: string | null;
  }>({
    lastSavedTime: null,
    isSaving: false,
    byteSize: 0,
    error: null,
  });

  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSave = useCallback(() => {
    setAutoSaveState(prev => ({ ...prev, isSaving: true }));
    try {
      const result = saveStudioSession({
        techObjects,
        buildingObjects,
        deviceConfig,
        buildingConfig,
        section,
        layers,
        tags,
        kinematicJoints,
        techConstraints,
        pbrSettings,
        measurements,
        comments,
        versionHistory,
        themeMode,
        renderMode,
        lightingPreset,
      });

      setAutoSaveState({
        lastSavedTime: result.timestamp,
        isSaving: false,
        byteSize: result.byteSize,
        error: result.success ? null : 'Failed to write to localStorage',
      });
    } catch (e: any) {
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: e?.message || 'Storage error',
      }));
    }
  }, [
    techObjects,
    buildingObjects,
    deviceConfig,
    buildingConfig,
    section,
    layers,
    tags,
    kinematicJoints,
    techConstraints,
    pbrSettings,
    measurements,
    comments,
    versionHistory,
    themeMode,
    renderMode,
    lightingPreset,
  ]);

  // Debounced auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const existing = loadStudioSession();
      if (existing) {
        setAutoSaveState(prev => ({
          ...prev,
          lastSavedTime: existing.timestamp,
          byteSize: existing.stats?.byteSizeEstimate || 0,
        }));
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    techObjects,
    buildingObjects,
    deviceConfig,
    buildingConfig,
    section,
    layers,
    tags,
    kinematicJoints,
    techConstraints,
    measurements,
    comments,
    versionHistory,
    themeMode,
    debounceMs,
    performSave,
  ]);

  const triggerImmediateSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSave();
  }, [performSave]);

  const clearAutoSave = useCallback(() => {
    clearStudioAutoSave();
    setAutoSaveState({
      lastSavedTime: null,
      isSaving: false,
      byteSize: 0,
      error: null,
    });
  }, []);

  return {
    autoSaveState,
    triggerImmediateSave,
    clearAutoSave,
  };
}
