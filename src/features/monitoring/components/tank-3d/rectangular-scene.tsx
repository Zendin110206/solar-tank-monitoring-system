"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TankFallbackVisual } from "./tank-fallback-visual";
import { createSafeWebGlRenderer, disposeObject } from "./three-helpers";
import { clamp } from "@/lib/math";

type TankRectangularScene3DProps = {
  fillPercent: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  sensorDistanceCm: number;
  fuelHeightCm: number;
  showMeasurementBadges?: boolean;
};

export function TankRectangularScene3D({
  fillPercent,
  lengthCm,
  widthCm,
  heightCm,
  sensorDistanceCm,
  fuelHeightCm,
  showMeasurementBadges = true,
}: TankRectangularScene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [renderMode, setRenderMode] = useState<"webgl" | "fallback">("webgl");

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const renderer = createSafeWebGlRenderer(canvas);

    if (!renderer) {
      setRenderMode("fallback");
      return;
    }

    setRenderMode("webgl");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(4.8, 3.2, 5.8);
    camera.lookAt(0, 0.45, 0);

    const root = new THREE.Group();
    scene.add(root);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xdbeafe, 2.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x67e8f9, 1.1);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);

    const safeLength = Math.max(lengthCm ?? 150, 1);
    const safeWidth = Math.max(widthCm ?? 60, 1);
    const safeHeight = Math.max(heightCm ?? 60, 1);
    const maxDimension = Math.max(safeLength, safeWidth, safeHeight);
    const scale = 4.4 / maxDimension;
    const tankLength = safeLength * scale;
    const tankWidth = safeWidth * scale;
    const tankHeight = safeHeight * scale;
    const safeFillPercent = clamp(fillPercent, 0, 100);
    const liquidHeight = Math.max(tankHeight * (safeFillPercent / 100), 0.02);
    const liquidTopY = -tankHeight / 2 + liquidHeight;
    const sensorGap = 0.42;
    const sensorY = tankHeight / 2 + sensorGap;
    const sensorLineHeight = Math.max(sensorY - liquidTopY, 0.04);

    const tankMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.26,
      roughness: 0.18,
      metalness: 0,
      transmission: 0.35,
      thickness: 0.18,
      side: THREE.DoubleSide,
    });
    const tankGeometry = new THREE.BoxGeometry(
      tankLength,
      tankHeight,
      tankWidth,
    );
    const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
    tankMesh.position.y = 0;
    root.add(tankMesh);

    const edgeGeometry = new THREE.EdgesGeometry(tankGeometry);
    const edges = new THREE.LineSegments(
      edgeGeometry,
      new THREE.LineBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.82,
      }),
    );
    root.add(edges);

    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.82,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.08,
      side: THREE.DoubleSide,
    });
    const liquidGeometry = new THREE.BoxGeometry(
      tankLength * 0.96,
      liquidHeight,
      tankWidth * 0.96,
    );
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -tankHeight / 2 + liquidHeight / 2;
    root.add(liquid);

    const surface = new THREE.Mesh(
      new THREE.BoxGeometry(tankLength * 0.96, 0.015, tankWidth * 0.96),
      new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.9,
      }),
    );
    surface.position.y = liquidTopY + 0.01;
    root.add(surface);

    const sensor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.18, 32),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }),
    );
    sensor.position.set(0, sensorY, 0);
    sensor.rotation.x = Math.PI / 2;
    root.add(sensor);

    const sensorLine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, sensorLineHeight, 16),
      new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    );
    sensorLine.position.set(0, liquidTopY + sensorLineHeight / 2, 0);
    root.add(sensorLine);

    const topMeasure = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.225, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide }),
    );
    topMeasure.position.set(0, liquidTopY + 0.025, 0);
    topMeasure.rotation.x = -Math.PI / 2;
    root.add(topMeasure);

    const grid = new THREE.GridHelper(6, 12, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -tankHeight / 2 - 0.03;
    root.add(grid);

    let pointerDown = false;
    let lastX = 0;
    let targetRotationY = -0.45;
    let currentRotationY = -0.45;
    root.rotation.x = -0.12;

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      lastX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown) {
        return;
      }

      targetRotationY += (event.clientX - lastX) * 0.008;
      lastX = event.clientX;
    };
    const onPointerUp = (event: PointerEvent) => {
      pointerDown = false;
      canvas.releasePointerCapture(event.pointerId);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frameId = 0;
    const animate = () => {
      currentRotationY += (targetRotationY - currentRotationY) * 0.08;
      root.rotation.y = currentRotationY;
      sensor.rotation.z += 0.006;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      disposeObject(root);
      grid.geometry.dispose();
      if (Array.isArray(grid.material)) {
        grid.material.forEach((material) => material.dispose());
      } else {
        grid.material.dispose();
      }
      renderer.dispose();
    };
  }, [
    fillPercent,
    lengthCm,
    widthCm,
    heightCm,
    sensorDistanceCm,
    fuelHeightCm,
  ]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {renderMode === "fallback" ? (
        <TankFallbackVisual fillPercent={fillPercent} shape="rectangular" />
      ) : (
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
          aria-label={`Visual 3D tangki balok dengan isi ${fillPercent}%`}
        />
      )}
      {showMeasurementBadges ? (
        <>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
            H {fuelHeightCm} cm
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
            Ruang kosong {sensorDistanceCm} cm
          </div>
        </>
      ) : null}
    </div>
  );
}
