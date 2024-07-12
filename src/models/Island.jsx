/**
 * IMPORTANT: Loading glTF models into a Three.js scene is a lot of work.
 * Before we can configure or animate our model’s meshes, we need to iterate through
 * each part of our model’s meshes and save them separately.
 *
 * But luckily there is an app that turns gltf or glb files into jsx components
 * For this model, visit https://gltf.pmnd.rs/
 * And get the code. And then add the rest of the things.
 * YOU DON'T HAVE TO WRITE EVERYTHING FROM SCRATCH
 */

import { a } from "@react-spring/three";
import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei"; 
import { useFrame, useThree } from "@react-three/fiber";

import islandScene from "../assets/3d/island.glb";

export function Island({
  isRotating,
  setIsRotating,
  setCurrentStage,
  currentFocusPoint,
  ...props
}) {
  const islandRef = useRef();
  // Get access to the Three.js renderer and viewport
  const { gl, viewport } = useThree();
  const { nodes, materials } = useGLTF(islandScene);

  // Use a ref for the last mouse x position
  const lastX = useRef(0);
  // Use a ref for rotation speed
  const rotationSpeed = useRef(0);
  // Define a damping factor to control rotation damping
  const dampingFactor = 0.95;

  // Handle pointer (mouse or touch) down event
  const handlePointerDown = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotating(true);

    // Calculate the clientX based on whether it's a touch event or a mouse event
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;

    // Store the current clientX position for reference
    lastX.current = clientX;
  };

  // Handle pointer (mouse or touch) up event
  const handlePointerUp = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotating(false);
  };

  // Handle pointer (mouse or touch) move event
  const handlePointerMove = (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (isRotating) {
      // If rotation is enabled, calculate the change in clientX position
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;

      // calculate the change in the horizontal position of the mouse cursor or touch input,
      // relative to the viewport's width
      const delta = (clientX - lastX.current) / viewport.width;

      // Update the island's rotation based on the mouse/touch movement
      islandRef.current.rotation.y += delta * 0.01 * Math.PI;

      // Update the reference for the last clientX position
      lastX.current = clientX;

      // Update the rotation speed
      rotationSpeed.current = delta * 0.01 * Math.PI;
    }
  };

  // Handle keydown events
  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      if (!isRotating) setIsRotating(true);

      islandRef.current.rotation.y += 0.005 * Math.PI;
      rotationSpeed.current = 0.007;
    } else if (event.key === "ArrowRight") {
      if (!isRotating) setIsRotating(true);

      islandRef.current.rotation.y -= 0.005 * Math.PI;
      rotationSpeed.current = -0.007;
    }
  };

  // Handle keyup events
  const handleKeyUp = (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      setIsRotating(false);
    }
  };

  // Touch events for mobile devices
  const handleTouchStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
  
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    lastX.current = clientX;
  }
  
  const handleTouchEnd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(false);
  }
  
  const handleTouchMove = (e) => {
    e.stopPropagation();
    e.preventDefault();
  
    if (isRotating) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const delta = (clientX - lastX.current) / viewport.width;
  
      islandRef.current.rotation.y += delta * 0.01 * Math.PI;
      lastX.current = clientX;
      rotationSpeed.current = delta * 0.01 * Math.PI;
    }
  }

  useEffect(() => {
    // Add event listeners for pointer and keyboard events
    const canvas = gl.domElement;
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchmove", handleTouchMove);

    // Remove event listeners when component unmounts
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [gl, handlePointerDown, handlePointerUp, handlePointerMove]);

  // This function is called on each frame update
  useFrame(() => {
    // If not rotating, apply damping to slow down the rotation (smoothly)
    if (!isRotating) {
      // Apply damping factor
      rotationSpeed.current *= dampingFactor;

      // Stop rotation when speed is very small
      if (Math.abs(rotationSpeed.current) < 0.001) {
        rotationSpeed.current = 0;
      }

      islandRef.current.rotation.y += rotationSpeed.current;
    } else {
      // When rotating, determine the current stage based on island's orientation
      const rotation = islandRef.current.rotation.y;

      /**
       * Normalize the rotation value to ensure it stays within the range [0, 2 * Math.PI].
       * The goal is to ensure that the rotation value remains within a specific range to
       * prevent potential issues with very large or negative rotation values.
       *  Here's a step-by-step explanation of what this code does:
       *  1. rotation % (2 * Math.PI) calculates the remainder of the rotation value when divided
       *     by 2 * Math.PI. This essentially wraps the rotation value around once it reaches a
       *     full circle (360 degrees) so that it stays within the range of 0 to 2 * Math.PI.
       *  2. (rotation % (2 * Math.PI)) + 2 * Math.PI adds 2 * Math.PI to the result from step 1.
       *     This is done to ensure that the value remains positive and within the range of
       *     0 to 2 * Math.PI even if it was negative after the modulo operation in step 1.
       *  3. Finally, ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) applies another
       *     modulo operation to the value obtained in step 2. This step guarantees that the value
       *     always stays within the range of 0 to 2 * Math.PI, which is equivalent to a full
       *     circle in radians.
       */
      const normalizedRotation =
        ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

      // Set the current stage based on the island's orientation
      switch (true) {
        case normalizedRotation >= 5.45 && normalizedRotation <= 5.85:
          setCurrentStage(4);
          break;
        case normalizedRotation >= 0.85 && normalizedRotation <= 1.3:
          setCurrentStage(3);
          break;
        case normalizedRotation >= 2.4 && normalizedRotation <= 2.6:
          setCurrentStage(2);
          break;
        case normalizedRotation >= 4.25 && normalizedRotation <= 4.75:
          setCurrentStage(1);
          break;
        default:
          setCurrentStage(null);
      }
    }
  });

  return (
    // {Island 3D model from: https://sketchfab.com/3d-models/foxs-islands-163b68e09fcc47618450150be7785907}
    <a.group ref={islandRef} {...props}>
          <group
            position={[13.264, 6.242, 4.096]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_12.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_13.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[-5.091, 8.434, -6.144]}
            rotation={[Math.PI / 2, 0, 2.926]}
            scale={0.031}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_15.geometry}
              material={materials['Material.007']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_16.geometry}
              material={materials['Material.008']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_17.geometry}
              material={materials['Material.009']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_18.geometry}
              material={materials['Material.020']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_19.geometry}
              material={materials['Material.021']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_20.geometry}
              material={materials['Material.022']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_21.geometry}
              material={materials['Material.023']}
            />
          </group>
          <group
            position={[7.376, 6.566, -13.231]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={[0.01, 0.01, 0.013]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_29.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_30.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[-17.802, 6.242, -5.938]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_32.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_33.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[-14.942, 6.242, 7.797]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_35.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_36.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group position={[5.806, 6.242, 9.255]} rotation={[Math.PI / 2, 0, Math.PI]} scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_38.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_39.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[-5.881, 6.566, -16.596]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={[0.01, 0.01, 0.013]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_57.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_58.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group position={[0.68, 6.242, -3.979]} rotation={[Math.PI / 2, 0, Math.PI]} scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_68.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_69.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[4.314, 6.242, -19.59]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_71.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_72.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[9.899, 6.242, -4.046]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_74.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_75.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[13.331, 6.242, 16.949]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_77.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_78.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[-10.017, 6.242, 3.679]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_166.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_167.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group position={[-2.346, 6.242, 0.53]} rotation={[Math.PI / 2, 0, Math.PI]} scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_169.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_170.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group position={[6.779, 6.242, 16.76]} rotation={[Math.PI / 2, 0, Math.PI]} scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_172.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_173.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[-19.384, 6.242, 16.599]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_175.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_176.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[-15.185, 6.242, 16.76]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_178.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_179.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[-20.353, 6.242, -6.818]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_181.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_182.geometry}
              material={materials['Material.026']}
            />
          </group>
          <group
            position={[12.916, 6.242, -11.179]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_184.geometry}
              material={materials['Material.027']}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Object_185.geometry}
              material={materials['Material.026']}
            />
          </group>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_4.geometry}
            material={materials['Material.028']}
            position={[-19.683, -1.546, -14.23]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[1.572, 1, 1]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_6.geometry}
            material={materials['Material.024']}
            position={[-5.51, 4.23, -1.33]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[20.477, 0.908, 13.838]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_8.geometry}
            material={materials['Material.029']}
            position={[-0.442, 6.861, -16.432]}
            rotation={[-Math.PI, 0, -Math.PI]}
            scale={[1.287, 1.822, 1.914]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_10.geometry}
            material={materials['Material.025']}
            position={[13.068, 7.435, 14.454]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_23.geometry}
            material={materials['Material.025']}
            position={[14.345, 7.71, -17.935]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={[0.01, 0.01, 0.012]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_25.geometry}
            material={materials['Material.025']}
            position={[-17.099, 7.435, 0.954]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_27.geometry}
            material={materials['Material.025']}
            position={[-15.654, 7.681, 13.842]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={[0.01, 0.01, 0.012]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_41.geometry}
            material={materials['Material.025']}
            position={[7.965, 7.435, -3.547]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_43.geometry}
            material={materials['Material.030']}
            position={[-3.164, 5.856, 11.888]}
            rotation={[0, -1.405, 1.571]}
            scale={[0.009, 0.008, 0.066]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_45.geometry}
            material={materials['Material.030']}
            position={[4.174, 6.057, -17.605]}
            rotation={[-Math.PI, -1.245, -Math.PI / 2]}
            scale={[0.015, 0.013, 0.148]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_47.geometry}
            material={materials['Material.030']}
            position={[-11.777, 6.421, -6.659]}
            rotation={[0, -0.968, Math.PI / 2]}
            scale={[0.017, 0.008, 0.106]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_49.geometry}
            material={materials['Material.031']}
            position={[-3.076, 5.399, 7.079]}
            rotation={[-Math.PI / 2, 0, 0.128]}
            scale={[1.548, 5.887, 0.424]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_51.geometry}
            material={materials['Material.032']}
            position={[14.704, 5.499, 13.081]}
            scale={[1.058, 1.305, 1.058]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_53.geometry}
            material={materials['Material.025']}
            position={[0.484, 7.435, -9.233]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_55.geometry}
            material={materials['Material.025']}
            position={[-7.793, 7.435, -19.461]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_60.geometry}
            material={materials['Material.025']}
            position={[-10.302, 7.435, 2.905]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_62.geometry}
            material={materials['Material.025']}
            position={[-16.587, 7.435, 6.162]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_64.geometry}
            material={materials['Material.025']}
            position={[5.982, 7.435, 1.223]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_66.geometry}
            material={materials['Material.025']}
            position={[13.922, 7.435, -7.929]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_80.geometry}
            material={materials['Material.032']}
            position={[9.419, 5.499, 11.466]}
            scale={[0.789, 0.798, 0.789]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_82.geometry}
            material={materials['Material.032']}
            position={[7.556, 5.499, 10.969]}
            scale={[0.897, 0.9, 0.897]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_84.geometry}
            material={materials['Material.032']}
            position={[1.666, 5.499, 12.848]}
            scale={[0.828, 1.021, 0.828]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_86.geometry}
            material={materials['Material.032']}
            position={[0.447, 5.433, 13.569]}
            scale={[0.632, 0.639, 0.632]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_88.geometry}
            material={materials['Material.032']}
            position={[1.52, 5.473, 14.201]}
            scale={[0.509, 0.512, 0.509]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_90.geometry}
            material={materials['Material.032']}
            position={[-4.4, 5.433, 13.511]}
            rotation={[Math.PI, -1.382, Math.PI]}
            scale={[0.632, 0.639, 0.632]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_92.geometry}
            material={materials['Material.032']}
            position={[-5.222, 5.473, 14.446]}
            rotation={[Math.PI, -1.382, Math.PI]}
            scale={[0.509, 0.512, 0.509]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_94.geometry}
            material={materials['Material.032']}
            position={[-6.363, 5.534, 13.604]}
            rotation={[Math.PI, -1.382, Math.PI]}
            scale={[0.695, 0.774, 0.695]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_96.geometry}
            material={materials['Material.032']}
            position={[5.129, 5.575, -1.155]}
            rotation={[0, -1.185, 0]}
            scale={[1.088, 1.342, 1.088]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_98.geometry}
            material={materials['Material.032']}
            position={[3.648, 5.488, -2.283]}
            rotation={[0, -1.185, 0]}
            scale={[0.831, 0.84, 0.831]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_100.geometry}
            material={materials['Material.032']}
            position={[3.408, 5.541, -0.664]}
            rotation={[0, -1.185, 0]}
            scale={[0.67, 0.672, 0.67]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_102.geometry}
            material={materials['Material.032']}
            position={[-14.074, 5.499, 5.127]}
            rotation={[Math.PI, -1.39, Math.PI]}
            scale={[0.789, 0.798, 0.789]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_104.geometry}
            material={materials['Material.032']}
            position={[-13.25, 5.499, 3.383]}
            rotation={[Math.PI, -1.39, Math.PI]}
            scale={[0.897, 0.9, 0.897]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_106.geometry}
            material={materials['Material.032']}
            position={[-10.441, 5.499, 15.049]}
            rotation={[0, -0.395, 0]}
            scale={[1.058, 1.305, 1.058]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_108.geometry}
            material={materials['Material.032']}
            position={[-14.695, 5.499, 11.523]}
            rotation={[0, -0.395, 0]}
            scale={[0.789, 0.798, 0.789]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_110.geometry}
            material={materials['Material.032']}
            position={[-16.223, 5.499, 10.346]}
            rotation={[0, -0.395, 0]}
            scale={[0.897, 0.9, 0.897]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_112.geometry}
            material={materials['Material.032']}
            position={[0.847, 5.575, 6.511]}
            rotation={[-Math.PI, -0.472, -Math.PI]}
            scale={[1.088, 1.342, 1.088]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_114.geometry}
            material={materials['Material.032']}
            position={[1.843, 5.488, 4.938]}
            rotation={[-Math.PI, -0.472, -Math.PI]}
            scale={[0.831, 0.84, 0.831]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_116.geometry}
            material={materials['Material.032']}
            position={[0.209, 5.541, 4.838]}
            rotation={[-Math.PI, -0.472, -Math.PI]}
            scale={[0.67, 0.672, 0.67]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_118.geometry}
            material={materials['Material.032']}
            position={[-8.438, 5.575, 6.971]}
            rotation={[0, 1.309, 0]}
            scale={[1.088, 1.342, 1.088]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_120.geometry}
            material={materials['Material.032']}
            position={[-7.936, 5.488, 8.764]}
            rotation={[0, 1.309, 0]}
            scale={[0.831, 0.84, 0.831]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_122.geometry}
            material={materials['Material.032']}
            position={[-6.769, 5.541, 7.617]}
            rotation={[0, 1.309, 0]}
            scale={[0.67, 0.672, 0.67]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_124.geometry}
            material={materials['Material.032']}
            position={[-12.139, 5.575, -2.651]}
            rotation={[0, 1.309, 0]}
            scale={[1.088, 1.342, 1.088]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_126.geometry}
            material={materials['Material.032']}
            position={[-11.637, 5.488, -0.859]}
            rotation={[0, 1.309, 0]}
            scale={[0.831, 0.84, 0.831]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_128.geometry}
            material={materials['Material.032']}
            position={[-10.47, 5.541, -2.005]}
            rotation={[0, 1.309, 0]}
            scale={[0.67, 0.672, 0.67]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_130.geometry}
            material={materials['Material.032']}
            position={[6.434, 5.575, -9.111]}
            rotation={[0, 1.309, 0]}
            scale={[1.088, 1.342, 1.088]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_132.geometry}
            material={materials['Material.032']}
            position={[6.935, 5.488, -7.319]}
            rotation={[0, 1.309, 0]}
            scale={[0.831, 0.84, 0.831]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_134.geometry}
            material={materials['Material.032']}
            position={[8.102, 5.541, -8.465]}
            rotation={[0, 1.309, 0]}
            scale={[0.67, 0.672, 0.67]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_136.geometry}
            material={materials['Material.032']}
            position={[8.679, 5.499, 4.793]}
            rotation={[Math.PI, -1.053, Math.PI]}
            scale={[1.058, 1.305, 1.058]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_138.geometry}
            material={materials['Material.032']}
            position={[12.699, 5.499, 1.003]}
            rotation={[Math.PI, -1.053, Math.PI]}
            scale={[0.789, 0.798, 0.789]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_140.geometry}
            material={materials['Material.032']}
            position={[14.054, 5.499, -0.37]}
            rotation={[Math.PI, -1.053, Math.PI]}
            scale={[0.897, 0.9, 0.897]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_142.geometry}
            material={materials['Material.032']}
            position={[10.177, 5.499, 2.029]}
            rotation={[-Math.PI, 0.831, -Math.PI]}
            scale={[1.058, 1.305, 1.058]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_144.geometry}
            material={materials['Material.032']}
            position={[12.547, 5.499, 7.02]}
            rotation={[-Math.PI, 0.831, -Math.PI]}
            scale={[0.789, 0.798, 0.789]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_146.geometry}
            material={materials['Material.032']}
            position={[13.436, 5.499, 8.732]}
            rotation={[-Math.PI, 0.831, -Math.PI]}
            scale={[0.897, 0.9, 0.897]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_148.geometry}
            material={materials['Material.032']}
            position={[9.919, 5.499, 14.273]}
            rotation={[0, 0.769, 0]}
            scale={[1.058, 1.305, 1.058]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_150.geometry}
            material={materials['Material.032']}
            position={[4.999, 5.499, 16.788]}
            rotation={[0, 0.769, 0]}
            scale={[0.789, 0.798, 0.789]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_152.geometry}
            material={materials['Material.032']}
            position={[3.315, 5.499, 17.727]}
            rotation={[0, 0.769, 0]}
            scale={[0.897, 0.9, 0.897]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_154.geometry}
            material={materials['Material.032']}
            position={[9.326, 5.499, -18.289]}
            rotation={[-Math.PI, -0.585, -Math.PI]}
            scale={[0.789, 0.798, 0.789]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_156.geometry}
            material={materials['Material.032']}
            position={[11.153, 5.499, -18.905]}
            rotation={[-Math.PI, -0.585, -Math.PI]}
            scale={[0.897, 0.9, 0.897]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_158.geometry}
            material={materials['Material.032']}
            position={[-5.246, 5.499, -17.836]}
            rotation={[-Math.PI, 0.831, -Math.PI]}
            scale={[1.058, 1.305, 1.058]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_160.geometry}
            material={materials['Material.025']}
            position={[10.935, 7.435, -10.351]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_162.geometry}
            material={materials['Material.025']}
            position={[4.394, 7.435, 6.929]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_164.geometry}
            material={materials['Material.025']}
            position={[-9.899, 7.435, 11.613]}
            rotation={[Math.PI / 2, 0, Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_187.geometry}
            material={materials['Material.036']}
            position={[-5.327, 5.051, 13.598]}
            rotation={[Math.PI / 2, 0.22, -0.568]}
            scale={1.455}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_189.geometry}
            material={materials['Material.036']}
            position={[8.692, 5.051, 10.421]}
            rotation={[1.485, -0.202, 2.17]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_191.geometry}
            material={materials['Material.036']}
            position={[-16.654, 5.051, 8.122]}
            rotation={[1.51, 0.211, -0.286]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_193.geometry}
            material={materials['Material.036']}
            position={[-14.748, 5.051, 3.355]}
            rotation={[1.423, -0.163, 1.834]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_195.geometry}
            material={materials['Material.036']}
            position={[0.561, 4.633, 1.841]}
            rotation={[1.576, 0.22, -0.593]}
            scale={1.457}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_197.geometry}
            material={materials['Material.036']}
            position={[8.243, 5.051, -7.523]}
            rotation={[1.667, -0.198, 3.032]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_199.geometry}
            material={materials['Material.036']}
            position={[2.131, 5.051, -9.767]}
            rotation={[1.755, -0.151, -1.512]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_201.geometry}
            material={materials['Material.036']}
            position={[-6.267, 5.051, -19.295]}
            rotation={[1.333, -0.003, 2.321]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_203.geometry}
            material={materials['Material.036']}
            position={[12.87, 5.051, -18.81]}
            rotation={[1.394, 0.16, 1.583]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_205.geometry}
            material={materials['Material.036']}
            position={[14.889, 5.051, -3.71]}
            rotation={[1.475, -0.218, -2.822]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_207.geometry}
            material={materials['Material.036']}
            position={[12.951, 5.051, 17.607]}
            rotation={[1.702, -0.199, -1.814]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_209.geometry}
            material={materials['Material.036']}
            position={[-15.042, 5.051, 17.607]}
            rotation={[1.804, 0.044, -0.649]}
            scale={1.737}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_211.geometry}
            material={materials['Material.032']}
            position={[9.631, 5.499, -1.258]}
            rotation={[Math.PI, -1.053, Math.PI]}
            scale={[0.789, 0.798, 0.789]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_213.geometry}
            material={materials['Material.037']}
            position={[-0.14, 5.671, 15.047]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_215.geometry}
            material={materials['Material.037']}
            position={[-6.122, 5.671, 9.533]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_217.geometry}
            material={materials['Material.037']}
            position={[12.103, 5.671, 3.411]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_219.geometry}
            material={materials['Material.037']}
            position={[4.673, 5.671, 10.748]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_221.geometry}
            material={materials['Material.037']}
            position={[-8.879, 5.671, -0.701]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_223.geometry}
            material={materials['Material.037']}
            position={[-17.991, 5.671, -1.122]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_225.geometry}
            material={materials['Material.037']}
            position={[-13.752, 5.931, 13.144]}
            rotation={[-1.672, -0.057, 0.512]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_227.geometry}
            material={materials['Material.037']}
            position={[2.062, 5.931, -2.669]}
            rotation={[-1.454, -0.004, 3.11]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_229.geometry}
            material={materials['Material.037']}
            position={[14.039, 5.931, -9.802]}
            rotation={[-1.546, -0.114, 1.788]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_231.geometry}
            material={materials['Material.037']}
            position={[6.368, 5.931, -12.09]}
            rotation={[-1.468, -0.055, 2.654]}
            scale={[0.992, 0.261, 0.992]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_233.geometry}
            material={materials['Material.037']}
            position={[8.537, 5.671, -10.989]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_235.geometry}
            material={materials['Material.037']}
            position={[2.533, 5.931, 2.378]}
            rotation={[-1.468, -0.055, 2.654]}
            scale={[0.992, 0.261, 0.992]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_237.geometry}
            material={materials['Material.037']}
            position={[4.701, 5.671, 3.479]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_239.geometry}
            material={materials['Material.037']}
            position={[15.654, 5.931, 10.654]}
            rotation={[-1.527, 0.108, -1.954]}
            scale={[0.992, 0.261, 0.992]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_241.geometry}
            material={materials['Material.037']}
            position={[-10.387, 5.931, 17.653]}
            rotation={[-1.54, 0.112, -1.838]}
            scale={[0.992, 0.261, 0.992]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_243.geometry}
            material={materials['Material.037']}
            position={[6.666, 5.671, 14.17]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_245.geometry}
            material={materials['Material.037']}
            position={[-15.406, 5.671, -8.574]}
            scale={[0.809, 0.213, 0.809]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_247.geometry}
            material={materials['Material.038']}
            position={[-8.243, 21.356, -10.585]}
            rotation={[0, 0.559, 0]}
            scale={[2.135, 1.809, 1.996]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_249.geometry}
            material={materials['Material.039']}
            position={[7.364, 22.745, 6.298]}
            scale={0.73}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_251.geometry}
            material={materials['Material.040']}
            position={[10.147, 21.412, -3.101]}
            rotation={[0, -0.94, 0]}
            scale={0.524}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_253.geometry}
            material={materials['Material.041']}
            position={[-4.576, 27.497, 0]}
            scale={1.299}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_255.geometry}
            material={materials['Material.039']}
            position={[-11.054, 22.745, 11.74]}
            rotation={[-Math.PI, 0.919, -Math.PI]}
            scale={0.73}
          />
    </a.group>
  );
}