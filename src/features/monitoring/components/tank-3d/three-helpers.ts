import * as THREE from "three";

type WebGlContext = WebGLRenderingContext | WebGL2RenderingContext;

export function createSafeWebGlRenderer(canvas: HTMLCanvasElement) {
  const contextAttributes: WebGLContextAttributes = {
    alpha: true,
    antialias: true,
    depth: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
    stencil: false,
  };

  let context: WebGlContext | null = null;

  try {
    context = (canvas.getContext("webgl2", contextAttributes) ??
      canvas.getContext("webgl", contextAttributes) ??
      canvas.getContext(
        "experimental-webgl",
        contextAttributes,
      )) as WebGlContext | null;
  } catch {
    return null;
  }

  if (!context) {
    return null;
  }

  try {
    return new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      context: context as WebGLRenderingContext,
    });
  } catch {
    return null;
  }
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }

    if (child instanceof THREE.LineSegments) {
      child.geometry.dispose();

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }

    if (child instanceof THREE.Line) {
      child.geometry.dispose();

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
