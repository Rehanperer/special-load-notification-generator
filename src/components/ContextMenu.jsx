import React from 'react';
import './ContextMenu.css';

const ContextMenu = ({ x, y, onClose, onCopy, onPaste, onClear }) => {
    return (
        <>
            <div className="context-menu-overlay" onClick={onClose} />
            <div
                className="context-menu"
                style={{
                    top: y,
                    left: x,
                    transform: 'translate(-50%, -100%)'
                }}
            >
                <button className="context-menu-item" onClick={onCopy}>
                    <span className="context-menu-icon">📋</span>
                    Copy
                </button>
                <button className="context-menu-item" onClick={onPaste}>
                    <span className="context-menu-icon">📝</span>
                    Paste
                </button>
                <button className="context-menu-item context-menu-danger" onClick={onClear}>
                    <span className="context-menu-icon">🗑️</span>
                    Clear
                </button>
            </div>
        </>
    );
};

export default ContextMenu;
