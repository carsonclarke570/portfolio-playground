"use client"

import { useCameraControls } from '@/providers/camera';
import { useControlScheme } from '@/providers/controls';
import { useIsoSnap, useResolution, useSmoothScalar } from '@/utils/hooks';
import { OrthographicCamera } from '@react-three/drei';
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three'

export default function CameraRig({ distance }: {
    distance: number;
}) {

    const { pixelationControls, cameraControls } = useControlScheme()
    const { position, angle, setPosition, setSubpixelOffset, rotateLeft, rotateRight } = useCameraControls()

    const { snappedPosition, subpixelOffset } = useIsoSnap(position, pixelationControls.tileTexelWidth)
    const { orthoWidth, orthoHeight } = useResolution(pixelationControls.texelSize, pixelationControls.tileTexelWidth)

    const rigRef = useRef<THREE.Group>(null);
    const cameraRef = useRef<THREE.OrthographicCamera>(null);

    const smoothOrbitAngle = useSmoothScalar(angle, 3)

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const moveDirection = new THREE.Vector3();

        switch (event.key) {
            case "w":
                moveDirection.set(0, 0, cameraControls.moveSpeed);
                break;
            case "s":
                moveDirection.set(0, 0, -cameraControls.moveSpeed);
                break;
            case "a":
                moveDirection.set(-cameraControls.moveSpeed, 0, 0);
                break;
            case "d":
                moveDirection.set(cameraControls.moveSpeed, 0, 0);
                break;
            case "q":
                rotateLeft()
                break;
            case "e":
                rotateRight()
                break;
            default:
                return;
        }

        const rotationMatrix = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(smoothOrbitAngle));
        moveDirection.applyMatrix4(rotationMatrix);

        const newPosition = position.clone().add(moveDirection);
        setPosition(newPosition)

    }, [cameraControls.moveSpeed, smoothOrbitAngle, position, rotateLeft, rotateRight, setPosition])

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Camera Rotation
    useEffect(() => {
        if (rigRef.current) {
            // Set the rig's position to the snapped position.
            rigRef.current.position.copy(snappedPosition);
            // Set the rig's Y rotation based on the orbit angle.
            rigRef.current.rotation.y = THREE.MathUtils.degToRad(smoothOrbitAngle);
        }
    }, [snappedPosition, smoothOrbitAngle]);

    // Camera scaling
    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.left = -orthoWidth / 2;
            cameraRef.current.right = orthoWidth / 2;
            cameraRef.current.top = orthoHeight / 2;
            cameraRef.current.bottom = -orthoHeight / 2;
            cameraRef.current.updateProjectionMatrix();
        }
    }, [cameraRef, orthoWidth, orthoHeight])

    useEffect(() => {
        setSubpixelOffset(subpixelOffset)
    }, [subpixelOffset, setSubpixelOffset])

    return (
        <>
            <group ref={rigRef}>
                <group rotation={[THREE.MathUtils.degToRad(30), 0, 0]}>
                    <OrthographicCamera
                        makeDefault
                        ref={cameraRef}
                        near={0.01}
                        far={50}
                        position={[0, 0, distance]}
                    />
                </group>
            </group>
        </>

    )
}
