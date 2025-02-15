"use client"

import { Canvas, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from 'three'
import { degToRad } from "three/src/math/MathUtils.js";
import CameraRig from "./CameraRig";
import { useEffect } from "react";
import { TILE_DIAGONAL_WORLD, TILE_SIDE_LENGTH_WORLD } from "@/utils/constants";
import PixelationEffect from "./postfx/PixelationEffect";

function tileWorldHeight(tileTexelHeight: number, tileTexelWidth: number) {
    const worldToTexelRatio = TILE_DIAGONAL_WORLD / tileTexelWidth;
    return tileTexelHeight * (worldToTexelRatio / Math.cos(degToRad(30)))
}

export default function ThreeCanvas() {

    const controls = useControls('Pixelation', {
        texelSize: {
            label: "Texel Size",
            value: 4
        },
        tileTexelWidth: {
            label: "Tile Width",
            value: 16
        }
    })

    return (
        <Canvas
            style={{ width: '100vw', height: '100vh' }}
            gl={{ antialias: false, depth: true }} // Turn off antialias for a crisper pixel look.

        >

            <CameraRig
                initialPosition={new THREE.Vector3(0, 0, 0)}
                distance={5}
                texelSize={controls.texelSize}
                tileTexelWidth={controls.tileTexelWidth}
            />

            <Scene tileTexelWidth={controls.tileTexelWidth} />

            {/* PostFX */}
            <>
                {/* <PixelationEffect texelSize={controls.texelSize} /> */}
                {/* <DepthDebugView texelSize={controls.texelSize} /> */}
            </>

        </Canvas>
    )
}


function Scene({ tileTexelWidth }: {
    tileTexelWidth: number;
}) {

    const { gl } = useThree()

    const controls = useControls('Lighting', {
        ambientLightStrength: {
            label: "Ambient Intensity",
            value: 2.0,
            min: 0.0,
            max: 5.0,
            step: 0.05
        }
    })

    const h = tileWorldHeight(4, tileTexelWidth)

    // Setup GL Context
    useEffect(() => {
        gl.getContext().clearDepth(0)
        gl.getContext().depthFunc(WebGL2RenderingContext.GEQUAL)
    }, [gl])

    return (
        <>
            {/* Ambient Light */}
            <ambientLight intensity={controls.ambientLightStrength} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
            <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

            <mesh position={[-1, 0, 0]}>
                <boxGeometry args={[TILE_SIDE_LENGTH_WORLD, h, TILE_SIDE_LENGTH_WORLD]} />
                <meshStandardMaterial color="blue" depthTest={true} side={THREE.BackSide} />
            </mesh>

            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[TILE_SIDE_LENGTH_WORLD, h, TILE_SIDE_LENGTH_WORLD]} />
                <meshStandardMaterial color="green" depthTest={true} side={THREE.BackSide} />
            </mesh>

            <mesh position={[1, 0, 0]}>
                <boxGeometry args={[TILE_SIDE_LENGTH_WORLD, h, TILE_SIDE_LENGTH_WORLD]} />
                <meshStandardMaterial color="red" depthTest={true} side={THREE.BackSide} />
            </mesh>
        </>

    )
}

