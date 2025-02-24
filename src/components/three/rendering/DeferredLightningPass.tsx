import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LightingMaterial } from '../material/lightpass';
import { useControlScheme } from '@/providers/controls';
import { useResolution } from '@/utils/hooks';
import { useFireflies } from './fireflies';

export function DeferredLightingPass({ gBuffer, resultBuffer }: {
    gBuffer: THREE.WebGLRenderTarget,
    resultBuffer: THREE.WebGLRenderTarget,
}) {
    const { gl, camera } = useThree();
    const orthoCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
    const { lightingControls, pixelationControls } = useControlScheme()
    const { internalWidth, internalHeight } = useResolution(pixelationControls.texelSize, pixelationControls.tileTexelWidth);

    const { fireflies, updateFireflies } = useFireflies()

    const material = useMemo(() => {
        return LightingMaterial.clone();
    }, [])

    useEffect(() => {
        material.uniforms["uFireflies"].value = fireflies;
        material.uniforms["uNumFireflies"].value = fireflies.length;
    }, [fireflies, material.uniforms])

    useEffect(() => {
        // BUFFERS
        material.uniforms["tAlbedo"].value = gBuffer.textures[0]
        material.uniforms["tNormal"].value = gBuffer.textures[1]
        material.uniforms["tPosition"].value = gBuffer.textures[2]
        material.uniforms["tDepth"].value = gBuffer.depthTexture

        // SUN
        material.uniforms["uSun"].value = {
            intensity: lightingControls.sunStrength,
            direction: new THREE.Vector3(1, 2, 1).normalize(),
            color: new THREE.Color(lightingControls.sunColor)
        }

        // AMBIENT LIGHT
        material.uniforms["ambientIntensity"].value = lightingControls.ambientStrength
        material.uniforms["ambientColor"].value = new THREE.Color(lightingControls.ambientColor)
    }, [gBuffer, lightingControls.sunStrength, lightingControls.sunColor, lightingControls.ambientStrength, lightingControls.ambientColor, orthoCamera.projectionMatrix, orthoCamera.matrixWorldInverse, material.uniforms])

    // Render the full-screen quad in a separate scene.
    const quadScene = useMemo(() => {
        const scene = new THREE.Scene();
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        return scene;
    }, [material]);

    useFrame((_, delta) => {
        gl.setRenderTarget(resultBuffer);

        updateFireflies(delta)

        camera.updateMatrixWorld();
        material.uniforms["uTime"].value += delta;
        material.uniforms["uResolution"].value.set(internalWidth, internalHeight)
        material.uniforms["uViewProjectionMatrix"].value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

        gl.render(quadScene, orthoCamera);
    }, 1);

    return null;
}