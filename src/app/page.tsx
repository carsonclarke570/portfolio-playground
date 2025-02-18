import PlaygroundControls from "@/components/playground/PlaygroundControls"

export default function Home() {
    return (
        <div className="fixed top-0 m-4">
            <div className="flex flex-col space-y-4">
                <Controls />
                <PlaygroundControls />
            </div>
        </div>
    )
}

function Controls() {
    return (
        <div className="rounded-lg bg-zinc-800 text-zinc-100" style={{
            boxShadow: "0 0 9px 0 #00000088"
        }}>
            <h1 className="text-sm text-center bg-zinc-700 p-2 rounded-t-lg">Keyboard Controls</h1>

            <div className="grid grid-cols-2 items-end text-xs py-4 px-4">

                {/* Move */}
                <div className="flex flex-col items-center space-y-1">

                    <div className="grid grid-cols-3 gap-1 text-emerald-500">
                        <div />
                        <div className="flex rounded-sm w-8 h-8 border items-center justify-center">W</div>
                        <div />
                        <div className="flex rounded-sm w-8 h-8 border items-center justify-center">A</div>
                        <div className="flex rounded-sm w-8 h-8 border items-center justify-center">S</div>
                        <div className="flex rounded-sm w-8 h-8 border items-center justify-center">D</div>
                    </div>

                    <div>Move</div>

                </div>

                {/* Rotate */}
                <div className="flex flex-col items-center space-y-1 ">
                    <div className="grid grid-cols-2 gap-1 text-emerald-500">
                        <div className="flex rounded-sm w-8 h-8 border items-center justify-center">Q</div>
                        <div className="flex rounded-sm w-8 h-8 border items-center justify-center">E</div>
                    </div>
                    <div>Rotate</div>
                </div>
            </div>
        </div>
    )
}

