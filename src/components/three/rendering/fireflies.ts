import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useControlScheme } from '@/providers/controls';
import { createNoise3D } from 'simplex-noise';

const simplex = createNoise3D()

export type Firefly = {
    strength: number;
    lifetime: number;
    spawn: THREE.Vector3;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color: THREE.Color;
    noiseOffset: number;
}

export const DEFAULT_FIREFLY: Firefly = {
    strength: 0,
    lifetime: -1,
    spawn: new THREE.Vector3(),
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    color: new THREE.Color(),
    noiseOffset: 0,
}

const minRange = new THREE.Vector3(-5, 0.5, -5);
const maxRange = new THREE.Vector3(5, 1.5, 5);
const particleLifetime = 6.0
const particleFadeout = 2.0
const particleFadein = 1.0

export function useFireflies() {

    const { lightingControls } = useControlScheme()

    const fireflies = useMemo<Firefly[]>(() => {
        return pointsInBox(lightingControls.count, minRange, maxRange).map((point) => {
            return {
                strength: 1,
                lifetime: Math.random() * particleLifetime,
                spawn: point.clone(),
                position: point.clone(),
                velocity: fireflyVelocity(),
                color: new THREE.Color(),
                noiseOffset: Math.random() * 1000
            }
        })
    }, [lightingControls.count])

    useEffect(() => {
        fireflies.forEach((firefly, idx) => {
            firefly.color.set(fireflyColor(idx, lightingControls.count, new THREE.Color(lightingControls.baseColor), new THREE.Color(lightingControls.altColor), lightingControls.altPercent))
        })
    }, [fireflies, lightingControls.baseColor, lightingControls.altColor, lightingControls.altPercent, lightingControls.count])

    useEffect(() => {
        fireflies.forEach((firefly, idx) => {
            firefly.strength = idx < lightingControls.count ? 1 : 0;
        })
    }, [fireflies, lightingControls.count])

    const updateFireflies = useCallback((delta: number) => {
        fireflies.forEach((firefly, idx) => {
            const { spawn, position, velocity, noiseOffset } = firefly;

            const time = performance.now() * 0.001;
            const noiseScale = 0.01

            velocity.x += (simplex(idx * 0.1, time * 0.2, noiseOffset) - 0.5) * noiseScale * delta;
            velocity.y += (simplex(idx * 0.1, time * 0.3, noiseOffset) - 0.5) * noiseScale * delta;
            velocity.z += (simplex(idx * 0.1, time * 0.4, noiseOffset) - 0.5) * noiseScale * delta;

            velocity.clampLength(0, 1);
            position.addScaledVector(velocity, delta);

            const distanceX = Math.abs(spawn.x - position.x);
            const distanceY = Math.abs(spawn.y - position.y);
            const distanceZ = Math.abs(spawn.z - position.z);
            if (distanceX > 2.0) velocity.x *= -1;
            if (distanceY > 2.0) velocity.y *= -1;
            if (distanceZ > 2.0) velocity.z *= -1;

            if (firefly.lifetime < 0) {
                return;
            }
            
            firefly.lifetime += delta;
            if (firefly.lifetime < particleFadein) {
                firefly.strength = Math.min(firefly.lifetime / particleFadein, 1.0);
            }

            if (firefly.lifetime > particleLifetime - particleFadeout) {
                firefly.strength = (particleLifetime - firefly.lifetime) / particleFadeout;
            }

            if (firefly.lifetime > particleLifetime) {
                const newSpawn = pointInBox(minRange, maxRange)

                firefly.lifetime = 0.0;
                firefly.spawn = newSpawn;
                firefly.position = newSpawn.clone()
            }
        })
    }, [fireflies])

    return { fireflies, updateFireflies }
}

function pointInBox(min: THREE.Vector3, max: THREE.Vector3) {
    const x = THREE.MathUtils.lerp(min.x, max.x, Math.random());
    const y = THREE.MathUtils.lerp(min.y, max.y, Math.random());
    const z = THREE.MathUtils.lerp(min.z, max.z, Math.random());
    return new THREE.Vector3(x, y, z)
}

function pointsInBox(numPoints: number, min: THREE.Vector3, max: THREE.Vector3) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        points.push(pointInBox(min, max));
    }
    return points;
}


function fireflyColor(idx: number, total: number, baseColor: THREE.Color, altColor: THREE.Color, altPct: number) {
    const shouldBeAlt = ((idx + 1) / total) < altPct;
    return shouldBeAlt ? altColor : baseColor;
}

function fireflyVelocity() {
    const speed = 1;
    return new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed
    )
}