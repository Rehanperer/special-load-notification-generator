import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ label }) => {
    const sigCanvas = useRef({});

    const clear = () => {
        sigCanvas.current.clear();
    };

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                    className: 'sigCanvas',
                    style: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }
                }}
            />
            {label && <p style={{ position: 'absolute', bottom: -15, left: 0, fontSize: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{label}</p>}
            <button
                onClick={clear}
                className="no-print"
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    fontSize: '7px',
                    padding: '1px 3px',
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid #ccc',
                    zIndex: 10
                }}
            >
                Clear
            </button>
        </div>
    );
};

export default SignaturePad;
