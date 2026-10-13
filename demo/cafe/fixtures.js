"use strict";

// Synthetic-only fixture for the Phase 3M-D static Cafe/Resto demonstration.
// It contains no customer, production, or personal data.
window.ERP_CAFE_DEMO_FIXTURE = {
  "schema": "erp-cloud-marketing-cafe-demo-v1",
  "synthetic": true,
  "generatedFor": "Phase 3M-D review",
  "outlet": {
    "name": "Kedai Nusa Sintetis",
    "code": "NUSA-DEMO",
    "businessDate": "2026-10-12",
    "timezone": "Asia/Jakarta",
    "cashier": "Kasir Demo",
    "table": "Meja 07"
  },
  "order": {
    "number": "ORD-DEMO-1042",
    "serviceMode": "DINE_IN",
    "items": [
      { "id": "nasi-goreng", "name": "Nasi Goreng Kampung", "category": "Makanan", "quantity": 2, "unitPrice": 35000, "station": "Dapur" },
      { "id": "es-kopi", "name": "Es Kopi Susu Gula Aren", "category": "Minuman", "quantity": 1, "unitPrice": 22000, "station": "Bar" },
      { "id": "pisang-goreng", "name": "Pisang Goreng Keju", "category": "Makanan", "quantity": 1, "unitPrice": 18000, "station": "Dapur" }
    ],
    "orderDiscount": 10000,
    "serviceRate": 0.05,
    "taxRate": 0.10
  },
  "paymentPlan": [
    { "method": "QRIS (simulasi)", "kind": "NON_CASH", "amount": 80000, "tendered": 80000 },
    { "method": "Tunai (simulasi)", "kind": "CASH", "amount": 35500, "tendered": 50000 }
  ],
  "shift": {
    "number": "SHIFT-DEMO-08",
    "openedAt": "08.00 WIB",
    "openingCash": 500000,
    "priorCashInflow": 785000,
    "cashCorrections": 20000,
    "countedCash": 1300000
  },
  "dashboardBeforeOrder": {
    "transactionCount": 17,
    "grossItemSales": 2810000,
    "discounts": 140000,
    "netSales": 2670000,
    "serviceCharge": 133500,
    "tax": 280350,
    "payableSales": 3083850,
    "paymentMix": { "cash": 1420000, "qris": 1663850 },
    "topItems": [
      { "name": "Nasi Goreng Kampung", "quantity": 26, "netSales": 860000 },
      { "name": "Es Kopi Susu Gula Aren", "quantity": 30, "netSales": 629000 },
      { "name": "Ayam Sambal Matah", "quantity": 18, "netSales": 576000 }
    ],
    "trend": [
      { "label": "Sen", "value": 1840000 },
      { "label": "Sel", "value": 2120000 },
      { "label": "Rab", "value": 1950000 },
      { "label": "Kam", "value": 2360000 },
      { "label": "Jum", "value": 2580000 },
      { "label": "Sab", "value": 2910000 },
      { "label": "Hari ini", "value": 2670000 }
    ]
  }
};
