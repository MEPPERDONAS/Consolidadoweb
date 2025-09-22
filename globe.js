import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 1. CONFIGURACIÓN BÁSICA DE LA ESCENA ---

// ¡CAMBIO 1! Buscar el contenedor del HTML
const container = document.getElementById('globe-container');

// Si el contenedor no existe, detenemos el script
if (!container) {
    throw new Error('No se encontró el contenedor #globe-container');
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, // Campo de visión (Field of View)
    // ¡CAMBIO 2! Usar el tamaño del CONTENEDOR
    container.clientWidth / container.clientHeight, // Aspect ratio
    0.1, // Distancia mínima de renderizado
    1000 // Distancia máxima de renderizado
);

const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias para bordes suaves
// ¡CAMBIO 3! Ajustar el tamaño del renderer al CONTENEDOR
renderer.setSize(container.clientWidth, container.clientHeight);

// ¡CAMBIO 4! Añadir el canvas (renderer.domElement) al CONTENEDOR
container.appendChild(renderer.domElement); 

// Establecer un color de fondo para la escena (blanco)
scene.background = new THREE.Color(0xffffff);

// --- 2. ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0xaaaaaa); 
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1); 
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

// --- 3. CARGA DE TEXTURAS ---
const textureLoader = new THREE.TextureLoader();
const specularMap = textureLoader.load('assets/earth_specular.png');
const earthTexture = textureLoader.load('assets/earth_daymap.jpg');
const cloudsTexture = textureLoader.load('assets/earth_clouds.png');
const earthBump = textureLoader.load('assets/earth_bump.jpg');

// --- 4. CREACIÓN DEL GLOBO TERRÁQUEO ---
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

// --- 5. CREACIÓN DE LAS NUBES ---
const cloudsGeometry = new THREE.SphereGeometry(1.005, 64, 64);
const cloudsMaterial = new THREE.MeshLambertMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.05 
});
const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
scene.add(clouds);

// --- 6. POSICIONAR CÁMARA ---
// (He quitado camera.position.x = -1; porque da problemas con OrbitControls)
// Lo he alejado un poco más (2.5) para que se vea bien en el contenedor
camera.position.z = 1.7; 

// --- 7. CONTROLES DE ÓRBITA (apuntando al renderer) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// --- 8. ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);

    earth.rotation.y += 0.001;
    clouds.rotation.y += 0.0008;

    controls.update(); 
    renderer.render(scene, camera);
}

animate();

// --- 9. Manejar el redimensionamiento de la ventana ---
// ¡CAMBIO 5! Actualizar todo en base al CONTENEDOR
window.addEventListener('resize', () => {
    // Solo actualiza si el contenedor existe
    if (container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
});