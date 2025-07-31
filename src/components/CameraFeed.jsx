// src/components/CameraFeed.jsx
import React, { forwardRef, useEffect, useState } from 'react';

const CameraFeed = forwardRef(function CameraFeed(_, videoRef) {
    const [error, setError] = useState(null);

    useEffect(() => {
        const constraints = {
            video: {
                facingMode: { ideal: 'user' },
                width: { ideal: 640 },
                height: { ideal: 640 }
            }
        };

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            })
            .catch(err => {
                if (err.name === 'NotFoundError') {
                    // Reintenta sin constraints estrictas
                    return navigator.mediaDevices
                        .getUserMedia({ video: true })
                        .then(stream => {
                            if (videoRef.current) {
                                videoRef.current.srcObject = stream;
                                videoRef.current.play();
                            }
                        })
                        .catch(e => setError(e.message));
                }
                setError(err.message);
            });

        const videoElement = videoRef.current;
        return () => videoElement?.srcObject?.getTracks().forEach(t => t.stop());
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
