import { shaderMaterial } from "@react-three/drei";
import * as THREE from 'three'

export const LightingMaterial = shaderMaterial(
    {
        tAlbedo: new THREE.Texture(),
        tNormal: new THREE.Texture(),
        tPosition: new THREE.Texture(),
        tDepth: new THREE.Texture(),

        cameraPosition: new THREE.Vector3(0, 0, 0),

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
        uniform sampler2D tPosition;

        uniform float sunIntensity;
        uniform vec3 sunDir;
        uniform vec3 sunColor;

        uniform float ambientIntensity;
        uniform vec3 ambientColor;

        varying vec2 vUv;

        void main() {
            vec3 albedo = texture2D(tAlbedo, vUv).rgb;
            vec3 normal = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;
            vec3 position = texture2D(tPosition, vUv).rgb;
            float depth = texture2D(tDepth, vUv).r;

            float lambertian = max(dot(sunDir, normal), 0.0);
            // float specular = 0.0;
            vec3 viewDir = normalize(cameraPosition - position);

            // Ambient Light
            vec3 totalLight = ambientIntensity * ambientColor * step(0.01, depth) * albedo;

            // Sunlight
            vec3 H = normalize(sunDir + viewDir);
            float NdotL = max(dot(normal, sunDir), 0.0);

            float attenuation = sunIntensity;
            vec3 diffuse = NdotL * albedo * sunColor;
            vec3 specular = vec3(0.0); // pow(max(dot(normal, H), 0.0), 16.0) * sunColor;
            totalLight += (diffuse * attenuation) + (specular * attenuation);

            gl_FragColor = vec4(totalLight, 1.0);
        }
    `
)