"use client"

import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from 'three'
import { degToRad } from "three/src/math/MathUtils.js";
import CameraRig from "./CameraRig";
import { useEffect, useMemo } from "react";
import { useControlScheme } from "@/providers/controls";
import DepthDebugView from "./postfx/DepthDebugView";

export default function ThreeCanvas() {

    const controls = useControlScheme()

    return (
        <Canvas
            style={{ width: '100vw', height: '100vh' }}
            gl={{ antialias: false }} // Turn off antialias for a crisper pixel look.

        >
            <CameraRig
                initialPosition={new THREE.Vector3(0, 0, 0)}
                distance={15}
            />

            <Scene />

            {/* PostFX */}
            <>
                {controls.framebufferControls.showDepth && <DepthDebugView texelSize={controls.pixelationControls.texelSize} tileTexelWidth={controls.pixelationControls.tileTexelWidth} />}
            </>

        </Canvas>
    )
}

function Scene() {
    const { gl } = useThree()
    const { lightingControls, pixelationControls } = useControlScheme()

    const h = useMemo(() => {
        const worldToTexelRatio = Math.SQRT2 / pixelationControls.tileTexelWidth;
        return pixelationControls.tileTexelHeight * (worldToTexelRatio / Math.cos(degToRad(30)))
    }, [pixelationControls.tileTexelHeight, pixelationControls.tileTexelWidth])

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

            <mesh position={[-1, -h / 2, 0]}>
                <boxGeometry args={[1, h, 1]} />
                <meshStandardMaterial color="blue" depthTest={true} side={THREE.BackSide} />
            </mesh>

            <mesh position={[0, -h / 2, 0]}>
                <boxGeometry args={[1, h, 1]} />
                <meshStandardMaterial color="green" depthTest={true} side={THREE.BackSide} />
            </mesh>

            <mesh position={[1, -h / 2, 0]}>
                <boxGeometry args={[1, h, 1]} />
                <meshStandardMaterial color="red" depthTest={true} side={THREE.BackSide} />
            </mesh>
        </>

    )
}

