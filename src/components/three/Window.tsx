"use client"

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three'
import { degToRad } from "three/src/math/MathUtils.js";
import CameraRig from "./CameraRig";
import { useEffect, useMemo, useRef } from "react";
import { FRAMEBUFFER_ALBEDO, FRAMEBUFFER_DEPTH, FRAMEBUFFER_NORMAL, useControlScheme } from "@/providers/controls";
import { Instance, Instances } from "@react-three/drei";
import { TILE_SIDE_LENGTH_WORLD } from "@/utils/constants";
import { useSwipeable } from "react-swipeable";
import { useCameraControls } from "@/providers/camera";
import { DeferredGeometryPass } from "./rendering/DeferredGeometryPass";
import { useGBuffer, useResultBuffer } from "./rendering/buffer";
import { useResolution } from "@/utils/hooks";
import { DeferredLightingPass } from "./rendering/DeferredLightningPass";
import { GrassMaterial } from "./material/grass";

export default function ThreeCanvas() {

    const controls = useControlScheme()
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

            {/* PostFX */}
            {/* <>
                {controls.framebufferControls.showDepth && <DepthDebugView texelSize={controls.pixelationControls.texelSize} tileTexelWidth={controls.pixelationControls.tileTexelWidth} />}
            </> */}

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

extend({ GrassMaterial })

function TileMap() {

    const { pixelationControls } = useControlScheme()

    const tileHeight = useMemo(() => {
        const worldToTexelRatio = Math.SQRT2 / pixelationControls.tileTexelWidth;
        return pixelationControls.tileTexelHeight * (worldToTexelRatio / Math.cos(degToRad(30)))
    }, [pixelationControls.tileTexelHeight, pixelationControls.tileTexelWidth])

    const instances = TILE_HEIGHT_MAP.reduce((total, row) => {
        return total + row.reduce((sum, height) => {
            return sum + height
        }, 0)
    }, 0)

    return (
        <Instances limit={instances}>
            <boxGeometry args={[1, tileHeight, 1]} />
            <grassMaterial glslVersion={THREE.GLSL3} side={THREE.BackSide} />
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
    )
}

function Scene() {
    const { gl } = useThree()
    const { pixelationControls, framebufferControls } = useControlScheme()
    const { displayWidth, displayHeight, internalWidth, internalHeight } = useResolution(pixelationControls.texelSize, pixelationControls.tileTexelWidth)

    const gBuffer = useGBuffer(displayWidth, displayHeight)
    const resultBuffer = useResultBuffer(internalWidth, internalHeight)

    const uvOffset = new THREE.Vector2(0, 0)

    const resultTexture = useMemo(() => {
        switch (framebufferControls.buffer) {
            case FRAMEBUFFER_ALBEDO:
                return gBuffer.textures[0]
            case FRAMEBUFFER_NORMAL:
                return gBuffer.textures[1]
            case FRAMEBUFFER_DEPTH:
                return gBuffer.depthTexture
            default:
                return resultBuffer.texture
        }
    }, [framebufferControls])

    const resultCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const resultScene = useMemo(() => {
        const scene = new THREE.Scene()
        const quadMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: resultTexture },
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
                    gl_FragColor = color; //vec4(corrected, color.a);
                }
            `,
            depthTest: false,
            depthWrite: false,
        })
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMaterial)
        scene.add(quad)

        return scene
    }, [resultBuffer, uvOffset])

    // Setup GL Context
    useEffect(() => {
        gl.getContext().clearDepth(0)
        gl.getContext().depthFunc(WebGL2RenderingContext.GEQUAL)
    }, [gl])

    useFrame(() => {
        // 2. Render the fullscreen quad with the pixelated texture.
        gl.setRenderTarget(null)
        gl.setSize(displayWidth, displayHeight)
        gl.render(resultScene, resultCamera)

    }, 2)

    return (
        <DeferredGeometryPass gBuffer={gBuffer}>
            <TileMap />

            <DeferredLightingPass gBuffer={gBuffer} resultBuffer={resultBuffer} />
        </DeferredGeometryPass>
    )
}

