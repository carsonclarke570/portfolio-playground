import { shaderMaterial } from "@react-three/drei"
import * as THREE from 'three'

const fragShader = /*glsl*/`
    precision highp float;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    layout(location = 0) out vec4 gAlbedo;
    layout(location = 1) out vec4 gNormal;
    layout(location = 2) out vec4 gPosition;

    uniform vec3 uLowColor;
    uniform vec3 uHighColor;

    float random(vec2 uv) {
        return fract(sin(dot(uv.xy,
            vec2(12.9898,78.233))) *
                43758.5453123);
    }

    float noise(vec2 uv) {
        vec2 uv_index = floor(uv);
        vec2 uv_fract = fract(uv);

        // Four corners in 2D of a tile
        float a = random(uv_index);
        float b = random(uv_index + vec2(1.0, 0.0));
        float c = random(uv_index + vec2(0.0, 1.0));
        float d = random(uv_index + vec2(1.0, 1.0));

        vec2 blur = smoothstep(0.0, 1.0, uv_fract);

        return mix(a, b, blur.x) +
                (c - a) * blur.y * (1.0 - blur.x) +
                (d - b) * blur.x * blur.y;
    }

    float fbm(vec2 uv) {
        int octaves = 6;
        float amplitude = 0.5;
        float frequency = 3.0;
        float value = 0.0;

        for(int i = 0; i < octaves; i++) {
            value += amplitude * noise(frequency * uv);
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        return value;
    }

    void main() {
        float noiseLevel = fbm(vPosition.xz / 8.0);
        noiseLevel = floor(noiseLevel * 5.0) / 5.0;

        vec3 albedo = mix(uLowColor, uHighColor, noiseLevel);
        vec3 normal = normalize(vNormal) * 0.5 + 0.5;

        // Write to multiple render targets:
        gAlbedo = vec4(albedo, 1.0);
        gNormal = vec4(normal, 1.0);
        gPosition = vec4(vPosition, 1.0);
    }
`

export const GrassTileMaterial = shaderMaterial({
    uLowColor: new THREE.Vector3(1, 1, 1),
    uHighColor: new THREE.Vector3(0, 0, 0),
},
    /*glsl*/`
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            mat3 normalMatrix = transpose(inverse(mat3(modelMatrix)));
            vec4 worldPos = modelMatrix * vec4(position, 1.0);

            vUv = uv;
            vNormal = normalMatrix * normal;
            vPosition = worldPos.rgb;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
    `,
    fragShader
)

export const InstancedGrassTileMaterial = shaderMaterial({
    uLowColor: new THREE.Vector3(1, 1, 1),
    uHighColor: new THREE.Vector3(0, 0, 0),
},
    /*glsl*/`
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            mat3 normalMatrix = transpose(inverse(mat3(instanceMatrix)));
            vec4 worldPos = instanceMatrix * vec4(position, 1.0);

            vUv = uv;
            vNormal = normalMatrix * normal;
            vPosition = worldPos.rgb;
            gl_Position = projectionMatrix * modelViewMatrix * worldPos;
        }
    `,
    fragShader
)