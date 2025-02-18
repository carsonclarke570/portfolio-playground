'use client'

import { useState } from "react"
import cx from 'classnames'
import { useControlScheme } from "@/providers/controls"

const DEFAULT_DESCRIPTION = "Press any button to learn more."

type EffectButton = {
    label: string;
    description: string;
    onSelect: () => void;
}

export default function PlaygroundControls() {

    const controls = useControlScheme();

    const [description, setDescripton] = useState(DEFAULT_DESCRIPTION)
    const [activeEffectIndex, setActiveEffectIndex] = useState(-1)

    const effects: EffectButton[] = [
        {
            label: "Source Image",
            description: "The scene, before pixelation, is rendered with full resolution. While it might not intuitively make sense to render the scene in high-resolution before pixelizing it, capturing the finer details of color, depth and normals up-front pays dividends later.",
            onSelect: controls.applySourceImagePreset
        },
        {
            label: "Depth Buffer",
            description: "The depth buffer stores the distance from the camera the scene is at each pixel. The GPU uses this to determine what 3D objects are in the front of the scene but it also gives us valuable information for some of our post-processing effects.",
            onSelect: controls.applyDepthBufferPreset
        },
        {
            label: "Normal Buffer",
            description: "The normal buffer stores the direction the surface found at each pixel is facing. This gives us valuable information for both lighting and post-processing effects.",
            onSelect: controls.applyNormalBufferPreset
        }
    ]

    return (
        <div className="rounded-lg bg-zinc-800 text-zinc-100 max-w-xs" style={{
            boxShadow: "0 0 9px 0 #00000088"
        }}>
            <button
                className="absolute mt-2 ml-4 border px-2 rounded-sm text-sm text-zinc-100 hover:bg-emerald-600/30 hover:border-emerald-300"
                onClick={() => { controls.reset() }}
            >
                Reset
            </button>

            <h1 className="text-sm text-center bg-zinc-700 p-2 rounded-t-lg">Playground</h1>

            <div className="flex flex-col text-xs py-4 px-4 space-y-4">

                {/* Buttons */}
                <div className="grid grid-cols-3 gap-2">
                    {effects.map((effect, idx) => {
                        const isActive = idx == activeEffectIndex;

                        return (
                            <button
                                key={effect.label}
                                className={cx("border rounded-md border-emerald-500/40 hover:bg-emerald-600/30 p-1", isActive && "bg-emerald-600/30")}
                                onClick={async () => {
                                    await controls.reset()
                                    setDescripton(effect.description)
                                    setActiveEffectIndex(idx)
                                    effect.onSelect()
                                }}
                            >
                                {effect.label}
                            </button>
                        )
                    })}
                </div>

                {/* Description */}
                <p>
                    {description}
                </p>
            </div>
        </div>
    )
}