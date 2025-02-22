import { shaderMaterial, Texture } from "@react-three/drei";
import * as THREE from 'three'

export const LightingMaterial = shaderMaterial(
    {
        tAlbedo: new THREE.Texture(),
        tNormal: new THREE.Texture(),
        tDepth: new THREE.Texture(),

        sunIntensity: 1.0,
        sunDir: new THREE.Vector3(1, 1, 0).normalize(),
        sunColor: new THREE.Vector3(1, 1, 1),

        ambientIntensity: 0.5,
        ambientColor: new THREE.Vector3(1, 1, 1),
    },
    /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    /* glsl */ `
        uniform sampler2D tAlbedo;
        uniform sampler2D tNormal;
        uniform sampler2D tDepth;

        uniform float sunIntensity;
        uniform vec3 sunDir;
        uniform vec3 sunColor;

        uniform float ambientIntensity;
        uniform vec3 ambientColor;

        varying vec2 vUv;

        void main() {
            vec3 albedo = texture2D(tAlbedo, vUv).rgb;
            vec3 normal = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;
            float depth = texture2D(tDepth, vUv).r;

            vec3 ambientLight = ambientIntensity * ambientColor * step(0.01, depth);
            vec3 diffuseLight = max(dot(normal, sunDir), 0.0) * sunIntensity * sunColor;
            vec3 totaLight = ambientLight + diffuseLight;

            gl_FragColor = vec4(totaLight * albedo, 1.0);
        }
    `
)