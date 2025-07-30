import React from "react";
import { useEffect, useState, useRef } from "react";

const CameraFeed = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Pedir video, cámara frontal si está disponible
    const constraints = {
      video: { facingMode: "user", width: 640, height: 640 },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        // 2. Asignar el stream al videoRef
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.log(err);
        setError(
          "No se pudo acceder a la cámara. Asegúrate de que está conectada y permite el acceso."
        );
      });

    // 3. Limpiar el stream al desmontar el componente
    return () => {
      videoRef.current &&
        videoRef.current.srcObject &&
        videoRef.current.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
    };
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <>
      <div>CameraFeed</div>
      <video 
        ref={videoRef} 
        width={640}
        height={640}
        style= {{ objectFit: "cover", borderRadius: "10px" }}
        muted
        playsInline 
      />
    </>
  );
};

export default CameraFeed;
