"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three'
import { degToRad } from "three/src/math/MathUtils.js";
import CameraRig from "./CameraRig";
import { useEffect, useMemo, useRef } from "react";
import { useControlScheme } from "@/providers/controls";
import DepthDebugView from "./postfx/DepthDebugView";
import { Instance, Instances } from "@react-three/drei";
import { TILE_SIDE_LENGTH_WORLD } from "@/utils/constants";
import { useSwipeable } from "react-swipeable";
import { useCameraControls } from "@/providers/camera";

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
            <>
                {controls.framebufferControls.showDepth && <DepthDebugView texelSize={controls.pixelationControls.texelSize} tileTexelWidth={controls.pixelationControls.tileTexelWidth} />}
            </>

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
            <meshStandardMaterial color="green" depthTest={true} side={THREE.BackSide} />
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
    const { lightingControls } = useControlScheme()

    const pointlightRef = useRef<THREE.PointLight>(null)
    const timeRef = useRef(0)

    useFrame((_, delta) => {
        if (pointlightRef.current) {
            timeRef.current += (delta * 2.0)

            const y = Math.sin(timeRef.current) * 0.5
            pointlightRef.current.position.y = y
        }
    })

    // Setup GL Context
    useEffect(() => {
        gl.getContext().clearDepth(0)
        gl.getContext().depthFunc(WebGL2RenderingContext.GEQUAL)
    }, [gl])

    return (
        <>
            {/* Ambient Light */}
            <ambientLight intensity={lightingControls.ambientStrength} color={lightingControls.ambientColor} />

            {/* Directional Light */}
            <directionalLight position={[-1, -1, 0]}></directionalLight>

            <pointLight ref={pointlightRef} position={[0, 2.0, 0]} intensity={4.0} />

            <TileMap />
        </>

    )
}

