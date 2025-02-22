"use client"

import { Leva, useControls } from "leva"
import { createContext, useContext, useMemo } from "react"

type FramebufferControls = {
    buffer: string
}

type PixelationControls = {
    enabled: boolean;
    texelSize: number;
    tileTexelWidth: number;
    tileTexelHeight: number;
}

type LightingControls = {
    ambientStrength: number;
    ambientColor: string;
}

type CameraControls = {
    moveSpeed: number;
}

export const FRAMEBUFFER_ALBEDO = "Albedo"
export const FRAMEBUFFER_NORMAL = "Normal"
export const FRAMEBUFFER_DEPTH = "Depth"
export const FRAMEBUFFER_RESULT = "Result"

const DEFAULT_VALUES = {
    framebufferControls: {
        buffer: FRAMEBUFFER_RESULT
    },
    pixelationControls: {
        enabled: true,
        texelSize: 4,
        tileTexelWidth: 24,
        tileTexelHeight: 4
    },
    lightingControls: {
        ambientStrength: 0.2,
        ambientColor: '#ffffff'
    },
    cameraControls: {
        moveSpeed: 0.05
    },
}

const ControlsContext = createContext<{
    framebufferControls: FramebufferControls,
    pixelationControls: PixelationControls,
    lightingControls: LightingControls,
    cameraControls: CameraControls,
    reset: () => void,
    applySourceImagePreset: () => void,
    applyDepthBufferPreset: () => void,
    applyNormalBufferPreset: () => void,
}>({
    ...DEFAULT_VALUES,
    reset: () => { },
    applySourceImagePreset: () => { },
    applyDepthBufferPreset: () => { },
    applyNormalBufferPreset: () => { }
});


export default function ControlsProvider({ children }: {
    children: React.ReactNode
}) {

    const framebufferOptions = useMemo(() => {
        return {
            buffer: { label: "Buffer", options: [FRAMEBUFFER_ALBEDO, FRAMEBUFFER_NORMAL, FRAMEBUFFER_DEPTH, FRAMEBUFFER_RESULT], value: FRAMEBUFFER_RESULT }
        }
    }, [])

    const pixelationOptions = useMemo(() => {
        return {
            enabled: { label: "Enabled", value: DEFAULT_VALUES.pixelationControls.enabled },
            texelSize: { label: "Texel Size", value: DEFAULT_VALUES.pixelationControls.texelSize },
            tileTexelWidth: { label: "Tile Width", value: DEFAULT_VALUES.pixelationControls.tileTexelWidth },
            tileTexelHeight: { label: "Tile Height", value: DEFAULT_VALUES.pixelationControls.tileTexelHeight }
        }
    }, [])

    const lightingOptions = useMemo(() => {
        return {
            ambientColor: {
                label: "Ambient Color",
                value: DEFAULT_VALUES.lightingControls.ambientColor
            },
            ambientStrength: {
                label: "Ambient Intensity",
                value: DEFAULT_VALUES.lightingControls.ambientStrength,
                min: 0.0,
                max: 1.0,
                step: 0.05
            }
        }
    }, [])

    const cameraOptions = useMemo(() => {
        return {
            moveSpeed: {
                label: "Movement Speed",
                value: DEFAULT_VALUES.cameraControls.moveSpeed,
                min: 0.01,
                max: 2
            }
        }
    }, [])

    const [pixelationControls, setPixelationControls] = useControls('Pixelation', () => pixelationOptions)
    const [lightingControls, setLightingControls] = useControls('Lighting', () => lightingOptions)
    const [cameraControls, setCameraControls] = useControls('Camera', () => cameraOptions)
    const [framebufferControls, setFramebufferControls] = useControls('Framebuffers', () => framebufferOptions)

    const reset = () => {
        setPixelationControls(DEFAULT_VALUES.pixelationControls)
        setLightingControls(DEFAULT_VALUES.lightingControls)
        setCameraControls(DEFAULT_VALUES.cameraControls)
        setFramebufferControls(DEFAULT_VALUES.framebufferControls)
    }

    const applySourceImagePreset = () => {
        setPixelationControls({
            ...pixelationControls,
            enabled: false
        })
    }

    const applyDepthBufferPreset = () => {
        setFramebufferControls({
            buffer: FRAMEBUFFER_DEPTH
        })
    }

    const applyNormalBufferPreset = () => {
        setFramebufferControls({
            buffer: FRAMEBUFFER_NORMAL
        })
    }

    return (
        <ControlsContext.Provider value={{
            pixelationControls,
            lightingControls,
            cameraControls,
            framebufferControls,
            reset,
            applySourceImagePreset,
            applyDepthBufferPreset,
            applyNormalBufferPreset
        }}>
            <div className="xl:flex hidden">
                <Leva
                    titleBar={{
                        drag: false,
                    }}
                    theme={{
                        colors: {
                            elevation1: "var(--color-zinc-700)",
                            elevation2: "var(--color-zinc-800)",
                            elevation3: "var(--color-zinc-700)",
                            accent2: "var(--color-emerald-500)",
                            accent3: "var(--color-emerald-600)",
                            folderTextColor: "var(--color-zinc-100)",
                        },
                    }}
                />
            </div>

            {children}
        </ControlsContext.Provider>
    )
}

export function useControlScheme() {
    return useContext(ControlsContext)
}