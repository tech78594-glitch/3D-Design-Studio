import { CADObject, KinematicJoint, KinematicSimulationState } from '../types/cad';

export const DEFAULT_KINEMATIC_STATE: KinematicSimulationState = {
  isPlaying: false,
  speedMultiplier: 1.0,
  timeSeconds: 0,
  showTrajectories: true,
  stopOnClash: false,
  loopPlayback: true,
};

export const SAMPLE_KINEMATIC_JOINTS: KinematicJoint[] = [
  {
    id: 'joint_camera_zoom',
    name: 'Periscope Optical Zoom Slider',
    type: 'prismatic',
    parentPartId: 'part_chassis_outer',
    childPartId: 'part_camera_module',
    anchorPoint: [24, 48, 4],
    axisVector: [0, 0, 1], // Z-axis extension
    currentValue: 0,
    minLimit: 0,
    maxLimit: 12, // 12mm stroke
    speed: 15, // 15 mm/s
    direction: 1,
    cycleType: 'oscillate',
    active: true,
    trajectoryColor: '#38bdf8',
    mechanicalRatio: 1.0,
  },
  {
    id: 'joint_power_button',
    name: 'Side Button Tactile Actuator',
    type: 'prismatic',
    parentPartId: 'part_chassis_outer',
    childPartId: 'part_sim_tray',
    anchorPoint: [37.5, 20, 0],
    axisVector: [1, 0, 0], // X-axis tactile press
    currentValue: 0,
    minLimit: 0,
    maxLimit: 3,
    speed: 8,
    direction: 1,
    cycleType: 'pingpong',
    active: true,
    trajectoryColor: '#f472b6',
    mechanicalRatio: 1.0,
  },
  {
    id: 'joint_rotor_spin',
    name: 'Vibration Motor / Cooling Fan Rotor',
    type: 'revolute',
    parentPartId: 'part_chassis_outer',
    childPartId: 'part_speaker_grille',
    anchorPoint: [0, -60, -3],
    axisVector: [0, 0, 1], // Z-axis rotation
    currentValue: 0,
    minLimit: 0,
    maxLimit: 360,
    speed: 360, // 1 rev/sec
    direction: 1,
    cycleType: 'continuous',
    active: true,
    trajectoryColor: '#34d399',
    mechanicalRatio: 1.0,
  },
];

/**
 * Calculates current kinematic value (angle in deg or distance in mm) for a joint at elapsed time
 */
export function calculateJointValueAtTime(joint: KinematicJoint, timeSeconds: number): number {
  if (!joint.active) return joint.currentValue;

  const range = joint.maxLimit - joint.minLimit;
  if (range <= 0 && joint.cycleType !== 'continuous') return joint.minLimit;

  if (joint.cycleType === 'continuous') {
    // Continuous rotation
    const raw = (joint.speed * timeSeconds) % 360;
    return raw;
  }

  if (joint.cycleType === 'oscillate') {
    // Smooth harmonic sine oscillation between min and max
    const frequencyHz = joint.speed / (2 * Math.max(range, 1));
    const sineVal = (Math.sin(2 * Math.PI * frequencyHz * timeSeconds) + 1) / 2; // 0 to 1
    return joint.minLimit + sineVal * range;
  }

  if (joint.cycleType === 'pingpong' || joint.cycleType === 'step_sweep') {
    // Linear triangle wave
    const period = (2 * range) / Math.max(joint.speed, 0.1);
    const modTime = timeSeconds % period;
    if (modTime < period / 2) {
      return joint.minLimit + (modTime / (period / 2)) * range;
    } else {
      return joint.maxLimit - ((modTime - period / 2) / (period / 2)) * range;
    }
  }

  return joint.currentValue;
}

/**
 * Computes animated 3D position and rotation offsets for a child CAD object based on active joint transforms
 */
export function getKinematicTransformForObject(
  objectId: string,
  joints: KinematicJoint[],
  timeSeconds: number
): { positionOffset: [number, number, number]; rotationOffset: [number, number, number] } {
  let posX = 0;
  let posY = 0;
  let posZ = 0;
  let rotX = 0;
  let rotY = 0;
  let rotZ = 0;

  const activeJoints = joints.filter(j => j.childPartId === objectId && j.active);

  for (const joint of activeJoints) {
    const val = calculateJointValueAtTime(joint, timeSeconds);

    if (joint.type === 'prismatic') {
      // Linear stroke translation
      const [ax, ay, az] = joint.axisVector;
      posX += ax * val;
      posY += ay * val;
      posZ += az * val;
    } else if (joint.type === 'revolute') {
      // Angular rotation (val in degrees -> convert to radians)
      const rad = (val * Math.PI) / 180;
      const [ax, ay, az] = joint.axisVector;
      rotX += ax * rad;
      rotY += ay * rad;
      rotZ += az * rad;
    } else if (joint.type === 'cylindrical') {
      // Combined translation and screw rotation
      const [ax, ay, az] = joint.axisVector;
      const leadPitch = joint.mechanicalRatio || 2.0; // 2mm per turn
      const distance = (val / 360) * leadPitch;
      posX += ax * distance;
      posY += ay * distance;
      posZ += az * distance;
      const rad = (val * Math.PI) / 180;
      rotX += ax * rad;
      rotY += ay * rad;
      rotZ += az * rad;
    }
  }

  return {
    positionOffset: [posX, posY, posZ],
    rotationOffset: [rotX, rotY, rotZ],
  };
}

/**
 * Generates an array of 3D trajectory points sampled along a joint's full range of motion
 */
export function generateJointTrajectoryPoints(
  joint: KinematicJoint,
  parentObject?: CADObject,
  samples = 32
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const anchor = joint.anchorPoint;

  if (joint.type === 'prismatic') {
    const [ax, ay, az] = joint.axisVector;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const dist = joint.minLimit + t * (joint.maxLimit - joint.minLimit);
      points.push([
        anchor[0] + ax * dist,
        anchor[1] + ay * dist,
        anchor[2] + az * dist,
      ]);
    }
  } else if (joint.type === 'revolute') {
    const radius = 15; // arc radius
    const [ax, ay, az] = joint.axisVector;
    const startAngle = (joint.minLimit * Math.PI) / 180;
    const endAngle = (joint.maxLimit * Math.PI) / 180;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const angle = startAngle + t * (endAngle - startAngle);
      if (Math.abs(az) >= 0.8) {
        // XY plane circle
        points.push([
          anchor[0] + Math.cos(angle) * radius,
          anchor[1] + Math.sin(angle) * radius,
          anchor[2],
        ]);
      } else if (Math.abs(ax) >= 0.8) {
        // YZ plane circle
        points.push([
          anchor[0],
          anchor[1] + Math.cos(angle) * radius,
          anchor[2] + Math.sin(angle) * radius,
        ]);
      } else {
        // XZ plane circle
        points.push([
          anchor[0] + Math.cos(angle) * radius,
          anchor[1],
          anchor[2] + Math.sin(angle) * radius,
        ]);
      }
    }
  }

  return points;
}
