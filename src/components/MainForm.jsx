import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { dangerousGoodsList } from '../data/dangerousGoodsData';
import SignaturePad from './SignaturePad';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MainForm = () => {
    const [generalInfo, setGeneralInfo] = useState({
        loadingStation: '',
        flightNumber: '',
        date: '24 APR 2024',
        registration: '',
        preparedBy: '',
        evidenceText: 'There is no evidence that any damaged or leaking packages containing dangerous goods have been loaded on the aircraft.',
        otherInfo: '',
        distributionText: "Distribution: (1) Aircraft Captain (original) (2) Load sheet Ship's Satchel (1st copy) (3) Station File (2nd Copy)",
        revCode: 'REV 4.0',
        docCode: 'QE/GOPS/01',
        footerDate: '24 APR 2024'
    });

    const [dangerousGoods, setDangerousGoods] = useState(
        Array(5).fill(null).map(() => ({
            unloadingStation: '',
            awbNumber: '',
            shippingName: '',
            classDiv: '',
            unNumber: '',
            subRisk: '',
            pkgCount: '',
            netQty: '',
            radioCat: '',
            pkgGroup: '',
            code: '',
            cao: '',
            ergCode: '',
            uldId: '',
            cptPos: '',
            selectedIdx: ''
        }))
    );

    const [otherLoads, setOtherLoads] = useState(
        Array(4).fill(null).map(() => ({
            unloadingStation: '',
            awbNumber: '',
            description: '',
            pkgCount: '',
            quantity: '',
            suppInfo: '',
            code: '',
            uldId: '',
            cptPos: ''
        }))
    );

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
                shippingName: item.properShippingName,
                classDiv: item.classOrDiv,
                unNumber: item.unNumber,
                subRisk: item.subRisk,
                pkgGroup: item.unPkgGroup,
                ergCode: item.ergCode,
                selectedIdx: selectedIdx
            };
            setDangerousGoods(newDG);
        }
    };

    const updateDGField = (rowIndex, field, value) => {
        const newDG = [...dangerousGoods];
        newDG[rowIndex][field] = value;
        setDangerousGoods(newDG);
    };

    const updateOtherField = (rowIndex, field, value) => {
        const newOther = [...otherLoads];
        newOther[rowIndex][field] = value;
        setOtherLoads(newOther);
    };

    const downloadPDF = async () => {
        // Create a clone of the element to modify for PDF generation without affecting UI
        const originalElement = document.getElementById('printable-form');
        const element = originalElement.cloneNode(true);

        // Setup hidden container for the clone
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-10000px';
        container.style.left = '-10000px';
        container.style.width = '1024px'; // Force valid width
        container.appendChild(element);
        document.body.appendChild(container);

        // 1. Handle Signatures: Convert original canvases to images in the clone
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
            const div = document.createElement('div');
            const val = input.value || '';
            div.textContent = val;
            div.className = input.className;

            // Apply absolute visibility styles
            div.style.border = 'none';
            div.style.background = 'transparent';
            div.style.backgroundColor = 'transparent';
            div.style.fontFamily = 'Arial, sans-serif';
            div.style.fontSize = input.style.fontSize || '11px';
            div.style.textAlign = input.style.textAlign || 'center';
            div.style.width = '100%';
            div.style.padding = '4px 0';
            div.style.fontWeight = 'bold';
            div.style.whiteSpace = 'nowrap';
            div.style.overflow = 'visible';
            div.style.display = 'block';

            if (input.parentNode) {
                input.parentNode.replaceChild(div, input);
            }
        });

        // 3. Transform TEXTAREAs to DIVs
        const textareas = element.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            const div = document.createElement('div');
            div.textContent = textarea.value;
            div.style.whiteSpace = 'pre-wrap';
            div.className = textarea.className;
            div.style.border = 'none';
            div.style.background = 'transparent';
            div.style.backgroundColor = 'transparent';
            div.style.fontFamily = 'Arial, sans-serif';
            div.style.fontSize = '11px';
            div.style.width = '100%';
            div.style.height = 'auto';
            div.style.overflow = 'visible';

            if (textarea.parentNode) {
                textarea.parentNode.replaceChild(div, textarea);
            }
        });

        // 4. Aggressively Remove Highlights from all grid cells and inputs
        // Final sweep for any inline background styles or classes
        const allInClone = element.querySelectorAll('*');
        allInClone.forEach(el => {
            // Force transparency on almost everything
            el.style.setProperty('background', 'transparent', 'important');
            el.style.setProperty('background-color', 'transparent', 'important');
        });

        // Restore white background to main container
        element.style.setProperty('background', '#ffffff', 'important');
        element.style.setProperty('background-color', '#ffffff', 'important');

        // 5. Cleanup visibility
        const noPrint = element.querySelectorAll('.no-print');
        noPrint.forEach(el => el.style.display = 'none');

        const printOnly = element.querySelectorAll('.print-only');
        printOnly.forEach(el => el.style.display = 'block');

        // Capture
        const canvas = await html2canvas(element, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1024,
            height: element.scrollHeight + 50,
            y: 0,
            x: 0
        });

        // Cleanup
        document.body.removeChild(container);

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);

        const finalWidth = canvasWidth * ratio;
        const finalHeight = canvasHeight * ratio;

        pdf.addImage(imgData, 'JPEG', (pdfWidth - finalWidth) / 2, 5, finalWidth, finalHeight - 5);
        pdf.save(`Special_Load_Notification_${generalInfo.flightNumber || 'Form'}.pdf`);
    };

    return (
        <div className="ipad-container" id="printable-form">
            <div className="sensitivity-header">Sensitivity: Internal</div>

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
                        <input value={generalInfo.loadingStation} onChange={e => setGeneralInfo({ ...generalInfo, loadingStation: e.target.value })} />
                    </div>
                    <div className="grid-cell">
                        <label>Flight Number</label>
                        <input value={generalInfo.flightNumber} onChange={e => setGeneralInfo({ ...generalInfo, flightNumber: e.target.value })} />
                    </div>
                    <div className="grid-cell">
                        <label>Date</label>
                        <input value={generalInfo.date} onChange={e => setGeneralInfo({ ...generalInfo, date: e.target.value })} />
                    </div>
                    <div className="grid-cell">
                        <label>Aircraft Registration</label>
                        <input value={generalInfo.registration} onChange={e => setGeneralInfo({ ...generalInfo, registration: e.target.value })} />
                    </div>

                    <div className="prepared-by-cell">
                        <div className="prepared-by-header">
                            <label>Prepared By</label>
                            <input
                                className="prepared-by-input"
                                value={generalInfo.preparedBy}
                                onChange={e => setGeneralInfo({ ...generalInfo, preparedBy: e.target.value })}
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
                        <tr key={`dg-${idx}`}>
                            <td><input className="input-elem" value={row.unloadingStation} onChange={e => updateDGField(idx, 'unloadingStation', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.awbNumber} onChange={e => updateDGField(idx, 'awbNumber', e.target.value)} /></td>
                            <td style={{ textAlign: 'left' }}>
                                {idx < 4 ? (
                                    <>
                                        <select
                                            className="select-elem no-print"
                                            value={row.selectedIdx}
                                            onChange={e => handleDGSelect(idx, e.target.value)}
                                        >
                                            <option value="">-- Select --</option>
                                            {dangerousGoodsList.map(item => (
                                                <option key={item.index} value={item.index}>{item.properShippingName}</option>
                                            ))}
                                        </select>
                                        <div className="row-autofill-info print-only">{row.shippingName}</div>
                                    </>
                                ) : (
                                    <input
                                        className="input-elem"
                                        style={{ textAlign: 'left', paddingLeft: '2px' }}
                                        value={row.shippingName}
                                        onChange={e => updateDGField(idx, 'shippingName', e.target.value)}
                                    />
                                )}
                            </td>
                            <td>
                                {idx < 4 ? row.classDiv : <input className="input-elem" value={row.classDiv} onChange={e => updateDGField(idx, 'classDiv', e.target.value)} />}
                            </td>
                            <td>
                                {idx < 4 ? row.unNumber : <input className="input-elem" value={row.unNumber} onChange={e => updateDGField(idx, 'unNumber', e.target.value)} />}
                            </td>
                            <td>
                                {idx < 4 ? row.subRisk : <input className="input-elem" value={row.subRisk} onChange={e => updateDGField(idx, 'subRisk', e.target.value)} />}
                            </td>
                            <td><input className="input-elem" value={row.pkgCount} onChange={e => updateDGField(idx, 'pkgCount', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.netQty} onChange={e => updateDGField(idx, 'netQty', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.radioCat} onChange={e => updateDGField(idx, 'radioCat', e.target.value)} /></td>
                            <td>
                                {idx < 4 ? row.pkgGroup : <input className="input-elem" value={row.pkgGroup} onChange={e => updateDGField(idx, 'pkgGroup', e.target.value)} />}
                            </td>
                            <td><input className="input-elem" value={row.code} onChange={e => updateDGField(idx, 'code', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.cao} onChange={e => updateDGField(idx, 'cao', e.target.value)} /></td>
                            <td>
                                {idx < 4 ? row.ergCode : <input className="input-elem" value={row.ergCode} onChange={e => updateDGField(idx, 'ergCode', e.target.value)} />}
                            </td>
                            <td><input className="input-elem" value={row.uldId} onChange={e => updateDGField(idx, 'uldId', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.cptPos} onChange={e => updateDGField(idx, 'cptPos', e.target.value)} /></td>
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
                        <tr key={`other-${idx}`}>
                            <td><input className="input-elem" value={row.unloadingStation} onChange={e => updateOtherField(idx, 'unloadingStation', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.awbNumber} onChange={e => updateOtherField(idx, 'awbNumber', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.description} onChange={e => updateOtherField(idx, 'description', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.pkgCount} onChange={e => updateOtherField(idx, 'pkgCount', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.quantity} onChange={e => updateOtherField(idx, 'quantity', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.suppInfo} onChange={e => updateOtherField(idx, 'suppInfo', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.code} onChange={e => updateOtherField(idx, 'code', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.uldId} onChange={e => updateOtherField(idx, 'uldId', e.target.value)} /></td>
                            <td><input className="input-elem" value={row.cptPos} onChange={e => updateOtherField(idx, 'cptPos', e.target.value)} /></td>
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
                            onChange={e => setGeneralInfo({ ...generalInfo, evidenceText: e.target.value })}
                        />
                    </div>
                    <div className="supervisor-sig-box">
                        <div className="footer-label-bold">
                            LOADING SUPERVISOR'S<br />SIGNATURE
                        </div>
                        <div className="footer-sig-pad-box mini-sig">
                            <SignaturePad />
                        </div>
                    </div>
                </div>
                <div className="footer-col center-sig">
                    <div className="footer-label-normal">Captains Signature:</div>
                    <div className="footer-sig-pad-box">
                        <SignaturePad />
                    </div>
                </div>
                <div className="footer-col right-info">
                    <div className="footer-label-normal">Other Information</div>
                    <textarea
                        className="other-info-ta"
                        value={generalInfo.otherInfo}
                        onChange={e => setGeneralInfo({ ...generalInfo, otherInfo: e.target.value })}
                    />
                </div>
            </div>

            <div className="dist-line-area">
                <textarea
                    rows="1"
                    style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '9px', background: '#fff', overflow: 'hidden' }}
                    value={generalInfo.distributionText}
                    onChange={e => setGeneralInfo({ ...generalInfo, distributionText: e.target.value })}
                />
            </div>

            <div className="bottom-meta-row">
                <div>
                    <input value={generalInfo.revCode} onChange={e => setGeneralInfo({ ...generalInfo, revCode: e.target.value })} />
                </div>
                <div>
                    <input value={generalInfo.docCode} onChange={e => setGeneralInfo({ ...generalInfo, docCode: e.target.value })} />
                </div>
                <div>
                    <input value={generalInfo.footerDate} onChange={e => setGeneralInfo({ ...generalInfo, footerDate: e.target.value })} />
                </div>
            </div>

            <div className="actions-panel no-print">
                <button className="btn-generate" onClick={downloadPDF}>
                    <Download size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    Download PDF
                </button>
            </div>
        </div>
    );
};

export default MainForm;
