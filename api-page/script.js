document.addEventListener("DOMContentLoaded", async () => {
  // Enhanced loading screen
  const loadingScreen = document.getElementById("loadingScreen");
  const body = document.body;
  body.classList.add("no-scroll");

  // Dynamic loading dots animation
  const loadingDotsAnimation = setInterval(() => {
    const loadingDots = document.querySelector(".loading-dots");
    if (loadingDots) {
      if (loadingDots.textContent === "...") {
        loadingDots.textContent = ".";
      } else {
        loadingDots.textContent += ".";
      }
    }
  }, 500);

  // Side navigation functionality
  const sideNav = document.querySelector(".side-nav");
  const mainWrapper = document.querySelector(".main-wrapper");
  const navCollapseBtn = document.querySelector(".nav-collapse-btn");
  const menuToggle = document.querySelector(".menu-toggle");

  // Check if we're on desktop and set the appropriate classes
  if (window.innerWidth >= 992) {
    sideNav.classList.add("collapsed");
    mainWrapper.classList.add("nav-collapsed");
  }

  navCollapseBtn.addEventListener("click", () => {
    sideNav.classList.toggle("collapsed");
    mainWrapper.classList.toggle("nav-collapsed");
  });

  menuToggle.addEventListener("click", () => {
    sideNav.classList.toggle("active");
  });

  // Close side nav when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth < 992 &&
      !e.target.closest(".side-nav") &&
      !e.target.closest(".menu-toggle") &&
      sideNav.classList.contains("active")
    ) {
      sideNav.classList.remove("active");
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll(".side-nav-link").forEach((link) => {
    if (link.getAttribute("href").startsWith("#")) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
          });

          // Update active link
          document.querySelectorAll(".side-nav-link").forEach((l) => {
            l.classList.remove("active");
          });
          this.classList.add("active");

          // Close side nav on mobile
          if (window.innerWidth < 992) {
            sideNav.classList.remove("active");
          }
        }
      });
    }
  });

  // Update active nav link on scroll
  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY;

    document.querySelectorAll("section[id]").forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        document.querySelectorAll(".side-nav-link").forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  });

  // Toast notification system
  const showToast = (message, type = "info") => {
    const toast = document.getElementById("notificationToast");
    const toastBody = toast.querySelector(".toast-body");
    const toastTitle = toast.querySelector(".toast-title");
    const toastIcon = toast.querySelector(".toast-icon");

    toastBody.textContent = message;

    // Set toast appearance based on type
    toast.style.borderLeftColor =
      type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#e63946";

    toastIcon.className = `toast-icon fas fa-${
      type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"
    } me-2`;

    toastIcon.style.color =
      type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#e63946";

    toastTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  };

  // Clear search button functionality
  document.getElementById("clearSearch").addEventListener("click", () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput.value.length > 0) {
      searchInput.value = "";
      searchInput.focus();
      searchInput.dispatchEvent(new Event("input"));
      searchInput.classList.add("shake-animation");
      setTimeout(() => {
        searchInput.classList.remove("shake-animation");
      }, 400);
    }
  });

  // Search functionality for Swagger UI
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const clearSearchBtn = document.getElementById("clearSearch");

    // Show/hide clear button
    if (searchTerm.length > 0) {
      clearSearchBtn.style.opacity = "1";
      clearSearchBtn.style.pointerEvents = "auto";
    } else {
      clearSearchBtn.style.opacity = "0";
      clearSearchBtn.style.pointerEvents = "none";
    }

    // Trigger Swagger UI search
    const swaggerSearchInput = document.querySelector(".swagger-ui .filter .input");
    if (swaggerSearchInput) {
      swaggerSearchInput.value = searchTerm;
      swaggerSearchInput.dispatchEvent(new Event("input"));
    }
  });

  try {
    // Fetch settings
    const settingsResponse = await fetch("/src/settings.json");
    if (!settingsResponse.ok) {
      throw new Error(`Failed to load settings: ${settingsResponse.status} ${settingsResponse.statusText}`);
    }

    const settings = await settingsResponse.json();

    // Set page content
    const setContent = (id, property, value, fallback = "") => {
      const element = document.getElementById(id);
      if (element) element[property] = value || fallback;
    };

    const currentYear = new Date().getFullYear();
    setContent("page", "textContent", settings.name, "Hookrest API");
    setContent(
      "wm",
      "textContent",
      `© ${currentYear} ${settings.apiSettings?.creator || "Hookrest-Team"}. All rights reserved.`
    );
    setContent("name", "textContent", settings.name, "Hookrest API");
    setContent("sideNavName", "textContent", settings.name, "API");
    setContent("version", "textContent", settings.version, "v1.0");
    setContent("versionHeader", "textContent", settings.header?.status, "Online!");
    setContent("description", "textContent", settings.description, "Simple APIs");

    // Set banner image
    const dynamicImage = document.getElementById("dynamicImage");
    if (dynamicImage && settings.bannerImage) {
      dynamicImage.src = settings.bannerImage;
      dynamicImage.onerror = () => {
        dynamicImage.src = "/src/banner.jpg";
        showToast("Failed to load banner image, using default", "error");
      };
      dynamicImage.onload = () => {
        dynamicImage.classList.add("fade-in");
      };
    }

    // Set links
    const apiLinksContainer = document.getElementById("apiLinks");
    if (apiLinksContainer && settings.links?.length) {
      apiLinksContainer.innerHTML = "";
      settings.links.forEach(({ url, name }, index) => {
        const link = document.createElement("a");
        link.href = url;
        link.textContent = name;
        link.target = "_blank";
        link.className = "api-link";
        link.style.animationDelay = `${index * 0.1}s`;
        link.setAttribute("aria-label", name);

        if (url.includes("github")) {
          link.innerHTML = `<i class="fab fa-github"></i> ${name}`;
        } else if (url.includes("docs") || url.includes("documentation")) {
          link.innerHTML = `<i class="fas fa-book"></i> ${name}`;
        } else {
          link.innerHTML = `<i class="fas fa-external-link-alt"></i> ${name}`;
        }

        apiLinksContainer.appendChild(link);
      });
    }

    // Initialize Swagger UI
    SwaggerUIBundle({
      url: "/src/openapi.yaml",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: "StandaloneLayout",
      onComplete: () => {
        // Hide loading screen after Swagger UI is loaded
        clearInterval(loadingDotsAnimation);
        setTimeout(() => {
          loadingScreen.classList.add("fade-out");
          setTimeout(() => {
            loadingScreen.style.display = "none";
            body.classList.remove("no-scroll");
          }, 500);
        }, 1000);
      },
      onFailure: (error) => {
        showToast(`Failed to load Swagger UI: ${error.message}`, "error");
        // Display fallback message
        document.getElementById("apiContent").innerHTML = `
          <div class="no-results-message">
            <i class="fas fa-database"></i>
            <p>Failed to load API documentation</p>
            <button class="btn btn-primary" onclick="location.reload()">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        `;
      }
    });

    // Notification bell click
    const notificationBell = document.querySelector(".notification-bell");
    if (notificationBell) {
      notificationBell.addEventListener("click", () => {
        showToast("2 new updates available", "info");
      });
    }
  } catch (error) {
    console.error("Error loading settings:", error);
    showToast(`Failed to load settings: ${error.message}`, "error");
    clearInterval(loadingDotsAnimation);
    setTimeout(() => {
      loadingScreen.classList.add("fade-out");
      setTimeout(() => {
        loadingScreen.style.display = "none";
        body.classList.remove("no-scroll");
      }, 500);
    }, 1000);
  }
});
