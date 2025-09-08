document.addEventListener("DOMContentLoaded", async () => {
  // Enhanced loading screen
  const loadingScreen = document.getElementById("loadingScreen")
  const body = document.body
  body.classList.add("no-scroll")

  // More dynamic loading dots animation
  const loadingDotsAnimation = setInterval(() => {
    const loadingDots = document.querySelector(".loading-dots")
    if (loadingDots) {
      if (loadingDots.textContent === "...") {
        loadingDots.textContent = "."
      } else {
        loadingDots.textContent += "."
      }
    }
  }, 500)

  // Side navigation functionality
  const sideNav = document.querySelector(".side-nav")
  const mainWrapper = document.querySelector(".main-wrapper")
  const navCollapseBtn = document.querySelector(".nav-collapse-btn")
  const menuToggle = document.querySelector(".menu-toggle")

  // Check if we're on desktop and set the appropriate classes
  if (window.innerWidth >= 992) {
    sideNav.classList.add("collapsed")
    mainWrapper.classList.add("nav-collapsed")
  }

  navCollapseBtn.addEventListener("click", () => {
    sideNav.classList.toggle("collapsed")
    mainWrapper.classList.toggle("nav-collapsed")
  })

  menuToggle.addEventListener("click", () => {
    sideNav.classList.toggle("active")
  })

  // Close side nav when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth < 992 &&
      !e.target.closest(".side-nav") &&
      !e.target.closest(".menu-toggle") &&
      sideNav.classList.contains("active")
    ) {
      sideNav.classList.remove("active")
    }
  })

  // Smooth scrolling for anchor links
  document.querySelectorAll(".side-nav-link").forEach((link) => {
    if (link.getAttribute("href").startsWith("#")) {
      link.addEventListener("click", function (e) {
        e.preventDefault()
        const targetId = this.getAttribute("href")
        const targetElement = document.querySelector(targetId)

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
          })

          // Update active link
          document.querySelectorAll(".side-nav-link").forEach((l) => {
            l.classList.remove("active")
          })
          this.classList.add("active")

          // Close side nav on mobile
          if (window.innerWidth < 992) {
            sideNav.classList.remove("active")
          }
        }
      })
    }
  })

  // Update active nav link on scroll
  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY

    document.querySelectorAll("section[id]").forEach((section) => {
      const sectionTop = section.offsetTop - 100
      const sectionHeight = section.offsetHeight
      const sectionId = section.getAttribute("id")

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        document.querySelectorAll(".side-nav-link").forEach((link) => {
          link.classList.remove("active")
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active")
          }
        })
      }
    })
  })

  // Toast notification system
  const showToast = (message, type = "info") => {
    const toast = document.getElementById("notificationToast")
    const toastBody = toast.querySelector(".toast-body")
    const toastTitle = toast.querySelector(".toast-title")
    const toastIcon = toast.querySelector(".toast-icon")

    toastBody.textContent = message

    // Set toast appearance based on type
    toast.style.borderLeftColor =
      type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#1976d2"

    toastIcon.className = `toast-icon fas fa-${
      type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"
    } me-2`

    toastIcon.style.color =
      type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#1976d2"

    toastTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1)

    const bsToast = new bootstrap.Toast(toast)
    bsToast.show()
  }

  // Check for saved theme preference
  const themeToggle = document.getElementById("themeToggle")

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode")
    themeToggle.checked = true
  } else {
    document.body.classList.add("light-mode")
    themeToggle.checked = false
  }

  // Enhanced theme toggle functionality
  themeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode")
    document.body.classList.toggle("light-mode")
    const isDarkMode = document.body.classList.contains("dark-mode")
    localStorage.setItem("darkMode", isDarkMode)

    // Show toast notification
    showToast(`Switched to ${isDarkMode ? "dark" : "light"} mode`, "success")
  })

  // Improved clear search button functionality
  document.getElementById("clearSearch").addEventListener("click", () => {
    const searchInput = document.getElementById("searchInput")
    if (searchInput.value.length > 0) {
      searchInput.value = ""
      searchInput.focus()
      // Trigger input event to update the search results
      searchInput.dispatchEvent(new Event("input"))
      // Add haptic feedback animation
      searchInput.classList.add("shake-animation")
      setTimeout(() => {
        searchInput.classList.remove("shake-animation")
      }, 400)
    }
  })

  // Enhanced copy to clipboard functionality
  const copyToClipboard = (text, buttonElement) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show enhanced success animation
        const originalIcon = buttonElement.innerHTML
        buttonElement.innerHTML = '<i class="fas fa-check"></i>'
        buttonElement.style.color = '#4caf50'

        // Show toast
        showToast("Copied to clipboard successfully!", "success")

        setTimeout(() => {
          buttonElement.innerHTML = originalIcon
          buttonElement.style.color = ''
        }, 1500)
      })
      .catch((err) => {
        showToast("Failed to copy text: " + err, "error")
      })
  }

  try {
    // Fetch settings with improved error handling
    const settingsResponse = await fetch("/src/settings.json")

    if (!settingsResponse.ok) {
      throw new Error(`Failed to load settings: ${settingsResponse.status} ${settingsResponse.statusText}`)
    }

    const settings = await settingsResponse.json()

    // Enhanced content setter function
    const setContent = (id, property, value, fallback = "") => {
      const element = document.getElementById(id)
      if (element) element[property] = value || fallback
    }

    // Set page content from settings with fallbacks
    const currentYear = new Date().getFullYear()
    setContent("page", "textContent", settings.name, "Hookrest Api's")
    setContent(
      "wm",
      "textContent",
      `© ${currentYear} ${settings.apiSettings?.creator || "Hookrest-Team"}. All rights reserved.`,
    )
    setContent("name", "textContent", settings.name, "Hookrest Api's")
    setContent("sideNavName", "textContent", settings.name || "API")
    setContent("version", "textContent", settings.version, "v1.0")
    setContent("versionHeader", "textContent", settings.header?.status, "Online!")
    setContent("description", "textContent", settings.description, "Simple API's")

    // Set banner image with improved error handling
    const dynamicImage = document.getElementById("dynamicImage")
    if (dynamicImage) {
      if (settings.bannerImage) {
        dynamicImage.src = settings.bannerImage
      }

      // Add loading animation and error handling
      dynamicImage.onerror = () => {
        dynamicImage.src = "/src/banner.jpg" // Fallback image
        showToast("Failed to load banner image, using default", "error")
      }

      dynamicImage.onload = () => {
        dynamicImage.classList.add("fade-in")
      }
    }

    // Set links with enhanced UI
    const apiLinksContainer = document.getElementById("apiLinks")
    if (apiLinksContainer && settings.links?.length) {
      apiLinksContainer.innerHTML = "" // Clear existing links

      settings.links.forEach(({ url, name }, index) => {
        const link = document.createElement("a")
        link.href = url
        link.textContent = name
        link.target = "_blank"
        link.className = "api-link"
        link.style.animationDelay = `${index * 0.1}s`
        link.setAttribute("aria-label", name)

        // Add icon based on URL
        if (url.includes("github")) {
          link.innerHTML = `<i class="fab fa-github"></i> ${name}`
        } else if (url.includes("docs") || url.includes("documentation")) {
          link.innerHTML = `<i class="fas fa-book"></i> ${name}`
        } else {
          link.innerHTML = `<i class="fas fa-external-link-alt"></i> ${name}`
        }

        apiLinksContainer.appendChild(link)
      })
    }

    // Generate OpenAPI specification dynamically
    const openApiSpec = {
      openapi: "3.0.3",
      info: {
        title: settings.name || "Hookrest API",
        version: settings.version || "1.0.0",
        description: settings.description || "Simple and powerful APIs",
        contact: {
          name: settings.apiSettings?.creator || "Hookrest Team",
          url: "https://wa.me/62895323195263",
        },
      },
      servers: [
        {
          url: window.location.origin, // Use your API base URL
          description: "Production server",
        },
      ],
      paths: {},
    };

    // Populate paths from settings.categories
    settings.categories?.forEach((category) => {
      category.items.forEach((item) => {
        const pathKey = item.path.split("?")[0];
        openApiSpec.paths[pathKey] = {
          get: {
            summary: item.name,
            description: item.desc || `This API endpoint allows users to interact with ${item.name}.`,
            parameters: item.path.includes("?")
              ? Array.from(new URLSearchParams(item.path.split("?")[1])).map(([name]) => ({
                  name,
                  in: "query",
                  description: item.params?.[name] || `The query parameter for ${item.name}`,
                  required: true,
                  schema: {
                    type: "string",
                    example: name === "q" ? "What is the capital of France?" : `Enter ${name}...`,
                  },
                }))
              : [],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        response: {
                          type: "string",
                          example: `Response from ${item.name}`,
                        },
                      },
                    },
                  },
                  "image/*": {
                    schema: {
                      type: "string",
                      format: "binary",
                    },
                  },
                  "video/*": {
                    schema: {
                      type: "string",
                      format: "binary",
                    },
                  },
                },
              },
              "400": {
                description: "Bad request",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        };
      });
    });

    // Initialize Swagger UI in the API section
    SwaggerUI({
      spec: openApiSpec,
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset,
      ],
      // Enable "Try it out" functionality
      tryItOutEnabled: true,
      // Customize Swagger UI
      customCss: `
        .swagger-ui .topbar { display: none; } /* Hide Swagger's default topbar */
        .swagger-ui { font-family: 'Inter', sans-serif; }
        .swagger-ui .scheme-container { background: var(--surface-dark); }
        .light-mode .swagger-ui .scheme-container { background: var(--surface-light); }
        .swagger-ui .opblock-tag { border-left: 4px solid var(--primary-blue); }
        .light-mode .swagger-ui .opblock-tag { border-left: 4px solid var(--accent-red); }
        .swagger-ui .opblock .opblock-summary-method { background: var(--primary-blue); }
        .light-mode .swagger-ui .opblock .opblock-summary-method { background: var(--accent-red); }
        .swagger-ui .opblock { border: 1px solid var(--border-dark); border-radius: var(--radius-md); }
        .light-mode .swagger-ui .opblock { border: 1px solid var(--border-light); }
        .swagger-ui .btn { background: var(--primary-blue); border-radius: var(--radius-md); }
        .light-mode .swagger-ui .btn { background: var(--accent-red); }
        .swagger-ui .btn:hover { background: var(--primary-blue-hover); }
        .light-mode .swagger-ui .btn:hover { background: var(--accent-red-hover); }
        .swagger-ui .response-col_status { color: var(--success-green); }
        .swagger-ui .response-col_status.error { color: var(--error-red); }
      `,
    });

    // Enhanced search functionality with improved UX
    const searchInput = document.getElementById("searchInput")
    const clearSearchBtn = document.getElementById("clearSearch")

    searchInput.addEventListener("focus", () => {
      // Add animation to search container on focus
      searchInput.parentElement.classList.add("search-focused")
    })

    searchInput.addEventListener("blur", () => {
      searchInput.parentElement.classList.remove("search-focused")
    })

    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase()

      // Show/hide clear button based on search input with animation
      if (searchTerm.length > 0) {
        clearSearchBtn.style.opacity = "1"
        clearSearchBtn.style.pointerEvents = "auto"
      } else {
        clearSearchBtn.style.opacity = "0"
        clearSearchBtn.style.pointerEvents = "none"
      }

      // Filter Swagger UI operations
      const operations = document.querySelectorAll(".swagger-ui .opblock");
      let visibleCount = 0;

      operations.forEach((operation) => {
        const summary = operation.querySelector(".opblock-summary-description")?.textContent.toLowerCase() || "";
        const path = operation.querySelector(".opblock-summary-path")?.textContent.toLowerCase() || "";
        const tag = operation.closest(".opblock-tag-section")?.querySelector(".opblock-tag")?.textContent.toLowerCase() || "";

        if (searchTerm === "" || summary.includes(searchTerm) || path.includes(searchTerm) || tag.includes(searchTerm)) {
          operation.style.display = "";
          visibleCount++;
        } else {
          operation.style.display = "none";
        }
      });

      // Show/hide tags (categories)
      const tags = document.querySelectorAll(".swagger-ui .opblock-tag");
      tags.forEach((tag) => {
        const tagSection = tag.closest(".opblock-tag-section");
        const visibleOperations = tagSection.querySelectorAll(".opblock:not([style*='display: none'])");
        tagSection.style.display = visibleOperations.length > 0 ? "" : "none";
      });

      // Show enhanced no results message if needed
      const noResultsMsg = document.getElementById("noResultsMessage");
      if (visibleCount === 0 && searchTerm.length > 0) {
        if (!noResultsMsg) {
          const msg = document.createElement("div");
          msg.id = "noResultsMessage";
          msg.className = "no-results-message fade-in";
          msg.innerHTML = `
            <i class="fas fa-search"></i>
            <p>No results found for "<span>${searchTerm}</span>"</p>
            <button id="clearSearchFromMsg" class="btn btn-primary">
              <i class="fas fa-times"></i> Clear Search
            </button>
          `;
          document.getElementById("swagger-ui").prepend(msg);

          document.getElementById("clearSearchFromMsg").addEventListener("click", () => {
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("input"));
            searchInput.focus();
          });
        } else {
          noResultsMsg.querySelector("span").textContent = searchTerm;
          noResultsMsg.style.display = "flex";
        }
      } else if (noResultsMsg) {
        noResultsMsg.style.display = "none";
      }
    })

    // Add bell notification dropdown on click
    const notificationBell = document.querySelector(".notification-bell")
    if (notificationBell) {
      notificationBell.addEventListener("click", () => {
        showToast("2 new updates available", "info")
      })
    }
  } catch (error) {
    console.error("Error loading settings:", error)

    // Show enhanced error notification
    showToast(`Failed to load settings: ${error.message}`, "error")
  } finally {
    // Add enhanced animation to loading screen disappearance
    clearInterval(loadingDotsAnimation)
    setTimeout(() => {
      loadingScreen.classList.add("fade-out")

      setTimeout(() => {
        loadingScreen.style.display = "none"
        body.classList.remove("no-scroll")
      }, 500)
    }, 1000)
  }

  // Animate in API items as they come into view
  const observeElements = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view")
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
      },
    )

    document.querySelectorAll(".swagger-ui .opblock:not(.in-view)").forEach((item) => {
      observer.observe(item)
    })
  }

  // Call on load and whenever content might change
  observeElements()
  // Re-run on window resize
  window.addEventListener("resize", observeElements)
});
