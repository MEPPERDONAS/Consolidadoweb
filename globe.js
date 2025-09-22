import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 1. CONFIGURACIÓN BÁSICA DE LA ESCENA ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, // Campo de visión (Field of View)
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Distancia mínima de renderizado
    1000 // Distancia máxima de renderizado
);

const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias para bordes suaves
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Añade el canvas al HTML

// Establecer un color de fondo para la escena (negro para el espacio)
scene.background = new THREE.Color(0xffffff);

// --- 2. ILUMINACIÓN ---
// Luz ambiente (ilumina uniformemente la escena)
const ambientLight = new THREE.AmbientLight(0xaaaaaa); // Luz blanca suave
scene.add(ambientLight);

// Luz direccional (simula el sol)
const sunLight = new THREE.DirectionalLight(0xffffff, 1); // Luz blanca brillante
sunLight.position.set(5, 3, 5); // Posición del "sol"
scene.add(sunLight);

// --- 3. CARGA DE TEXTURAS ---
const textureLoader = new THREE.TextureLoader();
const specularMap = textureLoader.load('assets/earth_specular.png');

// Textura de la Tierra (mapa de día)
const earthTexture = textureLoader.load('assets/earth_daymap.jpg');
// Textura de Nubes (con canal alfa para transparencia)
const cloudsTexture = textureLoader.load('assets/earth_clouds.png');
// (Opcional) Textura de relieve (bump map)
const earthBump = textureLoader.load('assets/earth_bump.jpg');

// --- 4. CREACIÓN DEL GLOBO TERRÁQUEO ---
const earthGeometry = new THREE.SphereGeometry(1, 64, 64); // Radio 1, muchos segmentos para suavidad
const earthMaterial = new THREE.MeshPhongMaterial({ // Material que reacciona a la luz
    map: earthTexture,
    bumpMap: earthBump,      // Añade el mapa de relieve
    bumpScale: 0.05,          // Intensidad del relieve
    specularMap: specularMap, // <--- AÑADE ESTA LÍNEA
    shininess: 10 
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// --- 5. CREACIÓN DE LAS NUBES ---
const cloudsGeometry = new THREE.SphereGeometry(1.005, 64, 64); // Un poco más grande que la Tierra
const cloudsMaterial = new THREE.MeshLambertMaterial({ // Material que no reacciona al brillo especular
    map: cloudsTexture,
    transparent: true,      // Permite la transparencia del PNG
    opacity: 0.05            // Opacidad de las nubes
});
const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
scene.add(clouds);

// --- 6. POSICIONAR CÁMARA ---
camera.position.z = 2.5; // Alejar la cámara para ver todo el globo

// --- 7. CONTROLES DE ÓRBITA (para que puedas rotar el globo con el ratón) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Efecto de inercia al mover
controls.dampingFactor = 0.25;
controls.enableZoom = true; // Permite hacer zoom con la rueda del ratón

// --- 8. ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);

    // Gira la Tierra y las Nubes
    earth.rotation.y += 0.001; // Velocidad de rotación de la Tierra
    clouds.rotation.y += 0.0008; // Velocidad de rotación de las nubes (un poco más lento)

    controls.update(); // Actualiza los controles de órbita
    renderer.render(scene, camera); // Renderiza la escena
}

animate();

// --- 9. Manejar el redimensionamiento de la ventana ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});