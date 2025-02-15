"use client"

import { useControls } from "leva"

export default function ControlsProvider({ children }: {
    children: React.ReactNode
}) {

    return <>
        {children}
    </>
}