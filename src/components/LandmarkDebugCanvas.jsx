import { useEffect, useRef } from 'react';
import useFaceLandmarks from '../hooks/useFaceLandmarks';

export default function LandmarkDebugCanvas({ videoRef }) {
    const canvasRef = useRef(null);
    const landmarks = useFaceLandmarks(videoRef);

    useEffect(() => {
        if (!landmarks || !canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'lime';
        landmarks.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x * ctx.canvas.width, pt.y * ctx.canvas.height, 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    }, [landmarks]);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0 }}
        />
    );
}