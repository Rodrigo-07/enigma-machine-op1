import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { Rotor, Reflector, Plugboard, Enigma, toChar, toIndex } from './enigma-logic.js';

// Configuração da Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Configuração da Câmera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0.6);
camera.lookAt(0, 0.75, 0);

// Configuração do Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// --- Céu HDRI (EXR) ---
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new EXRLoader()
    .setPath('./ceu/')
    .load('HdrSkyMorning004_HDR_2K.exr', (exrTexture) => {
        exrTexture.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
        scene.environment = envMap;
        pmremGenerator.dispose();

        const skyGeo = new THREE.SphereGeometry(1000, 64, 32);
        const skyMat = new THREE.MeshBasicMaterial({ map: exrTexture, side: THREE.BackSide, toneMapped: false });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        sky.rotation.x = THREE.MathUtils.degToRad(-8);
        scene.add(sky);
    });

// --- Iluminação ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
mainLight.position.set(5, 10, 5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

// --- Chão ---
const textureLoader = new THREE.TextureLoader();
const floorBaseColor = textureLoader.load('./chao/Poliigon_ConcreteFloorPoured_7656_BaseColor.jpg');
const floorNormal = textureLoader.load('./chao/Poliigon_ConcreteFloorPoured_7656_Normal.png');
const floorRoughness = textureLoader.load('./chao/Poliigon_ConcreteFloorPoured_7656_Roughness.jpg');
const floorAO = textureLoader.load('./chao/Poliigon_ConcreteFloorPoured_7656_AmbientOcclusion.jpg');

const FLOOR_SIZE = 500;
const TILE_WORLD_SIZE = 5;
const REPEAT = FLOOR_SIZE / TILE_WORLD_SIZE;

[floorBaseColor, floorNormal, floorRoughness, floorAO].forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(REPEAT, REPEAT);
    texture.colorSpace = THREE.SRGBColorSpace;
});
floorNormal.colorSpace = THREE.LinearSRGBColorSpace;
floorRoughness.colorSpace = THREE.LinearSRGBColorSpace;
floorAO.colorSpace = THREE.LinearSRGBColorSpace;

const floorGeometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    map: floorBaseColor,
    normalMap: floorNormal,
    roughnessMap: floorRoughness,
    aoMap: floorAO,
    roughness: 1.0,
    metalness: 0.0
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.geometry.setAttribute('uv2', floor.geometry.attributes.uv);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

scene.fog = new THREE.FogExp2(0x8aa6c1, 0.004);

const tableGroup = new THREE.Group();
const woodMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5c3a21,
    roughness: 0.7,
    metalness: 0.0
});

const tableTopWidth = 1.5;
const tableTopDepth = 0.9;
const tableTopThickness = 0.05;
const tableHeight = 0.75;

const topGeometry = new THREE.BoxGeometry(tableTopWidth, tableTopThickness, tableTopDepth);
const tableTop = new THREE.Mesh(topGeometry, woodMaterial);
tableTop.position.y = tableHeight - tableTopThickness / 2;
tableTop.castShadow = true;
tableTop.receiveShadow = true;
tableGroup.add(tableTop);

const legWidth = 0.08;
const legHeight = tableHeight - tableTopThickness;
const legGeometry = new THREE.BoxGeometry(legWidth, legHeight, legWidth);

const positions = [
    { x: tableTopWidth / 2 - legWidth, z: tableTopDepth / 2 - legWidth },
    { x: -tableTopWidth / 2 + legWidth, z: tableTopDepth / 2 - legWidth },
    { x: tableTopWidth / 2 - legWidth, z: -tableTopDepth / 2 + legWidth },
    { x: -tableTopWidth / 2 + legWidth, z: -tableTopDepth / 2 + legWidth }
];

positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, woodMaterial);
    leg.position.set(pos.x, legHeight / 2, pos.z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    tableGroup.add(leg);
});
scene.add(tableGroup);

const keyboardGroup = new THREE.Group();
keyboardGroup.position.set(0, tableHeight + tableTopThickness / 2, 0.45);

const keyLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'P'],
    ['Y', 'X', 'C', 'V', 'B', 'N', 'M', 'L']
];

const keySize = 0.045;
const keySpacing = 0.055;
const keyHeight = 0.015;

const keyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc,
    roughness: 0.5,
    metalness: 0.05
});

const keyPressedMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3
});

const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.3,
    metalness: 0.8
});

const keyMeshes = {};

keyLayout.forEach((row, rowIndex) => {
    const rowWidth = row.length * keySpacing;
    const startX = -rowWidth / 2 + keySpacing / 2;
    const zPos = -0.15 + rowIndex * keySpacing;
    
    row.forEach((letter, colIndex) => {
        const xPos = startX + colIndex * keySpacing;
        
        const keyGeometry = new THREE.CylinderGeometry(keySize / 2, keySize / 2, keyHeight, 32);
        const keyMeshMaterial = keyMaterial.clone();
        const keyMesh = new THREE.Mesh(keyGeometry, keyMeshMaterial);
        keyMesh.position.set(xPos, keyHeight / 2 + 0.001, zPos);
        keyMesh.castShadow = true;
        keyMesh.receiveShadow = true;
        keyboardGroup.add(keyMesh);
        
        const ringGeometry = new THREE.TorusGeometry(keySize / 2, 0.002, 8, 32);
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.set(xPos, keyHeight / 2 + 0.001, zPos);
        keyboardGroup.add(ringMesh);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        
        context.fillStyle = '#f5f5dc';
        context.beginPath();
        context.arc(64, 64, 60, 0, Math.PI * 2);
        context.fill();
        
        context.font = 'bold 56px serif';
        context.fillStyle = '#222222';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(letter, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const letterMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.6,
            metalness: 0.0,
            transparent: true
        });
        
        const letterGeometry = new THREE.CircleGeometry(keySize / 2 - 0.002, 32);
        const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
        letterMesh.rotation.x = -Math.PI / 2;
        letterMesh.position.set(xPos, keyHeight + 0.002, zPos);
        keyboardGroup.add(letterMesh);
        
        keyMeshes[letter] = {
            key: keyMesh,
            letter: letterMesh,
            ring: ringMesh,
            originalY: keyHeight / 2 + 0.001,
            pressedY: keyHeight / 2 - 0.004,
            originalMaterial: keyMeshMaterial
        };
    });
});

// Criar lâmpadas de saída (lightboard) acima do teclado
const lightboardGroup = new THREE.Group();
lightboardGroup.position.set(0, 0, -0.18);

const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.6,
    metalness: 0.2
});

const lampLitMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0xffff00,
    emissiveIntensity: 1.0
});

const lampMeshes = {};

keyLayout.forEach((row, rowIndex) => {
    const rowWidth = row.length * keySpacing;
    const startX = -rowWidth / 2 + keySpacing / 2;
    const zPos = -0.15 + rowIndex * keySpacing;
    
    row.forEach((letter, colIndex) => {
        const xPos = startX + colIndex * keySpacing;
        
        // Lâmpada (pequeno círculo)
        const lampGeometry = new THREE.CircleGeometry(keySize / 3, 16);
        const lampMeshMaterial = lampMaterial.clone();
        const lampMesh = new THREE.Mesh(lampGeometry, lampMeshMaterial);
        lampMesh.rotation.x = -Math.PI / 2;
        lampMesh.position.set(xPos, 0.002, zPos);
        lightboardGroup.add(lampMesh);
        
        // Letra na lâmpada
        const lampCanvas = document.createElement('canvas');
        const lampContext = lampCanvas.getContext('2d');
        lampCanvas.width = 64;
        lampCanvas.height = 64;
        
        lampContext.fillStyle = '#2a2a2a';
        lampContext.beginPath();
        lampContext.arc(32, 32, 30, 0, Math.PI * 2);
        lampContext.fill();
        
        lampContext.font = 'bold 28px serif';
        lampContext.fillStyle = '#ffffff';
        lampContext.textAlign = 'center';
        lampContext.textBaseline = 'middle';
        lampContext.fillText(letter, 32, 32);
        
        const lampTexture = new THREE.CanvasTexture(lampCanvas);
        const lampLetterMaterial = new THREE.MeshStandardMaterial({
            map: lampTexture,
            roughness: 0.4,
            metalness: 0.0,
            transparent: true
        });
        
        const lampLetterGeometry = new THREE.CircleGeometry(keySize / 3 - 0.002, 16);
        const lampLetterMesh = new THREE.Mesh(lampLetterGeometry, lampLetterMaterial);
        lampLetterMesh.rotation.x = -Math.PI / 2;
        lampLetterMesh.position.set(xPos, 0.003, zPos);
        lightboardGroup.add(lampLetterMesh);
        
        lampMeshes[letter] = {
            lamp: lampMesh,
            letter: lampLetterMesh,
            canvas: lampCanvas,
            context: lampContext,
            texture: lampTexture,
            originalMaterial: lampMeshMaterial
        };
    });
});

keyboardGroup.add(lightboardGroup);

tableGroup.add(keyboardGroup);

// --- Rotores (atrás da mesa) ---
const rotorGroup = new THREE.Group();
rotorGroup.position.set(0, tableHeight + tableTopThickness / 2, -0.3);

const enigmaRotor1 = new Rotor('I', 0);
const enigmaRotor2 = new Rotor('II', 0);
const enigmaRotor3 = new Rotor('III', 0);
const enigmaReflector = new Reflector('YRUHQSLDPXNGOKMIEBFZCWVJAT');
const enigmaPlugboard = new Plugboard({});
const enigmaMachine = new Enigma(enigmaReflector, enigmaRotor1, enigmaRotor2, enigmaRotor3, enigmaPlugboard);

const rotorRadius = 0.055;
const rotorHeight = 0.12;
const rotorSpacing = 0.14;

const rotorBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.8
});

const rotorRingMaterial = new THREE.MeshStandardMaterial({
    color: 0xcdaa7d,
    roughness: 0.4,
    metalness: 0.3
});

const rotorCapMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.2,
    metalness: 0.9
});

const rotorVisuals = [];

[enigmaRotor1, enigmaRotor2, enigmaRotor3].forEach((rotor, index) => {
    const rotorContainer = new THREE.Group();
    const xPos = (index - 1) * rotorSpacing;
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(rotorRadius + 0.015, rotorRadius + 0.015, 0.015, 32);
    const base = new THREE.Mesh(baseGeometry, rotorBodyMaterial);
    base.position.y = -rotorHeight / 2 - 0.0075;
    base.castShadow = true;
    rotorContainer.add(base);
    
    // Corpo principal
    const bodyGeometry = new THREE.CylinderGeometry(rotorRadius, rotorRadius, rotorHeight, 32);
    const body = new THREE.Mesh(bodyGeometry, rotorBodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    rotorContainer.add(body);
    
    // Ranhuras decorativas
    for (let i = 0; i < 3; i++) {
        const grooveGeometry = new THREE.TorusGeometry(rotorRadius + 0.001, 0.002, 8, 32);
        const groove = new THREE.Mesh(grooveGeometry, new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.8,
            metalness: 0.5
        }));
        groove.rotation.x = Math.PI / 2;
        groove.position.y = -rotorHeight / 2 + 0.02 + i * 0.025;
        rotorContainer.add(groove);
    }
    
    // Anel bronze
    const ringGeometry = new THREE.CylinderGeometry(rotorRadius + 0.008, rotorRadius + 0.008, 0.025, 32);
    const ring = new THREE.Mesh(ringGeometry, rotorRingMaterial);
    ring.position.y = rotorHeight / 2 - 0.035;
    ring.castShadow = true;
    rotorContainer.add(ring);
    
    // Tampa superior
    const capGeometry = new THREE.CylinderGeometry(rotorRadius * 0.4, rotorRadius * 0.6, 0.02, 32);
    const cap = new THREE.Mesh(capGeometry, rotorCapMaterial);
    cap.position.y = rotorHeight / 2 + 0.01;
    cap.castShadow = true;
    rotorContainer.add(cap);
    
    // Janela de visualização
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    function updateRotorDisplay() {
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(0, 0, 64, 80);
        ctx.strokeStyle = '#2c2c2c';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 60, 76);
        ctx.font = 'bold 48px monospace';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(toChar(rotor.position), 32, 40);
    }
    
    updateRotorDisplay();
    const texture = new THREE.CanvasTexture(canvas);
    const displayMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.0
    });
    
    const displayGeometry = new THREE.PlaneGeometry(0.035, 0.045);
    const display = new THREE.Mesh(displayGeometry, displayMaterial);
    display.position.set(0, rotorHeight / 2 - 0.035, rotorRadius + 0.009);
    rotorContainer.add(display);
    
    // Moldura
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.4,
        metalness: 0.6
    });
    
    const frameTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.002, 0.004),
        frameMaterial
    );
    frameTop.position.set(0, rotorHeight / 2 - 0.0125, rotorRadius + 0.011);
    rotorContainer.add(frameTop);
    
    const frameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.002, 0.004),
        frameMaterial
    );
    frameBottom.position.set(0, rotorHeight / 2 - 0.0575, rotorRadius + 0.011);
    rotorContainer.add(frameBottom);
    
    const frameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.002, 0.05, 0.004),
        frameMaterial
    );
    frameLeft.position.set(-0.02, rotorHeight / 2 - 0.035, rotorRadius + 0.011);
    rotorContainer.add(frameLeft);
    
    const frameRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.002, 0.05, 0.004),
        frameMaterial
    );
    frameRight.position.set(0.02, rotorHeight / 2 - 0.035, rotorRadius + 0.011);
    rotorContainer.add(frameRight);
    
    // Label
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 64;
    labelCanvas.height = 32;
    const labelCtx = labelCanvas.getContext('2d');
    labelCtx.fillStyle = '#cccccc';
    labelCtx.fillRect(0, 0, 64, 32);
    labelCtx.font = 'bold 20px Arial';
    labelCtx.fillStyle = '#000000';
    labelCtx.textAlign = 'center';
    labelCtx.textBaseline = 'middle';
    labelCtx.fillText(rotor.tipo, 32, 16);
    
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMaterial = new THREE.MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.6,
        metalness: 0.0
    });
    
    const labelGeometry = new THREE.PlaneGeometry(0.04, 0.02);
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, -rotorHeight / 2 - 0.015, rotorRadius + 0.001);
    rotorContainer.add(label);
    
    rotorContainer.position.set(xPos, rotorHeight / 2 + 0.01, 0);
    rotorGroup.add(rotorContainer);
    
    rotorVisuals.push({
        container: rotorContainer,
        rotor: rotor,
        canvas: canvas,
        ctx: ctx,
        texture: texture,
        updateDisplay: updateRotorDisplay
    });
});

tableGroup.add(rotorGroup);

// --- Refletor Visual ---
const reflectorGroup = new THREE.Group();
reflectorGroup.position.set(-0.4, tableHeight + tableTopThickness / 2, 0.15);

// Corpo principal do refletor (mais largo e achatado)
const reflectorRadius = 0.07;
const reflectorHeight = 0.06;

const reflectorBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.2,
    metalness: 0.9
});

const reflectorFaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b8b8b,
    roughness: 0.1,
    metalness: 0.95,
    emissive: 0x333333,
    emissiveIntensity: 0.2
});

// Base do refletor
const reflectorBaseGeometry = new THREE.CylinderGeometry(reflectorRadius, reflectorRadius, reflectorHeight, 32);
const reflectorBase = new THREE.Mesh(reflectorBaseGeometry, reflectorBodyMaterial);
reflectorBase.position.y = reflectorHeight / 2 + 0.01;
reflectorBase.castShadow = true;
reflectorBase.receiveShadow = true;
reflectorGroup.add(reflectorBase);

// Face frontal reflexiva
const reflectorFaceGeometry = new THREE.CylinderGeometry(reflectorRadius - 0.01, reflectorRadius - 0.01, 0.005, 32);
const reflectorFace = new THREE.Mesh(reflectorFaceGeometry, reflectorFaceMaterial);
reflectorFace.position.y = reflectorHeight + 0.012;
reflectorGroup.add(reflectorFace);

// Anel decorativo
const reflectorRingGeometry = new THREE.TorusGeometry(reflectorRadius - 0.005, 0.005, 16, 32);
const reflectorRing = new THREE.Mesh(reflectorRingGeometry, new THREE.MeshStandardMaterial({
    color: 0xb8860b,
    roughness: 0.3,
    metalness: 0.8
}));
reflectorRing.rotation.x = Math.PI / 2;
reflectorRing.position.y = reflectorHeight + 0.015;
reflectorGroup.add(reflectorRing);

// Detalhes de conectores (pequenos cilindros na base)
for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const connectorRadius = 0.004;
    const connectorGeometry = new THREE.CylinderGeometry(connectorRadius, connectorRadius, 0.015, 8);
    const connector = new THREE.Mesh(connectorGeometry, new THREE.MeshStandardMaterial({
        color: 0xcd7f32,
        roughness: 0.4,
        metalness: 0.7
    }));
    connector.position.set(
        Math.cos(angle) * (reflectorRadius - 0.015),
        0.0075,
        Math.sin(angle) * (reflectorRadius - 0.015)
    );
    reflectorGroup.add(connector);
}

// Label do refletor
const reflectorLabelCanvas = document.createElement('canvas');
reflectorLabelCanvas.width = 128;
reflectorLabelCanvas.height = 64;
const reflectorLabelCtx = reflectorLabelCanvas.getContext('2d');
reflectorLabelCtx.fillStyle = '#2a2a2a';
reflectorLabelCtx.fillRect(0, 0, 128, 64);
reflectorLabelCtx.strokeStyle = '#b8860b';
reflectorLabelCtx.lineWidth = 3;
reflectorLabelCtx.strokeRect(3, 3, 122, 58);
reflectorLabelCtx.font = 'bold 32px monospace';
reflectorLabelCtx.fillStyle = '#ffffff';
reflectorLabelCtx.textAlign = 'center';
reflectorLabelCtx.textBaseline = 'middle';
reflectorLabelCtx.fillText('UKW-B', 64, 32);

const reflectorLabelTexture = new THREE.CanvasTexture(reflectorLabelCanvas);
const reflectorLabelMaterial = new THREE.MeshStandardMaterial({
    map: reflectorLabelTexture,
    roughness: 0.4,
    metalness: 0.3
});

const reflectorLabelGeometry = new THREE.PlaneGeometry(0.064, 0.032);
const reflectorLabel = new THREE.Mesh(reflectorLabelGeometry, reflectorLabelMaterial);
reflectorLabel.position.set(0, reflectorHeight / 2 + 0.01, reflectorRadius + 0.003);
reflectorGroup.add(reflectorLabel);

// Parafusos decorativos
for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const screwGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.004, 6);
    const screw = new THREE.Mesh(screwGeometry, new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.6,
        metalness: 0.8
    }));
    screw.position.set(
        Math.cos(angle) * (reflectorRadius - 0.02),
        reflectorHeight + 0.013,
        Math.sin(angle) * (reflectorRadius - 0.02)
    );
    reflectorGroup.add(screw);
}

tableGroup.add(reflectorGroup);

// --- Plugboard (na frente, entre teclado e rotores) ---
const plugboardGroup = new THREE.Group();
plugboardGroup.position.set(0, tableHeight + tableTopThickness / 2, -0.08);

// Base do plugboard
const plugboardBaseGeometry = new THREE.BoxGeometry(0.6, 0.03, 0.15);
const plugboardBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    metalness: 0.4
});
const plugboardBase = new THREE.Mesh(plugboardBaseGeometry, plugboardBaseMaterial);
plugboardBase.position.y = 0.015;
plugboardBase.castShadow = true;
plugboardBase.receiveShadow = true;
plugboardGroup.add(plugboardBase);

// Sockets do plugboard (26 letras em 2 linhas)
const socketRadius = 0.008;
const socketSpacing = 0.023;
const plugboardSockets = {};

const topRowLetters = 'ABCDEFGHIJKLM'.split('');
const bottomRowLetters = 'NOPQRSTUVWXYZ'.split('');

[topRowLetters, bottomRowLetters].forEach((row, rowIndex) => {
    const startX = -(row.length - 1) * socketSpacing / 2;
    const zPos = rowIndex === 0 ? -0.04 : 0.04;
    
    row.forEach((letter, colIndex) => {
        const xPos = startX + colIndex * socketSpacing;
        
        // Socket (cilindro)
        const socketGeometry = new THREE.CylinderGeometry(socketRadius, socketRadius, 0.02, 16);
        const socketMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 0.4,
            metalness: 0.6
        });
        const socket = new THREE.Mesh(socketGeometry, socketMaterial);
        socket.position.set(xPos, 0.03, zPos);
        plugboardGroup.add(socket);
        
        // Label da letra
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 32;
        labelCanvas.height = 32;
        const labelCtx = labelCanvas.getContext('2d');
        labelCtx.fillStyle = '#ffffff';
        labelCtx.fillRect(0, 0, 32, 32);
        labelCtx.font = 'bold 20px monospace';
        labelCtx.fillStyle = '#000000';
        labelCtx.textAlign = 'center';
        labelCtx.textBaseline = 'middle';
        labelCtx.fillText(letter, 16, 16);
        
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const labelMaterial = new THREE.MeshStandardMaterial({
            map: labelTexture,
            roughness: 0.6,
            metalness: 0.0
        });
        
        const labelGeometry = new THREE.PlaneGeometry(0.015, 0.015);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.rotation.x = -Math.PI / 2;
        label.position.set(xPos, 0.041, zPos);
        plugboardGroup.add(label);
        
        plugboardSockets[letter] = {
            socket: socket,
            position: new THREE.Vector3(xPos, 0.04, zPos)
        };
    });
});

// Cabos do plugboard (conectando pares)
const plugboardCables = [];
const plugboardConnections = {}; // Armazenar conexões atuais

function createPlugboardCable(letter1, letter2) {
    if (!plugboardSockets[letter1] || !plugboardSockets[letter2]) return null;
    
    const pos1 = plugboardSockets[letter1].position.clone().add(plugboardGroup.position);
    const pos2 = plugboardSockets[letter2].position.clone().add(plugboardGroup.position);
    
    // Criar cabo com curva
    const midPoint = pos1.clone().lerp(pos2, 0.5);
    midPoint.y += 0.03; // Elevar o meio do cabo
    
    const curve = new THREE.QuadraticBezierCurve3(pos1, midPoint, pos2);
    const points = curve.getPoints(20);
    const cableGeometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        20,
        0.002,
        8,
        false
    );
    
    const cableMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.5,
        metalness: 0.3
    });
    
    const cable = new THREE.Mesh(cableGeometry, cableMaterial);
    cable.userData = { letter1, letter2 }; // Armazenar identificação
    cable.castShadow = true;
    tableGroup.add(cable);
    
    return cable;
}

// Adicionar algumas conexões iniciais de exemplo (podem ser modificadas)
const initialConnections = [
    ['A', 'B'],
    ['C', 'D'],
    ['E', 'F']
];

initialConnections.forEach(([letter1, letter2]) => {
    const cable = createPlugboardCable(letter1, letter2);
    if (cable) {
        plugboardCables.push(cable);
        plugboardConnections[letter1] = letter2;
        plugboardConnections[letter2] = letter1;
    }
});

// Atualizar o plugboard da máquina Enigma
enigmaPlugboard.connections = plugboardConnections;

tableGroup.add(plugboardGroup);

// --- Cabos de conexão visual ---
const cableMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.6,
    metalness: 0.3
});

const cableActiveMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.4,
    metalness: 0.5,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5
});

// Criar alguns cabos decorativos entre componentes
function createCable(startPos, endPos, parent) {
    const distance = startPos.distanceTo(endPos);
    const cableGeometry = new THREE.CylinderGeometry(0.003, 0.003, distance, 8);
    const cable = new THREE.Mesh(cableGeometry, cableMaterial.clone());
    
    cable.position.copy(startPos).lerp(endPos, 0.5);
    
    const direction = new THREE.Vector3().subVectors(endPos, startPos);
    const axis = new THREE.Vector3(0, 1, 0);
    cable.quaternion.setFromUnitVectors(axis, direction.normalize());
    
    parent.add(cable);
    return cable;
}

// Cabos visuais entre rotores
const cables = [];
for (let i = 0; i < 2; i++) {
    const start = new THREE.Vector3((i - 1) * rotorSpacing, rotorHeight / 2, 0);
    const end = new THREE.Vector3((i) * rotorSpacing, rotorHeight / 2, 0);
    start.add(rotorGroup.position);
    end.add(rotorGroup.position);
    cables.push(createCable(start, end, tableGroup));
}

// Cabo do último rotor para refletor
const lastRotorPos = new THREE.Vector3(rotorSpacing, rotorHeight / 2, 0).add(rotorGroup.position);
const reflectorPos = new THREE.Vector3(-0.25, reflectorHeight / 2 + 0.01, 0.25);
cables.push(createCable(lastRotorPos, reflectorPos, tableGroup));

// --- Display de Status ---
const statusCanvas = document.createElement('canvas');
statusCanvas.width = 512;
statusCanvas.height = 256;
const statusCtx = statusCanvas.getContext('2d');

function drawStatus(message, step = '') {
    statusCtx.fillStyle = '#000000';
    statusCtx.fillRect(0, 0, 512, 256);
    
    statusCtx.fillStyle = '#00ff00';
    statusCtx.font = 'bold 24px monospace';
    statusCtx.textAlign = 'center';
    statusCtx.fillText('ENIGMA STATUS', 256, 30);
    
    statusCtx.fillStyle = '#ffffff';
    statusCtx.font = '18px monospace';
    statusCtx.textAlign = 'left';
    
    const lines = message.split('\n');
    lines.forEach((line, i) => {
        statusCtx.fillText(line, 20, 70 + i * 25);
    });
    
    if (step) {
        statusCtx.fillStyle = '#ffff00';
        statusCtx.font = 'bold 20px monospace';
        statusCtx.fillText(step, 20, 220);
    }
}

drawStatus('Aguardando entrada...', 'Pressione qualquer tecla');

const statusTexture = new THREE.CanvasTexture(statusCanvas);
const statusMaterial = new THREE.MeshStandardMaterial({
    map: statusTexture,
    roughness: 0.4,
    metalness: 0.1
});

const statusGeometry = new THREE.PlaneGeometry(0.4, 0.2);
const statusDisplay = new THREE.Mesh(statusGeometry, statusMaterial);
statusDisplay.position.set(-0.5, tableHeight + tableTopThickness / 2 + 0.15, -0.1);
statusDisplay.rotation.x = -Math.PI / 6;
tableGroup.add(statusDisplay);

// Funções de animação e visualização
function updateRotorVisuals() {
    rotorVisuals.forEach((rv) => {
        rv.updateDisplay();
        rv.texture.needsUpdate = true;
        rv.container.rotation.y = (rv.rotor.position / 26) * Math.PI * 2;
    });
}

function lightUpLamp(letter) {
    if (!lampMeshes[letter]) return;
    
    const lamp = lampMeshes[letter];
    lamp.lamp.material = lampLitMaterial;
    
    // Atualizar textura da letra para fundo amarelo
    lamp.context.fillStyle = '#ffff00';
    lamp.context.beginPath();
    lamp.context.arc(32, 32, 30, 0, Math.PI * 2);
    lamp.context.fill();
    
    lamp.context.font = 'bold 28px serif';
    lamp.context.fillStyle = '#000000';
    lamp.context.textAlign = 'center';
    lamp.context.textBaseline = 'middle';
    lamp.context.fillText(letter, 32, 32);
    lamp.texture.needsUpdate = true;
}

function turnOffLamp(letter) {
    if (!lampMeshes[letter]) return;
    
    const lamp = lampMeshes[letter];
    lamp.lamp.material = lamp.originalMaterial;
    
    // Restaurar textura original
    lamp.context.fillStyle = '#2a2a2a';
    lamp.context.beginPath();
    lamp.context.arc(32, 32, 30, 0, Math.PI * 2);
    lamp.context.fill();
    
    lamp.context.font = 'bold 28px serif';
    lamp.context.fillStyle = '#ffffff';
    lamp.context.textAlign = 'center';
    lamp.context.textBaseline = 'middle';
    lamp.context.fillText(letter, 32, 32);
    lamp.texture.needsUpdate = true;
}

let currentLitLamp = null;

// Variáveis para armazenar mensagem
let inputMessage = '';
let outputMessage = '';

async function processEnigmaWithVisualization(letter) {
    // Capturar estados dos rotores antes
    const r1PosBefore = enigmaRotor1.position;
    const r2PosBefore = enigmaRotor2.position;
    const r3PosBefore = enigmaRotor3.position;
    
    // Acender cabos rapidamente
    cables.forEach(cable => {
        cable.material = cableActiveMaterial.clone();
    });
    
    // Processar
    const result = enigmaMachine.encipherLetter(letter);
    
    // Adicionar à mensagem
    inputMessage += letter;
    outputMessage += result;
    
    // Atualizar rotores
    updateRotorVisuals();
    
    await sleep(100);
    
    // Desligar cabos
    cables.forEach(cable => {
        cable.material = cableMaterial.clone();
    });
    
    // Acender lâmpada
    if (currentLitLamp) {
        turnOffLamp(currentLitLamp);
    }
    lightUpLamp(result);
    currentLitLamp = result;
    
    // Atualizar display
    const plugboardPairs = Object.keys(plugboardConnections)
        .filter((k, i, arr) => arr.indexOf(k) === i && k < (plugboardConnections[k] || 'ZZ'))
        .map(k => `${k}-${plugboardConnections[k]}`)
        .join(' ');
    
    drawStatus(
        `Input:  ${inputMessage}\n` +
        `Output: ${outputMessage}\n` +
        `\n` +
        `Rotores: ${toChar(enigmaRotor3.position)} ${toChar(enigmaRotor2.position)} ${toChar(enigmaRotor1.position)}\n` +
        (plugboardPairs ? `Plugboard: ${plugboardPairs}\n` : '') +
        `\n` +
        `P=Plugboard ; = Reset`,
        ''
    );
    statusTexture.needsUpdate = true;
    
    console.log(`${inputMessage} -> ${outputMessage}`);
    
    return result;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para resetar mensagem
function resetMessage() {
    inputMessage = '';
    outputMessage = '';
    
    drawStatus(
        `Input:  \n` +
        `Output: \n` +
        `\n` +
        `Mensagem resetada!\n` +
        `\n` +
        `Rotores: ${toChar(enigmaRotor3.position)} ${toChar(enigmaRotor2.position)} ${toChar(enigmaRotor1.position)}\n` +
        `\n` +
        `P=Plugboard ; = Reset`,
        'Pronto para nova mensagem'
    );
    statusTexture.needsUpdate = true;
    
    console.log('Mensagem resetada');
}

// --- Sistema de configuração do Plugboard ---
let plugboardMode = false;
let selectedSocketForPlugboard = null;

function togglePlugboardMode() {
    plugboardMode = !plugboardMode;
    
    if (plugboardMode) {
        drawStatus(
            'MODO PLUGBOARD ATIVO\n' +
            '\n' +
            'Clique em duas letras para conectá-las\n' +
            'ou clique em uma conexão existente\n' +
            'para removê-la.\n' +
            '\n' +
            'Pressione P para sair do modo',
            'Modo de configuração'
        );
    } else {
        selectedSocketForPlugboard = null;
        drawStatus('Aguardando entrada...', 'Pressione qualquer tecla');
    }
    statusTexture.needsUpdate = true;
}

function addPlugboardConnection(letter1, letter2) {
    // Remover conexões antigas se existirem
    if (plugboardConnections[letter1]) {
        removePlugboardConnection(letter1);
    }
    if (plugboardConnections[letter2]) {
        removePlugboardConnection(letter2);
    }
    
    // Criar novo cabo
    const cable = createPlugboardCable(letter1, letter2);
    if (cable) {
        plugboardCables.push(cable);
        plugboardConnections[letter1] = letter2;
        plugboardConnections[letter2] = letter1;
        enigmaPlugboard.connections = plugboardConnections;
        
        drawStatus(
            `CONEXÃO ADICIONADA: ${letter1} <-> ${letter2}\n` +
            '\n' +
            'Conexões atuais:\n' +
            Object.keys(plugboardConnections)
                .filter((k, i, arr) => arr.indexOf(k) === i && k < plugboardConnections[k])
                .map(k => `${k} <-> ${plugboardConnections[k]}`)
                .join(', '),
            'Clique em outra letra ou pressione P'
        );
        statusTexture.needsUpdate = true;
    }
}

function removePlugboardConnection(letter) {
    const connectedLetter = plugboardConnections[letter];
    if (!connectedLetter) return;
    
    // Encontrar e remover cabo correspondente
    for (let i = plugboardCables.length - 1; i >= 0; i--) {
        const cable = plugboardCables[i];
        if (cable.userData && 
            ((cable.userData.letter1 === letter && cable.userData.letter2 === connectedLetter) ||
             (cable.userData.letter1 === connectedLetter && cable.userData.letter2 === letter))) {
            tableGroup.remove(cable);
            cable.geometry.dispose();
            cable.material.dispose();
            plugboardCables.splice(i, 1);
            break;
        }
    }
    
    // Remover conexão
    delete plugboardConnections[letter];
    delete plugboardConnections[connectedLetter];
    enigmaPlugboard.connections = plugboardConnections;
    
    drawStatus(
        `CONEXÃO REMOVIDA: ${letter} <-> ${connectedLetter}\n` +
        '\n' +
        'Conexões restantes:\n' +
        Object.keys(plugboardConnections)
            .filter((k, i, arr) => arr.indexOf(k) === i && k < plugboardConnections[k])
            .map(k => `${k} <-> ${plugboardConnections[k]}`)
            .join(', '),
        'Modo Plugboard ativo'
    );
    statusTexture.needsUpdate = true;
}

// Raycaster para detectar cliques
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Modo de configuração de rotor
let rotorConfigMode = false;
let selectedRotorIndex = null;

function startRotorConfig(rotorIndex) {
    rotorConfigMode = true;
    selectedRotorIndex = rotorIndex;
    
    const rotor = [enigmaRotor1, enigmaRotor2, enigmaRotor3][rotorIndex];
    
    // Destacar rotor selecionado
    rotorVisuals.forEach((rv, i) => {
        if (i === rotorIndex) {
            // Adicionar brilho ao rotor selecionado
            rv.container.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissive = new THREE.Color(0x00ff00);
                    child.material.emissiveIntensity = 0.3;
                }
            });
        }
    });
    
    drawStatus(
        `CONFIGURANDO ROTOR ${rotor.tipo}\n` +
        '\n' +
        `Posição atual: ${toChar(rotor.position)}\n` +
        '\n' +
        'Digite uma letra (A-Z) para definir\n' +
        'a posição inicial do rotor.\n' +
        '\n' +
        'Pressione ESC para cancelar',
        'Modo de configuração de rotor'
    );
    statusTexture.needsUpdate = true;
}

function setRotorPosition(rotorIndex, letter) {
    const rotor = [enigmaRotor1, enigmaRotor2, enigmaRotor3][rotorIndex];
    const position = toIndex(letter);
    
    rotor.rotate_to(position);
    updateRotorVisuals();
    
    // Remover destaque do rotor
    rotorVisuals.forEach((rv) => {
        rv.container.traverse((child) => {
            if (child.isMesh && child.material && child.material.emissive) {
                child.material.emissive = new THREE.Color(0x000000);
                child.material.emissiveIntensity = 0;
            }
        });
    });
    
    const plugboardPairs = Object.keys(plugboardConnections)
        .filter((k, i, arr) => arr.indexOf(k) === i && k < (plugboardConnections[k] || 'ZZ'))
        .map(k => `${k}-${plugboardConnections[k]}`)
        .join(' ');
    
    drawStatus(
        `ROTOR ${rotor.tipo} -> ${letter}\n` +
        '\n' +
        `Input:  ${inputMessage}\n` +
        `Output: ${outputMessage}\n` +
        '\n' +
        `Rotores: ${toChar(enigmaRotor3.position)} ${toChar(enigmaRotor2.position)} ${toChar(enigmaRotor1.position)}\n` +
        (plugboardPairs ? `Plugboard: ${plugboardPairs}\n` : '') +
        '\n' +
        'P=Plugboard ; = Reset',
        'Clique nos rotores para configurar'
    );
    statusTexture.needsUpdate = true;
    
    rotorConfigMode = false;
    selectedRotorIndex = null;
}

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Se estiver no modo plugboard
    if (plugboardMode) {
        // Verificar interseção com sockets
        const allSockets = Object.keys(plugboardSockets).map(letter => plugboardSockets[letter].socket);
        const intersects = raycaster.intersectObjects(allSockets);
        
        if (intersects.length > 0) {
            const clickedSocket = intersects[0].object;
            const clickedLetter = Object.keys(plugboardSockets).find(
                letter => plugboardSockets[letter].socket === clickedSocket
            );
            
            if (plugboardConnections[clickedLetter]) {
                // Se já está conectada, remover conexão
                removePlugboardConnection(clickedLetter);
                selectedSocketForPlugboard = null;
            } else if (!selectedSocketForPlugboard) {
                // Primeira seleção
                selectedSocketForPlugboard = clickedLetter;
                plugboardSockets[clickedLetter].socket.material.color.setHex(0x00ff00);
                drawStatus(
                    `Letra selecionada: ${clickedLetter}\n` +
                    '\n' +
                    'Clique em outra letra para conectar',
                    'Aguardando segunda letra...'
                );
                statusTexture.needsUpdate = true;
            } else {
                // Segunda seleção - criar conexão
                plugboardSockets[selectedSocketForPlugboard].socket.material.color.setHex(0x8b7355);
                addPlugboardConnection(selectedSocketForPlugboard, clickedLetter);
                selectedSocketForPlugboard = null;
            }
        }
        return;
    }
    
    // Se não estiver em modo de configuração, verificar clique nos rotores
    if (!rotorConfigMode && !isProcessing && !plugboardMode) {
        // Tentar intersecção com todos os componentes dos rotores
        const allRotorParts = [];
        rotorVisuals.forEach((rv, index) => {
            rv.container.traverse((child) => {
                if (child.isMesh) {
                    child.userData.rotorIndex = index;
                    allRotorParts.push(child);
                }
            });
        });
        
        const intersects = raycaster.intersectObjects(allRotorParts, false);
        
        if (intersects.length > 0 && intersects[0].object.userData.rotorIndex !== undefined) {
            const rotorIndex = intersects[0].object.userData.rotorIndex;
            startRotorConfig(rotorIndex);
        }
    }
});

// --- Sistema de Detecção de Teclas ---
const pressedKeys = new Set();

function pressKey(letter) {
    const keyData = keyMeshes[letter];
    if (!keyData) return;
    
    keyData.key.position.y = keyData.pressedY;
    keyData.letter.position.y = keyData.pressedY + keyHeight + 0.002;
    keyData.ring.position.y = keyData.pressedY;
    keyData.key.material = keyPressedMaterial;
    
    pressedKeys.add(letter);
}

function releaseKey(letter) {
    const keyData = keyMeshes[letter];
    if (!keyData) return;
    
    keyData.key.position.y = keyData.originalY;
    keyData.letter.position.y = keyData.originalY + keyHeight + 0.002;
    keyData.ring.position.y = keyData.originalY;
    keyData.key.material = keyData.originalMaterial;
    
    pressedKeys.delete(letter);
}

// Event listeners para teclado físico
let isProcessing = false;

window.addEventListener('keydown', async (event) => {
    const letter = event.key.toUpperCase();
    
    // ESC para cancelar modo de configuração
    if (event.key === 'Escape') {
        if (rotorConfigMode) {
            rotorConfigMode = false;
            selectedRotorIndex = null;
            
            // Remover destaque do rotor
            rotorVisuals.forEach((rv) => {
                rv.container.traverse((child) => {
                    if (child.isMesh && child.material && child.material.emissive) {
                        child.material.emissive = new THREE.Color(0x000000);
                        child.material.emissiveIntensity = 0;
                    }
                });
            });
            
            const plugboardPairs = Object.keys(plugboardConnections)
                .filter((k, i, arr) => arr.indexOf(k) === i && k < (plugboardConnections[k] || 'ZZ'))
                .map(k => `${k}-${plugboardConnections[k]}`)
                .join(' ');
            
            drawStatus(
                `Input:  ${inputMessage}\n` +
                `Output: ${outputMessage}\n` +
                `\n` +
                `Rotores: ${toChar(enigmaRotor3.position)} ${toChar(enigmaRotor2.position)} ${toChar(enigmaRotor1.position)}\n` +
                (plugboardPairs ? `Plugboard: ${plugboardPairs}\n` : '') +
                `\n` +
                `P=Plugboard ; = Reset`,
                'Configuração cancelada'
            );
            statusTexture.needsUpdate = true;
        }
        return;
    }
    
    // Se estiver no modo de configuração de rotor
    if (rotorConfigMode && /^[A-Z]$/.test(letter)) {
        event.preventDefault();
        setRotorPosition(selectedRotorIndex, letter);
        return;
    }
    
    // Tecla P para alternar modo plugboard
    if (letter === 'P' && !isProcessing && !rotorConfigMode) {
        event.preventDefault();
        togglePlugboardMode();
        return;
    }
    
    // Tecla ; para resetar mensagem
    if (event.key === ';' && !isProcessing && !rotorConfigMode && !plugboardMode) {
        event.preventDefault();
        resetMessage();
        return;
    }
    
    // Não processar letras no modo plugboard ou configuração
    if (plugboardMode || rotorConfigMode) return;
    
    if (keyMeshes[letter] && !pressedKeys.has(letter) && !isProcessing) {
        event.preventDefault();
        isProcessing = true;
        
        pressKey(letter);
        
        // Processar com visualização
        await processEnigmaWithVisualization(letter);
        
        isProcessing = false;
    }
});

window.addEventListener('keyup', (event) => {
    const letter = event.key.toUpperCase(); 
    
    if (keyMeshes[letter] && pressedKeys.has(letter)) {
        event.preventDefault();
        releaseKey(letter);
        
        // Apagar lâmpada após soltar tecla
        if (currentLitLamp) {
            turnOffLamp(currentLitLamp);
            currentLitLamp = null;
        }
        
        if (!plugboardMode) {
            const plugboardPairs = Object.keys(plugboardConnections)
                .filter((k, i, arr) => arr.indexOf(k) === i && k < (plugboardConnections[k] || 'ZZ'))
                .map(k => `${k}-${plugboardConnections[k]}`)
                .join(' ');
            
            drawStatus(
                `Input:  ${inputMessage}\n` +
                `Output: ${outputMessage}\n` +
                `\n` +
                `Rotores: ${toChar(enigmaRotor3.position)} ${toChar(enigmaRotor2.position)} ${toChar(enigmaRotor1.position)}\n` +
                (plugboardPairs ? `Plugboard: ${plugboardPairs}\n` : '') +
                `\n` +
                `P=Plugboard ; = Reset`,
                'Aguardando entrada...'
            );
            statusTexture.needsUpdate = true;
        }
    }
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
