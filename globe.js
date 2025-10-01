import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- CONFIGURACIÓN BÁSICA DE LA ESCENA ---

const container = document.getElementById('globe-container');

if (!container) {
    throw new Error('No se encontró el contenedor #globe-container');
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, // Campo de visión (Field of View)
    container.clientWidth / container.clientHeight, // Aspect ratio
    0.1, // Distancia mínima de renderizado
    10 // Distancia máxima de renderizado
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement); 
scene.background = new THREE.Color(0xe0e2e4);

// --- ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0xaaaaaa); 
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1); 
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

// --- CARGA DE TEXTURAS ---
const textureLoader = new THREE.TextureLoader();
const specularMap = textureLoader.load('assets/earth_specular.png');
const earthTexture = textureLoader.load('assets/earth_daymap.jpg');
const cloudsTexture = textureLoader.load('assets/earth_clouds.png');
const earthBump = textureLoader.load('assets/earth_bump.jpg');

// --- CREACIÓN DEL GLOBO TERRÁQUEO ---
const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: earthBump,
    bumpScale: 0.05,
    specularMap: specularMap,
    shininess: 10 
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// --- CREACIÓN DE LAS NUBES ---
const cloudsGeometry = new THREE.SphereGeometry(1.005, 64, 64);
const cloudsMaterial = new THREE.MeshLambertMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.2 
});
const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
scene.add(clouds);

// --- POSICIONAR CÁMARA ---
camera.position.z = 1.7; 

// --- CONTROLES DE ÓRBITA  ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// --- ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);

    earth.rotation.y += 0.001;
    clouds.rotation.y += 0.0008;

    controls.update(); 
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    if (container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
});