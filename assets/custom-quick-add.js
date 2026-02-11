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
  modal.style.alignItems = "flex-end";
  modal.innerHTML = `
    <div id="quick-add-content" style="background:#fff;width:100%;border-radius:16px 16px 0 0;box-shadow:0 -4px 16px rgba(0,0,0,0.15);padding:24px 20px;position:relative;max-height:85vh;overflow-y:auto;">
      <div style="width:40px;height:4px;background:#ddd;border-radius:2px;margin:0 auto 16px;"></div>
      <button id="quick-add-close" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#222;">&times;</button>
      <div id="quick-add-body">Loading...</div>
    </div>
  `;
  document.body.appendChild(modal);

  const style = document.createElement("style");
  style.innerHTML = `
    @media (min-width: 769px) {
      #quick-add-modal {
        align-items: center !important;
      }
      #quick-add-content {
        width: auto !important;
        max-width: 500px !important;
        border-radius: 12px !important;
        padding: 32px 24px 24px 24px !important;
        max-height: 90vh !important;
      }
      #quick-add-content > div:first-child {
        display: none !important;
      }
    }

    @media (max-width: 768px) {
      #quick-add-content {
        padding: 24px 16px 32px 16px !important;
      }
      .quick-add-option {
        padding: 8px 12px !important;
        font-size: 13px !important;
        margin-right: 6px !important;
      }
      .quick-add-select {
        font-size: 14px !important;
        padding: 10px 8px !important;
      }
      #quick-add-form button[type="submit"] {
        padding: 14px 0 !important;
        font-size: 15px !important;
        margin-top: 16px !important;
      }
    }
  `;
  document.head.appendChild(style);

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

  window.addEventListener("openQuickAdd", function (e) {
    const handle = e.detail.handle;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    fetch(`/products/${handle}.js`)
      .then((r) => r.json())
      .then((product) => {
        let optionsHtml = "";
        if (product.options && product.options.length > 0) {
          product.options.forEach((option, idx) => {
            optionsHtml += `<div style='margin-bottom:16px;'><div style='font-size:14px;font-weight:600;margin-bottom:8px;color:#222;'>${option.name}</div>`;
            if (
              option.name.toLowerCase() === "color" ||
              option.values.length <= 4
            ) {
              optionsHtml += option.values
                .map(
                  (v) =>
                    `<button type='button' class='quick-add-option' data-idx='${idx}' data-value='${v}' style='margin-right:8px;margin-bottom:8px;padding:8px 16px;border-radius:6px;border:1px solid #ddd;background:#fafafa;cursor:pointer;font-size:13px;transition:all 0.2s;'>${v}</button>`,
                )
                .join("");
            } else {
              optionsHtml += `<select class='quick-add-select' data-idx='${idx}' style='width:100%;padding:10px 12px;border-radius:6px;border:1px solid #ddd;font-size:14px;background:#fafafa;'>`;
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
          <div style='display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;'>
            <img src='${product.featured_image}' style='width:70px;height:70px;object-fit:cover;border-radius:8px;flex-shrink:0;'>
            <div style='flex:1;'>
              <div style='font-size:16px;font-weight:700;color:#222;line-height:1.3;'>${product.title}</div>
              <div style='font-size:16px;color:#222;margin:6px 0;font-weight:600;'>${(product.price / 100).toLocaleString(undefined, { style: "currency", currency: product.currency || "USD" })}</div>
            </div>
          </div>
          <form id='quick-add-form'>
            ${optionsHtml}
            <button type='submit' style='width:100%;margin-top:16px;padding:14px 0;background:#222;color:#fff;font-size:15px;font-weight:700;border:none;border-radius:8px;cursor:pointer;transition:background 0.2s;'>ADD TO CART</button>
          </form>
        `;
        // Option selection logic
        let selectedOptions = Array(product.options.length).fill("");
        document.querySelectorAll(".quick-add-option").forEach((btn) => {
          btn.onclick = function () {
            const idx = +btn.getAttribute("data-idx");
            selectedOptions[idx] = btn.getAttribute("data-value");
            document
              .querySelectorAll(`.quick-add-option[data-idx='${idx}']`)
              .forEach((b) => {
                b.style.background = "#fafafa";
                b.style.color = "#222";
              });

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
        document.getElementById("quick-add-form").onsubmit = function (ev) {
          ev.preventDefault();
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
