import { useInternalSize } from "@/utils/hooks";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three'
import { useFBO } from "@react-three/drei";
import { useEffect, useMemo } from "react";

export default function DepthDebugView({ texelSize }: {
    texelSize: number
}) {
    const { gl, scene, camera } = useThree()
    const { internalWidth, internalHeight } = useInternalSize(texelSize);

    const depthTexture = useMemo(() => {
        const dt = new THREE.DepthTexture(internalWidth, internalHeight);
        dt.format = THREE.DepthFormat;
        dt.type = THREE.UnsignedShortType; // or THREE.FloatType if you prefer
        return dt;
    }, [internalWidth, internalHeight]);

    const fbo = useFBO(internalWidth, internalHeight, {
        depthBuffer: true,
        depthTexture: depthTexture
    })

    const debugMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                tDepth: { value: depthTexture },
                cameraNear: { value: camera.near },
                cameraFar: { value: camera.far },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D tDepth;
                uniform float cameraNear;
                uniform float cameraFar;

                void main() {
                    float d = texture2D(tDepth, vUv).r;
                    gl_FragColor = vec4(vec3(d), 1.0);
                }
            `,
            depthWrite: false,
            depthTest: false,
        });
    }, [depthTexture, camera.near, camera.far]);

    const debugScene = useMemo(() => new THREE.Scene(), []);
    const debugCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

    useEffect(() => {
        const quad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            debugMaterial
        );

        debugScene.add(quad);

        return () => {
            debugScene.remove(quad);
            quad.geometry.dispose();
            quad.material.dispose();
        };
    }, [debugScene, debugMaterial]);

    useFrame(() => {
        // 1) Render your main scene to the FBO (which has a depth texture)
        gl.setRenderTarget(fbo);
        gl.clear();
        gl.render(scene, camera);

        // 2) Render the debug scene with the depth texture
        gl.setRenderTarget(null);
        gl.clear();
        gl.render(debugScene, debugCamera);
    }, 1);

    return null;
}