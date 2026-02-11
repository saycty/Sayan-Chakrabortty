document.addEventListener("DOMContentLoaded", function () {
  const modal = document.createElement("div");
  modal.id = "quick-add-modal";
  modal.style.display = "none";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.background = "rgba(0,0,0,0.25)";
  modal.style.zIndex = "9999";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.innerHTML = `
    <div id="quick-add-content" style="background:#fff;max-width:350px;width:100%;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.18);padding:32px 24px 24px 24px;position:relative;">
      <button id="quick-add-close" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:22px;cursor:pointer;">&times;</button>
      <div id="quick-add-body">Loading...</div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal

  modal.querySelector("#quick-add-close").onclick = function () {
    modal.style.display = "none";
    document.body.style.overflow = "";
  };
  modal.onclick = function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
  };

  // Listen for event
  window.addEventListener("openQuickAdd", function (e) {
    const handle = e.detail.handle;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    // Fetch product data via Shopify AJAX API
    fetch(`/products/${handle}.js`)
      .then((r) => r.json())
      .then((product) => {
        let optionsHtml = "";
        if (product.options && product.options.length > 0) {
          product.options.forEach((option, idx) => {
            optionsHtml += `<div style='margin-bottom:12px;'><div style='font-size:14px;font-weight:500;margin-bottom:4px;'>${option.name}</div>`;
            if (
              option.name.toLowerCase() === "color" ||
              option.values.length <= 4
            ) {
              optionsHtml += option.values
                .map(
                  (v) =>
                    `<button type='button' class='quick-add-option' data-idx='${idx}' data-value='${v}' style='margin-right:8px;margin-bottom:4px;padding:6px 16px;border-radius:6px;border:1px solid #ddd;background:#fafafa;cursor:pointer;'>${v}</button>`,
                )
                .join("");
            } else {
              optionsHtml += `<select class='quick-add-select' data-idx='${idx}' style='width:100%;padding:8px 6px;margin-top:4px;'>`;
              optionsHtml += `<option value=''>Choose your ${option.name.toLowerCase()}</option>`;

              optionsHtml += option.values
                .map((v) => `<option value='${v}'>${v}</option>`)
                .join("");
              optionsHtml += `</select>`;
            }
            optionsHtml += `</div>`;
          });
        }

        document.getElementById("quick-add-body").innerHTML = `
          <div style='display:flex;align-items:center;gap:12px;margin-bottom:12px;'>
            <img src='${product.featured_image}' style='width:60px;height:60px;object-fit:cover;border-radius:6px;'>
            <div>
              <div style='font-size:17px;font-weight:600;'>${product.title}</div>
              <div style='font-size:15px;color:#222;margin:2px 0;'>${(product.price / 100).toLocaleString(undefined, { style: "currency", currency: product.currency || "USD" })}</div>
            </div>
          </div>
          <div style='font-size:13px;color:#444;margin-bottom:16px;'>${product.description.replace(/<[^>]+>/g, "").slice(0, 120)}...</div>
          <form id='quick-add-form'>
            ${optionsHtml}
            <button type='submit' style='width:100%;margin-top:12px;padding:12px 0;background:#111;color:#fff;font-size:15px;font-weight:600;border:none;border-radius:6px;cursor:pointer;'>ADD TO CART</button>
          </form>
        `;
        // Option selection logic
        let selectedOptions = Array(product.options.length).fill("");
        document.querySelectorAll(".quick-add-option").forEach((btn) => {
          btn.onclick = function () {
            const idx = +btn.getAttribute("data-idx");
            selectedOptions[idx] = btn.getAttribute("data-value");
            // Deselect others

            document
              .querySelectorAll(`.quick-add-option[data-idx='${idx}']`)
              .forEach((b) => (b.style.background = "#fafafa"));

            btn.style.background = "#222";

            btn.style.color = "#fff";
          };
        });
        document.querySelectorAll(".quick-add-select").forEach((sel) => {
          sel.onchange = function () {
            const idx = +sel.getAttribute("data-idx");

            selectedOptions[idx] = sel.value;
          };
        });
        // Add to cart logic

        document.getElementById("quick-add-form").onsubmit = function (ev) {
          ev.preventDefault();
          // Find matching variant

          let variant = product.variants.find((v) =>
            v.options.every(
              (opt, i) => !selectedOptions[i] || opt == selectedOptions[i],
            ),
          );
          if (!variant) {
            alert("Please select all options.");
            return;
          }
          fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: variant.id, quantity: 1 }),
          })
            .then((r) => r.json())

            .then((data) => {
              modal.style.display = "none";
              document.body.style.overflow = "";
              alert("Added to cart!");
            });
        };
      });
  });
});
