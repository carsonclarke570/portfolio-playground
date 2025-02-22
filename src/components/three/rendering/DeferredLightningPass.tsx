import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LightingMaterial } from '../material/lightpass';
import { useControlScheme } from '@/providers/controls';

export function DeferredLightingPass({ gBuffer, resultBuffer }: {
    gBuffer: THREE.WebGLRenderTarget,
    resultBuffer: THREE.WebGLRenderTarget,
}) {
    const { gl } = useThree();
    const orthoCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
    const { lightingControls } = useControlScheme()

    const material = useMemo(() => new LightingMaterial({
        uniforms: {
            tAlbedo: { value: gBuffer.textures[0] },
            tNormal: { value: gBuffer.textures[1] },
            tDepth: { value: gBuffer.depthTexture },

            sunIntensity: { value: 1.0 },
            sunDir: { value: new THREE.Vector3(1, 2, 1).normalize() },
            sunColor: { value: new THREE.Vector3(1, 1, 1) },

            ambientIntensity: { value: lightingControls.ambientStrength },
            ambientColor: { value: new THREE.Color(lightingControls.ambientColor) },
        },
        depthTest: false,
        depthWrite: false,
    }), [gBuffer, lightingControls])

    // Render the full-screen quad in a separate scene.
    const quadScene = useMemo(() => {
        const scene = new THREE.Scene();
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        return scene;
    }, [material]);

    useFrame(() => {
        gl.setRenderTarget(resultBuffer);
        gl.render(quadScene, orthoCamera);
    }, 1);

    return null;
}