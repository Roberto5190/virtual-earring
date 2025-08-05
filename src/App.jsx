import { useRef, useState, useEffect } from 'react';
import './App.css';
import * as tf from '@tensorflow/tfjs';                 // 2.8.6
import * as facemesh from '@tensorflow-models/facemesh';
import Webcam from 'react-webcam';
import { drawEarlobes } from './utilities/utilities';

const ALPHA = 0.35;

function App() {
  const [error, setError] = useState(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const rafIdRef  = useRef(null);
  const modelRef  = useRef(null);
  const smoothRef = useRef({ left: null, right: null });

  const earringImg = useRef(new Image()).current;
  earringImg.src = 'src/assets/react.svg';

  const smooth = (n, p) =>
    !p ? n : [ALPHA * n[0] + (1 - ALPHA) * p[0],
              ALPHA * n[1] + (1 - ALPHA) * p[1]];

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await tf.setBackend('webgl');   // usa WebGL incluido en tfjs@2.8.6
        await tf.ready();

        modelRef.current = await facemesh.load({
          inputResolution: { width: 640, height: 480 },
          scale: 0.8,
        });
        rafIdRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error(err);
        setError('Error al inicializar TensorFlow o Facemesh');
      }
    };

    const loop = async () => {
      if (!mounted) return;
      const video  = webcamRef.current?.video;
      const canvas = canvasRef.current;
      const net    = modelRef.current;

      if (!(video && canvas && net && video.readyState === 4)) {
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }

      const { videoWidth: w, videoHeight: h } = video;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const faces = await net.estimateFaces(video);
      const ctx   = canvas.getContext('2d');

      ctx.clearRect(0, 0, w, h);
      drawEarlobes(faces, canvasRef);

      if (faces.length && earringImg.complete) {
        const [xL, yL] = faces[0].scaledMesh[234];
        const [xR, yR] = faces[0].scaledMesh[454];

        smoothRef.current.left  = smooth([xL, yL], smoothRef.current.left);
        smoothRef.current.right = smooth([xR, yR], smoothRef.current.right);

        const [sxL, syL] = smoothRef.current.left;
        const [sxR, syR] = smoothRef.current.right;

        const eW = 30, eH = 30;
        ctx.drawImage(earringImg, sxL - eW / 2, syL, eW, eH);
        ctx.drawImage(earringImg, sxR - eW / 2, syR, eW, eH);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    init();

    return () => {
      mounted = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <>
      <h1>Virtual Earring</h1>
      {error && <p className="error">{error}</p>}
      <Webcam ref={webcamRef} className="absolute right-0 left-0 mx-auto" />
      <canvas ref={canvasRef} className="absolute right-0 left-0 mx-auto" />
    </>
  );
}

export default App;
