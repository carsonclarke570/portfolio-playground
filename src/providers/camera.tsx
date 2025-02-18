"use client"

import { createContext, useCallback, useContext, useState } from "react"
import * as THREE from 'three'

const DEFAULTS = {
    angle: 45,
    position: new THREE.Vector3(0, 0, 0)
}

const CameraContext = createContext<{
    angle: number;
    position: THREE.Vector3;
    setPosition: (position: THREE.Vector3) => void;
    rotateLeft: () => void;
    rotateRight: () => void;
}>({
    ...DEFAULTS,
    setPosition: () => { },
    rotateLeft: () => { },
    rotateRight: () => { }
});

export default function CameraProvider({ children }: {
    children: React.ReactNode
}) {

    const [angle, setAngle] = useState(DEFAULTS.angle);
    const [position, setPosition] = useState(DEFAULTS.position);

    const rotateLeft = useCallback(() => {
        setAngle(angle - 90)
    }, [angle])

    const rotateRight = useCallback(() => {
        setAngle(angle + 90)
    }, [angle])


    return (
        <CameraContext.Provider value={{
            angle,
            position,
            setPosition,
            rotateLeft,
            rotateRight
        }}>
            {children}
        </CameraContext.Provider>
    )
}

export function useCameraControls() {
    return useContext(CameraContext)
}