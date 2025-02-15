import * as THREE from 'three'

import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { TILE_DIAGONAL_WORLD } from './constants'

export function useInternalSize(texelSize: number) {
    const { size } = useThree()

    return useMemo(() => {
        const internalWidth = Math.floor(size.width / texelSize)
        const internalHeight = Math.floor(size.height / texelSize)

        return { internalWidth, internalHeight }
    }, [size])
}

export function useDisplaySize(texelSize: number) {
    const { internalWidth, internalHeight } = useInternalSize(texelSize)
    const displayWidth = internalWidth * texelSize
    const displayHeight = internalHeight * texelSize

    return { displayWidth, displayHeight }
}

function createIsoMatrices(camera: THREE.Camera, tileTexelWidth: number) {
    const worldUp = new THREE.Vector3(0, 1, 0);

    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    const camRight = new THREE.Vector3();
    camRight.crossVectors(worldUp, camForward).normalize();

    const worldToTexelRatio = (1.0 / tileTexelWidth);
    const isoRight = camRight.clone().multiplyScalar(worldToTexelRatio)
    const isoForward = camForward.clone().multiplyScalar(worldToTexelRatio * 2)
    const isoUp = worldUp.clone().multiplyScalar(worldToTexelRatio / Math.sqrt(3))

    const isoToWorld = new THREE.Matrix3();
    isoToWorld.set(
        isoRight.x, isoForward.x, isoUp.x,
        isoRight.y, isoForward.y, isoUp.y,
        isoRight.z, isoForward.z, isoUp.z
    );

    const worldToIso = new THREE.Matrix3().copy(isoToWorld).invert();

    return { isoToWorld, worldToIso }
}

export function useIsoSnap(position: THREE.Vector3, tileTexelWidth: number): {
    snappedPosition: THREE.Vector3,
    subpixelOffset: THREE.Vector2
} {
    const { camera } = useThree();
    return useMemo(() => {
        const { isoToWorld, worldToIso } = createIsoMatrices(camera, tileTexelWidth)
        const worldToTexelRatio = (1.0 / tileTexelWidth);

        const isoPos = position.clone().applyMatrix3(worldToIso);
        const isoPosSnapped = isoPos.clone().round();

        const offset = isoPos.clone().sub(isoPosSnapped);
        // const offsetNormalized = offset.multiplyScalar(worldToTexelRatio);
        const subpixelOffset = new THREE.Vector2(offset.x, offset.y)

        const snappedPosition = isoPosSnapped.applyMatrix3(isoToWorld);

        return {
            snappedPosition, subpixelOffset
        }
    }, [position.x, position.y, position.z, tileTexelWidth, camera])
}

export function useSmoothVector(target: THREE.Vector3, speed: number = 0.1) {
    const [currentValue, setCurrentValue] = useState(target);
    const timeRef = useRef(0);
    const lastTargetRef = useRef(target);
    const targetRef = useRef(target);

    useEffect(() => {
        lastTargetRef.current = targetRef.current
        targetRef.current = target;
        timeRef.current = 0;
    }, [target]);

    useFrame((_, delta) => {
        timeRef.current += delta;
        if (timeRef.current * speed >= 1.0) {
            setCurrentValue(targetRef.current)
        } else {
            setCurrentValue(lastTargetRef.current.lerp(targetRef.current, timeRef.current * speed))
        }
    });

    return currentValue;
}

export function useSmoothScalar(target: number, speed: number = 0.1) {
    const [currentValue, setCurrentValue] = useState(target);
    const timeRef = useRef(0);
    const lastTargetRef = useRef(target);
    const targetRef = useRef(target);

    useEffect(() => {
        lastTargetRef.current = targetRef.current
        targetRef.current = target;
        timeRef.current = 0;
    }, [target]);

    useFrame((_, delta) => {
        timeRef.current += delta;
        if (timeRef.current * speed >= 1.0) {
            setCurrentValue(targetRef.current)
        } else {
            setCurrentValue(THREE.MathUtils.lerp(lastTargetRef.current, targetRef.current, timeRef.current * speed))
        }
    });

    return currentValue;
}