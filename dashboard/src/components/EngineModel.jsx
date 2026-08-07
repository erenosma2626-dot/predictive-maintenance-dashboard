import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import './EngineModel.css';

// The actual 3D model component
const EngineObject = ({ isAlert, maintenanceProbability, dataset }) => {
  const modelPath = dataset === 'bearing' ? '/rolling-bearing.glb' : '/jet-engine.glb';
  const baseY = dataset === 'bearing' ? -0.2 : -1.5; // Bearing is naturally smaller/centered differently
  const { scene, nodes } = useGLTF(modelPath);
  const engineRef = useRef();
  const fanGroupRef = useRef();

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

  // Apply our custom wireframe material to every mesh in the GLB, and find the fan group
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
      }
    });
    // Find the group containing all fan blades to rotate them together (CMAPSS only)
    if (dataset === 'cmapss' && nodes.fan_blade_1 && nodes.fan_blade_1.parent && nodes.fan_blade_1.parent.parent) {
      fanGroupRef.current = nodes.fan_blade_1.parent.parent;
    } else if (dataset === 'bearing') {
      // For bearing, target the inner spinning parts
      const partsToSpin = [];
      if (nodes.rotor_assembly) partsToSpin.push(nodes.rotor_assembly);
      if (nodes.cage_retainer) partsToSpin.push(nodes.cage_retainer);
      
      // We store an array of objects to spin
      fanGroupRef.current = partsToSpin;
    }
  }, [scene, material, nodes, dataset]);

  useFrame((state) => {
    // Rotate the blades!
    if (fanGroupRef.current) {
      let speed = 0.1; // default fan speed
      if (isAlert) {
        speed = 0.5 + (maintenanceProbability * 0.5); // spin much faster on alert
      }
      
      if (dataset === 'bearing' && Array.isArray(fanGroupRef.current)) {
        fanGroupRef.current.forEach(part => {
          part.rotation.y -= speed; // Bearings usually spin on Y in this coordinate system
        });
      } else if (fanGroupRef.current && !Array.isArray(fanGroupRef.current)) {
        fanGroupRef.current.rotation.y += speed;
      }
    }

    // Add a slight shake/jitter to the whole engine only if alert is high
    if (engineRef.current) {
      if (isAlert) {
        engineRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 20) * 0.05;
        engineRef.current.position.x = Math.cos(state.clock.elapsedTime * 25) * 0.05;
      } else {
        engineRef.current.position.y = THREE.MathUtils.lerp(engineRef.current.position.y, baseY, 0.1);
        engineRef.current.position.x = THREE.MathUtils.lerp(engineRef.current.position.x, 0, 0.1);
      }
    }
  });

  return (
    <primitive 
      ref={engineRef}
      object={scene} 
      scale={1.5} 
      position={[0, baseY, 0]} 
    />
  );
};

// A small component to handle resetting the camera
const CameraController = ({ resetTrigger }) => {
  const { camera, controls } = useThree();
  
  useFrame(() => {
    if (resetTrigger > 0 && controls) {
      // Lerp camera back to default position
      camera.position.lerp(new THREE.Vector3(0, 0, 5), 0.1);
      controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
    }
  });
  return null;
};

// The wrapper container with the Canvas
const EngineModel = ({ isAlert, maintenanceProbability, dataset }) => {
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleResetCamera = () => {
    setResetTrigger(prev => prev + 1);
    // After 1 second, stop trying to reset so user can move it again
    setTimeout(() => {
      setResetTrigger(0);
    }, 1000);
  };

  return (
    <div className={`engine-container ${isAlert ? 'alert' : ''}`}>
      <span className="section-label" style={{position: 'absolute', top: '15px', left: '15px', zIndex: 10}}>
        DIGITAL TWIN
      </span>
      <button 
        className="reset-camera-btn" 
        onClick={handleResetCamera}
      >
        ⌖ Center Camera
      </button>
      {isAlert && (
        <div className="engine-warning">
          STRUCTURAL INTEGRITY COMPROMISED
        </div>
      )}
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <CameraController resetTrigger={resetTrigger} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <React.Suspense fallback={null}>
          <EngineObject isAlert={isAlert} maintenanceProbability={maintenanceProbability} dataset={dataset} />
          <Environment preset="city" />
        </React.Suspense>
        <OrbitControls enableZoom={true} enablePan={true} autoRotate={false} />
      </Canvas>
    </div>
  );
};

// Preload the models to prevent popping
useGLTF.preload('/jet-engine.glb');
useGLTF.preload('/rolling-bearing.glb');

export default EngineModel;
