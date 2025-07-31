import { useEffect, useRef } from 'react';
import useFaceLandmarks from '../hooks/useFaceLandmarks';

export default function LandmarkDebugCanvas({ videoRef }) {
    const canvasRef = useRef(null);
    const landmarks = useFaceLandmarks(videoRef);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!landmarks || !canvas || !video) return;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'lime';
        landmarks.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x * ctx.canvas.width, pt.y * ctx.canvas.height, 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    }, [landmarks, videoRef]);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0 }}
        />
    );
}
