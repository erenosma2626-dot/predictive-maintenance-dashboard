import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import './EngineModel.css';

// The actual 3D model component
const EngineObject = ({ isAlert, maintenanceProbability }) => {
  const { scene } = useGLTF('/jet-engine.glb');
  const groupRef = useRef();

  // Create a custom material that matches our dashboard
  const material = useMemo(() => {
    // Normal color is a subtle steel/blueish, alert is pulsing red
    return new THREE.MeshStandardMaterial({
      color: isAlert ? '#ff3333' : '#4a5568',
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
  }, [isAlert]);

  // Apply our custom wireframe material to every mesh in the GLB
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
      }
    });
  }, [scene, material]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Base rotation speed
    let speed = 0.005;
    
    // If high risk, spin it faster and erratically
    if (isAlert) {
      speed = 0.05 + (maintenanceProbability * 0.05);
      // Add a slight shake/jitter
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.05;
      groupRef.current.position.x = Math.cos(state.clock.elapsedTime * 25) * 0.05;
    } else {
      // Smooth reset to center
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1);
    }
    
    groupRef.current.rotation.y += speed;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <primitive 
      ref={groupRef}
      object={scene} 
      scale={1.5} 
      position={[0, -0.5, 0]} 
    />
  );
};

// The wrapper container with the Canvas
const EngineModel = ({ isAlert, maintenanceProbability }) => {
  return (
    <div className={`engine-container ${isAlert ? 'alert' : ''}`}>
      <span className="section-label" style={{position: 'absolute', top: '15px', left: '15px', zIndex: 10}}>
        DIGITAL TWIN
      </span>
      {isAlert && (
        <div className="engine-warning">
          STRUCTURAL INTEGRITY COMPROMISED
        </div>
      )}
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <React.Suspense fallback={null}>
          <EngineObject isAlert={isAlert} maintenanceProbability={maintenanceProbability} />
          <Environment preset="city" />
        </React.Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={!isAlert} autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

// Preload the model to prevent popping
useGLTF.preload('/jet-engine.glb');

export default EngineModel;
