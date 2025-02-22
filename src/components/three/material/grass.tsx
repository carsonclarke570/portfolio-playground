import { shaderMaterial } from "@react-three/drei"

export const GrassMaterial = shaderMaterial({},
    /*glsl*/`
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
            mat3 normalMatrix = transpose(inverse(mat3(instanceMatrix)));
            vec4 worldPos = instanceMatrix * vec4(position, 1.0);

            vUv = uv;
            vNormal = normalMatrix * normal;
            gl_Position = projectionMatrix * modelViewMatrix * worldPos;
        }
    `,
    /*glsl*/`
        precision highp float;
        varying vec2 vUv;
        varying vec3 vNormal;

        layout(location = 0) out vec4 gAlbedo;
        layout(location = 1) out vec4 gNormal;

        void main() {
            // Get albedo either from a texture or use a fallback color.
            vec3 albedo = vec3(0.0, 1.0, 1.0);
            // Remap normals from [-1,1] to [0,1]
            vec3 normal = normalize(vNormal) * 0.5 + 0.5;

            // Write to multiple render targets:
            // gl_FragData[0] will be your albedo buffer.
            // gl_FragData[1] will be your normal buffer.
            gAlbedo = vec4(albedo, 1.0);
            gNormal = vec4(normal, 1.0);
        }
    `,
)