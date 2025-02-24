import * as THREE from 'three'

export const LightingMaterial = new THREE.ShaderMaterial({
    uniforms: {
        tAlbedo: { value: new THREE.Texture() },
        tNormal: { value: new THREE.Texture() },
        tPosition: { value: new THREE.Texture() },
        tDepth: { value: new THREE.Texture() },

        uTime: { value: 0.0 },

        uResolution: { value: new THREE.Vector2() },
        uViewProjectionMatrix: { value: new THREE.Matrix4() },

        uSun: {
            value: {
                intensity: 1.0,
                direction: new THREE.Vector3(1, 1, 0).normalize(),
                color: new THREE.Vector3(1, 1, 1),
            }
        },
        ambientIntensity: { value: 0.5 },
        ambientColor: { value: new THREE.Vector3(1, 1, 1) },
        uFireflies: {
            value: []
        },
        uNumFireflies: { value: 10 },
        uPointLights: {
            value: []
        },
        uNumPointLights: { value: 0 },
        uDitherSize: { value: 1 },
        uDitherSpread: { value: 0.05 },
        uDitherLevels: { value: 5 }
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
    
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        struct DirectionalLight {
            float intensity;
            vec3 color;
            vec3 direction;
        };

        struct Firefly {
            vec3 position;
            vec3 color;
            float strength;
        };

        struct PointLight {
            float linear;
            float quadratic;
            vec3 position;
            vec3 color;
        };

        uniform sampler2D tAlbedo;
        uniform sampler2D tNormal;
        uniform sampler2D tDepth;
        uniform sampler2D tPosition;

        uniform float uTime;

        uniform vec2 uResolution;
        uniform mat4 uViewProjectionMatrix;

        uniform DirectionalLight uSun;
        uniform PointLight[4] uPointLights;
        uniform int uNumPointLights;
        uniform Firefly[10] uFireflies;
        uniform int uNumFireflies;

        uniform float ambientIntensity;
        uniform vec3 ambientColor;

        varying vec2 vUv;

        uniform int uDitherSize;
        uniform float uDitherSpread;
        uniform float uDitherLevels;

        float BAYER_4[16] = float[](
            0.0, 8.0, 2.0, 10.0,
            12.0, 4.0, 14.0, 6.0,
            3.0, 11.0, 1.0, 9.0,
            15.0, 7.0, 13.0, 5.0
        );

        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        float dithering(vec4 fragcoord, float lum) {
            int x = (int(fragcoord.x) % (4 * uDitherSize)) / uDitherSize;
            int y = (int(fragcoord.y) % (4 * uDitherSize)) / uDitherSize;
            float discrete_bayer = BAYER_4[(y * 4) + x];
            float bayer = discrete_bayer / 16.0;
            return clamp(lum - (bayer * uDitherSpread), 0.0, 1.0);
        }

        vec3 ambient_light(float depth, vec3 albedo) {
            return ambientIntensity * ambientColor * step(0.01, depth) * albedo;
        }

        vec3 directional_light(DirectionalLight light, vec3 albedo, vec3 normal) {
            float NdotL = max(dot(normal, light.direction), 0.0);

            float attenuation = light.intensity * NdotL;
            vec3 diffuse = albedo * light.color;

            return diffuse * attenuation;
        }

        void main() {
            vec3 albedo = texture2D(tAlbedo, vUv).rgb;
            vec3 normal = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;
            vec3 position = texture2D(tPosition, vUv).rgb;
            float depth = texture2D(tDepth, vUv).r;

            // Ambient Light
            vec3 totalLight = ambient_light(depth, albedo);

            // Sunlight
            totalLight += directional_light(uSun, albedo, normal);

            float particleAttenuation = 0.0;
            vec3 particleDiffuse = vec3(0.0);

            float particleMask = 0.0;
            vec3 particleMaskColor = vec3(1.0);

            for (int i = 0; i < 10; i++) {
                vec3 fireflyPosition = uFireflies[i].position;
                float strength = uFireflies[i].strength;

                // Calculate particle mask
                {
                    vec4 clipPos = uViewProjectionMatrix * vec4(fireflyPosition, 1.0);
                    vec3 ndcPos = clipPos.xyz / clipPos.w;
                    vec2 screenPos = (ndcPos.xy * 0.5 + 0.5) * uResolution;
                    vec2 fragScreenPos = gl_FragCoord.xy;

                    float screenDist = length(screenPos - fragScreenPos);
                    if (screenDist <= 2.0) {
                        particleMask = smoothstep(1.5, 0.0, screenDist) * strength;
                        particleMaskColor = uFireflies[i].color;
                    }
                }

                // Calculate particle light
                {
                    float distance = length(fireflyPosition - position);
                    vec3 lightDir = normalize(fireflyPosition - position);

                    float atten = (1.0 / (1.0 + 0.25 * distance * distance)) * max(dot(normal, lightDir), 0.0) * strength;
                    // float adjustedAtten = floor(dithering(gl_FragCoord, atten) * 8.0) / 8.0;

                    vec3 diffuse = albedo * uFireflies[i].color;
                    if (atten > particleAttenuation) {
                        particleDiffuse = diffuse;
                        particleAttenuation = atten;
                    }
                }
            }

            particleAttenuation = floor(dithering(gl_FragCoord, particleAttenuation) * 7.0) / 7.0;

            vec3 particleLight = albedo * particleDiffuse * particleAttenuation;
            vec3 finalColor = mix(totalLight + particleLight, particleMaskColor, particleMask);

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
    depthTest: false,
    depthWrite: false
})