"use strict";

(function () {
  const fixture = window.ERP_CAFE_DEMO_FIXTURE;
  if (!fixture || fixture.synthetic !== true) {
    throw new Error("Synthetic Cafe demo fixture is unavailable.");
  }

  const kitchenStates = ["BELUM_DIKIRIM", "QUEUED", "PREPARING", "READY", "COMPLETED"];
  const state = {
    currentStep: 1,
    serviceMode: fixture.order.serviceMode,
    orderConfirmed: false,
    kitchenStateIndex: 0,
    paymentCount: 0,
    saleClosed: false,
    shiftClosed: false
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const money = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });
  const rupiah = (value) => money.format(value).replace(/\s/g, "");
  const roundIdr = (value) => Math.round(value);

  function calculatePricing() {
    const gross = fixture.order.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
    const discount = fixture.order.orderDiscount;
    const netSales = gross - discount;
    const serviceCharge = roundIdr(netSales * fixture.order.serviceRate);
    const tax = roundIdr((netSales + serviceCharge) * fixture.order.taxRate);
    return {
      gross,
      discount,
      netSales,
      serviceCharge,
      tax,
      payable: netSales + serviceCharge + tax
    };
  }

  const pricing = calculatePricing();
  const paidAmount = () => fixture.paymentPlan
    .slice(0, state.paymentCount)
    .reduce((total, payment) => total + payment.amount, 0);
  const isPaid = () => paidAmount() === pricing.payable;
  const isJourneyComplete = () => (
    state.orderConfirmed
    && state.kitchenStateIndex === kitchenStates.length - 1
    && state.saleClosed
    && state.shiftClosed
  );
  const currentCashPayment = () => isPaid()
    ? fixture.paymentPlan.filter((payment) => payment.kind === "CASH")
      .reduce((total, payment) => total + payment.amount, 0)
    : 0;

  function renderOrder() {
    $("#outlet-name").textContent = fixture.outlet.name;
    $("#order-number").textContent = fixture.order.number;
    $("#context-service").textContent = state.serviceMode === "DINE_IN" ? "Dine-in" : "Takeaway";
    $("#context-location").textContent = state.serviceMode === "DINE_IN" ? fixture.outlet.table : "Ambil sendiri";
    $("#context-total").textContent = rupiah(pricing.payable);
    $("#payable-total").textContent = rupiah(pricing.payable);

    $("#order-items").innerHTML = fixture.order.items.map((item) => `
      <article class="order-item">
        <span class="item-quantity" aria-label="Jumlah ${item.quantity}">${item.quantity}×</span>
        <div><strong>${item.name}</strong><small>${item.category} · ${item.station} · ${rupiah(item.unitPrice)} per item</small></div>
        <span>${rupiah(item.quantity * item.unitPrice)}</span>
      </article>
    `).join("");

    $("#pricing-lines").innerHTML = [
      ["Subtotal item", pricing.gross],
      ["Promo demo", -pricing.discount],
      ["Service 5%", pricing.serviceCharge],
      ["Pajak 10%", pricing.tax]
    ].map(([label, value]) => `
      <div class="summary-line"><span>${label}</span><strong>${value < 0 ? "−" : ""}${rupiah(Math.abs(value))}</strong></div>
    `).join("");

    $$(".mode-button").forEach((button) => {
      const selected = button.dataset.mode === state.serviceMode;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = state.orderConfirmed;
    });
    const confirmButton = $("#confirm-order");
    confirmButton.disabled = state.orderConfirmed;
    confirmButton.textContent = state.orderConfirmed ? "Pesanan dikonfirmasi" : "Konfirmasi & lanjut ke dapur";
  }

  function renderKitchen() {
    const current = kitchenStates[state.kitchenStateIndex];
    const grouped = fixture.order.items.reduce((stations, item) => {
      (stations[item.station] ||= []).push(item);
      return stations;
    }, {});
    const displayStatus = current.replaceAll("_", " ");
    $("#kitchen-board").innerHTML = Object.entries(grouped).map(([station, items]) => `
      <section class="station-card" aria-label="Stasiun ${station}">
        <div class="station-head"><h3>${station}</h3><span>${items.length} item menu</span></div>
        <div class="ticket-list">
          ${items.map((item) => `
            <article class="ticket">
              <div><strong>${item.quantity}× ${item.name}</strong><small>${fixture.order.number} · ${state.serviceMode === "DINE_IN" ? fixture.outlet.table : "Takeaway"}</small></div>
              <span class="ticket-status pill ${kitchenPill(current)}">${displayStatus}</span>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("");

    const overall = $("#kitchen-overall");
    overall.textContent = current === "BELUM_DIKIRIM" ? "Belum dikirim" : displayStatus;
    overall.className = `pill ${kitchenPill(current)}`;
    $("#send-kitchen").disabled = !state.orderConfirmed || state.kitchenStateIndex > 0;
    $("#send-kitchen").textContent = state.kitchenStateIndex > 0 ? "Terkirim dengan send key demo" : "Kirim ke dapur & bar";
    $("#advance-kitchen").disabled = !state.orderConfirmed || state.kitchenStateIndex === 0 || state.kitchenStateIndex === kitchenStates.length - 1;
    $("#advance-kitchen").textContent = kitchenAdvanceLabel(current);
    $("#kitchen-gate").hidden = state.orderConfirmed;
  }

  function kitchenPill(status) {
    return {
      BELUM_DIKIRIM: "pill-queued",
      QUEUED: "pill-queued",
      PREPARING: "pill-preparing",
      READY: "pill-ready",
      COMPLETED: "pill-complete"
    }[status];
  }

  function kitchenAdvanceLabel(status) {
    return {
      BELUM_DIKIRIM: "Majukan semua status",
      QUEUED: "Mulai persiapan",
      PREPARING: "Tandai siap",
      READY: "Selesaikan pesanan",
      COMPLETED: "Semua selesai"
    }[status];
  }

  function renderPayment() {
    $("#payment-breakdown").innerHTML = [
      ["Gross item sales", pricing.gross],
      ["Diskon order", -pricing.discount],
      ["Net sales", pricing.netSales],
      ["Service charge", pricing.serviceCharge],
      ["Pajak", pricing.tax],
      ["Total harus dibayar", pricing.payable]
    ].map(([label, value]) => `
      <div class="summary-line"><span>${label}</span><strong>${value < 0 ? "−" : ""}${rupiah(Math.abs(value))}</strong></div>
    `).join("");

    $("#payment-entries").innerHTML = fixture.paymentPlan.map((payment, index) => {
      const recorded = index < state.paymentCount;
      return `<div class="payment-entry ${recorded ? "" : "pending"}">
        <span>${recorded ? "✓" : "○"} ${payment.method}</span><strong>${rupiah(payment.amount)}</strong>
      </div>`;
    }).join("");

    const outstanding = pricing.payable - paidAmount();
    const paymentState = $("#payment-state");
    paymentState.textContent = state.paymentCount === 0 ? "UNPAID" : isPaid() ? "PAID" : "PARTIALLY PAID";
    paymentState.className = `pill ${isPaid() ? "pill-complete" : state.paymentCount ? "pill-preparing" : "pill-open"}`;
    const paymentButton = $("#record-payment");
    paymentButton.disabled = !state.orderConfirmed || isPaid() || state.saleClosed;
    paymentButton.textContent = isPaid() ? "Pembayaran lengkap" : "Catat pembayaran berikutnya";
    $("#payment-hint").textContent = !state.orderConfirmed
      ? "Konfirmasi pesanan pada langkah 1 sebelum mencatat pembayaran."
      : isPaid()
        ? `Total ${rupiah(pricing.payable)} sudah direkonsiliasi; transaksi masih OPEN sampai ditutup eksplisit.`
        : `Sisa simulasi ${rupiah(outstanding)}.`;
    $("#payment-gate").hidden = state.orderConfirmed;

    const closeButton = $("#close-transaction");
    closeButton.disabled = !isPaid() || state.saleClosed;
    closeButton.textContent = state.saleClosed ? "Transaksi ditutup" : "Tutup transaksi & finalisasi struk";
    $("#close-hint").textContent = state.saleClosed
      ? "Status CLOSED, nomor struk, dan tanggal bisnis sudah difinalisasi."
      : isPaid()
        ? "Pembayaran PAID. Tutup transaksi secara eksplisit agar struk dan penjualan final tersedia."
        : "Pelunasan penuh diperlukan sebelum transaksi dapat ditutup.";
    $("#receipt").hidden = !state.saleClosed;
    if (state.saleClosed) renderReceipt();
  }

  function renderReceipt() {
    const change = fixture.paymentPlan.reduce((total, payment) => total + payment.tendered - payment.amount, 0);
    $("#receipt-body").innerHTML = `
      <div class="receipt-lines">
        ${fixture.order.items.map((item) => `<div class="receipt-line"><span>${item.quantity}× ${item.name}</span><strong>${rupiah(item.quantity * item.unitPrice)}</strong></div>`).join("")}
        <div class="receipt-line"><span>Diskon</span><strong>−${rupiah(pricing.discount)}</strong></div>
        <div class="receipt-line"><span>Service + pajak</span><strong>${rupiah(pricing.serviceCharge + pricing.tax)}</strong></div>
        <div class="receipt-line"><span><strong>Total</strong></span><strong>${rupiah(pricing.payable)}</strong></div>
        <div class="receipt-line"><span>Kembalian tunai</span><strong>${rupiah(change)}</strong></div>
      </div>
      <div class="receipt-meta">
        <span>Nomor: NUSA-DEMO-20261012-000042</span><span>Tanggal bisnis: ${fixture.outlet.businessDate}</span>
        <span>Order: ${fixture.order.number}</span><span>Kasir: ${fixture.outlet.cashier}</span>
      </div>
    `;
  }

  function shiftValues() {
    const cashIn = fixture.shift.priorCashInflow + currentCashPayment();
    const expected = fixture.shift.openingCash + cashIn - fixture.shift.cashCorrections;
    return { cashIn, expected, variance: fixture.shift.countedCash - expected };
  }

  function renderShift() {
    const values = shiftValues();
    $("#shift-metrics").innerHTML = [
      ["Kas awal", fixture.shift.openingCash, fixture.shift.openedAt],
      ["Tunai masuk", values.cashIn, isPaid() ? "termasuk pembayaran demo" : "order demo belum dibayar"],
      ["Koreksi tunai", fixture.shift.cashCorrections, "riwayat sintetis"],
      ["Kas diharapkan", values.expected, "hasil rekonsiliasi"]
    ].map(([label, value, note]) => `<article class="metric-card"><span>${label}</span><strong>${rupiah(value)}</strong><small>${note}</small></article>`).join("");
    $("#reconciliation-flow").innerHTML = `
      <span class="flow-node">Kas awal<strong>${rupiah(fixture.shift.openingCash)}</strong></span><span class="flow-operator">+</span>
      <span class="flow-node">Tunai masuk<strong>${rupiah(values.cashIn)}</strong></span><span class="flow-operator">−</span>
      <span class="flow-node">Koreksi<strong>${rupiah(fixture.shift.cashCorrections)}</strong></span><span class="flow-operator">=</span>
      <span class="flow-node">Diharapkan<strong>${rupiah(values.expected)}</strong></span>`;
    $("#shift-state").textContent = state.shiftClosed ? "CLOSED" : "OPEN";
    $("#shift-state").className = `pill ${state.shiftClosed ? "pill-complete" : "pill-open"}`;
    $("#close-shift").disabled = !state.saleClosed || state.shiftClosed;
    $("#close-shift").textContent = state.shiftClosed ? "Shift ditutup" : "Tutup shift simulasi";
    $("#shift-hint").textContent = state.saleClosed
      ? state.shiftClosed
        ? "Shift CLOSED setelah transaksi demo selesai difinalisasi."
        : "Transaksi demo sudah CLOSED; shift dapat direkonsiliasi dan ditutup."
      : "Tutup transaksi berbayar terlebih dahulu sebelum menutup shift simulasi.";
    $("#variance-note").hidden = !state.shiftClosed;
    $("#variance-note").innerHTML = `<strong>Selisih tercatat:</strong> ${values.variance < 0 ? "kurang" : "lebih"} ${rupiah(Math.abs(values.variance))}. Nilai ini ditampilkan sebagai pengecualian, bukan disembunyikan.`;
  }

  function dashboardValues() {
    const before = fixture.dashboardBeforeOrder;
    const includeOrder = state.saleClosed;
    const count = before.transactionCount + (includeOrder ? 1 : 0);
    const payable = before.payableSales + (includeOrder ? pricing.payable : 0);
    return {
      count,
      gross: before.grossItemSales + (includeOrder ? pricing.gross : 0),
      discounts: before.discounts + (includeOrder ? pricing.discount : 0),
      netSales: before.netSales + (includeOrder ? pricing.netSales : 0),
      service: before.serviceCharge + (includeOrder ? pricing.serviceCharge : 0),
      tax: before.tax + (includeOrder ? pricing.tax : 0),
      payable,
      averageTicket: count ? roundIdr(payable / count) : 0,
      cash: before.paymentMix.cash + (includeOrder ? currentCashPayment() : 0),
      qris: before.paymentMix.qris + (includeOrder ? fixture.paymentPlan.filter((item) => item.kind === "NON_CASH").reduce((total, item) => total + item.amount, 0) : 0)
    };
  }

  function renderDashboard() {
    const values = dashboardValues();
    $("[data-panel='5'] .role-badge").textContent = `${values.count} transaksi sintetis`;
    $("#owner-kpis").innerHTML = [
      ["Net Sales", values.netSales, `Gross ${rupiah(values.gross)} − diskon ${rupiah(values.discounts)}`],
      ["Payable Sales", values.payable, `Service ${rupiah(values.service)} + pajak ${rupiah(values.tax)}`],
      ["Transaksi final", values.count, "OPEN order tidak dihitung"],
      ["Rata-rata tiket", values.averageTicket, "Payable ÷ transaksi final"]
    ].map(([label, value, note], index) => `<article class="kpi-card"><span>${label}</span><strong>${index === 2 ? value : rupiah(value)}</strong><small>${note}</small></article>`).join("");

    const trend = fixture.dashboardBeforeOrder.trend.map((item, index, rows) => (
      index === rows.length - 1 ? { ...item, value: values.netSales } : item
    ));
    const maxTrend = Math.max(...trend.map((item) => item.value));
    $("#sales-chart").innerHTML = trend.map((item, index) => `
      <div class="bar-group ${index === trend.length - 1 ? "is-today" : ""}" title="${item.label}: ${rupiah(item.value)}">
        <span class="bar"></span><small>${item.label}</small>
      </div>`).join("");
    $$("#sales-chart .bar").forEach((bar, index) => {
      bar.style.height = `${Math.max(4, Math.round(trend[index].value / maxTrend * 100))}%`;
    });

    const cashPercent = Math.round(values.cash / values.payable * 100);
    $("#payment-donut").style.background = `conic-gradient(var(--green) 0 ${cashPercent}%, var(--orange) ${cashPercent}% 100%)`;
    $("#payment-donut").setAttribute("aria-label", `Pembayaran tunai ${cashPercent} persen dan QRIS ${100 - cashPercent} persen`);
    $("#payment-legend").innerHTML = `
      <div class="legend-row"><i class="legend-cash"></i><div><strong>Tunai · ${cashPercent}%</strong><span>${rupiah(values.cash)}</span></div></div>
      <div class="legend-row"><i class="legend-qris"></i><div><strong>QRIS · ${100 - cashPercent}%</strong><span>${rupiah(values.qris)}</span></div></div>`;

    const items = fixture.dashboardBeforeOrder.topItems.map((item) => ({ ...item }));
    if (state.saleClosed) {
      fixture.order.items.forEach((orderItem) => {
        const existing = items.find((item) => item.name === orderItem.name);
        if (existing) {
          existing.quantity += orderItem.quantity;
          existing.netSales += orderItem.quantity * orderItem.unitPrice;
        }
      });
    }
    $("#owner-gate").hidden = state.saleClosed;
    const maxItem = Math.max(...items.map((item) => item.netSales));
    $("#top-items").innerHTML = items.map((item) => `
      <div class="top-item"><strong>${item.name}<small>${item.quantity} item</small></strong><div class="item-track"><span></span></div><span>${rupiah(item.netSales)}</span></div>
    `).join("");
    $$("#top-items .item-track span").forEach((bar, index) => {
      bar.style.width = `${Math.round(items[index].netSales / maxItem * 100)}%`;
    });
  }

  function renderAudit() {
    const kitchenState = kitchenStates[state.kitchenStateIndex];
    const values = shiftValues();
    const events = [
      ["1", "10.12 WIB", "Pesanan dibuka", `${state.serviceMode === "DINE_IN" ? "Dine-in · Meja 07" : "Takeaway"}; 4 item sintetis`],
      ["2", "10.14 WIB", "Item dikirim", state.kitchenStateIndex ? `Dapur & Bar · ${kitchenState.replaceAll("_", " ")}` : "Belum dijalankan dalam sesi demo"],
      ["3", "10.28 WIB", "Pricing dibekukan", state.orderConfirmed ? `Total simulasi ${rupiah(pricing.payable)}` : "Belum dibekukan"],
      ["4", "10.29 WIB", "Pembayaran", isPaid() ? "PAID · QRIS + tunai; saldo Rp0" : `${rupiah(paidAmount())} dari ${rupiah(pricing.payable)}`],
      ["5", "10.30 WIB", "Transaksi ditutup", state.saleClosed ? "CLOSED · final masuk laporan penjualan" : isPaid() ? "Masih OPEN · PAID, menunggu penutupan" : "Belum dapat ditutup"],
      ["6", "10.30 WIB", "Struk final", state.saleClosed ? "NUSA-DEMO-20261012-000042" : "Belum difinalisasi"],
      ["7", "16.05 WIB", "Rekonsiliasi shift", state.shiftClosed ? `Selisih ${rupiah(values.variance)}` : "Shift masih OPEN dalam sesi demo"]
    ];
    $("#audit-timeline").innerHTML = events.map(([icon, time, title, detail]) => `
      <article class="audit-event"><span class="audit-icon">${icon}</span><time>${time}</time><div><strong>${title}</strong><small>${detail}</small></div></article>
    `).join("");
  }

  function renderContext() {
    const status = $("#context-status");
    if (state.saleClosed) {
      status.textContent = "CLOSED";
      status.className = "pill pill-complete";
    } else if (isPaid()) {
      status.textContent = "OPEN · PAID";
      status.className = "pill pill-ready";
    } else if (state.kitchenStateIndex > 0) {
      status.textContent = "OPEN · SENT";
      status.className = "pill pill-preparing";
    } else if (state.orderConfirmed) {
      status.textContent = "OPEN · CONFIRMED";
      status.className = "pill pill-preparing";
    } else {
      status.textContent = "OPEN";
      status.className = "pill pill-open";
    }
    const explanations = {
      1: "Pesanan dicatat satu kali dan menjadi sumber untuk proses berikutnya.",
      2: "Dapur melihat item, jumlah, meja, dan progres tanpa membuat order baru.",
      3: "Diskon, service, pajak, pembayaran, dan struk tetap dapat direkonsiliasi.",
      4: "Kas yang diharapkan dihitung dari peristiwa tunai, lalu selisih dicatat.",
      5: "Laporan hanya memakai transaksi final dan memisahkan komponen nilainya.",
      6: "Perubahan transaksi dicatat dan dapat ditelusuri sebagai rangkaian fakta."
    };
    $("#business-explanation").textContent = explanations[state.currentStep];
  }

  function showStep(nextStep, focusPanel = true) {
    const step = Math.min(6, Math.max(1, Number(nextStep)));
    state.currentStep = step;
    const completedSteps = {
      1: state.orderConfirmed,
      2: state.kitchenStateIndex === kitchenStates.length - 1,
      3: state.saleClosed,
      4: state.shiftClosed,
      5: state.saleClosed,
      6: isJourneyComplete()
    };
    $$(".step-button").forEach((button) => {
      const number = Number(button.dataset.step);
      button.classList.toggle("is-active", number === step);
      button.classList.toggle("is-complete", completedSteps[number]);
      if (number === step) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    $$(".step-panel").forEach((panel) => {
      const visible = Number(panel.dataset.panel) === step;
      panel.hidden = !visible;
      panel.classList.toggle("is-visible", visible);
    });
    $("#previous-step").disabled = step === 1;
    $("#next-step").disabled = step === 6;
    $("#step-status").textContent = `Langkah ${step} dari 6`;
    renderContext();
    if (step === 5) renderDashboard();
    if (step === 6) {
      renderAudit();
      const completionState = $("#completion-state");
      completionState.textContent = isJourneyComplete() ? "Demo selesai" : "Eksplorasi · belum selesai";
      completionState.className = `pill ${isJourneyComplete() ? "pill-complete" : "pill-queued"}`;
    }
    if (focusPanel) {
      const title = document.querySelector(`[data-panel="${step}"] h2`);
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }
  }

  function resetDemo() {
    state.currentStep = 1;
    state.serviceMode = fixture.order.serviceMode;
    state.orderConfirmed = false;
    state.kitchenStateIndex = 0;
    state.paymentCount = 0;
    state.saleClosed = false;
    state.shiftClosed = false;
    renderAll();
    showStep(1);
  }

  function renderAll() {
    renderOrder();
    renderKitchen();
    renderPayment();
    renderShift();
    renderDashboard();
    renderAudit();
    renderContext();
  }

  function completeNormalJourney(targetStep) {
    $("#confirm-order").click();
    $("#send-kitchen").click();
    while (state.kitchenStateIndex < kitchenStates.length - 1) {
      $("#advance-kitchen").click();
    }
    showStep(3, false);
    $("#record-payment").click();
    $("#record-payment").click();
    $("#close-transaction").click();
    showStep(4, false);
    $("#close-shift").click();
    showStep(targetStep, false);
  }

  function normalJourneyPassed() {
    return (
      state.orderConfirmed
      && state.kitchenStateIndex === kitchenStates.length - 1
      && isPaid()
      && state.saleClosed
      && state.shiftClosed
      && $("#context-status").textContent === "CLOSED"
      && !$("#receipt").hidden
    );
  }

  function setBrowserQa(scenario, passed) {
    document.documentElement.dataset.browserScenario = scenario;
    document.documentElement.dataset.browserQa = passed ? "pass" : "fail";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  function runBrowserReviewScenario(reviewMode) {
    // Deterministic CI-only scenarios invoke the same visitor controls. They
    // never send, persist, or retrieve data.
    if (reviewMode === "direct-payment") {
      showStep(3, false);
      $("#record-payment").click();
      setBrowserQa(reviewMode, (
        !state.orderConfirmed
        && state.paymentCount === 0
        && !state.saleClosed
        && $("#record-payment").disabled
        && $("#close-transaction").disabled
        && !$("#payment-gate").hidden
      ));
      return;
    }

    if (reviewMode === "early-shift") {
      $("#confirm-order").click();
      showStep(4, false);
      $("#close-shift").click();
      setBrowserQa(reviewMode, (
        !isPaid()
        && !state.saleClosed
        && !state.shiftClosed
        && $("#close-shift").disabled
      ));
      return;
    }

    if (reviewMode === "paid-open") {
      $("#confirm-order").click();
      showStep(3, false);
      $("#record-payment").click();
      $("#record-payment").click();
      renderDashboard();
      setBrowserQa(reviewMode, (
        isPaid()
        && !state.saleClosed
        && $("#context-status").textContent === "OPEN · PAID"
        && $("#receipt").hidden
        && !$("#close-transaction").disabled
        && $(`[data-panel="5"] .role-badge`).textContent === "17 transaksi sintetis"
      ));
      return;
    }

    if (reviewMode === "reset-replay") {
      completeNormalJourney(6);
      $("#reset-demo").click();
      const resetPassed = (
        state.currentStep === 1
        && !state.orderConfirmed
        && state.kitchenStateIndex === 0
        && state.paymentCount === 0
        && !state.saleClosed
        && !state.shiftClosed
      );
      completeNormalJourney(6);
      document.documentElement.dataset.resetReplay = resetPassed ? "pass" : "fail";
      setBrowserQa(reviewMode, resetPassed && normalJourneyPassed());
      return;
    }

    if (reviewMode === "owner" || reviewMode === "journey") {
      completeNormalJourney(reviewMode === "owner" ? 5 : 6);
      setBrowserQa(reviewMode, normalJourneyPassed());
    }
  }

  $$(".step-button").forEach((button) => button.addEventListener("click", () => showStep(button.dataset.step)));
  $$(".mode-button").forEach((button) => button.addEventListener("click", () => {
    if (state.orderConfirmed) return;
    state.serviceMode = button.dataset.mode;
    renderOrder();
    renderKitchen();
    renderContext();
  }));
  $("#confirm-order").addEventListener("click", () => {
    if (state.orderConfirmed) return;
    state.orderConfirmed = true;
    renderOrder();
    renderKitchen();
    renderPayment();
    renderContext();
    showStep(2);
  });
  $("#send-kitchen").addEventListener("click", () => {
    if (!state.orderConfirmed || state.kitchenStateIndex > 0) return;
    state.kitchenStateIndex = 1;
    renderKitchen();
    renderContext();
  });
  $("#advance-kitchen").addEventListener("click", () => {
    if (!state.orderConfirmed || state.kitchenStateIndex === 0) return;
    if (state.kitchenStateIndex < kitchenStates.length - 1) state.kitchenStateIndex += 1;
    renderKitchen();
  });
  $("#record-payment").addEventListener("click", () => {
    if (!state.orderConfirmed || state.saleClosed || isPaid()) return;
    if (state.paymentCount < fixture.paymentPlan.length) state.paymentCount += 1;
    renderPayment();
    renderShift();
    renderDashboard();
    renderContext();
  });
  $("#close-transaction").addEventListener("click", () => {
    if (!isPaid() || state.saleClosed) return;
    state.saleClosed = true;
    renderPayment();
    renderShift();
    renderDashboard();
    renderAudit();
    renderContext();
  });
  $("#close-shift").addEventListener("click", () => {
    if (!state.saleClosed || state.shiftClosed) return;
    state.shiftClosed = true;
    renderShift();
    renderAudit();
  });
  $("#previous-step").addEventListener("click", () => showStep(state.currentStep - 1));
  $("#next-step").addEventListener("click", () => showStep(state.currentStep + 1));
  $("#reset-demo").addEventListener("click", resetDemo);
  $("#restart-demo").addEventListener("click", resetDemo);

  renderAll();
  showStep(1, false);
  const reviewMode = new URLSearchParams(window.location.search).get("review");
  if (reviewMode) runBrowserReviewScenario(reviewMode);
}());
