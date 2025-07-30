// src/components/CameraFeed.jsx
import React, { forwardRef, useEffect, useState } from 'react';

const CameraFeed = forwardRef(function CameraFeed(_, videoRef) {
    const [error, setError] = useState(null);

    useEffect(() => {
        const constraints = { video: { facingMode: 'user', width: 640, height: 640 } };

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            })
            .catch(err => {
                console.error(err);
                setError('No se pudo acceder a la cámara. Revisa permisos y hardware.');
            });

        return () => videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    }, [videoRef]);

    return error ? (
        <div className="error">{error}</div>
    ) : (
        <video
            ref={videoRef}
            width={640}
            height={640}
            muted
            playsInline
            style={{ objectFit: 'cover', borderRadius: '10px' }}
        />
    );
});

export default CameraFeed;
