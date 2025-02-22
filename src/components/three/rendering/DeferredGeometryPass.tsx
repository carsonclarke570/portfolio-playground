import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three'

export function DeferredGeometryPass({ children, gBuffer }: {
    children: React.ReactNode;
    gBuffer: THREE.WebGLRenderTarget
}) {
    const { gl, scene, camera } = useThree();

    useFrame(() => {
        gl.setRenderTarget(gBuffer);
        gl.clear();
        gl.render(scene, camera);
    }, 0)

    return <>{children}</>
}

