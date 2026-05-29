import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();
const stlLoader = new STLLoader();
const mtlLoader = new MTLLoader();

function getResourcePath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx >= 0 ? normalized.slice(0, idx + 1) : '/';
}

function getFileName(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}

function upgradeMaterial(mat) {
  if (!mat) return mat;
  if (mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
    const next = new THREE.MeshStandardMaterial({
      color: mat.color,
      map: mat.map,
      normalMap: mat.normalMap,
      roughness: 0.55,
      metalness: 0.08,
      transparent: mat.transparent,
      opacity: mat.opacity,
      side: mat.side
    });
    if (next.map) next.map.colorSpace = THREE.SRGBColorSpace;
    mat.dispose?.();
    return next;
  }
  return mat;
}

function countMeshes(root) {
  let count = 0;
  root.traverse((node) => {
    if (node.isMesh) count += 1;
  });
  return count;
}

function repairGeometryAttributes(geometry) {
  const position = geometry.attributes.position;
  if (!position || position.count === 0) return false;

  const posArray = position.array;
  for (let i = 0; i < posArray.length; i += 1) {
    if (!Number.isFinite(posArray[i])) return false;
  }

  const vertexCount = position.count;
  for (const key of ['normal', 'uv', 'color', 'tangent']) {
    const attr = geometry.attributes[key];
    if (attr && attr.count !== vertexCount) {
      geometry.deleteAttribute(key);
    }
  }

  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return true;
}

/** Remove curve lines and fix Blender OBJ groups with mismatched attribute counts. */
function sanitizeBoatRoot(root) {
  const toRemove = [];

  root.traverse((node) => {
    if (node.isLine || node.isLineSegments) {
      toRemove.push(node);
      return;
    }

    if (!node.isMesh || !node.geometry) return;

    const ok = repairGeometryAttributes(node.geometry);
    if (!ok) toRemove.push(node);
  });

  for (const node of toRemove) {
    node.parent?.remove(node);
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((mat) => mat?.dispose?.());
    }
  }
}

function prepareBoatMeshes(root, { preserveMaterials = false } = {}) {
  const fallbackMat = new THREE.MeshStandardMaterial({
    color: 0x1a4f8c,
    roughness: 0.48,
    metalness: 0.12
  });

  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;

    if (!preserveMaterials) {
      if (Array.isArray(node.material)) {
        node.material = node.material.map((m) => m || fallbackMat);
      } else if (!node.material) {
        node.material = fallbackMat;
      }
    }

    let mats = Array.isArray(node.material) ? node.material : [node.material];
    if (preserveMaterials) {
      mats = mats.map((mat) => upgradeMaterial(mat));
      node.material = Array.isArray(node.material) ? mats : mats[0];
    }
    mats.forEach((mat) => {
      if (!mat) return;
      mat.side = THREE.DoubleSide;
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.needsUpdate = true;
    });
  });

  if (countMeshes(root) === 0) {
    throw new Error('Boat model loaded but contains no meshes');
  }
}

function finalizeBoatRoot(root, { preserveMaterials = false } = {}) {
  sanitizeBoatRoot(root);
  prepareBoatMeshes(root, { preserveMaterials });
  return root;
}

function loadGltf(path) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => resolve(finalizeBoatRoot(gltf.scene)),
      undefined,
      reject
    );
  });
}

function loadObj(path) {
  const resourcePath = getResourcePath(path);
  const objFile = getFileName(path);
  const mtlFile = objFile.replace(/\.obj$/i, '.mtl');

  mtlLoader.setPath(resourcePath);
  mtlLoader.setResourcePath(resourcePath);
  objLoader.setPath(resourcePath);

  return new Promise((resolve, reject) => {
    mtlLoader.load(
      mtlFile,
      (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load(
          objFile,
          (obj) => resolve(finalizeBoatRoot(obj, { preserveMaterials: true })),
          undefined,
          reject
        );
      },
      undefined,
      () => {
        objLoader.load(
          objFile,
          (obj) => resolve(finalizeBoatRoot(obj)),
          undefined,
          reject
        );
      }
    );
  });
}

function loadStl(path) {
  return new Promise((resolve, reject) => {
    stlLoader.load(
      path,
      (geometry) => {
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color: 0x1a4f8c,
            roughness: 0.48,
            metalness: 0.12
          })
        );
        const root = new THREE.Group();
        root.name = 'ImportedSTLBoat';
        root.add(mesh);
        resolve(finalizeBoatRoot(root));
      },
      undefined,
      reject
    );
  });
}

/**
 * Load a boat from .gltf, .glb, .obj (+ optional .mtl), or .stl
 * @param {string} path - URL path, e.g. /17-marlow66/Marlow66/Marlow66.obj
 */
export function loadBoatModel(path) {
  const ext = path.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'gltf':
    case 'glb':
      return loadGltf(path);
    case 'obj':
      return loadObj(path);
    case 'stl':
      return loadStl(path);
    default:
      return Promise.reject(new Error(`Unsupported boat model format: .${ext}`));
  }
}
