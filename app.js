"use strict";

const earlyAccessForm = document.querySelector("#early-access-form");
const status = document.querySelector("#form-status");

if (earlyAccessForm && status) {
  earlyAccessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent =
      "Preview aman: submit diblokir. Belum ada endpoint, analytics, cookie, atau penyimpanan data.";
  });
}
