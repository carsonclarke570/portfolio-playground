"use client"

import { useControlScheme } from '@/providers/controls';
import { useIsoSnap, useResolution, useSmoothScalar } from '@/utils/hooks';
import { OrthographicCamera, useFBO } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three'

export default function CameraRig({ initialPosition, distance }: {
    distance: number;
    initialPosition: THREE.Vector3;
}) {
    const [realPosition, setRealPosition] = useState(initialPosition);
    const [orbitAngle, setOrbitAngle] = useState(45);

    const { pixelationControls, cameraControls } = useControlScheme()
    const { snappedPosition, subpixelOffset } = useIsoSnap(realPosition, pixelationControls.tileTexelWidth)
    const { orthoWidth, orthoHeight } = useResolution(pixelationControls.texelSize, pixelationControls.tileTexelWidth)

    const rigRef = useRef<THREE.Group>(null);
    const cameraRef = useRef<THREE.OrthographicCamera>(null);

    const smoothOrbitAngle = useSmoothScalar(orbitAngle, 3)

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
                setOrbitAngle(orbitAngle - 90)
                break;
            case "e":
                setOrbitAngle(orbitAngle + 90)
                break;
            default:
                return;
        }

        const rotationMatrix = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(smoothOrbitAngle));
        moveDirection.applyMatrix4(rotationMatrix);

        const newPosition = realPosition.clone().add(moveDirection);
        setRealPosition(newPosition)

    }, [cameraControls.moveSpeed, orbitAngle, smoothOrbitAngle, realPosition])

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
            <PixelArtRenderer subpixelOffset={subpixelOffset} />
        </>

    )
}

function PixelArtRenderer({ subpixelOffset }: {
    subpixelOffset: THREE.Vector2
}) {

    const { gl, camera, scene } = useThree();
    const { pixelationControls } = useControlScheme()
    const { displayWidth, displayHeight, internalWidth, internalHeight } = useResolution(pixelationControls.texelSize, pixelationControls.tileTexelWidth)

    const uvOffset = useMemo(() => {
        return subpixelOffset.clone().multiplyScalar(pixelationControls.texelSize).divide(new THREE.Vector2(displayWidth, displayHeight))
    }, [subpixelOffset, displayWidth, displayHeight, pixelationControls.texelSize])

    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const sourceFBO = useFBO(displayWidth, displayHeight, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps: false,
        depthBuffer: true,
        depthTexture: new THREE.DepthTexture(displayWidth, displayHeight, THREE.FloatType),
    })

    const pixelFBO = useFBO(internalWidth, internalHeight, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps: false,
        depthBuffer: false,
        depth: false
    })

    const pixelQuadScene = useMemo(() => {
        const scene = new THREE.Scene()
        const quadMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: sourceFBO.texture },
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
                varying vec2 vUv;

                void main() {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                }
            `,
            depthTest: false,
            depthWrite: false,
        })
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMaterial)
        scene.add(quad)

        return scene
    }, [sourceFBO])

    const screenQuadScene = useMemo(() => {
        const scene = new THREE.Scene()
        const quadMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: pixelFBO.texture },
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

                vec3 LinearToSRGB(vec3 color) {
                    return pow(color, vec3(1.0 / 2.2));
                }

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv - uOffset);
                    vec3 corrected = LinearToSRGB(color.rgb);
                    gl_FragColor = vec4(corrected, color.a);
                }
            `,
            depthTest: false,
            depthWrite: false,
        })
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMaterial)
        scene.add(quad)

        return scene
    }, [pixelFBO, uvOffset])


    useFrame(() => {
        if (pixelationControls.enabled) {
            // 1. Render the main scene into the low-res FBO.
            gl.setRenderTarget(sourceFBO)
            gl.clear()
            gl.render(scene, camera)

            gl.setRenderTarget(pixelFBO)
            gl.clear()
            gl.render(pixelQuadScene, quadCamera)

            // 2. Render the fullscreen quad with the pixelated texture.
            gl.setRenderTarget(null)
            gl.setSize(displayWidth, displayHeight)
            gl.render(screenQuadScene, quadCamera)
        } else {
            // Render Normally
            gl.setRenderTarget(null)
            gl.setSize(displayWidth, displayHeight)
            gl.render(scene, camera)
        }
    }, 1)

    return null
}
