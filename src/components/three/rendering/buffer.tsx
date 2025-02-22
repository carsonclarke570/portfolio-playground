import { useFBO } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from 'three'

export function useGBuffer(width: number, height: number): THREE.WebGLRenderTarget {
    return useMemo(() => {
        const gBuffer = new THREE.WebGLRenderTarget(width, height, {
            count: 2,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            generateMipmaps: false,
            type: THREE.FloatType,
            depthBuffer: true,
            depthTexture: new THREE.DepthTexture(width, height, THREE.FloatType),
        })

        gBuffer.textures[0].name = 'gAlbedo';
        gBuffer.textures[1].name = 'gNormal';

        return gBuffer;

    }, [width, height])
}

export function useResultBuffer(width: number, height: number): THREE.WebGLRenderTarget {
    return useFBO(width, height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps: false,
        depthBuffer: false,
        depth: false
    })
}