import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Download, Check } from 'lucide-react';
import { dangerousGoodsList } from '../data/dangerousGoodsData';
import SignaturePad from './SignaturePad';
import ContextMenu from './ContextMenu';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MainForm = () => {
    // Loading and success states
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Context menu state for long-press
    const [contextMenu, setContextMenu] = useState(null);
    const longPressTimer = useRef(null);
    const [clipboardData, setClipboardData] = useState('');

    // Swipe state for table rows
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const [swipingRow, setSwipingRow] = useState(null); // { index, type: 'dg' | 'other' }
    const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right'

    // Long press handlers for Context Menu
    const handleTouchStart = (e, value, rowIndex, type, field) => {
        // Clear any existing timer
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            setContextMenu({
                x: touch.clientX,
                y: touch.clientY,
                value,
                rowIndex,
                type,
                field
            });
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleContextMenuCopy = () => {
        if (contextMenu) {
            setClipboardData(contextMenu.value);
            // Optionally use navigator.clipboard for cross-app copy if supported
            if (navigator.clipboard) {
                navigator.clipboard.writeText(contextMenu.value).catch(() => { });
            }
        }
        setContextMenu(null);
    };

    const handleContextMenuPaste = () => {
        if (contextMenu && clipboardData !== undefined) {
            if (contextMenu.type === 'dg') {
                updateDGField(contextMenu.rowIndex, contextMenu.field, clipboardData);
            } else if (contextMenu.type === 'other') {
                updateOtherField(contextMenu.rowIndex, contextMenu.field, clipboardData);
            }
        }
        setContextMenu(null);
    };

    const handleContextMenuClear = () => {
        if (contextMenu) {
            if (contextMenu.type === 'dg') {
                updateDGField(contextMenu.rowIndex, contextMenu.field, '');
            } else if (contextMenu.type === 'other') {
                updateOtherField(contextMenu.rowIndex, contextMenu.field, '');
            }
        }
        setContextMenu(null);
    };

    // Swipe handlers for row actions
    const handleRowTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleRowTouchMove = (e, rowIndex, type) => {
        const deltaX = e.touches[0].clientX - touchStartX.current;
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

        // Only trigger swipe if horizontal movement is dominant and significant
        if (Math.abs(deltaX) > 60 && deltaY < 40) {
            setSwipingRow({ index: rowIndex, type });
            setSwipeDirection(deltaX > 0 ? 'right' : 'left');
        } else {
            setSwipingRow(null);
            setSwipeDirection(null);
        }
    };

    const handleRowTouchEnd = (rowIndex, type) => {
        if (swipingRow && swipingRow.index === rowIndex && swipingRow.type === type) {
            if (swipeDirection === 'left') {
                // CLEAR row
                if (type === 'dg') {
                    clearDangerousGoodsRow(rowIndex);
                } else {
                    clearOtherLoadRow(rowIndex);
                }
            } else if (swipeDirection === 'right') {
                // DUPLICATE row
                if (type === 'dg') {
                    duplicateDangerousGoodsRow(rowIndex);
                } else {
                    duplicateOtherLoadRow(rowIndex);
                }
            }
        }
        setSwipingRow(null);
        setSwipeDirection(null);
    };

    const clearDangerousGoodsRow = (idx) => {
        const newDG = [...dangerousGoods];
        newDG[idx] = {
            stationUnloading: '', airWaybillNumber: '', shippingName: '',
            classOrDivision: '', unIdNumber: '', subRisk: '',
            numberOfPackages: '', netQuantity: '', radioactiveCategory: '-',
            packingGroup: '', caoOrPax: '', erg: '',
            loadedUldId: '', loadedPosition: ''
        };
        setDangerousGoods(newDG);
    };

    const clearOtherLoadRow = (idx) => {
        const newOther = [...otherLoads];
        newOther[idx] = {
            stationUnloading: '', airWaybillNumber: '', contents: '',
            numberOfPackages: '', quantity: '', supplementaryInfo: '',
            codeReverse: '', uldId: '', position: ''
        };
        setOtherLoads(newOther);
    };

    const duplicateDangerousGoodsRow = (idx) => {
        const rowData = dangerousGoods[idx];
        // Find next empty row
        const nextIdx = dangerousGoods.findIndex((r, i) => i > idx && !r.shippingName);
        if (nextIdx !== -1) {
            const newDG = [...dangerousGoods];
            newDG[nextIdx] = { ...rowData };
            setDangerousGoods(newDG);
        }
    };

    const duplicateOtherLoadRow = (idx) => {
        const rowData = otherLoads[idx];
        const nextIdx = otherLoads.findIndex((r, i) => i > idx && !r.contents);
        if (nextIdx !== -1) {
            const newOther = [...otherLoads];
            newOther[nextIdx] = { ...rowData };
            setOtherLoads(newOther);
        }
    };


    const getTodayFormatted = () => {
        const d = new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const today = getTodayFormatted();

    const initialGeneralInfo = {
        loadingStation: '',
        flightNumber: '',
        date: today,
        registration: '',
        preparedBy: '',
        evidenceText: 'THERE IS NO EVIDENCE THAT ANY DAMAGED OR LEAKING PACKAGES CONTAINING DANGEROUS GOODS HAVE BEEN LOADED ON THE AIRCRAFT.',
        otherInfo: '',
        distributionText: "DISTRIBUTION: (1) AIRCRAFT CAPTAIN (ORIGINAL) (2) LOAD SHEET SHIP'S SATCHEL (1ST COPY) (3) STATION FILE (2ND COPY)",
        revCode: 'REV 4.0',
        docCode: 'QE/GOPS/01',
        footerDate: '24 APR 2024'
    };

    const [generalInfo, setGeneralInfo] = useState(initialGeneralInfo);

    const datePickerRef = useRef(null);
    const supervisorSigRef = useRef(null);
    const captainSigRef = useRef(null);

    const handleClearAll = () => {
        if (window.confirm("This action will clear all details. Do you want to proceed?")) {
            setGeneralInfo(initialGeneralInfo);
            setDangerousGoods(initialDG);
            setOtherLoads(initialOther);
            supervisorSigRef.current?.clear();
            captainSigRef.current?.clear();
        }
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const formatPickerDate = (displayDate) => {
        if (!displayDate) return '';
        const parts = displayDate.split(' ');
        if (parts.length !== 3) return '';
        const day = parts[0];
        const monthStr = parts[1].toUpperCase();
        const year = parts[2];
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = String(months.indexOf(monthStr) + 1).padStart(2, '0');
        if (month === '00') return '';
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (isoDate) => {
        if (!isoDate) return;
        const formatted = formatDisplayDate(isoDate);
        setGeneralInfo(prev => ({ ...prev, date: formatted, footerDate: formatted }));
    };

    const initialDG = Array(5).fill(null).map(() => ({
        unloadingStation: '',
        awbNumber: '',
        shippingName: '',
        classDiv: '',
        unNumber: '',
        subRisk: '',
        pkgCount: '',
        netQty: '',
        radioCat: '-',
        pkgGroup: '',
        code: '',
        cao: '',
        ergCode: '',
        uldId: '',
        cptPos: '',
        selectedIdx: ''
    }));

    const [dangerousGoods, setDangerousGoods] = useState(initialDG);

    const initialOther = Array(4).fill(null).map(() => ({
        unloadingStation: '',
        awbNumber: '',
        description: '',
        pkgCount: '',
        quantity: '',
        suppInfo: '',
        code: '',
        uldId: '',
        cptPos: ''
    }));

    const [otherLoads, setOtherLoads] = useState(initialOther);

    const handleDGSelect = (rowIndex, selectedIdx) => {
        if (!selectedIdx) {
            const resetRow = {
                ...dangerousGoods[rowIndex],
                shippingName: '',
                classDiv: '',
                unNumber: '',
                subRisk: '',
                pkgGroup: '',
                ergCode: '',
                selectedIdx: ''
            };
            const newDG = [...dangerousGoods];
            newDG[rowIndex] = resetRow;
            setDangerousGoods(newDG);
            return;
        }

        const item = dangerousGoodsList.find(i => i.index === parseInt(selectedIdx));
        if (item) {
            const newDG = [...dangerousGoods];
            newDG[rowIndex] = {
                ...newDG[rowIndex],
                shippingName: item.properShippingName.toUpperCase(),
                classDiv: item.classOrDiv.split('/')[0], // Take first part if needed, or keep as is
                unNumber: item.unNumber,
                subRisk: item.subRisk,
                pkgGroup: item.unPkgGroup,
                code: item.dgrCode, // Autofill DGR Code
                ergCode: item.ergCode,
                selectedIdx: selectedIdx
            };
            setDangerousGoods(newDG);
        }
    };

    const updateDGField = (rowIndex, field, value) => {
        const newDG = [...dangerousGoods];
        // Exception: Last row (index 4) does NOT auto-capitalize
        const finalValue = rowIndex === 4 ? value : value.toUpperCase();
        newDG[rowIndex][field] = finalValue;
        setDangerousGoods(newDG);
    };

    const updateOtherField = (rowIndex, field, value) => {
        const newOther = [...otherLoads];
        newOther[rowIndex][field] = value.toUpperCase();
        setOtherLoads(newOther);
    };

    const downloadPDF = async () => {
        setIsGenerating(true);

        // Create a clone of the element to modify for PDF generation without affecting UI
        const originalElement = document.getElementById('printable-form');
        const element = originalElement.cloneNode(true);

        // Setup hidden container for the clone
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-10000px';
        container.style.left = '-10000px';
        container.style.width = '2900px'; // Maximum width for full horizontal coverage
        container.style.margin = '0';
        container.style.padding = '0';
        container.appendChild(element);
        document.body.appendChild(container);

        // Force edge-to-edge look in clone
        element.style.width = '2900px';
        element.style.margin = '0';
        element.style.padding = '0';
        element.style.border = 'none';

        // 6. Balanced Spacing for PDF (Wider, less tall)
        const allCells = element.querySelectorAll('.input-elem, .grid-cell, .shipping-name-display');
        allCells.forEach(cell => {
            cell.style.paddingTop = '12px'; // Increased padding
            cell.style.paddingBottom = '12px';
            cell.style.background = 'transparent';
            cell.style.backgroundColor = 'transparent';

            // INCREASE FONT SIZE FOR LEGIBILITY
            cell.style.fontSize = '28px'; // Significantly larger for shipping name data
            cell.style.fontWeight = 'bold';
            cell.style.color = '#000';

            // Ensure child elements also inherit or set font size
            const children = cell.querySelectorAll('*');
            children.forEach(child => {
                child.style.fontSize = '24px';
                child.style.fontWeight = 'bold';
            });
        });

        // Re-balance Label font size (Top section labels and signature headers)
        const labels = element.querySelectorAll('label, .footer-label-normal, .footer-label-bold');
        labels.forEach(lb => {
            lb.style.fontSize = '18px'; // Restored stable labels
            lb.style.fontWeight = 'bold';
            lb.style.color = '#333';
            lb.style.display = 'block';
            lb.style.marginBottom = '2px';
        });

        // Enlarge Logo for PDF
        const logo = element.querySelector('.logo-area img');
        if (logo) {
            logo.style.height = '150px'; // Professional logo size
            logo.style.width = 'auto';
        }
        const originalCanvases = originalElement.querySelectorAll('canvas');
        const clonedCanvases = element.querySelectorAll('canvas');

        originalCanvases.forEach((origCanvas, index) => {
            if (clonedCanvases[index]) {
                const img = document.createElement('img');
                img.src = origCanvas.toDataURL(); // Capture current signature state
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.display = 'block';
                // Replace empty canvas with image in clone
                clonedCanvases[index].parentNode.replaceChild(img, clonedCanvases[index]);
            }
        });

        // 2. Transform INPUTs to DIVs (Text Visibility Fix)
        const inputs = element.querySelectorAll('input');
        inputs.forEach(input => {
            // DETECT if it's the main date picker
            if (input.type === 'date' && input.parentElement && input.parentElement.style.position === 'relative') {
                // Find and remove the existing display-only date div to prevent overlap in PDF
                const existingDisplay = input.parentElement.querySelector('div');
                if (existingDisplay) existingDisplay.remove();

                const div = document.createElement('div');
                div.textContent = generalInfo.date;
                div.className = input.className;

                // Styles for PDF
                div.style.border = 'none';
                div.style.background = 'transparent';
                div.style.fontFamily = 'Arial, sans-serif';
                div.style.fontSize = '24px'; // Consistent large size
                div.style.textAlign = 'center';
                div.style.width = '100%';
                div.style.padding = '12px 0';
                div.style.fontWeight = 'bold';
                div.style.display = 'block';

                if (input.parentNode) {
                    input.parentNode.replaceChild(div, input);
                }
                return;
            }

            // SKIP hidden helper inputs or standard date inputs
            if (input.type === 'date' || input.style.opacity === '0' || input.style.opacity === '0.01' || input.style.zIndex === '1') {
                input.remove();
                return;
            }

            const div = document.createElement('div');
            const val = input.value || '';

            // No longer need the in-loop footer metadata logic as it's handled robustly post-loop
            div.textContent = val;

            div.className = input.className;

            // Apply absolute visibility styles
            div.style.border = 'none';
            div.style.background = 'transparent';
            div.style.backgroundColor = 'transparent';
            div.style.fontFamily = 'Arial, sans-serif';

            // Check if it's in the "Other Special Load" section or footer metadata
            const isOtherSpecial = input.closest('.other-special-section') || input.closest('.bottom-meta-row');
            div.style.fontSize = '24px'; // Uniform large font for all data

            div.style.textAlign = input.style.textAlign || 'center';
            div.style.width = '100%';
            div.style.padding = '10px 0';
            div.style.fontWeight = 'bold';
            div.style.whiteSpace = 'nowrap';
            div.style.overflow = 'visible';
            div.style.display = 'block';

            if (input.parentNode) {
                input.parentNode.replaceChild(div, input);
            }
        });

        // 3. Robust Footer Metadata override (post-input loop)
        const footerRow = element.querySelector('.bottom-meta-row');
        if (footerRow) {
            footerRow.style.display = 'grid';
            footerRow.style.gridTemplateColumns = '1fr 1fr 1fr';
            footerRow.style.width = '100%';
            footerRow.style.alignItems = 'center';

            const footerCells = Array.from(footerRow.children);
            if (footerCells[0]) {
                footerCells[0].innerHTML = '<div style="font-size:18px; font-weight:bold; text-align:left;">REV 4.0</div>';
            }
            if (footerCells[1]) {
                footerCells[1].innerHTML = '<div style="font-size:18px; font-weight:bold; text-align:center;">QE/GOPS/01</div>';
            }
            if (footerCells[2]) {
                footerCells[2].innerHTML = '<div style="font-size:18px; font-weight:bold; text-align:right;">24 APR 2024</div>';
            }
        }

        // 3. Transform TEXTAREAs to DIVs
        const textareas = element.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            const div = document.createElement('div');
            div.textContent = textarea.value;
            div.style.whiteSpace = 'pre-wrap';
            div.style.overflowWrap = 'break-word';
            div.style.wordBreak = 'break-word';
            div.className = textarea.className;
            div.style.border = 'none';
            div.style.background = 'transparent';
            div.style.backgroundColor = 'transparent';
            div.style.fontFamily = 'Arial, sans-serif';
            div.style.fontSize = '24px'; // Better textarea font
            div.style.width = '100%';
            div.style.height = 'auto';
            div.style.overflow = 'visible';

            if (textarea.parentNode) {
                textarea.parentNode.replaceChild(div, textarea);
            }
        });

        // Specific targeting for table column headers (The "small fields" like Station of Unloading)
        const tableHeaders = element.querySelectorAll('th');
        tableHeaders.forEach(th => {
            th.style.fontSize = '22px'; // Restored header size
            th.style.padding = '10px 4px';
            th.style.fontWeight = 'bold';
            th.style.textAlign = 'center';
            th.style.verticalAlign = 'middle';
        });

        const sectionHeaders = element.querySelectorAll('.section-header-row');
        sectionHeaders.forEach(header => {
            header.style.marginTop = '60px'; // Increased to prevent clash with rows above
            header.style.marginBottom = '10px';
            header.style.fontSize = '26px';
            header.style.fontWeight = 'bold';
            header.style.position = 'relative';
            header.style.display = 'block';
            header.style.clear = 'both'; // Force clear any floats
        });

        const dgBar = element.querySelector('.dg-bar-cell');
        if (dgBar) {
            dgBar.style.fontSize = '28px';
            dgBar.style.fontWeight = 'bold';
        }

        // Specific fix for Distribution line text size
        const distArea = element.querySelector('.dist-line-area textarea, .dist-line-area div');
        if (distArea) {
            const distDiv = document.createElement('div');
            distDiv.textContent = distArea.tagName === 'TEXTAREA' ? distArea.value : distArea.textContent;
            distDiv.style.fontSize = '18px'; // Restored distribution size
            distDiv.style.textAlign = 'center';
            distDiv.style.width = '100%';
            distDiv.style.fontWeight = 'bold';
            distDiv.style.overflowWrap = 'break-word';
            distDiv.style.wordBreak = 'break-word';
            distArea.parentNode.replaceChild(distDiv, distArea);
        }

        // Increase Signature area
        const sigBoxes = element.querySelectorAll('.signature-box, .footer-sig-pad-box, .evidence-box, .supervisor-sig-box');
        sigBoxes.forEach(box => {
            box.style.background = 'transparent';
            box.style.backgroundColor = 'transparent';
            if (box.classList.contains('signature-box')) {
                box.style.minHeight = '620px'; // Increased vertical height for more page fill
            }
        });

        // Ensure bottom-meta-row fits perfectly
        if (footerRow) {
            footerRow.style.marginTop = '25px';
            footerRow.style.paddingBottom = '15px';
        }

        // Targeted Font Increases
        // 1. Sensitivity Internal (A bit bigger)
        const sensitivity = element.querySelector('.header span');
        if (sensitivity && sensitivity.textContent.includes('Sensitivity: Internal')) {
            sensitivity.style.fontSize = '20px'; // "not much just a little"
        }

        // 2. Main Title (Specifically "SPECIAL LOAD - NOTIFICATION TO CAPTAIN")
        const mainTitle = element.querySelector('.title-text');
        if (mainTitle) {
            mainTitle.style.fontSize = '36px'; // Bigger title
        }

        // 3. Signature and Other Info labels
        const footerLabels = element.querySelectorAll('.footer-label-normal');
        footerLabels.forEach(label => {
            if (label.textContent.includes('Captains Signature') || label.textContent.includes('Other Information')) {
                label.style.fontSize = '28px';
            }
        });

        // Restore white background to main container
        element.style.setProperty('background', '#ffffff', 'important');
        element.style.setProperty('background-color', '#ffffff', 'important');

        // 5. Cleanup visibility
        const noPrint = element.querySelectorAll('.no-print');
        noPrint.forEach(el => el.style.display = 'none');

        const printOnly = element.querySelectorAll('.print-only');
        printOnly.forEach(el => el.style.display = 'block');

        // Capture with Error Handling
        try {
            const canvas = await html2canvas(element, {
                scale: 1.8, // High-quality capture
                useCORS: true,
                logging: true,
                backgroundColor: '#ffffff',
                windowWidth: 2900, // Matching container width
                height: element.scrollHeight + 500, // Large buffer to ensure footer is captured
                y: 0,
                x: 0,
                onclone: (clonedDoc) => {
                    const clonedEl = clonedDoc.getElementById(element.id);
                    if (clonedEl) {
                        clonedEl.style.height = 'auto';
                        clonedEl.style.overflow = 'visible';
                    }
                }
            });

            // Cleanup
            document.body.removeChild(container);

            if (!canvas) throw new Error("Canvas capture failed");

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // FULL PAGE FILL with small margins to avoid corner clashing
            const marginH = 5; // 5mm horizontal margins
            const availableWidth = pdfWidth - (marginH * 2);
            const availableHeight = pdfHeight;

            const ratio = Math.min(availableWidth / canvasWidth, availableHeight / canvasHeight);

            const finalWidth = canvasWidth * ratio;
            const finalHeight = canvasHeight * ratio;

            // TRUE CENTERING: Equal space top and bottom, equal space left and right
            const xPos = (pdfWidth - finalWidth) / 2;
            const yPos = (pdfHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'JPEG', xPos, yPos, finalWidth, finalHeight);
            pdf.save(`Special_Load_Notification_${generalInfo.flightNumber || 'Form'}.pdf`);

            // Show success animation
            setIsGenerating(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            setIsGenerating(false);
            alert("Failed to generate PDF. Please check the console for details.");
            if (container.parentNode) document.body.removeChild(container);
        }
    };

    return (
        <div className="ipad-container" id="printable-form">
            <div className="sensitivity-header">
                <button className="btn-clear no-print" onClick={handleClearAll}>Clear All</button>
                <span>Sensitivity: Internal</span>
            </div>

            <div className="header-outline">
                <div className="title-row">
                    <div className="logo-area">
                        <img src="./logo.png" alt="Qatar Executive Logo" />
                    </div>
                    <div className="title-text">SPECIAL LOAD - NOTIFICATION TO CAPTAIN</div>
                </div>

                <div className="info-grid-container">
                    <div className="grid-cell">
                        <label>Station of Loading</label>
                        <input value={generalInfo.loadingStation} onChange={e => setGeneralInfo({ ...generalInfo, loadingStation: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="grid-cell">
                        <label>Flight Number</label>
                        <input value={generalInfo.flightNumber} onChange={e => setGeneralInfo({ ...generalInfo, flightNumber: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="grid-cell">
                        <label>Date</label>
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            {/* Layer 1: Formatted Display (DD MMM YYYY) */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '17px',
                                background: 'transparent',
                                zIndex: 1,
                                fontWeight: 'normal',
                                pointerEvents: 'none',
                                textTransform: 'uppercase'
                            }}>
                                {generalInfo.date}
                            </div>
                            {/* Layer 2: Transparent Native Input on Top */}
                            <input
                                type="date"
                                value={formatPickerDate(generalInfo.date)}
                                onChange={(e) => handleDateChange(e.target.value)}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0.01, // Clickable but almost invisible
                                    zIndex: 2,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>
                    <div className="grid-cell">
                        <label>Aircraft Registration</label>
                        <input value={generalInfo.registration} onChange={e => setGeneralInfo({ ...generalInfo, registration: e.target.value.toUpperCase() })} />
                    </div>

                    <div className="prepared-by-cell">
                        <div className="prepared-by-header">
                            <label>Prepared By</label>
                            <input
                                className="prepared-by-input"
                                value={generalInfo.preparedBy}
                                onChange={e => setGeneralInfo({ ...generalInfo, preparedBy: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    <div className="dg-bar-cell">DANGEROUS GOODS</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowSpan="2" style={{ width: '6%' }}>Station of Unloading</th>
                        <th rowSpan="2" style={{ width: '8%' }}>Air Way bill Number</th>
                        <th rowSpan="2" style={{ width: '22%' }}>Proper Shipping Name</th>
                        <th rowSpan="2" style={{ width: '6%' }}>Class or Division For Class 1 Compt. Grp</th>
                        <th rowSpan="2" style={{ width: '6%' }}>UN or ID Number</th>
                        <th rowSpan="2" style={{ width: '4%' }}>Sub Risk</th>
                        <th rowSpan="2" style={{ width: '5%' }}>Number of Packages</th>
                        <th rowSpan="2" style={{ width: '7%' }}>Net Quantity or Transp. Ind per package</th>
                        <th rowSpan="2" style={{ width: '6%' }}>Radioactive Material Category</th>
                        <th rowSpan="2" style={{ width: '4%' }}>Packing Group</th>
                        <th rowSpan="2" style={{ width: '5%' }}>Code (see reverse)</th>
                        <th rowSpan="2" style={{ width: '4%' }}>CAO (x)</th>
                        <th rowSpan="2" style={{ width: '5%' }}>ERG CODE</th>
                        <th colSpan="2" style={{ width: '12%' }}>Loaded</th>
                    </tr>
                    <tr>
                        <th style={{ width: '6%' }}>ULD ID</th>
                        <th style={{ width: '6%' }}>CPT/POS</th>
                    </tr>
                </thead>
                <tbody>
                    {dangerousGoods.map((row, idx) => (
                        <tr
                            key={`dg-${idx}`}
                            className={`swipe-row ${swipingRow?.index === idx && swipingRow?.type === 'dg' ? `swiping-${swipeDirection}` : ''}`}
                            onTouchStart={handleRowTouchStart}
                            onTouchMove={(e) => handleRowTouchMove(e, idx, 'dg')}
                            onTouchEnd={() => handleRowTouchEnd(idx, 'dg')}
                        >
                            {/* Swipe Indicators */}
                            {swipingRow?.index === idx && swipingRow?.type === 'dg' && swipeDirection === 'left' && (
                                <div className="swipe-indicator left">CLEAR 🗑️</div>
                            )}
                            {swipingRow?.index === idx && swipingRow?.type === 'dg' && swipeDirection === 'right' && (
                                <div className="swipe-indicator right">DUPLICATE 📋</div>
                            )}

                            <td>
                                <input
                                    className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                    value={row.unloadingStation}
                                    onChange={e => updateDGField(idx, 'unloadingStation', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.unloadingStation, idx, 'dg', 'unloadingStation')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                    value={row.awbNumber}
                                    onChange={e => updateDGField(idx, 'awbNumber', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.awbNumber, idx, 'dg', 'awbNumber')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td style={{ textAlign: 'left', padding: '4px' }}>
                                {idx < 4 ? (
                                    <div style={{ position: 'relative', width: '100%', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
                                        {/* Layer 1: Display with Wrapping */}
                                        <div
                                            className="shipping-name-display haptic-touch"
                                            onTouchStart={(e) => handleTouchStart(e, row.shippingName, idx, 'dg', 'shippingName')}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            {row.shippingName || ""}
                                        </div>
                                        {/* Layer 2: Transparent Select on Top */}
                                        <select
                                            className="select-elem no-print"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                zIndex: 2,
                                                cursor: 'pointer'
                                            }}
                                            value={row.selectedIdx}
                                            onChange={e => handleDGSelect(idx, e.target.value)}
                                        >
                                            <option value="">-- Select --</option>
                                            {dangerousGoodsList.map(item => (
                                                <option key={item.index} value={item.index}>{item.properShippingName.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <input
                                        className="input-elem haptic-touch no-caps"
                                        style={{ textAlign: 'left', paddingLeft: '2px' }}
                                        value={row.shippingName}
                                        onChange={e => updateDGField(idx, 'shippingName', e.target.value)}
                                        onTouchStart={(e) => handleTouchStart(e, row.shippingName, idx, 'dg', 'shippingName')}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                )}
                            </td>
                            <td>
                                {idx < 4 ? (
                                    <div className="input-elem no-highlight">{row.classDiv}</div>
                                ) : (
                                    <input
                                        className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                        value={row.classDiv}
                                        onChange={e => updateDGField(idx, 'classDiv', e.target.value)}
                                        onTouchStart={(e) => handleTouchStart(e, row.classDiv, idx, 'dg', 'classDiv')}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                )}
                            </td>
                            <td>
                                {idx < 4 ? (
                                    <div className="input-elem no-highlight">{row.unNumber}</div>
                                ) : (
                                    <input
                                        className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                        value={row.unNumber}
                                        onChange={e => updateDGField(idx, 'unNumber', e.target.value)}
                                        onTouchStart={(e) => handleTouchStart(e, row.unNumber, idx, 'dg', 'unNumber')}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                )}
                            </td>
                            <td>
                                {idx < 4 ? (
                                    <div className="input-elem no-highlight">{row.subRisk}</div>
                                ) : (
                                    <input
                                        className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                        value={row.subRisk}
                                        onChange={e => updateDGField(idx, 'subRisk', e.target.value)}
                                        onTouchStart={(e) => handleTouchStart(e, row.subRisk, idx, 'dg', 'subRisk')}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                )}
                            </td>
                            <td>
                                <input
                                    className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                    value={row.pkgCount}
                                    onChange={e => updateDGField(idx, 'pkgCount', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.pkgCount, idx, 'dg', 'pkgCount')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                    value={row.netQty}
                                    onChange={e => updateDGField(idx, 'netQty', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.netQty, idx, 'dg', 'netQty')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td><input className="input-elem" value="-" readOnly /></td>
                            <td>
                                {idx < 4 ? (
                                    <div className="input-elem no-highlight">{row.pkgGroup}</div>
                                ) : (
                                    <input
                                        className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                        value={row.pkgGroup}
                                        onChange={e => updateDGField(idx, 'pkgGroup', e.target.value)}
                                        onTouchStart={(e) => handleTouchStart(e, row.pkgGroup, idx, 'dg', 'pkgGroup')}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                )}
                            </td>
                            <td>
                                {idx < 4 ? (
                                    <div className="input-elem no-highlight">{row.code}</div>
                                ) : (
                                    <input
                                        className="input-elem haptic-touch no-caps"
                                        value={row.code}
                                        onChange={e => updateDGField(idx, 'code', e.target.value)}
                                        onTouchStart={(e) => handleTouchStart(e, row.code, idx, 'dg', 'code')}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                )}
                            </td>
                            <td>
                                <input
                                    className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                    value={row.cao}
                                    onChange={e => updateDGField(idx, 'cao', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.cao, idx, 'dg', 'cao')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                {idx < 4 ? (
                                    <div className="input-elem no-highlight">{row.ergCode}</div>
                                ) : (
                                    <input
                                        className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                        value={row.ergCode}
                                        onChange={e => updateDGField(idx, 'ergCode', e.target.value)}
                                        onTouchStart={(e) => handleTouchStart(e, row.ergCode, idx, 'dg', 'ergCode')}
                                        onTouchEnd={handleTouchEnd}
                                    />
                                )}
                            </td>
                            <td>
                                <input
                                    className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                    value={row.uldId}
                                    onChange={e => updateDGField(idx, 'uldId', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.uldId, idx, 'dg', 'uldId')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className={`input-elem haptic-touch ${idx === 4 ? 'no-caps' : ''}`}
                                    value={row.cptPos}
                                    onChange={e => updateDGField(idx, 'cptPos', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.cptPos, idx, 'dg', 'cptPos')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="section-header-row">OTHER SPECIAL LOAD</div>

            <table>
                <thead>
                    <tr>
                        <th rowSpan="2" style={{ width: '8%' }}>Station of Unloading</th>
                        <th rowSpan="2" style={{ width: '10%' }}>Air Way Bill Number</th>
                        <th rowSpan="2" style={{ width: '28%' }}>Contents and Description</th>
                        <th rowSpan="2" style={{ width: '8%' }}>Number of Packages</th>
                        <th rowSpan="2" style={{ width: '8%' }}>Quantity</th>
                        <th rowSpan="2" style={{ width: '16%' }}>Supplementary Information</th>
                        <th rowSpan="2" style={{ width: '8%' }}>Code (See Reverse)</th>
                        <th colSpan="2" style={{ width: '14%' }}>Loaded</th>
                    </tr>
                    <tr>
                        <th style={{ width: '7%' }}>ULD ID</th>
                        <th style={{ width: '7%' }}>CPT/POS</th>
                    </tr>
                </thead>
                <tbody>
                    {otherLoads.map((row, idx) => (
                        <tr
                            key={`other-${idx}`}
                            className={`swipe-row ${swipingRow?.index === idx && swipingRow?.type === 'other' ? `swiping-${swipeDirection}` : ''}`}
                            onTouchStart={handleRowTouchStart}
                            onTouchMove={(e) => handleRowTouchMove(e, idx, 'other')}
                            onTouchEnd={() => handleRowTouchEnd(idx, 'other')}
                        >
                            {/* Swipe Indicators */}
                            {swipingRow?.index === idx && swipingRow?.type === 'other' && swipeDirection === 'left' && (
                                <div className="swipe-indicator left">CLEAR 🗑️</div>
                            )}
                            {swipingRow?.index === idx && swipingRow?.type === 'other' && swipeDirection === 'right' && (
                                <div className="swipe-indicator right">DUPLICATE 📋</div>
                            )}

                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.unloadingStation}
                                    onChange={e => updateOtherField(idx, 'unloadingStation', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.unloadingStation, idx, 'other', 'unloadingStation')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.awbNumber}
                                    onChange={e => updateOtherField(idx, 'awbNumber', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.awbNumber, idx, 'other', 'awbNumber')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.description}
                                    onChange={e => updateOtherField(idx, 'description', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.description, idx, 'other', 'description')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.pkgCount}
                                    onChange={e => updateOtherField(idx, 'pkgCount', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.pkgCount, idx, 'other', 'pkgCount')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.quantity}
                                    onChange={e => updateOtherField(idx, 'quantity', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.quantity, idx, 'other', 'quantity')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.suppInfo}
                                    onChange={e => updateOtherField(idx, 'suppInfo', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.suppInfo, idx, 'other', 'suppInfo')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.code}
                                    onChange={e => updateOtherField(idx, 'code', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.code, idx, 'other', 'code')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.uldId}
                                    onChange={e => updateOtherField(idx, 'uldId', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.uldId, idx, 'other', 'uldId')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                            <td>
                                <input
                                    className="input-elem haptic-touch"
                                    value={row.cptPos}
                                    onChange={e => updateOtherField(idx, 'cptPos', e.target.value)}
                                    onTouchStart={(e) => handleTouchStart(e, row.cptPos, idx, 'other', 'cptPos')}
                                    onTouchEnd={handleTouchEnd}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="footer-mega-grid">
                <div className="footer-col vertical-split">
                    <div className="evidence-box">
                        <textarea
                            className="evidence-ta"
                            value={generalInfo.evidenceText}
                            onChange={e => setGeneralInfo({ ...generalInfo, evidenceText: e.target.value.toUpperCase() })}
                        />
                    </div>
                    <div className="supervisor-sig-box">
                        <div className="footer-label-bold">
                            LOADING SUPERVISOR'S SIGNATURE
                        </div>
                        <div className="footer-sig-pad-box">
                            <SignaturePad ref={supervisorSigRef} />
                        </div>
                    </div>
                </div>
                <div className="footer-col center-sig">
                    <div className="footer-label-normal">Captains Signature:</div>
                    <div className="footer-sig-pad-box">
                        <SignaturePad ref={captainSigRef} />
                    </div>
                </div>
                <div className="footer-col right-info">
                    <div className="footer-label-normal">Other Information</div>
                    <textarea
                        className="other-info-ta"
                        value={generalInfo.otherInfo}
                        onChange={e => setGeneralInfo({ ...generalInfo, otherInfo: e.target.value.toUpperCase() })}
                    />
                </div>
            </div>

            <div className="dist-line-area">
                <textarea
                    rows="1"
                    style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11px', background: '#fff', overflow: 'hidden' }}
                    value={generalInfo.distributionText}
                    onChange={e => setGeneralInfo({ ...generalInfo, distributionText: e.target.value.toUpperCase() })}
                />
            </div>

            <div className="bottom-meta-row">
                <div>
                    <input value={generalInfo.revCode} readOnly />
                </div>
                <div>
                    <input value={generalInfo.docCode} readOnly />
                </div>
                <div>
                    <input value={generalInfo.footerDate} readOnly />
                </div>
            </div>

            <div className="actions-panel no-print">
                <button className="btn-generate" onClick={downloadPDF} disabled={isGenerating}>
                    <Download size={18} />
                    {isGenerating ? 'Generating...' : 'Download PDF'}
                </button>
            </div>

            {/* Loading Overlay */}
            {isGenerating && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Generating PDF...</div>
                </div>
            )}

            {/* Success Animation */}
            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-checkmark">
                        <svg viewBox="0 0 24 24">
                            <polyline points="4 12 9 17 20 6" />
                        </svg>
                    </div>
                    <div className="success-text">PDF Downloaded Successfully!</div>
                </div>
            )}
            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onCopy={handleContextMenuCopy}
                    onPaste={handleContextMenuPaste}
                    onClear={handleContextMenuClear}
                />
            )}
        </div>
    );
};

export default MainForm;
