import React, { useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// highlightedRegion can be: 'inner_race' | 'outer_race' | 'roller_element' | null
export function BearingModel({ highlightedRegion = null, ...props }) {
  const { nodes, materials } = useGLTF('/rolling-bearing.glb')
  
  const innerRef = useRef()
  const outerRef = useRef()
  const rollerRef = useRef()

  const clonedMaterials = useMemo(() => {
    const mats = {
      roller_chrome: new THREE.MeshBasicMaterial(),
      cage_bronze: new THREE.MeshBasicMaterial(),
      race_steel: new THREE.MeshBasicMaterial(),
      shaft_steel: new THREE.MeshBasicMaterial(),
      housing_iron: new THREE.MeshBasicMaterial(),
      load_arrow: new THREE.MeshBasicMaterial(),
    }
    // Set wireframe for all materials to match the requested aesthetic
    Object.values(mats).forEach(mat => {
      mat.wireframe = true
      mat.transparent = true
      mat.opacity = 0.5
      mat.color = new THREE.Color('#88aadd') // Slightly bluish tech color
    })
    return mats
  }, [])

  // Custom alert material
  const alertMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: '#ff4444',
      wireframe: true,
      transparent: true,
      opacity: 0.8
    })
    return mat
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    
    // Normal healthy animation (from original model or implied by spec)
    // Inner race spins, outer race is static, rollers orbit
    if (innerRef.current) innerRef.current.rotation.y = t * 2
    if (rollerRef.current) rollerRef.current.rotation.y = t * 1 // Rollers orbit at half speed
    
    // Pulse effect if highlighted
    if (highlightedRegion) {
      const intensity = (Math.sin(t * Math.PI * 2) + 1) / 2 // 0 to 1, 1Hz
      alertMaterial.opacity = 0.4 + (intensity * 0.6)
    }
  })

  // Helper to pick material
  const getMat = (regionName, originalMat) => {
    return highlightedRegion === regionName ? alertMaterial : clonedMaterials[originalMat]
  }

  return (
    <group {...props} dispose={null}>
      <group rotation={[0.15, 0, 0]}>
        {/* ROLLER ELEMENTS & CAGE */}
        <group ref={rollerRef}>
          {/* Rollers row 0 */}
          {[0.63, 0.582, 0.445, 0.241, 0, -0.241, -0.445, -0.582, -0.63, -0.582, -0.445, -0.241, 0, 0.241, 0.445, 0.582].map((x, i) => {
            const zVals = [0, 0.241, 0.445, 0.582, 0.63, 0.582, 0.445, 0.241, 0, -0.241, -0.445, -0.582, -0.63, -0.582, -0.445, -0.241]
            return (
              <mesh key={`r0_${i}`} geometry={nodes[`roller_0_${i}`].geometry} material={getMat('roller_element', 'roller_chrome')} position={[x, -0.14, zVals[i]]} />
            )
          })}
          {/* Rollers row 1 */}
          {[0.63, 0.582, 0.445, 0.241, 0, -0.241, -0.445, -0.582, -0.63, -0.582, -0.445, -0.241, 0, 0.241, 0.445, 0.582].map((x, i) => {
            const zVals = [0, 0.241, 0.445, 0.582, 0.63, 0.582, 0.445, 0.241, 0, -0.241, -0.445, -0.582, -0.63, -0.582, -0.445, -0.241]
            return (
              <mesh key={`r1_${i}`} geometry={nodes[`roller_1_${i}`].geometry} material={getMat('roller_element', 'roller_chrome')} position={[x, 0.14, zVals[i]]} />
            )
          })}
          
          {/* Cage */}
          <mesh geometry={nodes.cage_rim_0.geometry} material={getMat('roller_element', 'cage_bronze')} position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={nodes.cage_rim_1.geometry} material={getMat('roller_element', 'cage_bronze')} position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} />
          {[0.63, 0.582, 0.445, 0.241, 0, -0.241, -0.445, -0.582, -0.63, -0.582, -0.445, -0.241, 0, 0.241, 0.445, 0.582].map((x, i) => {
            const zVals = [0, 0.241, 0.445, 0.582, 0.63, 0.582, 0.445, 0.241, 0, -0.241, -0.445, -0.582, -0.63, -0.582, -0.445, -0.241]
            return (
              <mesh key={`cage_bar_${i}`} geometry={nodes[`cage_bar_${i}`].geometry} material={getMat('roller_element', 'cage_bronze')} position={[x, 0, zVals[i]]} />
            )
          })}
        </group>

        {/* INNER RACE & SHAFT */}
        <group ref={innerRef}>
          <mesh geometry={nodes.inner_race.geometry} material={getMat('inner_race', 'race_steel')} />
          <mesh geometry={nodes.shaft.geometry} material={clonedMaterials.shaft_steel} />
        </group>

        {/* OUTER RACE & HOUSING */}
        <group ref={outerRef}>
          <mesh geometry={nodes.outer_race.geometry} material={getMat('outer_race', 'race_steel')} />
          <mesh geometry={nodes.housing_block.geometry} material={clonedMaterials.housing_iron} rotation={[-Math.PI / 2, 0, 0]} />
        </group>

        {/* LOAD ARROWS (Removed per user request) */}
        {/* <mesh geometry={nodes.load_arrow_shaft.geometry} material={clonedMaterials.load_arrow} position={[0, 1.715, 0]} /> */}
        {/* <mesh geometry={nodes.load_arrow_head.geometry} material={clonedMaterials.load_arrow} position={[0, 1.31, 0]} rotation={[Math.PI, 0, 0]} /> */}
      </group>
    </group>
  )
}

useGLTF.preload('/rolling-bearing.glb')
