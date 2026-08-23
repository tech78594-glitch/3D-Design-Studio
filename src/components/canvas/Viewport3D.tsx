import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  CADObject,
  DesignSection,
  RenderMode,
  LightingPreset,
  TransformMode,
  DeviceConfig,
  BuildingConfig,
  SnapshotItem,
  PBRReviewSettings,
  CADConstraint,
  CADMeasurement,
  CADCommentPin,
  StudioThemeMode,
  CADEdge,
  ExplodedTrailsSettings,
} from '../../types/cad';
import { createCADGeometry, createCADMaterial } from '../../utils/cadEngine';
import {
  extractSceneEdges,
  pickNearestEdge,
  createEdgeSelectionVisuals,
  findConnectedEdgeLoop,
} from '../../utils/edgeSelection';
import {
  generateExplodedTrails,
  createExplodedTrailsGroup,
  DEFAULT_EXPLODED_TRAILS_SETTINGS,
} from '../../utils/explodedTrails';
import {
  Camera,
  RotateCcw,
  Layers,
  Ruler,
  Crosshair,
  Zap,
  Paintbrush,
  MessageSquare,
} from 'lucide-react';

interface Viewport3DProps {
  section: DesignSection;
  objects: CADObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObjectTransform: (
    id: string,
    transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }
  ) => void;
  renderMode: RenderMode;
  lightingPreset: LightingPreset;
  transformMode: TransformMode;
  deviceConfig: DeviceConfig;
  buildingConfig: BuildingConfig;
  gridVisible: boolean;
  snapEnabled: boolean;
  snapStep: number;
  pbrSettings?: PBRReviewSettings;
  constraints?: CADConstraint[];
  measurements?: CADMeasurement[];
  onAddMeasurement?: (m: CADMeasurement) => void;
  comments?: CADCommentPin[];
  onSelectCommentPin?: (pinId: string) => void;
  themeMode?: StudioThemeMode;
  onOpenMaterialLibrary?: () => void;
  onOpenSnapshotStudio?: () => void;
  onOpenPBRReview?: () => void;
  onOpenHolographicStudio?: () => void;
  onOpenMeasuringTool?: () => void;
  onOpenCommentsModal?: () => void;
  onOpenVersionModal?: () => void;
  onOpenBOMModal?: () => void;
  onRegisterSnapshotCapture?: (
    captureFn: (options: {
      resolutionMultiplier: number;
      transparentBg: boolean;
      includeWatermark: boolean;
      aspectRatio: string;
    }) => Promise<SnapshotItem | null>
  ) => void;
  onRestoreCameraState?: (camState: any) => void;
  onUpdateStarkPartOffset?: (id: string, offset: [number, number, number] | null) => void;
  // Exploded Trails & Smart Edge Selection Props
  isEdgeSelectionMode?: boolean;
  selectedEdges?: CADEdge[];
  onSelectEdge?: (edge: CADEdge | null, edgeLoop?: CADEdge[]) => void;
  showExplodedTrails?: boolean;
  explodedTrailsSettings?: ExplodedTrailsSettings;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  section,
  objects,
  selectedObjectId,
  onSelectObject,
  renderMode,
  lightingPreset,
  transformMode,
  deviceConfig,
  buildingConfig,
  gridVisible,
  pbrSettings,
  measurements = [],
  onAddMeasurement,
  comments = [],
  onSelectCommentPin,
  themeMode = 'dark',
  onOpenMaterialLibrary,
  onOpenSnapshotStudio,
  onOpenMeasuringTool,
  onOpenCommentsModal,
  onRegisterSnapshotCapture,
  isEdgeSelectionMode = false,
  selectedEdges = [],
  onSelectEdge,
  showExplodedTrails = true,
  explodedTrailsSettings = DEFAULT_EXPLODED_TRAILS_SETTINGS,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.Group | null>(null);
  const selectionHelperRef = useRef<THREE.BoxHelper | null>(null);
  const slicePlaneRef = useRef<THREE.Plane | null>(null);
  const starkLinesGroupRef = useRef<THREE.Group | null>(null);
  const explodedTrailsGroupRef = useRef<THREE.Group | null>(null);
  const edgeVisualsGroupRef = useRef<THREE.Group | null>(null);
  const measurementsGroupRef = useRef<THREE.Group | null>(null);
  const commentsGroupRef = useRef<THREE.Group | null>(null);

  // Hovered edge for smart selection
  const [hoveredEdge, setHoveredEdge] = useState<CADEdge | null>(null);

  // Orbit navigation state
  const isDraggingRef = useRef(false);
  const dragButtonRef = useRef(0);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 250, theta: Math.PI / 4, phi: Math.PI / 3 });
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));

  // FPS Diagnostics & UI states
  const [fps, setFps] = useState<number>(60);
  const [activeCamView, setActiveCamView] = useState<'iso' | 'top' | 'front' | 'right'>('iso');
  const [dimensionsOverlay, setDimensionsOverlay] = useState<boolean>(true);
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);

  // Clock for smooth animations and holographic float
  const clockRef = useRef(new THREE.Clock());

  // Stark / Exploded Mode Displacement Calculator
  const calculateObjectDisplacement = useCallback(
    (obj: CADObject, index: number, timeSec: number) => {
      if (section !== 'technology') {
        return {
          position: obj.position,
          rotation: obj.rotation,
        };
      }

      const starkActive = !!deviceConfig.starkModeEnabled;
      const separation = deviceConfig.starkSeparationAmount ?? 0;
      const exploded = deviceConfig.explodedAmount ?? 0;
      const effectiveSeparation = Math.max(starkActive ? separation : 0, exploded);

      if (effectiveSeparation <= 0.001) {
        return {
          position: obj.position,
          rotation: obj.rotation,
        };
      }

      // Check manual pull offset override
      const manualPull = deviceConfig.starkPullOffsets?.[obj.id];
      if (manualPull) {
        return {
          position: [
            obj.position[0] + manualPull[0],
            obj.position[1] + manualPull[1],
            obj.position[2] + manualPull[2],
          ] as [number, number, number],
          rotation: obj.rotation,
        };
      }

      const preset = deviceConfig.starkSeparationPreset || 'radial';
      let deltaX = 0;
      let deltaY = 0;
      let deltaZ = 0;

      // Base category order separation vectors
      const categorySeparationVector: Record<string, [number, number, number]> = {
        screen: [0, 0, 85],
        glass: [0, 0, 95],
        battery: [0, -15, -45],
        pcb: [0, 0, 0],
        camera: [18, 52, 60],
        sensor: [0, 50, 40],
        port: [0, -75, -20],
        casing: [0, 0, -85],
        internal: [0, 0, -25],
        fastener: [0, 0, 110],
      };

      const baseVec = categorySeparationVector[obj.category] || [0, 0, (index - 4) * 20];

      if (preset === 'axial_z') {
        deltaZ = baseVec[2] * effectiveSeparation * 1.5;
        deltaX = baseVec[0] * effectiveSeparation * 0.2;
        deltaY = baseVec[1] * effectiveSeparation * 0.2;
      } else if (preset === 'radial') {
        deltaX = (obj.position[0] !== 0 ? Math.sign(obj.position[0]) * 50 : (index % 2 === 0 ? 35 : -35)) * effectiveSeparation;
        deltaY = (obj.position[1] !== 0 ? Math.sign(obj.position[1]) * 40 : 0) * effectiveSeparation;
        deltaZ = baseVec[2] * effectiveSeparation * 1.2;
      } else if (preset === 'spherical') {
        const theta = (index / Math.max(1, objects.length)) * Math.PI * 2;
        deltaX = Math.cos(theta) * 70 * effectiveSeparation;
        deltaY = Math.sin(theta) * 70 * effectiveSeparation;
        deltaZ = (index % 2 === 0 ? 40 : -40) * effectiveSeparation;
      } else if (preset === 'stark_heroic') {
        deltaX = baseVec[0] * effectiveSeparation * 1.3;
        deltaY = baseVec[1] * effectiveSeparation * 1.3;
        deltaZ = baseVec[2] * effectiveSeparation * 1.8;
      }

      // Harmonic levitation floating oscillation
      if (deviceConfig.starkLevitationActive) {
        const floatSpeed = 1.8;
        const floatAmp = 2.5;
        deltaY += Math.sin(timeSec * floatSpeed + index * 0.8) * floatAmp;
        deltaZ += Math.cos(timeSec * floatSpeed * 0.7 + index * 0.5) * (floatAmp * 0.6);
      }

      return {
        position: [
          obj.position[0] + deltaX,
          obj.position[1] + deltaY,
          obj.position[2] + deltaZ,
        ] as [number, number, number],
        rotation: obj.rotation,
      };
    },
    [
      section,
      deviceConfig.starkModeEnabled,
      deviceConfig.starkSeparationAmount,
      deviceConfig.explodedAmount,
      deviceConfig.starkPullOffsets,
      deviceConfig.starkSeparationPreset,
      deviceConfig.starkLevitationActive,
      objects.length,
    ]
  );

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(
      themeMode === 'light' ? '#f8fafc' : themeMode === 'blueprint' ? '#021833' : '#0f1117'
    );
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    const initialDistance = section === 'technology' ? 240 : 45;
    sphericalRef.current.radius = initialDistance;
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.localClippingEnabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting group
    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;

    // Grid group
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    gridHelperRef.current = gridGroup;

    // Stark Hologram Laser Guidelines Group
    const starkLinesGroup = new THREE.Group();
    scene.add(starkLinesGroup);
    starkLinesGroupRef.current = starkLinesGroup;

    // Interactive Exploded Assembly Trails Group
    const explodedTrailsGroup = new THREE.Group();
    scene.add(explodedTrailsGroup);
    explodedTrailsGroupRef.current = explodedTrailsGroup;

    // Smart Edge Selection & Feature Highlighting Group
    const edgeVisualsGroup = new THREE.Group();
    scene.add(edgeVisualsGroup);
    edgeVisualsGroupRef.current = edgeVisualsGroup;

    // 3D Measurement Visual Calipers Group
    const measurementsGroup = new THREE.Group();
    scene.add(measurementsGroup);
    measurementsGroupRef.current = measurementsGroup;

    // 3D Comment Pins Group
    const commentsGroup = new THREE.Group();
    scene.add(commentsGroup);
    commentsGroupRef.current = commentsGroup;

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
        if (cameraRef.current instanceof THREE.PerspectiveCamera) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
        }
        rendererRef.current.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Animation Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // FPS tracking
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      const timeSec = clockRef.current.getElapsedTime();

      // Dynamic update for harmonic levitation in Stark Mode
      if (deviceConfig.starkModeEnabled || deviceConfig.starkLevitationActive) {
        const meshMap = meshMapRef.current;
        objects.forEach((obj, idx) => {
          const mesh = meshMap.get(obj.id);
          if (mesh && mesh.visible) {
            const tr = calculateObjectDisplacement(obj, idx, timeSec);
            mesh.position.set(tr.position[0], tr.position[1], tr.position[2]);
            mesh.rotation.set(tr.rotation[0], tr.rotation[1], tr.rotation[2]);
          }
        });
      }

      // Rotate comment pin beacons gently
      if (commentsGroupRef.current) {
        commentsGroupRef.current.children.forEach((child, i) => {
          child.rotation.y = timeSec * 1.2 + i;
        });
      }

      // Update camera position from spherical coordinates
      if (cameraRef.current && !buildingConfig.viewMode2D) {
        const s = sphericalRef.current;
        const x = s.radius * Math.sin(s.phi) * Math.sin(s.theta) + targetRef.current.x;
        const y = s.radius * Math.cos(s.phi) + targetRef.current.y;
        const z = s.radius * Math.sin(s.phi) * Math.cos(s.theta) + targetRef.current.z;
        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(targetRef.current);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [calculateObjectDisplacement, buildingConfig.viewMode2D, deviceConfig.starkLevitationActive, deviceConfig.starkModeEnabled, objects, themeMode]);

  // Update Theme Mode Background
  useEffect(() => {
    if (!sceneRef.current) return;
    if (themeMode === 'light') {
      sceneRef.current.background = new THREE.Color('#f8fafc');
    } else if (themeMode === 'blueprint') {
      sceneRef.current.background = new THREE.Color('#021833');
    } else {
      sceneRef.current.background = new THREE.Color('#0f1117');
    }
  }, [themeMode]);

  // Update Section & Initial View Setup
  useEffect(() => {
    if (section === 'technology') {
      sphericalRef.current = { radius: 240, theta: Math.PI / 4, phi: Math.PI / 3 };
      targetRef.current.set(0, 0, 0);
    } else {
      sphericalRef.current = { radius: 45, theta: Math.PI / 3.5, phi: Math.PI / 3.2 };
      targetRef.current.set(0, 3, 0);
    }
  }, [section]);

  // Update Environment Lighting
  useEffect(() => {
    const lightsGroup = lightsGroupRef.current;
    if (!lightsGroup) return;

    while (lightsGroup.children.length > 0) {
      const light = lightsGroup.children[0];
      lightsGroup.remove(light);
    }

    if (section === 'building') {
      const hour = buildingConfig.timeOfDay;
      const angle = ((hour - 6) / 14) * Math.PI;
      const sunHeight = Math.sin(angle) * 35;
      const sunDist = Math.cos(angle) * 35;

      const sunLight = new THREE.DirectionalLight(
        hour < 8 || hour > 17 ? '#fed7aa' : '#ffffff',
        buildingConfig.sunIntensity * 2.2
      );
      sunLight.position.set(sunDist, Math.max(4, sunHeight), 25);
      sunLight.castShadow = buildingConfig.shadowsEnabled;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 150;
      const d = 30;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      lightsGroup.add(sunLight);

      const skyHemisphere = new THREE.HemisphereLight('#93c5fd', '#334155', 0.85);
      lightsGroup.add(skyHemisphere);

      const softFill = new THREE.DirectionalLight('#e0f2fe', 0.4);
      softFill.position.set(-20, 15, -20);
      lightsGroup.add(softFill);
    } else {
      if (pbrSettings) {
        const keyColor = pbrSettings.keyLightColor || '#ffffff';
        const keyIntensity = (pbrSettings.keyLightIntensity ?? 2.0) * (pbrSettings.envIntensity ?? 1.0);
        const keyLight = new THREE.DirectionalLight(keyColor, keyIntensity);
        keyLight.position.set(120, 160, 140);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 10;
        keyLight.shadow.camera.far = 500;
        const d = 150;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.0005;
        lightsGroup.add(keyLight);

        const fillColor = pbrSettings.fillLightColor || '#cbd5e1';
        const fillIntensity = (pbrSettings.fillLightIntensity ?? 1.0) * (pbrSettings.envIntensity ?? 1.0);
        const fillLight = new THREE.DirectionalLight(fillColor, fillIntensity);
        fillLight.position.set(-140, 80, -100);
        lightsGroup.add(fillLight);

        const rimColor = pbrSettings.rimLightColor || '#38bdf8';
        const rimIntensity = (pbrSettings.rimLightIntensity ?? 1.4) * (pbrSettings.envIntensity ?? 1.0);
        const rimBacklight = new THREE.DirectionalLight(rimColor, rimIntensity);
        rimBacklight.position.set(0, -100, -150);
        lightsGroup.add(rimBacklight);

        const ambientLight = new THREE.AmbientLight('#ffffff', 0.6 * (pbrSettings.envIntensity ?? 1.0));
        lightsGroup.add(ambientLight);
      } else if (lightingPreset === 'studio') {
        const keyLight = new THREE.DirectionalLight('#ffffff', 2.0);
        keyLight.position.set(120, 160, 140);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 10;
        keyLight.shadow.camera.far = 500;
        const d = 150;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.0005;
        lightsGroup.add(keyLight);

        const fillLight = new THREE.DirectionalLight('#cbd5e1', 1.0);
        fillLight.position.set(-140, 80, -100);
        lightsGroup.add(fillLight);

        const rimBacklight = new THREE.DirectionalLight('#38bdf8', 1.4);
        rimBacklight.position.set(0, -100, -150);
        lightsGroup.add(rimBacklight);

        const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
        lightsGroup.add(ambientLight);
      } else if (lightingPreset === 'cyberpunk') {
        const keyCyan = new THREE.DirectionalLight('#06b6d4', 2.5);
        keyCyan.position.set(100, 100, 100);
        keyCyan.castShadow = true;
        lightsGroup.add(keyCyan);

        const fillMagenta = new THREE.DirectionalLight('#ec4899', 2.2);
        fillMagenta.position.set(-120, 50, -80);
        lightsGroup.add(fillMagenta);

        const ambientDark = new THREE.AmbientLight('#1e1b4b', 0.7);
        lightsGroup.add(ambientDark);
      } else if (lightingPreset === 'warm_sun') {
        const warmSun = new THREE.DirectionalLight('#fde047', 2.4);
        warmSun.position.set(150, 120, 90);
        warmSun.castShadow = true;
        lightsGroup.add(warmSun);

        const ambientWarm = new THREE.AmbientLight('#451a03', 0.8);
        lightsGroup.add(ambientWarm);
      } else {
        const coolKey = new THREE.DirectionalLight('#e0f2fe', 2.0);
        coolKey.position.set(80, 150, 120);
        lightsGroup.add(coolKey);

        const coolAmb = new THREE.AmbientLight('#0f172a', 1.0);
        lightsGroup.add(coolAmb);
      }
    }
  }, [lightingPreset, section, buildingConfig.timeOfDay, buildingConfig.sunIntensity, buildingConfig.shadowsEnabled, pbrSettings]);

  // Update Grid Helper
  useEffect(() => {
    const gridGroup = gridHelperRef.current;
    if (!gridGroup) return;

    while (gridGroup.children.length > 0) {
      gridGroup.remove(gridGroup.children[0]);
    }

    if (!gridVisible) return;

    const primaryColor = themeMode === 'light' ? '#64748b' : themeMode === 'blueprint' ? '#00e5ff' : '#0284c7';
    const secondaryColor = themeMode === 'light' ? '#cbd5e1' : themeMode === 'blueprint' ? '#083364' : '#1e293b';

    if (section === 'technology') {
      const grid = new THREE.GridHelper(300, 30, primaryColor, secondaryColor);
      grid.position.y = -deviceConfig.dimensions.height / 2 - 20;
      gridGroup.add(grid);

      const axes = new THREE.AxesHelper(30);
      axes.position.copy(grid.position);
      gridGroup.add(axes);
    } else {
      const grid = new THREE.GridHelper(50, 50, primaryColor, secondaryColor);
      grid.position.y = -0.01;
      gridGroup.add(grid);

      const axes = new THREE.AxesHelper(10);
      axes.position.copy(grid.position);
      gridGroup.add(axes);
    }
  }, [gridVisible, section, deviceConfig.dimensions.height, themeMode]);

  // Update Slicing Plane
  useEffect(() => {
    if (deviceConfig.slicePlaneEnabled && section === 'technology') {
      let normal = new THREE.Vector3(0, 1, 0);
      if (deviceConfig.sliceAxis === 'x') normal = new THREE.Vector3(1, 0, 0);
      if (deviceConfig.sliceAxis === 'z') normal = new THREE.Vector3(0, 0, 1);
      slicePlaneRef.current = new THREE.Plane(normal, deviceConfig.sliceOffset);
    } else {
      slicePlaneRef.current = null;
    }
  }, [deviceConfig.slicePlaneEnabled, deviceConfig.sliceAxis, deviceConfig.sliceOffset, section]);

  // Render CAD Objects & Meshes into Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const meshMap = meshMapRef.current;
    const currentObjectIds = new Set(objects.map(o => o.id));

    // Remove obsolete meshes
    meshMap.forEach((mesh, id) => {
      if (!currentObjectIds.has(id)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
        meshMap.delete(id);
      }
    });

    const timeSec = clockRef.current.getElapsedTime();

    // Add or update meshes
    objects.forEach((obj, idx) => {
      let mesh = meshMap.get(obj.id);

      const isVisibleByFloor =
        section === 'building' && buildingConfig.activeFloor !== -1
          ? obj.architecturalProps?.floorLevel === buildingConfig.activeFloor ||
            obj.architecturalProps?.floorLevel === undefined
          : true;

      const shouldBeVisible = obj.visible && isVisibleByFloor;

      if (!mesh) {
        const geom = createCADGeometry(obj);
        const mat = createCADMaterial(
          obj.material,
          renderMode,
          deviceConfig.thermalSimActive,
          obj.electricalProps?.heatWattage,
          slicePlaneRef.current,
          pbrSettings?.channel || 'lit'
        );
        mesh = new THREE.Mesh(geom, mat);
        mesh.name = obj.id;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        meshMap.set(obj.id, mesh);
      } else {
        mesh.geometry.dispose();
        mesh.geometry = createCADGeometry(obj);

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
        mesh.material = createCADMaterial(
          obj.material,
          renderMode,
          deviceConfig.thermalSimActive,
          obj.electricalProps?.heatWattage,
          slicePlaneRef.current,
          pbrSettings?.channel || 'lit'
        );
      }

      mesh.visible = shouldBeVisible;

      // Position from Stark / Explode Disassembly Calculator
      const tr = calculateObjectDisplacement(obj, idx, timeSec);
      mesh.position.set(tr.position[0], tr.position[1], tr.position[2]);
      mesh.rotation.set(tr.rotation[0], tr.rotation[1], tr.rotation[2]);
      mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
    });

    // Update selection highlight helper box
    if (selectionHelperRef.current) {
      scene.remove(selectionHelperRef.current);
      selectionHelperRef.current.dispose();
      selectionHelperRef.current = null;
    }

    if (selectedObjectId) {
      const selectedMesh = meshMap.get(selectedObjectId);
      if (selectedMesh && selectedMesh.visible) {
        const boxHelper = new THREE.BoxHelper(selectedMesh, new THREE.Color('#38bdf8'));
        scene.add(boxHelper);
        selectionHelperRef.current = boxHelper;
      }
    }

    // Update Holographic Stark Guidelines between separated parts and origins
    const starkLinesGroup = starkLinesGroupRef.current;
    if (starkLinesGroup) {
      while (starkLinesGroup.children.length > 0) {
        const line = starkLinesGroup.children[0];
        starkLinesGroup.remove(line);
      }

      const isStarkActive = !!deviceConfig.starkModeEnabled;
      const isSeparated = (deviceConfig.starkSeparationAmount || 0) > 0.1 || deviceConfig.explodedAmount > 0.1;

      if (section === 'technology' && (isStarkActive || isSeparated)) {
        const lineMatNormal = new THREE.LineDashedMaterial({
          color: '#0284c7',
          dashSize: 2,
          gapSize: 2,
          opacity: 0.5,
          transparent: true,
        });

        const lineMatSelected = new THREE.LineBasicMaterial({
          color: '#38bdf8',
          linewidth: 2,
          opacity: 0.9,
          transparent: true,
        });

        objects.forEach((obj, idx) => {
          if (!obj.visible) return;
          const tr = calculateObjectDisplacement(obj, idx, timeSec);
          const orig = new THREE.Vector3(...obj.position);
          const current = new THREE.Vector3(...tr.position);

          if (orig.distanceTo(current) > 3) {
            const geom = new THREE.BufferGeometry().setFromPoints([orig, current]);
            const isSelected = selectedObjectId === obj.id;
            const line = new THREE.Line(geom, isSelected ? lineMatSelected : lineMatNormal);
            line.computeLineDistances();
            starkLinesGroup.add(line);
          }
        });
      }
    }
  }, [
    objects,
    renderMode,
    deviceConfig.explodedAmount,
    deviceConfig.starkModeEnabled,
    deviceConfig.starkSeparationAmount,
    deviceConfig.starkSeparationPreset,
    deviceConfig.starkPullOffsets,
    deviceConfig.thermalSimActive,
    deviceConfig.slicePlaneEnabled,
    deviceConfig.sliceAxis,
    deviceConfig.sliceOffset,
    buildingConfig.activeFloor,
    selectedObjectId,
    section,
    calculateObjectDisplacement,
    pbrSettings,
  ]);

  // Extract Scene Edges for Smart Edge Selection Mode
  const extractedSceneEdges = useMemo(() => {
    if (!isEdgeSelectionMode) return [];
    return extractSceneEdges(objects, 24);
  }, [objects, isEdgeSelectionMode]);

  // Render Interactive Exploded Trails
  useEffect(() => {
    const group = explodedTrailsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    if (section === 'technology' && showExplodedTrails) {
      const trails = generateExplodedTrails(objects, deviceConfig, explodedTrailsSettings);
      if (trails.length > 0) {
        const visualTrailsGroup = createExplodedTrailsGroup(trails, explodedTrailsSettings);
        while (visualTrailsGroup.children.length > 0) {
          const c = visualTrailsGroup.children[0];
          group.add(c);
        }
      }
    }
  }, [
    objects,
    section,
    showExplodedTrails,
    explodedTrailsSettings,
    deviceConfig.explodedAmount,
    deviceConfig.starkSeparationAmount,
    deviceConfig.starkModeEnabled,
  ]);

  // Render Smart Edge Selection Highlights
  useEffect(() => {
    const group = edgeVisualsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    if (isEdgeSelectionMode) {
      const visuals = createEdgeSelectionVisuals(selectedEdges, hoveredEdge);
      while (visuals.children.length > 0) {
        const c = visuals.children[0];
        group.add(c);
      }
    }
  }, [isEdgeSelectionMode, selectedEdges, hoveredEdge]);

  // Render 3D Measurement Visual Calipers in Scene
  useEffect(() => {
    const group = measurementsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    const sphereGeom = new THREE.SphereGeometry(section === 'technology' ? 1.5 : 0.2, 16, 16);

    measurements.forEach(m => {
      if (m.visible === false) return;

      const pA = new THREE.Vector3(...m.pointA);
      const pB = new THREE.Vector3(...m.pointB);
      const color = m.color || '#06b6d4';

      const lineMat = new THREE.LineDashedMaterial({
        color,
        dashSize: 2,
        gapSize: 1,
        linewidth: 2,
      });

      const geom = new THREE.BufferGeometry().setFromPoints([pA, pB]);
      const line = new THREE.Line(geom, lineMat);
      line.computeLineDistances();
      group.add(line);

      // Sphere end caps
      const sphereMat = new THREE.MeshBasicMaterial({ color });
      const sphereA = new THREE.Mesh(sphereGeom, sphereMat);
      sphereA.position.copy(pA);
      group.add(sphereA);

      const sphereB = new THREE.Mesh(sphereGeom, sphereMat);
      sphereB.position.copy(pB);
      group.add(sphereB);

      // Midpoint measurement tick
      const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      const tickGeom = new THREE.SphereGeometry(section === 'technology' ? 1.0 : 0.15, 12, 12);
      const tickMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const tickMesh = new THREE.Mesh(tickGeom, tickMat);
      tickMesh.position.copy(mid);
      group.add(tickMesh);
    });
  }, [measurements, section]);

  // Render 3D Comment Pins in Scene
  useEffect(() => {
    const group = commentsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    comments.forEach(pin => {
      const pinContainer = new THREE.Group();
      pinContainer.name = `comment_pin_${pin.id}`;

      const pos = new THREE.Vector3(...pin.position);
      const pinColor = pin.status === 'resolved' ? '#10b981' : pin.status === 'in_progress' ? '#f59e0b' : '#6366f1';

      // Pin stalk line
      const stalkHeight = section === 'technology' ? 8 : 1.2;
      const topPos = new THREE.Vector3(pos.x, pos.y + stalkHeight, pos.z);
      const stalkGeom = new THREE.BufferGeometry().setFromPoints([pos, topPos]);
      const stalkMat = new THREE.LineBasicMaterial({ color: pinColor, linewidth: 2 });
      const stalk = new THREE.Line(stalkGeom, stalkMat);
      pinContainer.add(stalk);

      // Pin head sphere
      const headGeom = new THREE.SphereGeometry(section === 'technology' ? 2.5 : 0.35, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: pinColor,
        emissive: pinColor,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.copy(topPos);
      head.name = `comment_pin_${pin.id}`;
      pinContainer.add(head);

      // Halo ring
      const ringGeom = new THREE.RingGeometry(
        section === 'technology' ? 3.0 : 0.45,
        section === 'technology' ? 3.6 : 0.55,
        24
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(topPos);
      pinContainer.add(ring);

      group.add(pinContainer);
    });
  }, [comments, section]);

  // Register High-Resolution Snapshot Exporter callback
  useEffect(() => {
    if (!onRegisterSnapshotCapture) return;

    const captureSnapshotFn = async (options: {
      resolutionMultiplier: number;
      transparentBg: boolean;
      includeWatermark: boolean;
      aspectRatio: string;
    }): Promise<SnapshotItem | null> => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) return null;

      const originalBg = scene.background;
      if (options.transparentBg) {
        scene.background = null;
      }

      const origSize = new THREE.Vector2();
      renderer.getSize(origSize);
      const mult = options.resolutionMultiplier || 1;

      // Render at requested scaled resolution
      renderer.setSize(origSize.x * mult, origSize.y * mult, false);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = origSize.x / origSize.y;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
      const rawDataUrl = renderer.domElement.toDataURL('image/png');

      // Restore viewport
      renderer.setSize(origSize.x, origSize.y, false);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = origSize.x / origSize.y;
        camera.updateProjectionMatrix();
      }
      scene.background = originalBg;

      const snapItem: SnapshotItem = {
        id: `snap_${Date.now()}`,
        dataUrl: rawDataUrl,
        timestamp: Date.now(),
        section,
        title: `${section === 'technology' ? 'Device' : 'Building'} Render (${options.resolutionMultiplier}x)`,
        resolution: `${Math.round(origSize.x * mult)} x ${Math.round(origSize.y * mult)}`,
        aspectRatio: options.aspectRatio,
        partCount: objects.filter(o => o.visible).length,
        cameraState: {
          radius: sphericalRef.current.radius,
          theta: sphericalRef.current.theta,
          phi: sphericalRef.current.phi,
          target: [targetRef.current.x, targetRef.current.y, targetRef.current.z],
        },
      };

      return snapItem;
    };

    onRegisterSnapshotCapture(captureSnapshotFn);
  }, [onRegisterSnapshotCapture, objects, section]);

  // Handle Pointer Events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (e.button === 0 && mountRef.current && cameraRef.current && sceneRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Smart Edge Selection picking
      if (isEdgeSelectionMode && extractedSceneEdges.length > 0) {
        const mouseCanvasPos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        const hitEdge = pickNearestEdge(
          mouseCanvasPos,
          extractedSceneEdges,
          cameraRef.current,
          rect.width,
          rect.height,
          18
        );
        if (hitEdge) {
          let loop: CADEdge[] = [];
          if (e.shiftKey) {
            loop = findConnectedEdgeLoop(hitEdge, extractedSceneEdges);
          }
          if (onSelectEdge) {
            onSelectEdge(hitEdge, loop.length > 0 ? loop : [hitEdge]);
          }
          return;
        }
      }

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Check comment pin hits first
      if (commentsGroupRef.current && onSelectCommentPin) {
        const pinMeshes: THREE.Object3D[] = [];
        commentsGroupRef.current.traverse(child => {
          if (child instanceof THREE.Mesh) pinMeshes.push(child);
        });
        const pinIntersects = raycaster.intersectObjects(pinMeshes, true);
        if (pinIntersects.length > 0) {
          const hitName = pinIntersects[0].object.name || pinIntersects[0].object.parent?.name || '';
          if (hitName.startsWith('comment_pin_')) {
            const commentId = hitName.replace('comment_pin_', '');
            onSelectCommentPin(commentId);
            return;
          }
        }
      }

      const meshes: THREE.Mesh[] = Array.from(meshMapRef.current.values()).filter(
        (m): m is THREE.Mesh => m instanceof THREE.Mesh && m.visible
      );
      const intersects = raycaster.intersectObjects(meshes, false);

      if (transformMode === 'measure') {
        if (intersects.length > 0) {
          const pt = intersects[0].point;
          setMeasurePoints(prev => {
            const next = [...prev, pt];
            if (next.length === 2) {
              const dist = next[0].distanceTo(next[1]);
              setMeasureDistance(dist);
              if (onAddMeasurement) {
                const hitObjId = intersects[0].object.name;
                onAddMeasurement({
                  id: `meas_${Date.now()}`,
                  name: `Measurement (${dist.toFixed(2)} ${section === 'technology' ? 'mm' : 'm'})`,
                  type: 'point_to_point',
                  pointA: [next[0].x, next[0].y, next[0].z],
                  pointB: [next[1].x, next[1].y, next[1].z],
                  distance: dist,
                  unit: section === 'technology' ? 'mm' : 'm',
                  color: '#06b6d4',
                  visible: true,
                  targetObjectId: hitObjId,
                  timestamp: Date.now(),
                });
              }
              return next;
            } else if (next.length > 2) {
              setMeasureDistance(null);
              return [pt];
            }
            return next;
          });
        }
        return;
      }

      if (intersects.length > 0) {
        const hitId = intersects[0].object.name;
        onSelectObject(hitId);
      } else if (!e.shiftKey) {
        onSelectObject(null);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      if (isEdgeSelectionMode && mountRef.current && cameraRef.current && extractedSceneEdges.length > 0) {
        const rect = mountRef.current.getBoundingClientRect();
        const mouseCanvasPos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        const nearest = pickNearestEdge(
          mouseCanvasPos,
          extractedSceneEdges,
          cameraRef.current,
          rect.width,
          rect.height,
          16
        );
        setHoveredEdge(nearest);
      }
      return;
    }

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (dragButtonRef.current === 0) {
      sphericalRef.current.theta -= deltaX * 0.008;
      sphericalRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, sphericalRef.current.phi - deltaY * 0.008)
      );
    } else if (dragButtonRef.current === 2 || dragButtonRef.current === 1) {
      const panSpeed = section === 'technology' ? 0.35 : 0.05;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);

      if (cameraRef.current) {
        cameraRef.current.getWorldDirection(right);
        right.cross(up).normalize();
      }

      targetRef.current.addScaledVector(right, -deltaX * panSpeed);
      targetRef.current.y += deltaY * panSpeed;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * (section === 'technology' ? 0.15 : 0.03);
    const minZoom = section === 'technology' ? 20 : 3;
    const maxZoom = section === 'technology' ? 800 : 150;
    sphericalRef.current.radius = Math.max(minZoom, Math.min(maxZoom, sphericalRef.current.radius + zoomFactor));
  };

  // Camera Presets
  const setCameraView = (view: 'iso' | 'top' | 'front' | 'right') => {
    setActiveCamView(view);
    const radius = sphericalRef.current.radius;
    if (view === 'iso') {
      sphericalRef.current = { radius, theta: Math.PI / 4, phi: Math.PI / 3 };
    } else if (view === 'top') {
      sphericalRef.current = { radius, theta: 0, phi: 0.001 };
    } else if (view === 'front') {
      sphericalRef.current = { radius, theta: 0, phi: Math.PI / 2 };
    } else if (view === 'right') {
      sphericalRef.current = { radius, theta: Math.PI / 2, phi: Math.PI / 2 };
    }
  };

  const resetCamera = () => {
    targetRef.current.set(0, section === 'technology' ? 0 : 3, 0);
    sphericalRef.current = {
      radius: section === 'technology' ? 240 : 45,
      theta: Math.PI / 4,
      phi: Math.PI / 3,
    };
    setActiveCamView('iso');
  };

  const isLight = themeMode === 'light';
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  return (
    <div
      id="viewport_3d_container"
      className={`relative w-full h-full select-none overflow-hidden transition-colors ${
        isLight ? 'bg-slate-100' : themeMode === 'blueprint' ? 'bg-[#001b3a]' : 'bg-zinc-950'
      }`}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Top Floating Viewport Control Bar */}
      <div
        id="viewport_top_bar"
        className={`absolute top-3 left-3 flex items-center gap-1.5 backdrop-blur-md border px-2.5 py-1.5 rounded-xl shadow-lg z-10 ${
          isLight
            ? 'bg-white/90 border-slate-300 text-slate-800'
            : 'bg-zinc-900/90 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* View Camera Angles */}
        <div className={`flex items-center rounded-lg p-0.5 border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-zinc-950/80 border-zinc-800'}`}>
          <button
            id="btn_view_iso"
            onClick={() => setCameraView('iso')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeCamView === 'iso'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-zinc-800 text-zinc-100 shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Isometric Perspective View"
          >
            ISO
          </button>
          <button
            id="btn_view_top"
            onClick={() => setCameraView('top')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeCamView === 'top'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-zinc-800 text-zinc-100 shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Top-Down Plan View"
          >
            TOP
          </button>
          <button
            id="btn_view_front"
            onClick={() => setCameraView('front')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeCamView === 'front'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-zinc-800 text-zinc-100 shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Front Elevation View"
          >
            FRONT
          </button>
          <button
            id="btn_view_right"
            onClick={() => setCameraView('right')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeCamView === 'right'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-zinc-800 text-zinc-100 shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Right Side View"
          >
            RIGHT
          </button>
        </div>

        <div className={`h-4 w-px mx-1 ${isLight ? 'bg-slate-300' : 'bg-zinc-800'}`} />

        {/* Reset Camera */}
        <button
          id="btn_reset_cam"
          onClick={resetCamera}
          className={`p-1.5 rounded-lg transition-colors ${
            isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
          }`}
          title="Reset Camera Center & Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* 3D Measuring Tool */}
        {onOpenMeasuringTool && (
          <button
            id="btn_open_measure_panel"
            onClick={onOpenMeasuringTool}
            className={`p-1.5 rounded-lg transition-colors ${
              transformMode === 'measure'
                ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-500/40'
                : isLight
                ? 'text-slate-600 hover:text-cyan-600 hover:bg-slate-100'
                : 'text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800'
            }`}
            title="Open 3D Measuring Tool"
          >
            <Ruler className="w-4 h-4" />
          </button>
        )}

        {/* Collaborative Comments Pin Tool */}
        {onOpenCommentsModal && (
          <button
            id="btn_open_comments_panel"
            onClick={onOpenCommentsModal}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                : 'text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800'
            }`}
            title="Open 3D Spatial Comments"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}

        {/* Material Library Quick Button */}
        {onOpenMaterialLibrary && (
          <button
            id="btn_open_material_lib"
            onClick={onOpenMaterialLibrary}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              isLight ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-zinc-400 hover:text-blue-400 hover:bg-zinc-800'
            }`}
            title="Open PBR Material Library"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
        )}

        {/* Take Snapshot / Open Snapshot Studio */}
        <button
          id="btn_open_snapshot_studio"
          onClick={onOpenSnapshotStudio}
          className={`p-1.5 rounded-lg transition-colors ${
            isLight ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-zinc-400 hover:text-blue-400 hover:bg-zinc-800'
          }`}
          title="Open High-Res Snapshot Studio & Gallery"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Toggle Dimensions Overlay */}
        <button
          id="btn_toggle_dimensions"
          onClick={() => setDimensionsOverlay(!dimensionsOverlay)}
          className={`p-1.5 rounded-lg transition-colors ${
            dimensionsOverlay
              ? 'text-blue-400 bg-blue-950/40 border border-blue-500/30'
              : isLight
              ? 'text-slate-400 hover:text-slate-700'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle Dimension Annotations"
        >
          <Ruler className="w-4 h-4" />
        </button>
      </div>

      {/* Measurement Tool Result Overlay */}
      {transformMode === 'measure' && (
        <div
          id="measure_info_badge"
          className="absolute top-16 left-3 bg-zinc-900/95 border border-cyan-500/50 text-zinc-200 text-xs px-3 py-2 rounded-xl backdrop-blur-md shadow-xl flex items-center gap-2 z-20"
        >
          <Crosshair className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>
            {measurePoints.length === 0 && 'Click first point on 3D geometry'}
            {measurePoints.length === 1 && 'Click second point to measure distance'}
            {measureDistance !== null && (
              <strong className="text-cyan-400 font-mono text-sm ml-1">
                Distance: {section === 'technology' ? `${measureDistance.toFixed(2)} mm` : `${measureDistance.toFixed(2)} m`}
              </strong>
            )}
          </span>
          {measurePoints.length > 0 && (
            <button
              onClick={() => {
                setMeasurePoints([]);
                setMeasureDistance(null);
              }}
              className="ml-2 underline text-cyan-400 hover:text-cyan-300 text-[11px]"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Iron Man / Stark Hologram Active Indicator */}
      {section === 'technology' && deviceConfig.starkModeEnabled && (
        <div
          id="stark_mode_badge"
          className="absolute top-3 right-3 bg-zinc-900/90 border border-blue-500/50 text-blue-300 text-xs px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2 z-10"
        >
          <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="font-semibold tracking-wide">STARK HOLOGRAPHIC DISASSEMBLY</span>
          <span className="font-mono text-[10px] bg-blue-950/80 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/80">
            {Math.round((deviceConfig.starkSeparationAmount ?? 1) * 100)}%
          </span>
        </div>
      )}

      {/* Real-Time Selected Object Dimensions Pill */}
      {selectedObject && dimensionsOverlay && (
        <div
          id="selected_object_overlay"
          className={`absolute bottom-3 left-3 backdrop-blur-md border text-xs px-3 py-2 rounded-xl shadow-xl flex items-center gap-3 font-mono z-10 ${
            isLight
              ? 'bg-white/95 border-slate-300 text-slate-800'
              : 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-blue-400 font-sans font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{selectedObject.name}</span>
          </div>
          <span className={isLight ? 'text-slate-300' : 'text-zinc-700'}>|</span>
          <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>
            W: <strong className={isLight ? 'text-slate-900' : 'text-zinc-100'}>{selectedObject.dimensions.width}</strong>
            {section === 'technology' ? 'mm' : 'm'}
          </span>
          <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>
            H: <strong className={isLight ? 'text-slate-900' : 'text-zinc-100'}>{selectedObject.dimensions.height}</strong>
            {section === 'technology' ? 'mm' : 'm'}
          </span>
          <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>
            D: <strong className={isLight ? 'text-slate-900' : 'text-zinc-100'}>{selectedObject.dimensions.depth}</strong>
            {section === 'technology' ? 'mm' : 'm'}
          </span>
        </div>
      )}

      {/* Bottom Right Diagnostics */}
      <div
        id="viewport_diagnostics"
        className={`absolute bottom-3 right-3 flex items-center gap-2 backdrop-blur-md border px-3 py-1.5 rounded-xl text-[11px] font-mono pointer-events-none z-10 ${
          isLight
            ? 'bg-white/90 border-slate-300 text-slate-600'
            : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
        }`}
      >
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-ping" />
          {fps} FPS
        </span>
        <span className={isLight ? 'text-slate-300' : 'text-zinc-700'}>|</span>
        <span>Units: {section === 'technology' ? 'Metric (mm)' : 'Architectural (m)'}</span>
        <span className={isLight ? 'text-slate-300' : 'text-zinc-700'}>|</span>
        <span>Parts: {objects.filter(o => o.visible).length}</span>
      </div>
    </div>
  );
};
