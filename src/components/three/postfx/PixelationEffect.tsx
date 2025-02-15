import { useDisplaySize, useInternalSize } from '@/utils/hooks'
import { useFBO } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * PixelationEffect renders the whole scene into a low-resolution FBO,
 * then draws a fullscreen quad that samples from that FBO.
 */
export default function PixelationEffect({ texelSize }: {
    texelSize: number
}) {

    const { gl, scene, camera } = useThree()
    const { internalWidth, internalHeight } = useInternalSize(texelSize)
    const { displayWidth, displayHeight } = useDisplaySize(texelSize)

    const depthTexture = new THREE.DepthTexture(internalWidth, internalHeight);
    depthTexture.format = THREE.DepthFormat;
    depthTexture.type = THREE.UnsignedShortType;

    const fbo = useFBO(internalWidth, internalHeight, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps: false,
        depthBuffer: true,
        depthTexture: depthTexture
    })

    const postScene = new THREE.Scene()
    const quadMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: fbo.texture },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(tDiffuse, vUv);
            }
        `,
        depthTest: false,
        depthWrite: false,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMaterial)
    postScene.add(quad)

    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    useFrame(() => {
        // 1. Render the main scene into the low-res FBO.
        gl.setRenderTarget(fbo)
        gl.clear()
        gl.render(scene, camera)

        // 2. Render the fullscreen quad with the pixelated texture.
        gl.setRenderTarget(null)
        gl.setSize(displayWidth, displayHeight)
        gl.render(postScene, postCamera)
    }, 1)

    return null
}