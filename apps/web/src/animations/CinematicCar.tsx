import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    useGLTF,
    Environment,
} from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import "./CinematicCar.css";

function CarModel() {
    const { scene } = useGLTF(
        "/models/bmw_m4_competition_m_package.glb"
    );

    return (
        <group
            position={[2.2, -0.3, 0]}
            rotation={[0, 0, 0]}
            scale={0.25}
        >
            <primitive object={scene} />
        </group>
    );
}

function CinematicCar() {
    return (
        <div className="cinematic-car">
            <Canvas
                camera={{
                    position: [0, 0, 8],
                    fov: 40,
                    near: 0.01,
                    far: 1000,
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                dpr={[1, 2]}
                onCreated={({ gl }) => {
                    // Accurate colors
                    gl.outputColorSpace = THREE.SRGBColorSpace;

                    // Cinematic contrast
                    gl.toneMapping =
                        THREE.ACESFilmicToneMapping;

                    // Controlled brightness
                    gl.toneMappingExposure = 0.85;
                }}
            >
                <Suspense fallback={null}>

                    {/* -------------------------------- */}
                    {/* DARK STUDIO REFLECTIONS */}
                    {/* -------------------------------- */}

                    <Environment
                        preset="studio"
                        environmentIntensity={0.45}
                    />

                    {/* -------------------------------- */}
                    {/* SOFT BASE LIGHT */}
                    {/* -------------------------------- */}

                    <ambientLight intensity={0.25} />

                    {/* -------------------------------- */}
                    {/* FRONT KEY LIGHT */}
                    {/* -------------------------------- */}

                    <directionalLight
                        position={[4, 6, 7]}
                        intensity={2.2}
                    />

                    {/* -------------------------------- */}
                    {/* LEFT DETAIL LIGHT */}
                    {/* -------------------------------- */}

                    <directionalLight
                        position={[-5, 3, 5]}
                        intensity={1.4}
                    />

                    {/* -------------------------------- */}
                    {/* RIGHT DETAIL LIGHT */}
                    {/* -------------------------------- */}

                    <directionalLight
                        position={[5, 2, 3]}
                        intensity={1.0}
                    />

                    {/* -------------------------------- */}
                    {/* BACK RIM LIGHT */}
                    {/* -------------------------------- */}

                    <directionalLight
                        position={[0, 4, -6]}
                        intensity={1.5}
                    />

                    {/* -------------------------------- */}
                    {/* BMW */}
                    {/* -------------------------------- */}

                    <CarModel />

                    {/* -------------------------------- */}
                    {/* DRAG TO ROTATE */}
                    {/* -------------------------------- */}

                    <OrbitControls
                        target={[0, 0, 0]}
                        enableZoom={false}
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.08}
                        rotateSpeed={0.6}
                    />

                </Suspense>
            </Canvas>
        </div>
    );
}

useGLTF.preload(
    "/models/bmw_m4_competition_m_package.glb"
);

export default CinematicCar;