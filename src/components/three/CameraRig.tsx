"use client"

import { useDisplaySize, useInternalSize, useIsoSnap, useSmoothScalar } from '@/utils/hooks';
import { OrthographicCamera, useFBO } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three'

export default function CameraRig({ initialPosition, distance, texelSize, tileTexelWidth }: {
    distance: number;
    texelSize: number;
    tileTexelWidth: number;
    initialPosition: THREE.Vector3;
}) {

    const { gl, size, camera, scene } = useThree();

    const controls = useControls('Camera', {
        orbitAngle: {
            label: "Orbit Angle",
            value: 45,
            min: -45,
            max: 315,
            step: 45
        },
        moveSpeed: {
            label: "Movement Speed",
            value: 0.1,
            min: 0.01,
            max: 2
        }
    })

    const [realPosition, setRealPosition] = useState(initialPosition);
    const { snappedPosition, subpixelOffset } = useIsoSnap(realPosition, tileTexelWidth)

    const rigRef = useRef<THREE.Group>(null);
    const cameraRef = useRef<THREE.OrthographicCamera>(null);

    const { displayWidth, displayHeight } = useDisplaySize(texelSize)
    const { internalWidth, internalHeight } = useInternalSize(texelSize)
    const orbitAngle = useSmoothScalar(controls.orbitAngle, 3)

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const moveDirection = new THREE.Vector3();

        switch (event.key) {
            case "w":
                moveDirection.set(0, 0, controls.moveSpeed);
                break;
            case "s":
                moveDirection.set(0, 0, -controls.moveSpeed);
                break;
            case "a":
                moveDirection.set(-controls.moveSpeed, 0, 0);
                break;
            case "d":
                moveDirection.set(controls.moveSpeed, 0, 0);
                break;
            default:
                return;
        }

        const rotationMatrix = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(orbitAngle));
        moveDirection.applyMatrix4(rotationMatrix);

        const newPosition = realPosition.clone().add(moveDirection);
        setRealPosition(newPosition)

    }, [controls.moveSpeed, orbitAngle, realPosition])

    const fbo = useFBO(internalWidth, internalHeight, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps: false,
        depthBuffer: true
    })

    const uvOffset = useMemo(() => {
        return subpixelOffset.clone().multiplyScalar(texelSize).divide(new THREE.Vector2(displayWidth, displayHeight))
    }, [subpixelOffset, displayWidth, displayHeight, texelSize])

    const postScene = new THREE.Scene()
    const quadMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: fbo.texture },
            uOffset: { value: uvOffset }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform vec2 uOffset;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(tDiffuse, vUv - uOffset);
            }
        `,
        depthTest: false,
        depthWrite: false,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMaterial)
    postScene.add(quad)

    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

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
            rigRef.current.rotation.y = THREE.MathUtils.degToRad(orbitAngle);
        }
    }, [snappedPosition, orbitAngle]);

    // Camera scaling
    useEffect(() => {
        const worldWidth = internalWidth / tileTexelWidth;
        const worldHeight = worldWidth * (internalHeight / internalWidth);

        if (cameraRef.current) {
            cameraRef.current.left = -worldWidth / 2;
            cameraRef.current.right = worldWidth / 2;
            cameraRef.current.top = worldHeight / 2;
            cameraRef.current.bottom = -worldHeight / 2;
            cameraRef.current.updateProjectionMatrix();
        }
    }, [cameraRef, size, internalWidth, internalHeight, tileTexelWidth])

    useFrame(() => {
        // 1. Render the main scene into the low-res FBO.
        gl.setRenderTarget(fbo)
        gl.clear()
        gl.render(scene, camera)

        // 2. Render the fullscreen quad with the pixelated texture.
        gl.setRenderTarget(null)
        gl.setSize(displayWidth, displayHeight)
        gl.render(postScene, postCamera)
    }, 1)

    return (
        <group ref={rigRef}>
            <group rotation={[THREE.MathUtils.degToRad(30), 0, 0]}>
                <OrthographicCamera
                    makeDefault
                    ref={cameraRef}
                    near={0.1}
                    far={50}
                    position={[0, 0, distance]}
                />
            </group>
        </group>
    )
}