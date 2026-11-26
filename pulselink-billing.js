/* =========================================================
   PULSE LINK — PAYMENT CHECKOUT & PDF BILL GENERATOR
========================================================= */
(function () {
    const PULSE_LINK_CONFIG = {
        brandName: "PULSE LINK",
        tagline: "24x7 Emergency Blood & Cold-Chain Delivery Network",
        address: "Pulse Link Medical Hub, Old Gajuwaka Junction, Visakhapatnam, Andhra Pradesh - 530026",
        helpline: "1800-108-7857 / 104",
        email: "pulselinkdonation@gmail.com",
        gstin: "GSTIN: 37AABCP7857M1Z2"
    };

    const PAYMENT_OPTIONS = [
        { id: "PhonePe", label: "📱 PhonePe" },
        { id: "Google Pay (GPay)", label: "💳 GPay" },
        { id: "Paytm", label: "📲 Paytm" },
        { id: "BHIM UPI", label: "🇮🇳 BHIM" },
        { id: "UPI ID", label: "⚡ UPI ID" },
        { id: "Net Banking", label: "🏦 Net Banking" },
        { id: "Credit Card", label: "💳 Credit Card" },
        { id: "Debit Card", label: "💳 Debit Card" }
    ];

    let pendingOrder = null;
    let activeInvoice = null;

    function injectStyles() {
        if (document.getElementById("pl-billing-styles")) return;
        const style = document.createElement("style");
        style.id = "pl-billing-styles";
        style.textContent = `
            .pl-overlay {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 99999;
                background: rgba(5, 8, 15, 0.86);
                backdrop-filter: blur(6px);
                align-items: center;
                justify-content: center;
                padding: 16px;
                overflow-y: auto;
            }
            .pl-overlay.open { display: flex; }
            .pl-modal {
                width: 100%;
                max-width: 740px;
                max-height: 92vh;
                overflow-y: auto;
                background: #121722;
                color: #f8fafc;
                border: 1.5px solid #ff5a67;
                border-radius: 16px;
                padding: 26px;
                position: relative;
                box-shadow: 0 24px 65px rgba(0, 0, 0, 0.72), 0 0 28px rgba(225, 29, 72, 0.28);
                font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
            }
            .pl-close {
                position: absolute;
                top: 14px;
                right: 16px;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,0.25);
                background: rgba(255,255,255,0.08);
                color: #ffffff;
                font-size: 20px;
                cursor: pointer;
            }
            .pl-close:hover { background: rgba(225, 29, 72, 0.45); }
            .pl-title { font-size: 21px; font-weight: 800; color: #ffffff; margin-bottom: 4px; }
            .pl-sub { font-size: 13px; color: #cbd5e1; margin-bottom: 16px; }
            .pl-summary-box {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 90, 103, 0.35);
                border-radius: 12px;
                padding: 14px 16px;
                margin-bottom: 16px;
                font-size: 13px;
                line-height: 1.7;
            }
            .pl-summary-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
            }
            .pl-summary-row.total {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px dashed rgba(255,255,255,0.25);
                font-size: 16.5px;
                font-weight: 800;
                color: #ff8a92;
            }
            .pl-pay-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 9px;
                margin: 10px 0 14px;
            }
            .pl-pay-pill {
                padding: 10px 8px;
                border-radius: 9px;
                border: 1.5px solid rgba(255, 255, 255, 0.24);
                background: rgba(255, 255, 255, 0.05);
                color: #e2e8f0;
                text-align: center;
                font-size: 12.5px;
                font-weight: 700;
                cursor: pointer;
                transition: 0.2s;
            }
            .pl-pay-pill.active, .pl-pay-pill:hover {
                border-color: #ff5a67;
                background: rgba(225, 29, 72, 0.28);
                color: #ffffff;
                box-shadow: 0 0 14px rgba(225, 29, 72, 0.35);
            }
            .pl-input {
                width: 100%;
                padding: 11px 13px;
                border-radius: 9px;
                border: 1px solid rgba(255,255,255,0.32);
                background: rgba(255,255,255,0.08);
                color: #ffffff;
                font-family: inherit;
                font-size: 13.5px;
                margin-bottom: 14px;
                outline: none;
            }
            .pl-btn-primary {
                width: 100%;
                padding: 13px 18px;
                border-radius: 10px;
                border: 1px solid rgba(255, 130, 138, 0.65);
                background: linear-gradient(135deg, #e11d48 0%, #9f1239 100%);
                color: #ffffff;
                font-family: inherit;
                font-size: 14.5px;
                font-weight: 800;
                cursor: pointer;
            }
            .pl-btn-secondary {
                padding: 12px 18px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.32);
                background: rgba(255, 255, 255, 0.08);
                color: #ffffff;
                font-family: inherit;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
            }
            .pl-success-banner {
                background: rgba(22, 163, 74, 0.18);
                border: 1.5px solid #22c55e;
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                margin-bottom: 16px;
            }
            .pl-success-banner h3 {
                color: #4ade80;
                font-size: 18px;
                margin-bottom: 6px;
            }
            .pl-btn-row {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 14px;
            }
            .pl-btn-row button { flex: 1; min-width: 170px; }

            /* White Printable Invoice Preview Sheet */
            .pl-invoice-paper {
                background: #ffffff;
                color: #0f172a;
                border-radius: 12px;
                overflow: hidden;
                margin-top: 14px;
                border: 1px solid #cbd5e1;
            }
            .pl-inv-top {
                background: linear-gradient(135deg, #881337 0%, #be123c 55%, #1e293b 100%);
                color: #ffffff;
                padding: 18px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 14px;
                flex-wrap: wrap;
            }
            .pl-inv-brand { display: flex; align-items: center; gap: 12px; }
            .pl-inv-brand h2 { margin: 0; font-size: 21px; font-weight: 900; letter-spacing: 1px; }
            .pl-inv-brand p { margin: 3px 0 0; font-size: 11.5px; opacity: 0.94; max-width: 350px; line-height: 1.45; }
            .pl-inv-meta { text-align: right; font-size: 12px; line-height: 1.55; }
            .pl-paid-tag {
                display: inline-block;
                background: #22c55e;
                color: #ffffff;
                font-size: 11px;
                font-weight: 800;
                padding: 3px 10px;
                border-radius: 999px;
                margin-top: 4px;
            }
            .pl-inv-body { padding: 18px 20px; font-size: 13px; }
            .pl-inv-grid {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 13px 15px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 7px 16px;
                margin-bottom: 14px;
            }
            .pl-inv-grid strong { color: #881337; }
            .pl-inv-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 14px;
            }
            .pl-inv-table th {
                background: #fff1f2;
                color: #881337;
                padding: 9px 10px;
                text-align: left;
                border-bottom: 2px solid #fecdd3;
                font-weight: 800;
            }
            .pl-inv-table td {
                padding: 9px 10px;
                border-bottom: 1px solid #e2e8f0;
                color: #1e293b;
            }
            .pl-right { text-align: right !important; }
            .pl-inv-footer-box {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 14px;
                flex-wrap: wrap;
                border-top: 2px solid #e2e8f0;
                padding-top: 12px;
            }
            @media (max-width: 620px) {
                .pl-pay-grid { grid-template-columns: repeat(2, 1fr); }
                .pl-inv-grid { grid-template-columns: 1fr; }
                .pl-inv-meta { text-align: left; }
            }
        `;
        document.head.appendChild(style);
    }

    function ensureOverlay() {
        injectStyles();
        let ov = document.getElementById("pl-bill-overlay");
        if (!ov) {
            ov = document.createElement("div");
            ov.id = "pl-bill-overlay";
            ov.className = "pl-overlay";
            ov.innerHTML = `<div class="pl-modal" id="pl-bill-modal-body"></div>`;
            ov.addEventListener("click", function (e) {
                if (e.target === ov) closeOverlay();
            });
            document.body.appendChild(ov);
        }
        return ov;
    }

    function closeOverlay() {
        const ov = document.getElementById("pl-bill-overlay");
        if (ov) ov.classList.remove("open");
    }

    function parseUnitsCount(unitsText) {
        const m = String(unitsText || "1").match(/(\d+)/);
        return m ? Math.max(1, parseInt(m[1], 10)) : 1;
    }

    // STEP 1: OPEN PAYMENT METHOD SELECTION MODAL
    function startPayment(orderData, onConfirmCallback) {
        const unitsCount = parseUnitsCount(orderData.units);
        const isDeliveryBoy = orderData.requestType === "emergency_delivery";

        // Transparent hospital & cold-chain logistics fee breakdown
        const bloodProcessingFee = unitsCount * 450;
        const deliveryPartnerFee = isDeliveryBoy ? 140 : 60;
        const subtotal = bloodProcessingFee + deliveryPartnerFee;
        const gstAmount = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + gstAmount;

        pendingOrder = {
            ...orderData,
            unitsCount,
            bloodProcessingFee,
            deliveryPartnerFee,
            subtotal,
            gstAmount,
            grandTotal,
            onConfirmCallback
        };

        const ov = ensureOverlay();
        const pillsHTML = PAYMENT_OPTIONS.map((opt, idx) =>
            `<div class="pl-pay-pill ${idx === 0 ? "active" : ""}" data-method="${opt.id}">${opt.label}</div>`
        ).join("");

        document.getElementById("pl-bill-modal-body").innerHTML = `
            <button type="button" class="pl-close" onclick="PulseLinkBilling.close()">×</button>
            <div class="pl-title">💳 Complete Service & Delivery Payment</div>
            <div class="pl-sub">Select your payment method to confirm your blood request and generate your official PDF bill</div>

            <div class="pl-summary-box">
                <div class="pl-summary-row"><span>Patient Name & Hospital ID:</span><strong>${orderData.patientName} (${orderData.hospitalId})</strong></div>
                <div class="pl-summary-row"><span>Blood Group & Units:</span><strong>${orderData.bloodGroup} • ${orderData.units}</strong></div>
                <div class="pl-summary-row"><span>Blood Bank Processing / Cold-Chain Fee:</span><span>₹${bloodProcessingFee.toFixed(2)}</span></div>
                <div class="pl-summary-row"><span>${isDeliveryBoy ? "Express Delivery Partner Fee:" : "Donor Coordination & Kit Fee:"}</span><span>₹${deliveryPartnerFee.toFixed(2)}</span></div>
                <div class="pl-summary-row"><span>GST (5%):</span><span>₹${gstAmount.toFixed(2)}</span></div>
                <div class="pl-summary-row total"><span>Overall Payable Amount:</span><span>₹${grandTotal.toFixed(2)}</span></div>
            </div>

            <label style="font-size:12.5px; font-weight:700; color:#ffd7da;">Choose Payment Method *</label>
            <input type="hidden" id="pl-selected-method" value="PhonePe">
            <div class="pl-pay-grid" id="pl-pay-grid">${pillsHTML}</div>

            <div id="pl-extra-field-wrap">
                <input type="text" id="pl-pay-ref-input" class="pl-input" placeholder="Enter PhonePe Mobile Number or UPI ID (e.g. 9876543210@ybl)">
            </div>

            <button type="button" class="pl-btn-primary" id="pl-confirm-pay-btn">
                Pay ₹${grandTotal.toFixed(2)} via PhonePe →
            </button>
        `;

        // Handle payment option clicks
        document.querySelectorAll("#pl-pay-grid .pl-pay-pill").forEach(pill => {
            pill.addEventListener("click", function () {
                document.querySelectorAll("#pl-pay-grid .pl-pay-pill").forEach(p => p.classList.remove("active"));
                this.classList.add("active");
                const method = this.getAttribute("data-method");
                document.getElementById("pl-selected-method").value = method;
                document.getElementById("pl-confirm-pay-btn").textContent = `Pay ₹${grandTotal.toFixed(2)} via ${method} →`;

                const refInput = document.getElementById("pl-pay-ref-input");
                if (method === "Credit Card" || method === "Debit Card") {
                    refInput.placeholder = "Enter Last 4 Digits of Card / Cardholder Name (e.g. 4532 - Rahul)";
                } else if (method === "Net Banking") {
                    refInput.placeholder = "Enter Bank Name (e.g. SBI / HDFC / ICICI / Union Bank)";
                } else {
                    refInput.placeholder = `Enter ${method} ID or Mobile Number (e.g. name@upi)`;
                }
            });
        });

        // Confirm Payment
        document.getElementById("pl-confirm-pay-btn").addEventListener("click", function () {
            const method = document.getElementById("pl-selected-method").value;
            const now = new Date();

            activeInvoice = {
                invoiceNo: "PL-INV-" + Math.floor(100000 + Math.random() * 900000),
                transactionId: "TXN" + Date.now().toString().slice(-9),
                dateTime: now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
                paymentMethod: method,
                requestType: pendingOrder.requestType,
                patientName: pendingOrder.patientName,
                hospitalId: pendingOrder.hospitalId,
                hospitalName: pendingOrder.hospital,
                bloodGroup: pendingOrder.bloodGroup,
                patientPhone: pendingOrder.phone,
                permanentAddress: pendingOrder.permanentAddress || "Not provided",
                hospitalAddress: pendingOrder.hospitalAddress || pendingOrder.hospital,
                bloodCentre: pendingOrder.bloodCentre || "Verified Pulse Link Blood Network",
                units: pendingOrder.units,
                bloodProcessingFee: pendingOrder.bloodProcessingFee,
                deliveryPartnerFee: pendingOrder.deliveryPartnerFee,
                subtotal: pendingOrder.subtotal,
                gstAmount: pendingOrder.gstAmount,
                grandTotal: pendingOrder.grandTotal
            };

            // Save invoice to localStorage so both Patient & Accepting Customer can view/download it
            const allBills = JSON.parse(localStorage.getItem("pulseLinkInvoices") || "[]");
            allBills.unshift(activeInvoice);
            localStorage.setItem("pulseLinkInvoices", JSON.stringify(allBills.slice(0, 30)));

            // Dispatch the request (Delivery Boy OR Real Donor Alert) with invoice attached
            if (typeof pendingOrder.onConfirmCallback === "function") {
                pendingOrder.onConfirmCallback(activeInvoice);
            }

            showSuccessScreen(activeInvoice, false);
        });

        ov.classList.add("open");
    }

    // STEP 2: SHOW PAYMENT SUCCESS + VIEW & DOWNLOAD BILL PDF BUTTONS
    function showSuccessScreen(inv, showFullPaperImmediately) {
        const ov = ensureOverlay();
        const isDeliveryBoy = inv.requestType === "emergency_delivery";

        const invoicePaperHTML = `
            <div class="pl-invoice-paper" id="pl-invoice-preview-box" style="display:${showFullPaperImmediately ? "block" : "none"};">
                <div class="pl-inv-top">
                    <div class="pl-inv-brand">
                        <svg width="46" height="46" viewBox="0 0 64 46" fill="none">
                            <circle cx="32" cy="23" r="22" fill="#ffffff"/>
                            <path d="M32 37 C 32 37, 17 26, 17 17 C 17 12, 21 8.5, 25.5 9.8 C 28.2 10.5, 30.5 12.5, 32 14.5 C 33.5 12.5, 35.8 10.5, 38.5 9.8 C 43 8.5, 47 12, 47 17 C 47 26, 32 37, 32 37 Z" fill="#e11d48"/>
                            <path d="M13 23 L 23 23 L 26 17 L 29 29 L 33 14 L 37 27 L 40 22 L 43 23 L 51 23" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div>
                            <h2>${PULSE_LINK_CONFIG.brandName}</h2>
                            <p>${PULSE_LINK_CONFIG.address}<br>Helpline: ${PULSE_LINK_CONFIG.helpline} | Email: ${PULSE_LINK_CONFIG.email}</p>
                        </div>
                    </div>
                    <div class="pl-inv-meta">
                        <div><strong>Bill / Invoice No:</strong> ${inv.invoiceNo}</div>
                        <div><strong>Date:</strong> ${inv.dateTime}</div>
                        <div><strong>${PULSE_LINK_CONFIG.gstin}</strong></div>
                        <span class="pl-paid-tag">PAID VIA ${inv.paymentMethod.toUpperCase()}</span>
                    </div>
                </div>

                <div class="pl-inv-body">
                    <div class="pl-inv-grid">
                        <div><strong>Patient Name:</strong> ${inv.patientName}</div>
                        <div><strong>Hospital Patient ID:</strong> ${inv.hospitalId}</div>
                        <div><strong>Hospital Name:</strong> ${inv.hospitalName}</div>
                        <div><strong>Blood Group Needed:</strong> ${inv.bloodGroup} (${inv.units})</div>
                        <div><strong>Patient Phone No:</strong> ${inv.patientPhone}</div>
                        <div><strong>Service Mode:</strong> ${isDeliveryBoy ? "Emergency Delivery Boy" : "Real Donor Verification"}</div>
                        <div style="grid-column:1 / -1;"><strong>Hospital Address:</strong> ${inv.hospitalAddress}</div>
                        <div style="grid-column:1 / -1;"><strong>Patient Permanent Address:</strong> ${inv.permanentAddress}</div>
                    </div>

                    <table class="pl-inv-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Service Description</th>
                                <th class="pl-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Blood Bank Processing, Screening & Cold-Storage Fee (${inv.bloodGroup} • ${inv.units})</td>
                                <td class="pl-right">₹${Number(inv.bloodProcessingFee).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>${isDeliveryBoy ? "Express Cold-Chain Delivery Partner Fee" : "Verified Donor Coordination & Sterile Kit Fee"}</td>
                                <td class="pl-right">₹${Number(inv.deliveryPartnerFee).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>GST & Medical Logistics Tax (5%)</td>
                                <td class="pl-right">₹${Number(inv.gstAmount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="pl-inv-footer-box">
                        <div>
                            <div><strong>Payment Method:</strong> ${inv.paymentMethod}</div>
                            <div><strong>Transaction ID:</strong> ${inv.transactionId}</div>
                            <div><strong>Status:</strong> Verified & Paid</div>
                        </div>
                        <div style="text-align:right; font-size:16px; font-weight:900; color:#881337;">
                            Overall Total Paid: ₹${Number(inv.grandTotal).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("pl-bill-modal-body").innerHTML = `
            <button type="button" class="pl-close" onclick="PulseLinkBilling.close()">×</button>

            <div class="pl-success-banner">
                <h3>✅ Payment done successfully via ${inv.paymentMethod}!</h3>
                <p style="font-size:13px; color:#dcfce7; margin:0;">
                    Invoice <strong>${inv.invoiceNo}</strong> • Amount Paid: <strong>₹${Number(inv.grandTotal).toFixed(2)}</strong>
                </p>
                <div class="pl-btn-row">
                    <button type="button" class="pl-btn-secondary" onclick="PulseLinkBilling.togglePreview()">
                        👁️ View Bill PDF
                    </button>
                    <button type="button" class="pl-btn-primary" id="pl-dl-pdf-btn" onclick="PulseLinkBilling.downloadPDF()">
                        ⬇️ Download Bill PDF
                    </button>
                </div>
            </div>

            ${invoicePaperHTML}
        `;

        ov.classList.add("open");
    }

    function togglePreview() {
        const box = document.getElementById("pl-invoice-preview-box");
        if (box) {
            box.style.display = box.style.display === "none" ? "block" : "none";
        }
    }

    function viewInvoice(inv) {
        if (!inv) return;
        activeInvoice = inv;
        showSuccessScreen(inv, true);
    }

    // STEP 3: GENERATE & DOWNLOAD REAL A4 PDF BILL
    function downloadPDF(invoiceOverride) {
        const inv = invoiceOverride || activeInvoice;
        if (!inv) return;

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("PDF library is still loading. Please check your internet connection and try again.");
            return;
        }

        const btn = document.getElementById("pl-dl-pdf-btn");
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Generating PDF...";
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const isDeliveryBoy = inv.requestType === "emergency_delivery";

        // Top Crimson & Dark Navy Header Banner
        doc.setFillColor(136, 19, 55);
        doc.rect(0, 0, 210, 42, "F");

        // Vector Pulse Link Logo Emblem (White circle + Crimson Heart + White ECG line)
        doc.setFillColor(255, 255, 255);
        doc.circle(25, 21, 11, "F");
        doc.setFillColor(225, 29, 72);
        doc.circle(22.2, 18.5, 3.6, "F");
        doc.circle(27.8, 18.5, 3.6, "F");
        doc.triangle(18.8, 19.8, 31.2, 19.8, 25, 28.5, "F");
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.9);
        doc.line(16, 21, 21, 21);
        doc.line(21, 21, 23, 17);
        doc.line(23, 17, 25.5, 25.5);
        doc.line(25.5, 25.5, 27.5, 19);
        doc.line(27.5, 19, 29, 21);
        doc.line(29, 21, 34, 21);

        // Website Name, Address, Helpline & Email
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(PULSE_LINK_CONFIG.brandName, 41, 13.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.2);
        const addrLines = doc.splitTextToSize(PULSE_LINK_CONFIG.address, 96);
        doc.text(addrLines, 41, 19.5);
        doc.text(`Website Helpline: ${PULSE_LINK_CONFIG.helpline}`, 41, 29.5);
        doc.text(`Email: ${PULSE_LINK_CONFIG.email} | ${PULSE_LINK_CONFIG.gstin}`, 41, 34.8);

        // Right Header: Invoice ID, Date & PAID Badge
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text("BLOOD SERVICE & PAYMENT BILL", 196, 12, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`Bill No: ${inv.invoiceNo}`, 196, 18, { align: "right" });
        doc.text(`Date: ${inv.dateTime}`, 196, 23, { align: "right" });

        doc.setFillColor(34, 197, 94);
        doc.roundedRect(166, 27, 30, 6.8, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("PAID", 181, 31.6, { align: "center" });

        // Patient & Hospital Details Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, 48, 182, 48, 2.5, 2.5, "FD");

        doc.setTextColor(136, 19, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("PATIENT & HOSPITAL DETAILS", 19, 55);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9.2);
        doc.setFont("helvetica", "bold"); doc.text("Patient Name:", 19, 62);
        doc.setFont("helvetica", "normal"); doc.text(inv.patientName, 48, 62);

        doc.setFont("helvetica", "bold"); doc.text("Hospital ID:", 116, 62);
        doc.setFont("helvetica", "normal"); doc.text(inv.hospitalId, 141, 62);

        doc.setFont("helvetica", "bold"); doc.text("Hospital Name:", 19, 68.5);
        doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(inv.hospitalName, 64), 48, 68.5);

        doc.setFont("helvetica", "bold"); doc.text("Blood Group:", 116, 68.5);
        doc.setFont("helvetica", "normal"); doc.text(`${inv.bloodGroup} (${inv.units})`, 141, 68.5);

        doc.setFont("helvetica", "bold"); doc.text("Phone Number:", 19, 75.5);
        doc.setFont("helvetica", "normal"); doc.text(inv.patientPhone, 48, 75.5);

        doc.setFont("helvetica", "bold"); doc.text("Request Type:", 116, 75.5);
        doc.setFont("helvetica", "normal"); doc.text(isDeliveryBoy ? "Emergency Delivery Boy" : "Real Donor Alert", 141, 75.5);

        doc.setFont("helvetica", "bold"); doc.text("Hospital Addr:", 19, 82.5);
        doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(inv.hospitalAddress, 144), 48, 82.5);

        doc.setFont("helvetica", "bold"); doc.text("Patient Addr:", 19, 90);
        doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(inv.permanentAddress, 144), 48, 90);

        // Itemized Charges Table
        const tableRows = [
            [
                "1",
                `Blood Bank Processing, Screening & Cold-Storage Fee (${inv.bloodGroup} • ${inv.units})`,
                "Rs. " + Number(inv.bloodProcessingFee).toFixed(2)
            ],
            [
                "2",
                isDeliveryBoy ? "Express Cold-Chain Delivery Partner Fee" : "Verified Donor Coordination & Sterile Collection Kit Fee",
                "Rs. " + Number(inv.deliveryPartnerFee).toFixed(2)
            ],
            [
                "3",
                "GST & Medical Logistics Tax (5%)",
                "Rs. " + Number(inv.gstAmount).toFixed(2)
            ]
        ];

        const tableConfig = {
            startY: 102,
            head: [["#", "Charge Description", "Amount"]],
            body: tableRows,
            theme: "grid",
            headStyles: { fillColor: [136, 19, 55], textColor: 255, fontStyle: "bold", fontSize: 9.5 },
            styles: { fontSize: 9.2, cellPadding: 3.5, textColor: [30, 41, 59] },
            columnStyles: {
                0: { halign: "center", cellWidth: 12 },
                2: { halign: "right", fontStyle: "bold", cellWidth: 36 }
            }
        };

        if (typeof doc.autoTable === "function") {
            doc.autoTable(tableConfig);
        } else if (window.jspdf && typeof window.jspdf.autoTable === "function") {
            window.jspdf.autoTable(doc, tableConfig);
        }

        const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 9 : 162;

        // Left: Payment Method Box
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(134, 239, 172);
        doc.roundedRect(14, finalY, 96, 30, 2, 2, "FD");
        doc.setTextColor(22, 101, 52);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text("PAYMENT CONFIRMATION", 19, finalY + 7);

        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Paid Via: ${inv.paymentMethod}`, 19, finalY + 13.5);
        doc.text(`Transaction ID: ${inv.transactionId}`, 19, finalY + 19.5);
        doc.text("Status: PAID & VERIFIED", 19, finalY + 25.5);

        // Right: Overall Total Summary Box
        doc.setFillColor(255, 241, 242);
        doc.setDrawColor(253, 164, 175);
        doc.roundedRect(116, finalY, 80, 30, 2, 2, "FD");

        doc.setTextColor(51, 65, 85);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Subtotal:", 121, finalY + 7.5);
        doc.text("Rs. " + Number(inv.subtotal).toFixed(2), 191, finalY + 7.5, { align: "right" });

        doc.text("GST (5%):", 121, finalY + 13.5);
        doc.text("Rs. " + Number(inv.gstAmount).toFixed(2), 191, finalY + 13.5, { align: "right" });

        doc.setDrawColor(136, 19, 55);
        doc.line(121, finalY + 17.5, 191, finalY + 17.5);

        doc.setTextColor(136, 19, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11.5);
        doc.text("Overall Total:", 121, finalY + 25);
        doc.text("Rs. " + Number(inv.grandTotal).toFixed(2), 191, finalY + 25, { align: "right" });

        // Footer
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.text("Thank you for trusting Pulse Link! Every drop saves a life.", 105, 280, { align: "center" });
        doc.text("Computer-generated official receipt. For 24x7 support call 1800-108-7857.", 105, 285, { align: "center" });

        doc.save(`PulseLink_Bill_${inv.invoiceNo}.pdf`);

        if (btn) {
            btn.disabled = false;
            btn.textContent = "⬇️ Download Bill PDF";
        }
    }

    window.PulseLinkBilling = {
        startPayment,
        viewInvoice,
        downloadPDF,
        togglePreview,
        close: closeOverlay
    };
})();