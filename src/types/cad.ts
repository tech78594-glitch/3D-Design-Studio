export type DesignSection = 'technology' | 'building';

export type TransformMode = 'translate' | 'rotate' | 'scale' | 'select' | 'measure';
export type RenderMode = 'shaded' | 'wireframe' | 'clay' | 'blueprint' | 'thermal' | 'xray';
export type LightingPreset = 'studio' | 'cyberpunk' | 'warm_sun' | 'cool_tech' | 'blueprint';

export type MaterialType = 
  | 'anodized_aluminum'
  | 'polished_metal'
  | 'matte_plastic'
  | 'glossy_ceramic'
  | 'tinted_glass'
  | 'clear_glass'
  | 'carbon_fiber'
  | 'gold_trace'
  | 'copper'
  | 'pcb_green'
  | 'pcb_black'
  | 'rubber_grip'
  | 'led_emissive'
  | 'concrete'
  | 'warm_wood'
  | 'white_plaster'
  | 'brick'
  | 'steel_beam';

export interface CADMaterial {
  id: string;
  name: string;
  type: MaterialType;
  color: string;
  roughness: number;
  metalness: number;
  transmission?: number;
  opacity?: number;
  transparent?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  clearcoat?: number;
  wireframe?: boolean;
  texturePattern?: 'carbon' | 'pcb_grid' | 'brushed' | 'wood_grain' | 'concrete_speck' | 'none';
}

export type ShapePrimitive = 
  | 'box' 
  | 'cylinder' 
  | 'sphere' 
  | 'rounded_box' 
  | 'torus' 
  | 'cone' 
  | 'pcb_board'
  | 'screen_panel'
  | 'camera_lens'
  | 'battery_cell'
  | 'chip_ic'
  | 'port_usbc'
  | 'screw_head'
  | 'cooling_fan'
  | 'wall'
  | 'window'
  | 'door'
  | 'slab'
  | 'column'
  | 'roof_pitched'
  | 'solar_panel'
  | 'furniture_desk';

export interface CADObject {
  id: string;
  name: string;
  category: 'casing' | 'internal' | 'pcb' | 'optics' | 'power' | 'io' | 'fastener' | 'structure' | 'envelope' | 'interior' | 'custom';
  section: DesignSection;
  primitive: ShapePrimitive;
  position: [number, number, number];
  rotation: [number, number, number]; // Euler in radians
  scale: [number, number, number];
  dimensions: {
    width: number;
    height: number;
    depth: number;
    radius?: number;
    radiusTop?: number;
    radiusBottom?: number;
    segments?: number;
    bevelRadius?: number;
  };
  material: CADMaterial;
  visible: boolean;
  locked: boolean;
  parentId?: string;
  childrenIds?: string[];
  
  // Exploded view offsets (unit vector * explosion factor)
  explodeDirection?: [number, number, number];
  explodeDistance?: number;
  
  // Electronics / Tech properties
  electricalProps?: {
    voltage?: number;
    currentMa?: number;
    heatWattage?: number;
    partNumber?: string;
    temperatureC?: number;
  };

  // Engineering, Layering, Tagging & Physical Specs
  layerId?: string;
  tags?: string[];
  massKg?: number;
  unitCostUsd?: number;
  carbonKgCo2?: number;
  materialGrade?: string;

  // Building properties
  architecturalProps?: {
    floorLevel?: number; // 0, 1, 2...
    materialCostPerM2?: number;
    isLoadBearing?: boolean;
    thermalUValue?: number;
  };
}

export interface DeviceConfig {
  id: string;
  name: string;
  type: 'smartphone' | 'smartwatch' | 'drone' | 'vr_headset' | 'keyboard' | 'iot_hub' | 'custom_device';
  description: string;
  dimensions: { width: number; height: number; depth: number; cornerRadius: number; wallThickness: number };
  casingColor: string;
  accentColor: string;
  screenOn: boolean;
  screenEmissiveColor: string;
  explodedAmount: number; // 0 to 1
  slicePlaneEnabled: boolean;
  sliceAxis: 'x' | 'y' | 'z';
  sliceOffset: number;
  thermalSimActive: boolean;
  pcbTracesVisible: boolean;
  // Iron Man / Stark Holographic Disassembly Mode
  starkModeEnabled?: boolean;
  starkSeparationAmount?: number; // 0 to 2.5
  starkLevitationActive?: boolean;
  starkHologramGlow?: boolean;
  starkSeparationPreset?: 'radial_all' | 'optics_stack' | 'power_core' | 'logic_board' | 'chassis_orbit';
  starkPullOffsets?: Record<string, [number, number, number]>;
}

export interface SnapshotItem {
  id: string;
  dataUrl: string;
  timestamp: number;
  section: DesignSection;
  title: string;
  resolution: string;
  aspectRatio: string;
  partCount: number;
  cameraState?: {
    radius: number;
    theta: number;
    phi: number;
    target: [number, number, number];
  };
}

export interface BuildingConfig {
  id: string;
  name: string;
  typology: 'modern_villa' | 'office_pavilion' | 'loft_apartment' | 'tech_datacenter';
  description: string;
  dimensions: { width: number; length: number; stories: number; storyHeight: number };
  activeFloor: number; // -1 for all, 0, 1, 2
  viewMode2D: boolean; // Orthographic 2D floorplan vs 3D
  timeOfDay: number; // 6 to 20 (hours)
  sunIntensity: number;
  shadowsEnabled: boolean;
  showDimensions: boolean;
  showFurniture: boolean;
}

export interface SceneHistoryStep {
  objects: CADObject[];
  deviceConfig: DeviceConfig;
  buildingConfig: BuildingConfig;
  timestamp: number;
}

// --- ASSEMBLY CONSTRAINTS & KINEMATIC MATES ---
export type ConstraintType = 
  | 'coincident' 
  | 'concentric' 
  | 'distance' 
  | 'parallel' 
  | 'perpendicular' 
  | 'tangent' 
  | 'angle';

export interface CADConstraint {
  id: string;
  name: string;
  type: ConstraintType;
  partAId: string;
  partBId: string;
  axis: 'x' | 'y' | 'z';
  offset: number; // distance in mm or angle in deg
  alignment: 'aligned' | 'anti_aligned';
  minLimit?: number;
  maxLimit?: number;
  active: boolean;
  status: 'satisfied' | 'warning' | 'conflict';
  errorDistanceMm?: number;
}

export interface InterferenceResult {
  partAId: string;
  partBId: string;
  partAName: string;
  partBName: string;
  type: 'clearance' | 'clash' | 'touching';
  overlapVolumeMm3: number;
  minDistanceMm: number;
}

// --- REAL-TIME PBR REVIEW & DIAGNOSTICS ---
export type PBRDiagnosticChannel = 
  | 'lit' 
  | 'roughness_zebra' 
  | 'metalness' 
  | 'normals' 
  | 'fresnel' 
  | 'curvature' 
  | 'ao' 
  | 'wireframe_pbr';

export type PBREnvironmentPreset = 
  | 'clean_studio' 
  | 'cyber_neon' 
  | 'golden_hour' 
  | 'industrial_warehouse' 
  | 'deep_space';

export interface PBRReviewSettings {
  channel: PBRDiagnosticChannel;
  environmentPreset: PBREnvironmentPreset;
  envIntensity: number;
  envRotationDeg: number;
  envBlur: number;
  exposure: number;
  toneMapping: 'aces' | 'reinhard' | 'cineon' | 'linear';
  shadowIntensity: number;
  keyLightIntensity: number;
  fillLightIntensity: number;
  rimLightIntensity: number;
  keyLightColor: string;
  fillLightColor: string;
  rimLightColor: string;
  groundContactShadow: boolean;
  bloomGlow: boolean;
  specularSheen: boolean;
}

// --- HOLOGRAPHIC EXPLODED VIEW & ASSEMBLY SEQUENCE ---
export type HolographicDisassemblyMode = 'radial' | 'orthogonal' | 'spherical' | 'stepped_subsystem';

export interface HolographicStep {
  id: string;
  stepNumber: number;
  title: string;
  subsystem: string;
  description: string;
  targetObjectIds: string[];
  offsetVector: [number, number, number];
  rotationDelta?: [number, number, number];
  estimatedTorqueNm?: number;
  toolingRequired?: string;
}

export interface HolographicExplodedConfig {
  active: boolean;
  disassemblyAmount: number; // 0 to 2.5
  mode: HolographicDisassemblyMode;
  levitationOscillation: boolean;
  hologramGridGlow: boolean;
  laserTracksVisible: boolean;
  audioEnabled: boolean;
  showPartTelemetry: boolean;
  autoOrbitCam: boolean;
  activeStepIndex: number;
  playingSequence: boolean;
}

export const DEFAULT_PBR_SETTINGS: PBRReviewSettings = {
  channel: 'lit',
  environmentPreset: 'clean_studio',
  envIntensity: 1.0,
  envRotationDeg: 0,
  envBlur: 0.1,
  exposure: 1.0,
  toneMapping: 'aces',
  shadowIntensity: 0.8,
  keyLightIntensity: 1.5,
  fillLightIntensity: 0.6,
  rimLightIntensity: 1.2,
  keyLightColor: '#ffffff',
  fillLightColor: '#93c5fd',
  rimLightColor: '#38bdf8',
  groundContactShadow: true,
  bloomGlow: true,
  specularSheen: true,
};

export const DEFAULT_HOLOGRAPHIC_CONFIG: HolographicExplodedConfig = {
  active: false,
  disassemblyAmount: 0.8,
  mode: 'radial',
  levitationOscillation: true,
  hologramGridGlow: true,
  laserTracksVisible: true,
  audioEnabled: true,
  showPartTelemetry: true,
  autoOrbitCam: false,
  activeStepIndex: 0,
  playingSequence: false,
};

// ================= SMART AUTO-ALIGN SYSTEM =================
export type AutoAlignDirection =
  | 'center_all'
  | 'center_x'
  | 'center_y'
  | 'center_z'
  | 'flush_min_x'
  | 'flush_max_x'
  | 'flush_min_y'
  | 'flush_max_y'
  | 'flush_min_z'
  | 'flush_max_z'
  | 'stack_up_y'
  | 'stack_down_y'
  | 'concentric_axial'
  | 'ground_to_bottom'
  | 'distribute_linear_x'
  | 'distribute_linear_y'
  | 'distribute_linear_z';

export interface AutoAlignOptions {
  direction: AutoAlignDirection;
  referenceTarget: 'anchor_part' | 'assembly_bbox' | 'origin_ground';
  anchorPartId?: string;
  spacingOffsetMm?: number;
  preserveRelativeOffset?: boolean;
}

// ================= ADVANCED CLASH DETECTION =================
export type ClashSeverity = 'critical_clash' | 'soft_interference' | 'clearance_touch';

export interface AdvancedClashItem {
  id: string;
  partAId: string;
  partBId: string;
  partAName: string;
  partBName: string;
  categoryA: string;
  categoryB: string;
  severity: ClashSeverity;
  overlapVolumeMm3: number;
  penetrationDepthMm: number;
  minClearanceDistanceMm: number;
  clashCenterPoint: [number, number, number];
  boundingBoxIntersection: {
    min: [number, number, number];
    max: [number, number, number];
  };
  ignored?: boolean;
  notes?: string;
}

export interface ClashDetectionSettings {
  clearanceToleranceMm: number; // e.g. 0.5mm minimum clearance
  includeFasteners: boolean;
  highlightClashingMeshes: boolean;
  showBoundingHulls: boolean;
  filterSeverity: 'all' | 'critical' | 'interference';
}

// ================= KINEMATIC MOTION PLAYER & JOINTS =================
export type KinematicJointType = 
  | 'revolute'      // 1-DOF Rotation (hinge/gear/motor)
  | 'prismatic'     // 1-DOF Linear translation (slider/piston/actuator)
  | 'cylindrical'   // 2-DOF (Screw / combined slide + rotate)
  | 'four_bar'      // Multibar planar linkage
  | 'cam_follower'  // Cam & spring follower
  | 'spherical';    // 3-DOF Ball joint

export interface KinematicJoint {
  id: string;
  name: string;
  type: KinematicJointType;
  parentPartId: string;
  childPartId: string;
  anchorPoint: [number, number, number];
  axisVector: [number, number, number]; // [0,0,1], [1,0,0], etc.
  currentValue: number; // Angle (deg) or Distance (mm)
  minLimit: number;
  maxLimit: number;
  speed: number; // deg/s or mm/s
  direction: 1 | -1;
  cycleType: 'oscillate' | 'continuous' | 'pingpong' | 'step_sweep';
  active: boolean;
  trajectoryColor?: string;
  mechanicalRatio?: number; // Gear ratio or lead pitch (mm/rev)
}

export interface KinematicSimulationState {
  isPlaying: boolean;
  speedMultiplier: number;
  timeSeconds: number;
  showTrajectories: boolean;
  stopOnClash: boolean;
  loopPlayback: boolean;
}

// ================= CAD LAYER & TAGGING SYSTEM =================
export interface CADLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  wireframeOnly: boolean;
  opacity: number;
  order: number;
  description?: string;
}

export interface CADTag {
  id: string;
  label: string;
  color: string;
  category?: string;
}

export const DEFAULT_CAD_LAYERS: CADLayer[] = [
  { id: 'layer_chassis', name: 'Chassis & Outer Shell', color: '#38bdf8', visible: true, locked: false, wireframeOnly: false, opacity: 1.0, order: 0 },
  { id: 'layer_pcb', name: 'Electronics & Logic Boards', color: '#34d399', visible: true, locked: false, wireframeOnly: false, opacity: 1.0, order: 1 },
  { id: 'layer_optics', name: 'Optics & Sensors', color: '#a78bfa', visible: true, locked: false, wireframeOnly: false, opacity: 1.0, order: 2 },
  { id: 'layer_power', name: 'Power Cell & Thermals', color: '#fb923c', visible: true, locked: false, wireframeOnly: false, opacity: 1.0, order: 3 },
  { id: 'layer_io', name: 'I/O & Transducers', color: '#f472b6', visible: true, locked: false, wireframeOnly: false, opacity: 1.0, order: 4 },
  { id: 'layer_fasteners', name: 'Fasteners & Mates', color: '#94a3b8', visible: true, locked: false, wireframeOnly: false, opacity: 1.0, order: 5 },
];

export const DEFAULT_CAD_TAGS: CADTag[] = [
  { id: 'tag_critical', label: 'Safety Critical', color: '#ef4444' },
  { id: 'tag_rf', label: 'RF Shielded', color: '#8b5cf6' },
  { id: 'tag_thermal', label: 'Thermal Zone A', color: '#f97316' },
  { id: 'tag_waterproof', label: 'IP68 Sealed', color: '#06b6d4' },
  { id: 'tag_recycled', label: '100% Recycled', color: '#10b981' },
  { id: 'tag_fastener', label: 'Standard M2.0', color: '#64748b' },
];

// ================= DESIGN ANALYTICS & TELEMETRY =================
export interface DesignAnalyticsMetrics {
  totalMassGrams: number;
  totalVolumeCm3: number;
  totalSurfaceAreaCm2: number;
  centerOfMass: [number, number, number];
  estimatedBOMCostUsd: number;
  carbonFootprintKgCo2: number;
  totalHeatDissipationWatts: number;
  structuralRiskIndex: number; // 0 to 100
  partCount: number;
  massDistribution: { category: string; massGrams: number; percentage: number; color: string }[];
  costDistribution: { category: string; costUsd: number; percentage: number; color: string }[];
  sustainabilityRating: 'A+' | 'A' | 'B' | 'C' | 'D';
}

// ================= DESIGN VERSIONING & REVISIONS =================
export interface DesignVersion {
  id: string;
  versionNumber: string; // e.g. "v1.0.0", "v1.1.2"
  title: string;
  description: string;
  author: string;
  timestamp: string;
  tag?: 'milestone' | 'release' | 'wip' | 'review' | 'prototype';
  objects: CADObject[];
  constraints?: CADConstraint[];
  metricsSummary: {
    partCount: number;
    totalMassGrams: number;
    bomCostUsd: number;
  };
  changeLog?: string[];
}

export interface VersionDiffResult {
  versionA: DesignVersion;
  versionB: DesignVersion;
  addedParts: CADObject[];
  removedParts: CADObject[];
  modifiedParts: {
    partId: string;
    name: string;
    changes: string[];
  }[];
  deltaMassGrams: number;
  deltaCostUsd: number;
  deltaPartCount: number;
}

// ================= BOM (BILL OF MATERIALS) =================
export interface BOMRowItem {
  id: string;
  partId: string;
  itemNumber: number;
  name: string;
  category: string;
  materialName: string;
  materialType: string;
  quantity: number;
  dimensionsFormatted: string;
  unitVolumeCm3: number;
  totalVolumeCm3: number;
  densityGPerCm3: number;
  unitMassGrams: number;
  totalMassGrams: number;
  unitCostUsd: number;
  totalCostUsd: number;
  supplierSKU: string;
  manufacturingProcess: string;
  leadTimeWeeks: number;
  status: 'approved' | 'pending' | 'custom' | 'off_the_shelf';
}

export interface BOMReportSummary {
  assemblyName: string;
  generatedDate: string;
  author: string;
  totalComponents: number;
  uniqueParts: number;
  totalMassKg: number;
  totalCostUsd: number;
  currency: string;
  items: BOMRowItem[];
  categoryBreakdown: {
    category: string;
    partCount: number;
    totalMassGrams: number;
    totalCostUsd: number;
  }[];
}

// ================= 3D MEASURING TOOL =================
export type MeasureMode = 'point_to_point' | 'vertex_snap' | 'bounding_box' | 'angle_3point';

export interface CADMeasurement {
  id: string;
  name: string;
  mode: MeasureMode;
  pointA: [number, number, number];
  pointB: [number, number, number];
  pointC?: [number, number, number]; // For 3-point angle
  distanceMm: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  angleDeg?: number;
  color: string;
  visible: boolean;
  notes?: string;
  createdAt: string;
}

// ================= COLLABORATIVE 3D COMMENTS & ANNOTATIONS =================
export type CommentStatus = 'open' | 'in_review' | 'resolved';
export type CommentCategory = 'design_change' | 'material_check' | 'tolerance_issue' | 'electrical_note' | 'general';

export interface CADCommentReply {
  id: string;
  author: string;
  avatarColor: string;
  text: string;
  timestamp: string;
}

export interface CADCommentPin {
  id: string;
  title: string;
  text: string;
  author: string;
  authorInitials: string;
  avatarColor: string;
  position: [number, number, number]; // 3D coordinate in world space
  normalVector?: [number, number, number]; // Surface normal if placed on mesh
  targetPartId?: string;
  targetPartName?: string;
  status: CommentStatus;
  category: CommentCategory;
  createdAt: string;
  replies: CADCommentReply[];
  resolvedAt?: string;
  resolvedBy?: string;
}

// ================= THEME MODES =================
export type StudioThemeMode = 'dark' | 'light' | 'blueprint';


