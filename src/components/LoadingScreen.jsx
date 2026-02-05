import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onComplete }) => {
    const [phase, setPhase] = useState('favicon'); // 'favicon' -> 'logo' -> 'fadeout'

    useEffect(() => {
        // Phase 1: Show favicon with animation (1.5s)
        const faviconTimer = setTimeout(() => {
            setPhase('logo');
        }, 1500);

        // Phase 2: Show logo with animation (1.5s)
        const logoTimer = setTimeout(() => {
            setPhase('fadeout');
        }, 3000);

        // Phase 3: Complete and unmount (0.5s fade)
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 3500);

        return () => {
            clearTimeout(faviconTimer);
            clearTimeout(logoTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className={`loading-screen ${phase === 'fadeout' ? 'fade-out' : ''}`}>
            <div className="loading-content">
                {/* Favicon Phase */}
                <img
                    src="./favicon.png"
                    alt="Loading..."
                    className={`loading-favicon ${phase === 'favicon' ? 'active' : 'hidden'}`}
                />

                {/* Logo Phase */}
                <img
                    src="./logo.png"
                    alt="Qatar Executive"
                    className={`loading-logo ${phase === 'logo' || phase === 'fadeout' ? 'active' : 'hidden'}`}
                />

                {/* Loading text */}
                <div className={`loading-text ${phase === 'logo' || phase === 'fadeout' ? 'active' : ''}`}>
                    SPECIAL LOAD NOTIFICATION
                </div>

                {/* Animated loading bar */}
                <div className="loading-bar-container">
                    <div className="loading-bar"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
