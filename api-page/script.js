// Simple and robust script - guaranteed to work
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, starting initialization...");
    
    // Force remove loading screen after max 3 seconds
    const forceRemoveLoading = setTimeout(() => {
        console.log("Force removing loading screen...");
        removeLoadingScreen();
    }, 3000);

    // Mobile navigation
    initMobileNavigation();
    
    // Initialize with fallback data
    initializeApp();

    function removeLoadingScreen() {
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) {
            loadingScreen.classList.add("fade-out");
            setTimeout(() => {
                loadingScreen.style.display = "none";
                document.body.classList.remove("no-scroll");
                console.log("Loading screen removed successfully");
            }, 500);
        }
    }

    function initMobileNavigation() {
        const sidebar = document.getElementById("sidebar");
        const mobileMenuBtn = document.getElementById("mobileMenuBtn");
        const sidebarClose = document.getElementById("sidebarClose");

        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener("click", () => {
                sidebar.classList.add("show");
            });
        }

        if (sidebarClose && sidebar) {
            sidebarClose.addEventListener("click", () => {
                sidebar.classList.remove("show");
            });
        }

        // Close sidebar when clicking outside
        document.addEventListener("click", (e) => {
            if (window.innerWidth <= 991 && 
                !e.target.closest("#sidebar") && 
                !e.target.closest("#mobileMenuBtn") &&
                sidebar && sidebar.classList.contains("show")) {
                sidebar.classList.remove("show");
            }
        });
    }

    async function initializeApp() {
        try {
            console.log("Fetching settings...");
            
            // Try to fetch settings with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch("/src/settings.json", {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const settings = await response.json();
            console.log("Settings loaded successfully");
            
            // Clear force timeout since we succeeded
            clearTimeout(forceRemoveLoading);
            
            // Initialize with real settings
            initializeWithSettings(settings);
            
        } catch (error) {
            console.warn("Failed to load settings, using fallback:", error);
            
            // Clear force timeout
            clearTimeout(forceRemoveLoading);
            
            // Use fallback settings
            const fallbackSettings = {
                name: "API Documentation",
                version: "v1.0",
                description: "API Documentation Interface",
                categories: [
                    {
                        name: "Sample APIs",
                        items: [
                            {
                                name: "Test API",
                                desc: "Sample API endpoint for testing",
                                path: "/api/test?q=",
                                status: "ready"
                            }
                        ]
                    }
                ]
            };
            
            initializeWithSettings(fallbackSettings);
        }
    }

    function initializeWithSettings(settings) {
        console.log("Initializing with settings...");
        
        // Set page title and basic info
        document.title = settings.name || "API Documentation";
        
        const sidebarTitle = document.getElementById("sidebarTitle");
        const sidebarVersion = document.getElementById("sidebarVersion");
        const mobileTitle = document.getElementById("mobileTitle");
        
        if (sidebarTitle) sidebarTitle.textContent = settings.name || "API Documentation";
        if (sidebarVersion) sidebarVersion.textContent = settings.version || "v1.0";
        if (mobileTitle) mobileTitle.textContent = settings.name || "API Docs";

        // Create API grid
        createApiGrid(settings.categories || []);
        
        // Initialize search
        initializeSearch();
        
        // Initialize modal functionality
        initializeModal(settings);
        
        // Remove loading screen
        setTimeout(() => {
            removeLoadingScreen();
        }, 500);
    }

    function createApiGrid(categories) {
        const apiGrid = document.getElementById("apiGrid");
        if (!apiGrid) return;

        apiGrid.innerHTML = "";

        if (!categories.length) {
            apiGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-database fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No API categories found</p>
                </div>
            `;
            return;
        }

        categories.forEach(category => {
            // Create category section
            const categorySection = document.createElement("div");
            categorySection.className = "api-category";
            categorySection.innerHTML = `<h2 class="category-title">${category.name}</h2>`;

            const categoryGrid = document.createElement("div");
            categoryGrid.className = "category-grid";

            // Sort items alphabetically
            const sortedItems = (category.items || []).sort((a, b) => a.name.localeCompare(b.name));

            sortedItems.forEach(item => {
                const apiCard = createApiCard(item);
                categoryGrid.appendChild(apiCard);
            });

            categorySection.appendChild(categoryGrid);
            apiGrid.appendChild(categorySection);
        });
    }

    function createApiCard(item) {
        const card = document.createElement("div");
        card.className = "api-card";
        card.dataset.apiPath = item.path || "";
        card.dataset.apiName = item.name || "";
        card.dataset.apiDesc = item.desc || "";

        const status = item.status || "ready";
        const statusClass = `status-${status}`;
        const statusIcon = status === "error" ? "fa-exclamation-triangle" : 
                          status === "update" ? "fa-arrow-up" : "fa-circle";

        card.innerHTML = `
            <div class="api-card-header">
                <div class="api-card-info">
                    <h3 class="api-card-title">${item.name || "Unnamed API"}</h3>
                    <p class="api-card-description">${item.desc || "No description available"}</p>
                </div>
                <div class="api-status ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                    <span>${status}</span>
                </div>
            </div>
            <div class="api-card-footer">
                <button class="btn-try-api">
                    <i class="fas fa-code"></i>
                    Try API
                </button>
            </div>
        `;

        return card;
    }

    function initializeSearch() {
        const searchInput = document.getElementById("searchInput");
        const searchClear = document.getElementById("searchClear");

        if (!searchInput) return;

        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Show/hide clear button
            if (searchClear) {
                searchClear.classList.toggle("show", searchTerm.length > 0);
            }

            // Filter API cards
            const apiCards = document.querySelectorAll(".api-card");
            const categories = document.querySelectorAll(".api-category");

            apiCards.forEach(card => {
                const name = card.dataset.apiName.toLowerCase();
                const desc = card.dataset.apiDesc.toLowerCase();
                const matches = name.includes(searchTerm) || desc.includes(searchTerm);
                card.style.display = matches ? "" : "none";
            });

            // Hide empty categories
            categories.forEach(category => {
                const visibleCards = category.querySelectorAll(".api-card:not([style*='display: none'])");
                category.style.display = visibleCards.length > 0 ? "" : "none";
            });
        });

        if (searchClear) {
            searchClear.addEventListener("click", () => {
                searchInput.value = "";
                searchInput.dispatchEvent(new Event("input"));
                searchInput.focus();
            });
        }
    }

    function initializeModal(settings) {
        const modal = document.getElementById("apiModal");
        if (!modal) return;

        const bsModal = new bootstrap.Modal(modal);

        // Handle API card clicks
        document.addEventListener("click", (e) => {
            const apiCard = e.target.closest(".api-card");
            if (!apiCard) return;

            const apiPath = apiCard.dataset.apiPath;
            const apiName = apiCard.dataset.apiName;
            const apiDesc = apiCard.dataset.apiDesc;

            openApiModal(apiPath, apiName, apiDesc, settings);
            bsModal.show();
        });
    }

    function openApiModal(apiPath, apiName, apiDesc, settings) {
        // Set basic info
        const apiEndpoint = document.getElementById("apiEndpoint");
        const apiDescription = document.getElementById("apiDescription");

        if (apiEndpoint) apiEndpoint.textContent = apiPath;
        if (apiDescription) apiDescription.textContent = apiDesc || `API endpoint for ${apiName}`;

        // Parse parameters
        const params = new URLSearchParams(apiPath.split("?")[1] || "");
        const parametersBody = document.getElementById("parametersBody");

        if (parametersBody) {
            parametersBody.innerHTML = "";

            if (params.toString()) {
                Array.from(params.keys()).forEach(param => {
                    const paramRow = document.createElement("div");
                    paramRow.className = "parameter-row";
                    paramRow.innerHTML = `
                        <div class="parameter-name">
                            <span>${param}</span>
                            <span class="parameter-required">* required</span>
                            <span class="parameter-type">string<br>(query)</span>
                        </div>
                        <div class="parameter-description">
                            <span>Parameter for ${apiName}</span>
                            <span class="parameter-example">Example: test value</span>
                        </div>
                    `;
                    parametersBody.appendChild(paramRow);
                });
            } else {
                parametersBody.innerHTML = `
                    <div class="parameter-row">
                        <div class="parameter-name">
                            <span>No parameters</span>
                        </div>
                        <div class="parameter-description">
                            <span>This endpoint does not require parameters</span>
                        </div>
                    </div>
                `;
            }
        }

        // Initialize try it out functionality
        initializeTryItOut(apiPath, apiName, params);
    }

    function initializeTryItOut(apiPath, apiName, params) {
        const btnTryOut = document.getElementById("btnTryOut");
        const executeSection = document.getElementById("executeSection");
        const btnExecute = document.getElementById("btnExecute");
        const btnClear = document.getElementById("btnClear");
        const btnCancel = document.getElementById("btnCancel");

        if (!btnTryOut) return;

        let isTryingOut = false;

        btnTryOut.onclick = () => {
            isTryingOut = !isTryingOut;

            if (isTryingOut) {
                btnTryOut.textContent = "Cancel";
                btnTryOut.style.background = "#da3633";
                btnTryOut.style.borderColor = "#da3633";
                btnTryOut.style.color = "white";
                
                if (executeSection) executeSection.classList.remove("d-none");

                // Add input fields
                addParameterInputs(params);
            } else {
                btnTryOut.textContent = "Try it out";
                btnTryOut.style.background = "none";
                btnTryOut.style.borderColor = "#1f6feb";
                btnTryOut.style.color = "#1f6feb";
                
                if (executeSection) executeSection.classList.add("d-none");

                // Remove input fields
                removeParameterInputs();
                hideResponseSections();
            }
        };

        if (btnExecute) {
            btnExecute.onclick = () => executeApiRequest(apiPath, apiName, params);
        }

        if (btnClear) {
            btnClear.onclick = () => clearParameterInputs();
        }

        if (btnCancel) {
            btnCancel.onclick = () => btnTryOut.click();
        }
    }

    function addParameterInputs(params) {
        const parametersBody = document.getElementById("parametersBody");
        if (!parametersBody) return;

        Array.from(params.keys()).forEach(param => {
            const paramRow = Array.from(parametersBody.children).find(
                row => row.querySelector(".parameter-name span")?.textContent === param
            );

            if (paramRow) {
                const paramDesc = paramRow.querySelector(".parameter-description");
                if (paramDesc && !paramDesc.querySelector(".parameter-input")) {
                    const input = document.createElement("input");
                    input.className = "parameter-input";
                    input.type = "text";
                    input.placeholder = `Enter ${param}...`;
                    input.dataset.param = param;
                    paramDesc.appendChild(input);
                }
            }
        });
    }

    function removeParameterInputs() {
        document.querySelectorAll(".parameter-input").forEach(input => input.remove());
    }

    function clearParameterInputs() {
        document.querySelectorAll(".parameter-input").forEach(input => {
            input.value = "";
            input.style.borderColor = "#30363d";
        });
    }

    function hideResponseSections() {
        const sections = ["curlBlock", "requestUrlBlock", "responseBlock", "loadingSection"];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add("d-none");
        });

        const defaultResponses = document.getElementById("defaultResponses");
        if (defaultResponses) defaultResponses.classList.remove("d-none");
    }

    async function executeApiRequest(apiPath, apiName, params) {
        const inputs = document.querySelectorAll(".parameter-input");
        const newParams = new URLSearchParams();
        let isValid = true;

        // Validate inputs
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = "#da3633";
            } else {
                input.style.borderColor = "#30363d";
                newParams.append(input.dataset.param, input.value.trim());
            }
        });

        if (!isValid) {
            showToast("Please fill in all required fields", "error");
            return;
        }

        // Show loading
        const loadingSection = document.getElementById("loadingSection");
        const defaultResponses = document.getElementById("defaultResponses");
        
        if (loadingSection) loadingSection.classList.remove("d-none");
        if (defaultResponses) defaultResponses.classList.add("d-none");

        // Build API URL
        const apiUrl = `${window.location.origin}${apiPath.split("?")[0]}?${newParams.toString()}`;

        // Show curl and request URL
        showCurlCommand(apiUrl);
        showRequestUrl(apiUrl);

        try {
            const response = await fetch(apiUrl);
            
            // Hide loading
            if (loadingSection) loadingSection.classList.add("d-none");

            // Show response
            await showApiResponse(response, apiName);
            
            showToast("Request completed successfully", "success");
        } catch (error) {
            console.error("API request failed:", error);
            
            // Hide loading
            if (loadingSection) loadingSection.classList.add("d-none");
            
            // Show error response
            showErrorResponse(error);
            
            showToast("Request failed", "error");
        }
    }

    function showCurlCommand(apiUrl) {
        const curlBlock = document.getElementById("curlBlock");
        const curlCode = document.getElementById("curlCode");
        
        if (curlBlock && curlCode) {
            const curlCommand = `curl -X 'GET' \\\n  '${apiUrl}' \\\n  -H 'accept: */*'`;
            curlCode.textContent = curlCommand;
            curlBlock.classList.remove("d-none");
        }
    }

    function showRequestUrl(apiUrl) {
        const requestUrlBlock = document.getElementById("requestUrlBlock");
        const requestUrlCode = document.getElementById("requestUrlCode");
        
        if (requestUrlBlock && requestUrlCode) {
            requestUrlCode.textContent = apiUrl;
            requestUrlBlock.classList.remove("d-none");
        }
    }

    async function showApiResponse(response, apiName) {
        const responseBlock = document.getElementById("responseBlock");
        const responseCode = document.getElementById("responseCode");
        const responseBody = document.getElementById("responseBody");
        const responseHeaders = document.getElementById("responseHeaders");

        if (!responseBlock || !responseCode || !responseBody) return;

        // Show response block
        responseBlock.classList.remove("d-none");

        // Set response code
        responseCode.textContent = response.status;
        responseCode.className = `response-code ${response.ok ? "success" : "error"}`;

        try {
            // Handle different content types
            const contentType = response.headers.get("Content-Type") || "";

            if (contentType.startsWith("image/")) {
                // Handle image response
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);

                const img = document.createElement("img");
                img.src = imageUrl;
                img.alt = apiName;
                img.className = "response-image";
                img.style.maxWidth = "100%";
                img.style.height = "auto";
                img.style.borderRadius = "8px";

                responseBody.innerHTML = "";
                responseBody.appendChild(img);

                // Add download button
                const downloadBtn = document.createElement("div");
                downloadBtn.className = "image-actions";
                downloadBtn.innerHTML = `
                    <button class="btn-download-image" onclick="downloadImage('${imageUrl}', '${apiName}')">
                        <i class="fas fa-download"></i>
                        Download Image
                    </button>
                `;
                responseBody.appendChild(downloadBtn);

            } else {
                // Handle JSON response
                const data = await response.json();
                const formattedJson = syntaxHighlight(JSON.stringify(data, null, 2));
                responseBody.innerHTML = formattedJson;
            }

            // Show response headers
            if (responseHeaders) {
                const headers = {};
                response.headers.forEach((value, key) => {
                    headers[key] = value;
                });
                responseHeaders.textContent = Object.entries(headers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\n");
            }

        } catch (error) {
            console.error("Error processing response:", error);
            responseBody.textContent = "Error processing response: " + error.message;
        }
    }

    function showErrorResponse(error) {
        const responseBlock = document.getElementById("responseBlock");
        const responseCode = document.getElementById("responseCode");
        const responseBody = document.getElementById("responseBody");

        if (responseBlock && responseCode && responseBody) {
            responseBlock.classList.remove("d-none");
            responseCode.textContent = "500";
            responseCode.className = "response-code error";
            responseBody.textContent = JSON.stringify({
                error: error.message,
                status: false
            }, null, 2);
        }
    }

    function syntaxHighlight(json) {
        json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
            (match) => {
                let cls = "json-number";
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = "json-key";
                    } else {
                        cls = "json-string";
                    }
                } else if (/true|false/.test(match)) {
                    cls = "json-boolean";
                } else if (/null/.test(match)) {
                    cls = "json-null";
                }
                return '<span class="' + cls + '">' + match + "</span>";
            }
        );
    }

    function showToast(message, type = "info") {
        const toast = document.getElementById("toast");
        if (!toast) return;

        const toastBody = toast.querySelector(".toast-body");
        const toastIcon = toast.querySelector(".toast-icon");

        if (toastBody) toastBody.textContent = message;

        const colors = {
            success: "#238636",
            error: "#da3633",
            info: "#1f6feb"
        };

        const icons = {
            success: "fa-check-circle",
            error: "fa-exclamation-circle",
            info: "fa-info-circle"
        };

        if (toastIcon) {
            toastIcon.className = `toast-icon fas ${icons[type] || icons.info} me-2`;
            toastIcon.style.color = colors[type] || colors.info;
        }

        toast.style.borderLeftColor = colors[type] || colors.info;

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    // Global functions for copy and download
    window.copyToClipboard = function(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalIcon = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.style.color = "#238636";
            
            showToast("Copied to clipboard!", "success");
            
            setTimeout(() => {
                button.innerHTML = originalIcon;
                button.style.color = "";
            }, 1500);
        }).catch(err => {
            showToast("Failed to copy: " + err, "error");
        });
    };

    window.downloadImage = function(imageUrl, apiName) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `${apiName.toLowerCase().replace(/\s+/g, "-")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Image download started!", "success");
    };

    // Initialize copy buttons
    document.addEventListener("click", (e) => {
        if (e.target.closest("#copyCurl")) {
            const curlCode = document.getElementById("curlCode");
            if (curlCode) copyToClipboard(curlCode.textContent, e.target.closest("#copyCurl"));
        }
        
        if (e.target.closest("#copyUrl")) {
            const requestUrlCode = document.getElementById("requestUrlCode");
            if (requestUrlCode) copyToClipboard(requestUrlCode.textContent, e.target.closest("#copyUrl"));
        }
        
        if (e.target.closest("#copyResponse")) {
            const responseBody = document.getElementById("responseBody");
            if (responseBody) copyToClipboard(responseBody.textContent, e.target.closest("#copyResponse"));
        }
        
        if (e.target.closest("#downloadResponse")) {
            const responseBody = document.getElementById("responseBody");
            if (responseBody) {
                const data = responseBody.textContent;
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "api-response.json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast("Response downloaded!", "success");
            }
        }
    });

    console.log("Script initialization completed");
});
