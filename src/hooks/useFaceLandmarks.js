// src/hooks/useFaceLandmarks.js
import { useEffect, useRef, useState } from 'react';

/**
 * Exponential Moving Average para un solo punto 3D.
 * @param {{x:number,y:number,z:number}} prev - punto previo suavizado
 * @param {{x:number,y:number,z:number}} curr - punto actual crudo
 * @param {number} alpha - 0-1, cuanto mayor más “rápido” responde (0.6 recomendado)
 */
function smooth(prev, curr, alpha = 0.6) {
    return {
        x: alpha * curr.x + (1 - alpha) * prev.x,
        y: alpha * curr.y + (1 - alpha) * prev.y,
        z: alpha * curr.z + (1 - alpha) * prev.z
    };
}

/**
 * Hook: devuelve un array de 468 landmarks suavizados (o null si no hay cara).
 * - Procesa cada frame en un Web Worker para no bloquear React.
 * - Usa requestVideoFrameCallback (con fallback) para ritmo de cuadro estable.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef  referencia al <video>
 * @param {number} alpha  coeficiente de suavizado EMA (0.6-0.8 habitual)
 */
export default function useFaceLandmarks(videoRef, alpha = 0.6) {
    const [landmarks, setLandmarks] = useState(null);
    const workerRef = useRef(null);
    const prevRef = useRef(null);

    /** —— 1. Crear y preparar el Web Worker (una sola vez) */
    useEffect(() => {
        // Carga dinámica para que Vite empaquete correctamente el worker
        workerRef.current = new Worker(
            new URL('../workers/faceWorker.j?worker', import.meta.url),
            { type: 'classic' }
        );

        // Iniciar el worker
        workerRef.current.postMessage({ type: 'init' });

        // Escuchar resultados
        workerRef.current.onmessage = ({ data }) => {
            if (data.type !== 'result') return;

            const raw = data.result?.faceLandmarks?.[0] ?? null;
            if (!raw) {
                setLandmarks(null);
                prevRef.current = null;
                return;
            }

            // Si es el primer frame, no suavizamos
            if (!prevRef.current) {
                prevRef.current = raw;
                setLandmarks(raw);
                return;
            }

            // Suavizar cada punto con EMA
            const smoothed = raw.map((pt, i) => smooth(prevRef.current[i], pt, alpha));
            prevRef.current = smoothed;
            setLandmarks(smoothed);
        };

        // Limpieza al desmontar
        return () => workerRef.current?.terminate();
    }, [alpha]);

    /** —— 2. Enviar cada frame del vídeo al Worker */
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // requestVideoFrameCallback no existe en Firefox aún ⇒ fallback a setTimeout
        const schedule = video.requestVideoFrameCallback
            ? cb => video.requestVideoFrameCallback(cb)
            : cb => setTimeout(() => cb(0, { mediaTime: video.currentTime }), 16);

        const loop = async (_, info) => {
            // Crear ImageBitmap transferible (cero copia)
            const bitmap = await createImageBitmap(video);

            workerRef.current?.postMessage(
                { type: 'frame', bitmap, timestamp: info.mediaTime },
                [bitmap] // Transfiere la memoria
            );

            // Solicitar el siguiente frame
            schedule(loop);
        };

        schedule(loop);
    }, [videoRef]);

    return landmarks; // null | Array<{x,y,z}>
}
