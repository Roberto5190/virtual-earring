/**************************************************************************
 *  Virtual Earring App – React + TensorFlow.js FaceMesh + lil-gui
 *  Muestra pendientes virtuales sobre los lóbulos detectados por la cámara
 *  y permite desplazar cada pendiente (X / Y / Z) en tiempo real.
 **************************************************************************/

// ────────────────  IMPORTACIONES  ────────────────
import { useRef, useState, useEffect } from 'react';   // Hooks de React
import './App.css';                                    // Estilos globales
import * as tf from '@tensorflow/tfjs';                // Núcleo TF-JS 2.8.6
import * as facemesh from '@tensorflow-models/facemesh';// Modelo FaceMesh
import Webcam from 'react-webcam';                     // Componente webcam
import { drawEarlobes } from './utilities/utilities';  // Función para círculos
import { GUI } from 'lil-gui';                         // Panel interactivo

// ────────────────  CONSTANTES DE CONFIGURACIÓN  ────────────────
const EMA_ALPHA          = 0.35;   // Factor de suavizado exponencial (0-1)
const EARRING_BASE_SIZE  = 30;     // Tamaño base del pendiente en píxeles

// ────────────────  COMPONENTE PRINCIPAL  ────────────────
function VirtualEarringApp() {
  /* ======== ESTADO ======== */
  const [errorMessage, setErrorMessage] = useState(null);   // Para mostrar errores

  /* ======== REFERENCIAS MUTABLES ======== */
  const webcamElementRef   = useRef(null);   // <Webcam>
  const canvasElementRef   = useRef(null);   // <canvas>
  const animationFrameRef  = useRef(null);   // ID de requestAnimationFrame
  const faceMeshModelRef   = useRef(null);   // Instancia de FaceMesh cargada
  const smoothCoordsRef    = useRef({        // Coordenadas suavizadas (EMA)
    leftLobe : null,
    rightLobe: null,
  });
  // Controles independientes (pendiente izquierdo / derecho)
  const earringOffsetRef   = useRef({
    left : { x: 0, y: 0, z: 0 },
    right: { x: 0, y: 0, z: 0 },
  });

  /* ======== IMAGEN DEL PENDIENTE (SE CARGA UNA VEZ) ======== */
  const earringImage = useRef(new Image()).current;
  earringImage.src   = 'src/assets/react.svg';         // Ruta del SVG en tu proyecto

  /* ======== FUNCIÓN DE SUAVIZADO EMA ======== */
  const applyEmaSmoothing = (newPoint, previousPoint) =>
    !previousPoint
      ? newPoint                                             // Primer frame → no suaviza
      : [
          EMA_ALPHA * newPoint[0] + (1 - EMA_ALPHA) * previousPoint[0], // X suavizado
          EMA_ALPHA * newPoint[1] + (1 - EMA_ALPHA) * previousPoint[1], // Y suavizado
        ];

  // ──────────────────────────────  GUI (lil-gui)  ──────────────────────────────
  useEffect(() => {
    const gui = new GUI({ title: 'Ajuste de Pendientes' });   // Crea ventana

    // Carpetas para cada pendiente
    const leftFolder  = gui.addFolder('Pendiente Izq.');
    leftFolder.add(earringOffsetRef.current.left,  'x', -80,  80, 1).name('X');
    leftFolder.add(earringOffsetRef.current.left,  'y', -80,  80, 1).name('Y');
    leftFolder.add(earringOffsetRef.current.left,  'z', -50,  50, 1).name('Z');

    const rightFolder = gui.addFolder('Pendiente Der.');
    rightFolder.add(earringOffsetRef.current.right, 'x', -80, 80, 1).name('X');
    rightFolder.add(earringOffsetRef.current.right, 'y', -80, 80, 1).name('Y');
    rightFolder.add(earringOffsetRef.current.right, 'z', -50, 50, 1).name('Z');

    leftFolder.open();                                      // Abre carpetas por defecto
    rightFolder.open();

    return () => gui.destroy();                             // Limpia GUI al desmontar
  }, []); // [] → se ejecuta una sola vez al montar

  // ────────────────────  CARGA DEL MODELO + BUCLE RAF  ────────────────────
  useEffect(() => {
    let componentMounted = true;                            // Para abortar si se desmonta

    /* --- Paso 1 : inicializar backend WebGL y cargar FaceMesh --- */
    const initialiseModel = async () => {
      try {
        await tf.setBackend('webgl');                       // Selecciona backend rápido :contentReference[oaicite:0]{index=0}
        await tf.ready();                                   // Espera a que WebGL esté listo :contentReference[oaicite:1]{index=1}

        faceMeshModelRef.current = await facemesh.load({    // Carga modelo FaceMesh
          inputResolution: { width: 640, height: 480 },     // Tamaño de entrada :contentReference[oaicite:2]{index=2}
          scale          : 0.8,                             // Reduce coste de cómputo
        });
        animationFrameRef.current = requestAnimationFrame(animationLoop); // Inicia animación
      } catch (loadError) {
        console.error(loadError);
        setErrorMessage('Error al inicializar TensorFlow o FaceMesh');
      }
    };

    /* --- Paso 2 : bucle de detección y dibujo sincronizado con requestAnimationFrame --- */
    const animationLoop = async () => {
      if (!componentMounted) return;                        // Salir si el componente se desmonta

      const videoElement  = webcamElementRef.current?.video;
      const canvasElement = canvasElementRef.current;
      const faceMeshModel = faceMeshModelRef.current;

      // Verifica que vídeo, canvas y modelo estén listos
      if (!(videoElement && canvasElement && faceMeshModel && videoElement.readyState === 4)) {
        animationFrameRef.current = requestAnimationFrame(animationLoop);
        return;                                             // Espera al siguiente frame
      }

      /* --- Ajustar tamaño del canvas al vídeo --- */
      const { videoWidth, videoHeight } = videoElement;
      if (canvasElement.width !== videoWidth || canvasElement.height !== videoHeight) {
        canvasElement.width  = videoWidth;                  // Cambiar tamaño reinicia el buffer :contentReference[oaicite:3]{index=3}
        canvasElement.height = videoHeight;
      }

      /* ---  Detección de rostro y obtención de landmarks --- */
      const detectedFaces = await faceMeshModel.estimateFaces(videoElement); // Predicción
      const ctx           = canvasElement.getContext('2d'); // Contexto 2D

      ctx.clearRect(0, 0, videoWidth, videoHeight);         // Limpia el lienzo :contentReference[oaicite:4]{index=4}
      drawEarlobes(detectedFaces, canvasElementRef);        // Dibuja puntos de referencia

      /* --- Si hay al menos una cara detectada y la imagen del pendiente está cargada --- */
      if (detectedFaces.length && earringImage.complete) {
        // Índices 234 (izquierdo) y 454 (derecho) → lóbulos :contentReference[oaicite:5]{index=5}
        const [leftX,  leftY ] = detectedFaces[0].scaledMesh[234];
        const [rightX, rightY] = detectedFaces[0].scaledMesh[454];

        /* ● Suavizar coordenadas con EMA para evitar “temblor” ● */
        smoothCoordsRef.current.leftLobe  = applyEmaSmoothing([leftX,  leftY ], smoothCoordsRef.current.leftLobe);
        smoothCoordsRef.current.rightLobe = applyEmaSmoothing([rightX, rightY], smoothCoordsRef.current.rightLobe);

        const [smoothLeftX,  smoothLeftY ] = smoothCoordsRef.current.leftLobe;
        const [smoothRightX, smoothRightY] = smoothCoordsRef.current.rightLobe;

        /* ● Leer desplazamientos configurados en lil-gui ● */
        const { left:  leftOffset,  right: rightOffset } = earringOffsetRef.current;

        /* ● Calcular tamaño final aplicando offset Z como “escala” ● */
        const leftSize  = EARRING_BASE_SIZE * (1 - leftOffset.z  * 0.01);
        const rightSize = EARRING_BASE_SIZE * (1 - rightOffset.z * 0.01);

        /* ● Dibujar pendiente izquierdo ● */
        ctx.drawImage(
          earringImage,
          smoothLeftX  + leftOffset.x  - leftSize  / 2,      // Desplaza X y centra
          smoothLeftY  + leftOffset.y,                       // Desplaza Y
          leftSize, leftSize                                 // Ancho y alto
        );                                                   // drawImage() :contentReference[oaicite:6]{index=6}

        /* ● Dibujar pendiente derecho ● */
        ctx.drawImage(
          earringImage,
          smoothRightX + rightOffset.x - rightSize / 2,
          smoothRightY + rightOffset.y,
          rightSize, rightSize
        );
      }

      /* --- Solicita el siguiente frame --- */
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    };

    initialiseModel();                                      // Dispara inicialización

    /* --- Limpieza al desmontar el componente --- */
    return () => {
      componentMounted = false;                             // Detiene el loop
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []); // [] → efecto único

  // ────────────────────────────────  RENDER  ────────────────────────────────
  return (
    <>
      <h1>Virtual Earring</h1>
      {errorMessage && <p className="error">{errorMessage}</p>}

      {/* Webcam en tiempo real */}
      <Webcam
        ref={webcamElementRef}
        className="absolute right-0 left-0 mx-auto"
      />

      {/* Canvas para dibujar puntos y pendientes */}
      <canvas
        ref={canvasElementRef}
        className="absolute right-0 left-0 mx-auto"
      />
    </>
  );
}

export default VirtualEarringApp; // Exportación del componente principal
