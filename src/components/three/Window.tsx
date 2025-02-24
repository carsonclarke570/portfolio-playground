"use client"

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three'
import { degToRad } from "three/src/math/MathUtils.js";
import CameraRig from "./CameraRig";
import { useEffect, useMemo, useRef } from "react";
import { FRAMEBUFFER_ALBEDO, FRAMEBUFFER_DEPTH, FRAMEBUFFER_NORMAL, FRAMEBUFFER_POSITION, useControlScheme } from "@/providers/controls";
import { Instance, Instances, useGLTF } from "@react-three/drei";
import { TILE_SIDE_LENGTH_WORLD } from "@/utils/constants";
import { useSwipeable } from "react-swipeable";
import { useCameraControls } from "@/providers/camera";
import { DeferredGeometryPass } from "./rendering/DeferredGeometryPass";
import { useGBuffer, useResultBuffer } from "./rendering/buffer";
import { useResolution } from "@/utils/hooks";
import { DeferredLightingPass } from "./rendering/DeferredLightningPass";
import { GrassTileMaterial, InstancedGrassTileMaterial } from "./material/grasstile";
import { InstancedGrassMaterial } from "./material/grass";

export default function ThreeCanvas() {

    const { rotateLeft, rotateRight } = useCameraControls()

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => rotateLeft(),
        onSwipedRight: () => rotateRight(),
    })

    return (
        <Canvas
            style={{ width: '100vw', height: '100vh' }}
            gl={{ antialias: false }} // Turn off antialias for a crisper pixel look.
            {...swipeHandlers}
        >
            <CameraRig distance={15} />
            <Scene />
            {/* <Stats showPanel={0} /> */}
        </Canvas>
    )
}

const TILE_HEIGHT_MAP = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 3, 2, 2, 2, 3, 1],
    [1, 2, 2, 2, 2, 2, 1],
    [1, 1, 2, 3, 2, 1, 1],
    [1, 2, 2, 2, 2, 2, 1],
    [1, 3, 2, 1, 2, 3, 1],
    [1, 1, 1, 1, 1, 1, 1],
]

extend({ InstancedGrassTileMaterial })
extend({ GrassTileMaterial })
extend({ InstancedGrassMaterial })

function TileMap() {

    const { pixelationControls, grassControls } = useControlScheme()

    const tileHeight = useMemo(() => {
        const worldToTexelRatio = Math.SQRT2 / pixelationControls.tileTexelWidth;
        return pixelationControls.tileTexelHeight * (worldToTexelRatio / Math.cos(degToRad(30)))
    }, [pixelationControls.tileTexelHeight, pixelationControls.tileTexelWidth])

    const instances = TILE_HEIGHT_MAP.reduce((total, row) => {
        return total + row.reduce((sum, height) => {
            return sum + height
        }, 0)
    }, 0)

    const exposedGrassTilePositions = useMemo(() => {
        return TILE_HEIGHT_MAP.reduce((all, row, z) => {
            return all.concat(row.flatMap((y, x) => {
                return [...Array(30).keys()].map(() => {
                    const xPos = THREE.MathUtils.lerp(x - 3.5, x - 2.5, Math.random())
                    const zPos = THREE.MathUtils.lerp(z - 3.5, z - 2.5, Math.random())

                    return {
                        position: new THREE.Vector3(
                            xPos * TILE_SIDE_LENGTH_WORLD,
                            (y - 0.5) * tileHeight,
                            zPos * TILE_SIDE_LENGTH_WORLD
                        ),
                        rotation: new THREE.Euler(0, Math.random() * Math.PI, 0)
                    }
                })
            }));
        }, [] as { position: THREE.Vector3, rotation: THREE.Euler }[])
    }, [tileHeight])

    const { nodes } = useGLTF('./models/grass.glb')
    const grassMesh = nodes["Plane003"] as THREE.Mesh

    const grassTileMateriaRef = useRef<THREE.ShaderMaterial>(null)
    const grassMateriaRef = useRef<THREE.ShaderMaterial>(null)

    useEffect(() => {
        if (grassTileMateriaRef.current) {
            grassTileMateriaRef.current.uniforms["uLowColor"].value = new THREE.Color(grassControls.lowColor)
            grassTileMateriaRef.current.uniforms["uHighColor"].value = new THREE.Color(grassControls.highColor)
        }

        if (grassMateriaRef.current) {
            grassMateriaRef.current.uniforms["uLowColor"].value = new THREE.Color(grassControls.lowColor)
            grassMateriaRef.current.uniforms["uHighColor"].value = new THREE.Color(grassControls.highColor)
        }

    }, [grassControls.lowColor, grassControls.highColor])

    return (
        <>
            <Instances limit={instances}>
                <boxGeometry args={[1, tileHeight, 1]} />
                <instancedGrassTileMaterial glslVersion={THREE.GLSL3} side={THREE.BackSide} ref={grassTileMateriaRef} />
                {TILE_HEIGHT_MAP.map((row, z) => {
                    return row.map((height, x) => {

                        return [...Array(height).keys()].map((y) => {
                            const xPos = (x - 3) * TILE_SIDE_LENGTH_WORLD
                            const yPos = y * tileHeight
                            const zPos = (z - 3) * TILE_SIDE_LENGTH_WORLD

                            return (
                                <Instance
                                    key={`${x}-${z}-${y}`}
                                    position={[xPos, yPos, zPos]}
                                />
                            )
                        })
                    })
                })}
            </Instances>
            <Instances limit={exposedGrassTilePositions.length}>
                <primitive object={grassMesh.geometry} />
                <instancedGrassMaterial glslVersion={THREE.GLSL3} side={THREE.DoubleSide} ref={grassMateriaRef} />
                {exposedGrassTilePositions.map((grass, idx) => {
                    return (
                        <Instance
                            key={`${idx}`}
                            position={grass.position}
                            scale={0.05}
                            rotation={grass.rotation}
                        />
                    )
                })}
            </Instances>
        </>
    )
}

function Scene() {
    const { gl } = useThree()
    const { pixelationControls, framebufferControls, grassControls } = useControlScheme()
    // const { subpixelOffset } = useCameraControls()
    const { displayWidth, displayHeight, internalWidth, internalHeight } = useResolution(pixelationControls.texelSize, pixelationControls.tileTexelWidth)

    const tileHeight = useMemo(() => {
        const worldToTexelRatio = Math.SQRT2 / pixelationControls.tileTexelWidth;
        return pixelationControls.tileTexelHeight * (worldToTexelRatio / Math.cos(degToRad(30)))
    }, [pixelationControls.tileTexelHeight, pixelationControls.tileTexelWidth])

    const gBuffer = useGBuffer(displayWidth, displayHeight)
    const resultBuffer = useResultBuffer(
        pixelationControls.enabled ? internalWidth : displayWidth,
        pixelationControls.enabled ? internalHeight : displayHeight
    )

    const grassMateriaRef = useRef<THREE.ShaderMaterial>(null)

    useEffect(() => {
        if (grassMateriaRef.current) {
            grassMateriaRef.current.uniforms["uLowColor"].value = new THREE.Color(grassControls.lowColor)
            grassMateriaRef.current.uniforms["uHighColor"].value = new THREE.Color(grassControls.highColor)
        }

    }, [grassControls.lowColor, grassControls.highColor])

    // const uvOffset = useMemo(() => {
    //     return subpixelOffset.clone().multiplyScalar(pixelationControls.texelSize).divide(new THREE.Vector2(displayWidth, displayHeight))
    // }, [subpixelOffset, displayWidth, displayHeight, pixelationControls.texelSize])

    const resultTexture = useMemo(() => {
        switch (framebufferControls.buffer) {
            case FRAMEBUFFER_ALBEDO:
                return gBuffer.textures[0]
            case FRAMEBUFFER_NORMAL:
                return gBuffer.textures[1]
            case FRAMEBUFFER_POSITION:
                return gBuffer.textures[2]
            case FRAMEBUFFER_DEPTH:
                return gBuffer.depthTexture
            default:
                return resultBuffer.texture
        }
    }, [framebufferControls, gBuffer.depthTexture, gBuffer.textures, resultBuffer.texture])

    const resultCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const resultScene = useMemo(() => {
        const scene = new THREE.Scene()
        const quadMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: resultTexture },
                uOffset: { value: new THREE.Vector2(0, 0) }
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
                    gl_FragColor = color; //vec4(corrected, color.a);
                }
            `,
            depthTest: false,
            depthWrite: false,
        })
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMaterial)
        scene.add(quad)

        return scene
    }, [resultTexture])

    // Setup GL Context
    useEffect(() => {
        gl.getContext().clearDepth(0)
        gl.getContext().depthFunc(WebGL2RenderingContext.GEQUAL)
    }, [gl])

    useFrame(() => {
        gl.setRenderTarget(null)
        gl.setSize(displayWidth, displayHeight)
        gl.render(resultScene, resultCamera)

    }, 2)



    return (
        <DeferredGeometryPass gBuffer={gBuffer}>
            {/* Scene */}
            <TileMap />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -tileHeight, 0]}>
                <planeGeometry args={[40, 40]} />
                <grassTileMaterial glslVersion={THREE.GLSL3} side={THREE.BackSide} ref={grassMateriaRef} />
            </mesh>

            {/* Lighting */}
            <DeferredLightingPass gBuffer={gBuffer} resultBuffer={resultBuffer} />
        </DeferredGeometryPass>
    )
}

