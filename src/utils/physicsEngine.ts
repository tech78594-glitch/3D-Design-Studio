import * as THREE from 'three';
import { CADObject } from '../types/cad';

export interface PhysicsBody {
  id: string;
  name: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  rotation: THREE.Euler;
  massKg: number;
  restitution: number; // bounciness 0-1
  friction: number;
  isStatic: boolean;
  boundingBox: THREE.Box3;
  trajectory: THREE.Vector3[];
}

export interface PhysicsSimulationConfig {
  gravity: number; // m/s^2 (e.g. 9.81)
  timeStep: number; // e.g. 0.016 (60 FPS)
  groundY: number; // ground level in mm
  airResistance: number;
  maxTrajectorySteps: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsSimulationConfig = {
  gravity: 9.81,
  timeStep: 0.016,
  groundY: 0,
  airResistance: 0.01,
  maxTrajectorySteps: 50,
};

export class CADPhysicsEngine {
  private bodies: Map<string, PhysicsBody> = new Map();
  private config: PhysicsSimulationConfig;
  private isRunning: boolean = false;

  constructor(config: Partial<PhysicsSimulationConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
  }

  public initFromCADObjects(objects: CADObject[], initialDropHeightMm = 100): void {
    this.bodies.clear();

    objects.forEach((obj, idx) => {
      const pos = new THREE.Vector3(obj.position[0], obj.position[1] + initialDropHeightMm, obj.position[2]);
      const { width, height, depth } = obj.dimensions;

      // Approximate mass from volume and density if not set
      const volumeCm3 = (width * height * depth) / 1000;
      const massKg = obj.massKg || Math.max(0.01, (volumeCm3 * 2.7) / 1000); // default aluminum density

      const halfW = (width * obj.scale[0]) / 2;
      const halfH = (height * obj.scale[1]) / 2;
      const halfD = (depth * obj.scale[2]) / 2;

      const bbox = new THREE.Box3(
        new THREE.Vector3(pos.x - halfW, pos.y - halfH, pos.z - halfD),
        new THREE.Vector3(pos.x + halfW, pos.y + halfH, pos.z + halfD)
      );

      const body: PhysicsBody = {
        id: obj.id,
        name: obj.name,
        position: pos.clone(),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5),
        angularVelocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, 0),
        rotation: new THREE.Euler(obj.rotation[0], obj.rotation[1], obj.rotation[2]),
        massKg,
        restitution: obj.material?.type === 'rubber_grip' ? 0.8 : 0.4,
        friction: 0.3,
        isStatic: obj.locked || obj.primitive === 'slab' || obj.primitive === 'wall',
        boundingBox: bbox,
        trajectory: [pos.clone()],
      };

      this.bodies.set(obj.id, body);
    });
  }

  public stepSimulation(dt: number = 0.016): Map<string, PhysicsBody> {
    const gravityMm = this.config.gravity * 1000; // convert m/s^2 to mm/s^2

    this.bodies.forEach(body => {
      if (body.isStatic) return;

      // Apply gravity
      body.velocity.y -= gravityMm * dt;

      // Apply air drag
      body.velocity.multiplyScalar(1 - this.config.airResistance);

      // Update position
      body.position.addScaledVector(body.velocity, dt);

      // Update rotation
      body.rotation.x += body.angularVelocity.x * dt;
      body.rotation.y += body.angularVelocity.y * dt;
      body.rotation.z += body.angularVelocity.z * dt;

      // Ground collision check
      const minY = body.position.y - 10;
      if (minY <= this.config.groundY) {
        body.position.y = this.config.groundY + 10;
        body.velocity.y = -body.velocity.y * body.restitution;
        body.velocity.x *= 1 - body.friction;
        body.velocity.z *= 1 - body.friction;
        body.angularVelocity.multiplyScalar(0.7);

        // Stop tiny oscillations
        if (Math.abs(body.velocity.y) < 10) {
          body.velocity.y = 0;
        }
      }

      // Record trajectory history
      if (body.trajectory.length > this.config.maxTrajectorySteps) {
        body.trajectory.shift();
      }
      body.trajectory.push(body.position.clone());
    });

    return this.bodies;
  }

  public getBodies(): Map<string, PhysicsBody> {
    return this.bodies;
  }

  public resetTrajectories(): void {
    this.bodies.forEach(b => {
      b.trajectory = [b.position.clone()];
    });
  }
}
