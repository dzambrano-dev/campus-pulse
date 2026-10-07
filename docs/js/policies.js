/**
 * policies.js
 * Loads the Terms of Service, Privacy Policy and User Policy and shows them in a dialog
 */


let policiesPromise;
let dialog;


// Fetch the policy documents once
export function loadPolicies() {
    if (!policiesPromise) {
        policiesPromise = fetch("assets/policies.json")
            .then(response => {
                if (!response.ok) throw new Error("Failed to load policies");
                return response.json();
            })
            .catch(error => {
                policiesPromise = null;
                throw error;
            });
    }
    return policiesPromise;
}


// Open the policy viewer, optionally on a specific document
export async function openPolicies(documentId) {
    const policies = await loadPolicies();
    if (!dialog) dialog = createDialog(policies);

    const tabs = dialog.querySelectorAll("[role='tab']");
    const target = [...tabs].find(tab => tab.dataset.doc === documentId) || tabs[0];
    selectTab(target);

    dialog.showModal();
    target.focus();
}


function createDialog(policies) {
    const element = document.createElement("dialog");
    element.className = "policy-dialog";
    element.setAttribute("aria-labelledby", "policy-dialog-title");

    const tabs = policies.documents.map(doc => `
        <button role="tab" id="policy-tab-${doc.id}" data-doc="${doc.id}" aria-controls="policy-panel-${doc.id}" aria-selected="false" tabindex="-1">${doc.shortTitle}</button>
    `).join("");

    const panels = policies.documents.map(doc => `
        <article role="tabpanel" id="policy-panel-${doc.id}" aria-labelledby="policy-tab-${doc.id}" tabindex="0" hidden>
            <h3 class="policy-doc-title">${doc.title}</h3>
            <p class="policy-summary">${doc.summary}</p>
            ${doc.sections.map(section => `
                <section class="policy-section">
                    <h4>${section.heading}</h4>
                    ${section.body.map(paragraph => `<p>${paragraph}</p>`).join("")}
                </section>
            `).join("")}
        </article>
    `).join("");

    element.innerHTML = `
        <div class="policy-header">
            <div>
                <h2 id="policy-dialog-title">Terms and policies</h2>
                <p class="policy-updated">Last updated ${policies.lastUpdated}</p>
            </div>
            <button class="icon-button policy-close" aria-label="Close">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
        </div>
        <div class="policy-tabs" role="tablist" aria-label="Policies">${tabs}</div>
        <div class="policy-body">
            ${panels}
            <p class="policy-contact">Questions? <a href="${policies.contact}" target="_blank" rel="noopener">Contact the project maintainers</a>.</p>
        </div>
    `;

    // Close button and backdrop click
    element.querySelector(".policy-close").addEventListener("click", () => element.close());
    element.addEventListener("click", (event) => {
        if (event.target === element) element.close();
    });

    // Tabs, with arrow key support
    const tabButtons = [...element.querySelectorAll("[role='tab']")];
    tabButtons.forEach((tab, index) => {
        tab.addEventListener("click", () => selectTab(tab));
        tab.addEventListener("keydown", (event) => {
            const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
            if (!step) return;
            event.preventDefault();
            const next = tabButtons[(index + step + tabButtons.length) % tabButtons.length];
            selectTab(next);
            next.focus();
        });
    });

    document.body.appendChild(element);
    return element;
}


function selectTab(selected) {
    dialog.querySelectorAll("[role='tab']").forEach(tab => {
        const isSelected = tab === selected;
        tab.setAttribute("aria-selected", String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
        document.getElementById(tab.getAttribute("aria-controls")).hidden = !isSelected;
    });
    dialog.querySelector(".policy-body").scrollTop = 0;
}
