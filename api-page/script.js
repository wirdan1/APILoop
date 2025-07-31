// Ensure DOM is fully loaded before running script
document.addEventListener("DOMContentLoaded", async () => {
  // Main DOM Element Selectors
  const DOM = {
    loadingScreen: document.getElementById("loadingScreen"),
    body: document.body,
    sideNav: document.querySelector(".side-nav"),
    mainWrapper: document.querySelector(".main-wrapper"),
    menuToggle: document.querySelector(".menu-toggle"),
    themeToggle: document.getElementById("themeToggle"),
    searchInput: document.getElementById("searchInput"),
    clearSearchBtn: document.getElementById("clearSearch"),
    apiContent: document.getElementById("apiContent"),
    notificationToast: document.getElementById("notificationToast"), // Toast for general notifications
    notificationBell: document.getElementById("notificationBell"), // Bell button
    notificationBadge: document.getElementById("notificationBadge"), // Red badge
    modal: {
      instance: null, // Will be initialized later
      element: document.getElementById("apiResponseModal"),
      label: document.getElementById("apiResponseModalLabel"),
      desc: document.getElementById("apiResponseModalDesc"),
      content: document.getElementById("apiResponseContent"),
      container: document.getElementById("responseContainer"),
      endpoint: document.getElementById("apiEndpoint"),
      spinner: document.getElementById("apiResponseLoading"),
      queryInputContainer: document.getElementById("apiQueryInputContainer"),
      submitBtn: document.getElementById("submitQueryBtn"),
      copyEndpointBtn: document.getElementById("copyEndpoint"),
      copyResponseBtn: document.getElementById("copyResponse"),
    },
    // Elements populated from settings.json
    pageTitle: document.getElementById("page"),
    wm: document.getElementById("wm"),
    appName: document.getElementById("name"),
    sideNavName: document.getElementById("sideNavName"),
    versionBadge: document.getElementById("version"),
    versionHeaderBadge: document.getElementById("versionHeader"),
    appDescription: document.getElementById("description"),
    dynamicImage: document.getElementById("dynamicImage"), // ID for banner image in hero section
    apiLinksContainer: document.getElementById("apiLinks"),
  }

  let settings = {} // To store data from settings.json
  let currentApiData = null // To store API data currently displayed in the modal
  let allNotifications = [] // To store all notifications from JSON

  // --- URL Parameter Functions ---
  const getUrlParameter = (name) => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(name)
  }

  const updateUrlParameter = (key, value) => {
    const url = new URL(window.location)
    if (value) {
      url.searchParams.set(key, value)
    } else {
      url.searchParams.delete(key)
    }
    window.history.replaceState({}, "", url)
  }

  const removeUrlParameter = (key) => {
    const url = new URL(window.location)
    url.searchParams.delete(key)
    window.history.replaceState({}, "", url)
  }

  // --- Share API Functions ---
  const generateShareLink = (apiData) => {
    const url = new URL(window.location.origin + window.location.pathname)
    // Remove parameters from the path before sharing
    const cleanPath = apiData.path.split("?")[0]
    url.searchParams.set("share", cleanPath)
    return url.toString()
  }

  const parseSharedApiFromUrl = () => {
    const sharedPath = getUrlParameter("share")
    return sharedPath || null
  }

  const findApiByPath = (path) => {
    if (!settings || !settings.categories) return null

    for (const category of settings.categories) {
      for (const item of category.items) {
        // Compare both full path and clean path (without parameters)
        const itemCleanPath = item.path.split("?")[0]
        if (item.path === path || itemCleanPath === path) {
          return {
            path: item.path,
            name: item.name,
            desc: item.desc,
            params: item.params || null,
            innerDesc: item.innerDesc || null,
          }
        }
      }
    }
    return null
  }

  const handleShareApi = async () => {
    if (!currentApiData) return

    const shareLink = generateShareLink(currentApiData)

    try {
      await navigator.clipboard.writeText(shareLink)
      showToast("Share link copied to clipboard!", "success", "Share API")

      // Update URL to reflect the shared API
      // Update URL to reflect the shared API (clean path without parameters)
      const cleanPath = currentApiData.path.split("?")[0]
      updateUrlParameter("share", cleanPath)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = shareLink
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        showToast("Share link copied to clipboard!", "success", "Share API")
        showToast("Share link copied to clipboard!", "success", "Share API")
        // Update URL to reflect the shared API (clean path without parameters)
        const cleanPath = currentApiData.path.split("?")[0]
        updateUrlParameter("share", cleanPath)
      } catch (fallbackErr) {
        showToast("Failed to copy share link", "error")
      }
      document.body.removeChild(textArea)
    }
  }

  const openSharedApi = async (sharedPath) => {
    // Wait for settings to be loaded
    if (!settings || !settings.categories) {
      setTimeout(() => openSharedApi(sharedPath), 100)
      return
    }

    // Find the API in settings using the path
    const apiData = findApiByPath(sharedPath)

    if (!apiData) {
      showToast("The shared API is no longer available", "error", "Share Link")
      // Clean up URL parameter
      removeUrlParameter("share")
      return
    }

    // Set current API data and open modal
    currentApiData = apiData
    setupModalForApi(currentApiData)

    // Show modal after a short delay to ensure DOM is ready
    setTimeout(() => {
      DOM.modal.instance.show()
      showToast(`Opened shared API: ${apiData.name}`, "info", "Share Link")
    }, 500)
  }

  // --- Utility Functions ---
  const showToast = (message, type = "info", title = "Notification") => {
    if (!DOM.notificationToast) return
    const toastBody = DOM.notificationToast.querySelector(".toast-body")
    const toastTitleEl = DOM.notificationToast.querySelector(".toast-title")
    const toastIcon = DOM.notificationToast.querySelector(".toast-icon")

    toastBody.textContent = message
    toastTitleEl.textContent = title

    const typeConfig = {
      success: { color: "var(--success-color)", icon: "fa-check-circle" },
      error: { color: "var(--error-color)", icon: "fa-exclamation-circle" },
      info: { color: "var(--primary-color)", icon: "fa-info-circle" },
      notification: { color: "var(--accent-color)", icon: "fa-bell" },
    }

    const config = typeConfig[type] || typeConfig.info

    DOM.notificationToast.style.borderLeftColor = config.color
    toastIcon.className = `toast-icon fas ${config.icon} me-2`
    toastIcon.style.color = config.color

    let bsToast = window.bootstrap.Toast.getInstance(DOM.notificationToast)
    if (!bsToast) {
      bsToast = new window.bootstrap.Toast(DOM.notificationToast)
    }
    bsToast.show()
  }

  const copyToClipboard = async (text, btnElement) => {
    if (!navigator.clipboard) {
      showToast("Browser does not support copying to clipboard.", "error")
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      const originalIcon = btnElement.innerHTML
      btnElement.innerHTML = '<i class="fas fa-check"></i>'
      btnElement.classList.add("copy-success")
      showToast("Successfully copied to clipboard!", "success")

      setTimeout(() => {
        btnElement.innerHTML = originalIcon
        btnElement.classList.remove("copy-success")
      }, 1500)
    } catch (err) {
      showToast("Failed to copy text: " + err.message, "error")
    }
  }

  const debounce = (func, delay) => {
    let timeout
    return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), delay)
    }
  }

  // --- Notification Functions ---
  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (!response.ok) throw new Error(`Failed to load notifications: ${response.status}`)
      allNotifications = await response.json()
      updateNotificationBadge()
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  const getSessionReadNotificationIds = () => {
    const ids = sessionStorage.getItem("sessionReadNotificationIds")
    return ids ? JSON.parse(ids) : []
  }

  const addSessionReadNotificationId = (id) => {
    const ids = getSessionReadNotificationIds()
    if (!ids.includes(id)) {
      ids.push(id)
      sessionStorage.setItem("sessionReadNotificationIds", JSON.stringify(ids))
    }
  }

  const updateNotificationBadge = () => {
    if (!DOM.notificationBadge || !allNotifications.length) {
      if (DOM.notificationBadge) DOM.notificationBadge.classList.remove("active")
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessionReadIds = getSessionReadNotificationIds()

    const unreadNotifications = allNotifications.filter((notif) => {
      const notificationDate = new Date(notif.date)
      notificationDate.setHours(0, 0, 0, 0)
      return !notif.read && notificationDate <= today && !sessionReadIds.includes(notif.id)
    })

    if (unreadNotifications.length > 0) {
      DOM.notificationBadge.classList.add("active")
      DOM.notificationBell.setAttribute("aria-label", `Notifications (${unreadNotifications.length} unread)`)
    } else {
      DOM.notificationBadge.classList.remove("active")
      DOM.notificationBell.setAttribute("aria-label", "No new notifications")
    }
  }

  const handleNotificationBellClick = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sessionReadIds = getSessionReadNotificationIds()

    const notificationsToShow = allNotifications.filter((notif) => {
      const notificationDate = new Date(notif.date)
      notificationDate.setHours(0, 0, 0, 0)
      return !notif.read && notificationDate <= today && !sessionReadIds.includes(notif.id)
    })

    if (notificationsToShow.length > 0) {
      notificationsToShow.forEach((notif) => {
        showToast(notif.message, "notification", `Notification (${new Date(notif.date).toLocaleDateString("en-US")})`)
        addSessionReadNotificationId(notif.id)
      })
    } else {
      showToast("No new notifications at this time.", "info")
    }

    updateNotificationBadge()
  }

  // --- Main Initialization and Event Listeners ---
  const init = async () => {
    setupEventListeners()
    initTheme()
    initSideNav()
    initModal()
    await loadNotifications()

    try {
      const response = await fetch("/api/settings")
      if (!response.ok) throw new Error(`Failed to load settings: ${response.status}`)
      settings = await response.json()
      populatePageContent()
      renderApiCategories()
      observeApiItems()

      // Check for shared API in URL after everything is loaded
      const sharedPath = parseSharedApiFromUrl()
      if (sharedPath) {
        openSharedApi(sharedPath)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      showToast(`Failed to load settings: ${error.message}`, "error")
      displayErrorState("Could not load API configuration.")
    } finally {
      hideLoadingScreen()
    }
  }

  const setupEventListeners = () => {
    if (DOM.menuToggle) DOM.menuToggle.addEventListener("click", toggleSideNavMobile)
    if (DOM.themeToggle) DOM.themeToggle.addEventListener("change", handleThemeToggle)
    if (DOM.searchInput) DOM.searchInput.addEventListener("input", debounce(handleSearch, 300))
    if (DOM.clearSearchBtn) DOM.clearSearchBtn.addEventListener("click", clearSearch)

    if (DOM.notificationBell) DOM.notificationBell.addEventListener("click", handleNotificationBellClick)

    if (DOM.apiContent) DOM.apiContent.addEventListener("click", handleApiGetButtonClick)

    if (DOM.modal.copyEndpointBtn)
      DOM.modal.copyEndpointBtn.addEventListener("click", () =>
        copyToClipboard(DOM.modal.endpoint.textContent, DOM.modal.copyEndpointBtn),
      )
    if (DOM.modal.copyResponseBtn)
      DOM.modal.copyResponseBtn.addEventListener("click", () =>
        copyToClipboard(DOM.modal.content.textContent, DOM.modal.copyResponseBtn),
      )
    if (DOM.modal.submitBtn) DOM.modal.submitBtn.addEventListener("click", handleSubmitQuery)

    window.addEventListener("scroll", handleScroll)
    document.addEventListener("click", closeSideNavOnClickOutside)
  }

  // --- Loading Screen Management ---
  const hideLoadingScreen = () => {
    if (!DOM.loadingScreen) return
    const loadingDots = DOM.loadingScreen.querySelector(".loading-dots")
    if (loadingDots && loadingDots.intervalId) clearInterval(loadingDots.intervalId)

    DOM.loadingScreen.classList.add("fade-out")
    setTimeout(() => {
      DOM.loadingScreen.style.display = "none"
      DOM.body.classList.remove("no-scroll")
    }, 500)
  }

  const animateLoadingDots = () => {
    const loadingDots = DOM.loadingScreen.querySelector(".loading-dots")
    if (loadingDots) {
      loadingDots.intervalId = setInterval(() => {
        if (loadingDots.textContent.length >= 3) {
          loadingDots.textContent = "."
        } else {
          loadingDots.textContent += "."
        }
      }, 500)
    }
  }
  animateLoadingDots()

  // --- Theme Management ---
  const initTheme = () => {
    // Check URL parameter first
    const modeParam = getUrlParameter("mode")

    if (modeParam === "dark") {
      // Force dark mode from URL parameter
      DOM.body.classList.add("dark-mode")
      if (DOM.themeToggle) DOM.themeToggle.checked = true
      localStorage.setItem("darkMode", "true")
      showToast("Dark mode activated from URL parameter", "info")
    } else if (modeParam === "light") {
      // Force light mode from URL parameter
      DOM.body.classList.remove("dark-mode")
      if (DOM.themeToggle) DOM.themeToggle.checked = false
      localStorage.setItem("darkMode", "false")
      showToast("Light mode activated from URL parameter", "info")
    } else {
      // Use saved preference or system preference
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      const savedTheme = localStorage.getItem("darkMode")

      if (savedTheme === "true" || (savedTheme === null && prefersDark)) {
        DOM.body.classList.add("dark-mode")
        if (DOM.themeToggle) DOM.themeToggle.checked = true
      }
    }
  }

  const handleThemeToggle = () => {
    DOM.body.classList.toggle("dark-mode")
    const isDarkMode = DOM.body.classList.contains("dark-mode")
    localStorage.setItem("darkMode", isDarkMode)

    // Update URL parameter
    updateUrlParameter("mode", isDarkMode ? "dark" : "light")

    showToast(`Switched to ${isDarkMode ? "dark" : "light"} mode`, "success")
  }

  // --- Side Navigation Management ---
  const initSideNav = () => {
    if (DOM.sideNav) {
      const isCollapsed = DOM.sideNav.classList.contains("collapsed")
    }
  }

  const toggleSideNavMobile = () => {
    if (!DOM.sideNav || !DOM.menuToggle) return
    DOM.sideNav.classList.toggle("active")
    const isActive = DOM.sideNav.classList.contains("active")
    DOM.menuToggle.setAttribute("aria-expanded", isActive)
  }

  const closeSideNavOnClickOutside = (e) => {
    if (!DOM.sideNav || !DOM.menuToggle) return
    if (
      window.innerWidth < 992 &&
      !DOM.sideNav.contains(e.target) &&
      !DOM.menuToggle.contains(e.target) &&
      DOM.sideNav.classList.contains("active")
    ) {
      DOM.sideNav.classList.remove("active")
      DOM.menuToggle.setAttribute("aria-expanded", "false")
    }
  }

  const handleScroll = () => {
    const scrollPosition = window.scrollY
    const headerElement = document.querySelector(".main-header")
    const headerHeight = headerElement ? Number.parseInt(getComputedStyle(headerElement).height) : 70

    document.querySelectorAll("section[id]").forEach((section) => {
      const sectionTop = section.offsetTop - headerHeight - 20
      const sectionHeight = section.offsetHeight
      const sectionId = section.getAttribute("id")

      const navLink = document.querySelector(`.side-nav-link[href="#${sectionId}"]`)
      if (navLink) {
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          document.querySelectorAll(".side-nav-link.active").forEach((l) => {
            l.classList.remove("active")
            l.removeAttribute("aria-current")
          })
          navLink.classList.add("active")
          navLink.setAttribute("aria-current", "page")
        }
      }
    })
  }

  // --- Modal Initialization ---
  const initModal = () => {
    if (DOM.modal.element) {
      DOM.modal.instance = new window.bootstrap.Modal(DOM.modal.element)
    }
  }

  // --- Page Content Population ---
  const setPageContent = (element, value, fallback = "") => {
    if (element) element.textContent = value || fallback
  }

  const setPageAttribute = (element, attribute, value, fallback = "") => {
    if (element) element.setAttribute(attribute, value || fallback)
  }

  const populatePageContent = () => {
    if (!settings || Object.keys(settings).length === 0) return

    const currentYear = new Date().getFullYear()
    const creator = settings.apiSettings?.creator || "Raol Api'S"

    setPageContent(DOM.pageTitle, settings.name, "Raol Api'S")
    setPageContent(DOM.wm, `© ${currentYear} Raol Api'S Corp. All rights reversed.`)
    setPageContent(DOM.appName, settings.name, "Raol Api'S")
    setPageContent(DOM.sideNavName, settings.name || "API")
    setPageContent(DOM.versionBadge, settings.version, "v1.0")
    setPageContent(DOM.versionHeaderBadge, settings.header?.status, "Active!")
    setPageContent(DOM.appDescription, settings.description, "Simple and easy to use API documentation.")

    // Set banner image
    if (DOM.dynamicImage) {
      if (settings.bannerImage) {
        DOM.dynamicImage.src = settings.bannerImage
        DOM.dynamicImage.alt = settings.name ? `${settings.name} Banner` : "API Banner"
        DOM.dynamicImage.style.display = "" // Ensure image is displayed if there is a path
      } else {
        // If there is no bannerImage in settings, use the default fallback and display it
        DOM.dynamicImage.src = "/src/banner.jpg"
        DOM.dynamicImage.alt = "API Banner Default"
        DOM.dynamicImage.style.display = ""
      }
      DOM.dynamicImage.onerror = () => {
        DOM.dynamicImage.src = "/src/banner.jpg" // Fallback if loading error
        DOM.dynamicImage.alt = "API Banner Fallback"
        DOM.dynamicImage.style.display = "" // Ensure it still appears
        showToast("Failed to load banner image, using default image.", "warning")
      }
    }

    if (DOM.apiLinksContainer) {
      DOM.apiLinksContainer.innerHTML = ""
      const defaultLinks = [{ url: "", name: "", icon: "fab fa-github" }]
      const linksToRender = settings.links?.length ? settings.links : defaultLinks

      linksToRender.forEach(({ url, name, icon }, index) => {
        const link = document.createElement("a")
        link.href = url
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.className = "api-link btn btn-primary"
        link.style.animationDelay = `${index * 0.1}s`
        link.setAttribute("aria-label", name)

        const iconElement = document.createElement("i")
        iconElement.className = icon || "fas fa-external-link-alt"
        iconElement.setAttribute("aria-hidden", "true")

        link.appendChild(iconElement)
        link.appendChild(document.createTextNode(` ${name}`))
        DOM.apiLinksContainer.appendChild(link)
      })
    }
  }

  // --- Render API Categories and Items ---
  const renderApiCategories = () => {
    if (!DOM.apiContent || !settings.categories || !settings.categories.length) {
      displayErrorState("No API categories found.")
      return
    }
    DOM.apiContent.innerHTML = ""

    settings.categories.forEach((category, categoryIndex) => {
      const sortedItems = category.items.sort((a, b) => a.name.localeCompare(b.name))

      const categorySection = document.createElement("section")
      categorySection.id = `category-${category.name.toLowerCase().replace(/\s+/g, "-")}`
      categorySection.className = "category-section"
      categorySection.style.animationDelay = `${categoryIndex * 0.15}s`
      categorySection.setAttribute("aria-labelledby", `category-title-${categoryIndex}`)

      const categoryHeader = document.createElement("h3")
      categoryHeader.id = `category-title-${categoryIndex}`
      categoryHeader.className = "category-header"

      if (category.icon) {
        const iconEl = document.createElement("i")
        iconEl.className = `${category.icon} me-2`
        iconEl.setAttribute("aria-hidden", "true")
        categoryHeader.appendChild(iconEl)
      }
      categoryHeader.appendChild(document.createTextNode(category.name))
      categorySection.appendChild(categoryHeader)

      if (category.image) {
        const img = document.createElement("img")
        img.src = category.image
        img.alt = `${category.name} banner`
        img.className = "category-image img-fluid rounded mb-3 shadow-sm"
        img.loading = "lazy"
        categorySection.appendChild(img)
      }

      const itemsRow = document.createElement("div")
      itemsRow.className = "row"

      sortedItems.forEach((item, itemIndex) => {
        const itemCol = document.createElement("div")
        itemCol.className = "col-12 col-md-6 col-lg-4 api-item"
        itemCol.dataset.name = item.name
        itemCol.dataset.desc = item.desc
        itemCol.dataset.category = category.name
        itemCol.style.animationDelay = `${itemIndex * 0.05 + 0.2}s`

        const apiCard = document.createElement("article")
        apiCard.className = "api-card h-100"
        apiCard.setAttribute("aria-labelledby", `api-title-${categoryIndex}-${itemIndex}`)

        const cardInfo = document.createElement("div")
        cardInfo.className = "api-card-info"

        const itemTitle = document.createElement("h5")
        itemTitle.id = `api-title-${categoryIndex}-${itemIndex}`
        itemTitle.className = "mb-1"
        itemTitle.textContent = item.name

        const itemDesc = document.createElement("p")
        itemDesc.className = "text-muted mb-0"
        itemDesc.textContent = item.desc

        cardInfo.appendChild(itemTitle)
        cardInfo.appendChild(itemDesc)

        const actionsDiv = document.createElement("div")
        actionsDiv.className = "api-actions mt-auto"

        const getBtn = document.createElement("button")
        getBtn.type = "button"
        getBtn.className = "btn get-api-btn btn-sm"
        getBtn.innerHTML = '<i class="fas fa-code me-1" aria-hidden="true"></i> GET'
        getBtn.dataset.apiPath = item.path
        getBtn.dataset.apiName = item.name
        getBtn.dataset.apiDesc = item.desc
        if (item.params) getBtn.dataset.apiParams = JSON.stringify(item.params)
        if (item.innerDesc) getBtn.dataset.apiInnerDesc = item.innerDesc
        getBtn.setAttribute("aria-label", `Get details for ${item.name}`)

        const status = item.status || "ready"
        const statusConfig = {
          ready: { class: "status-ready", icon: "fa-circle", text: "Ready" },
          error: { class: "status-error", icon: "fa-exclamation-triangle", text: "Error" },
          update: { class: "status-update", icon: "fa-arrow-up", text: "Update" },
        }
        const currentStatus = statusConfig[status] || statusConfig.ready

        if (status === "error" || status === "update") {
          getBtn.disabled = true
          apiCard.classList.add("api-card-unavailable")
          getBtn.title = `This API is in '${status}' status, temporarily unavailable.`
        }

        const statusIndicator = document.createElement("div")
        statusIndicator.className = `api-status ${currentStatus.class}`
        statusIndicator.title = `Status: ${currentStatus.text}`
        statusIndicator.innerHTML = `<i class="fas ${currentStatus.icon} me-1" aria-hidden="true"></i><span>${currentStatus.text}</span>`

        actionsDiv.appendChild(getBtn)
        actionsDiv.appendChild(statusIndicator)

        apiCard.appendChild(cardInfo)
        apiCard.appendChild(actionsDiv)
        itemCol.appendChild(apiCard)
        itemsRow.appendChild(itemCol)
      })

      categorySection.appendChild(itemsRow)
      DOM.apiContent.appendChild(categorySection)
    })
    initializeTooltips()
  }

  const displayErrorState = (message) => {
    if (!DOM.apiContent) return
    DOM.apiContent.innerHTML = `
            <div class="no-results-message text-center p-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="h5">${message}</p>
                <p class="text-muted">Please try reloading the page or contact the administrator.</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    <i class="fas fa-sync-alt me-2"></i> Reload
                </button>
            </div>
        `
  }

  // --- Search Functionality ---
  const handleSearch = () => {
    if (!DOM.searchInput || !DOM.apiContent) return
    const searchTerm = DOM.searchInput.value.toLowerCase().trim()
    DOM.clearSearchBtn.classList.toggle("visible", searchTerm.length > 0)

    const apiItems = DOM.apiContent.querySelectorAll(".api-item")
    const visibleCategories = new Set()

    apiItems.forEach((item) => {
      const name = (item.dataset.name || "").toLowerCase()
      const desc = (item.dataset.desc || "").toLowerCase()
      const category = (item.dataset.category || "").toLowerCase()
      const matches = name.includes(searchTerm) || desc.includes(searchTerm) || category.includes(searchTerm)

      item.style.display = matches ? "" : "none"
      if (matches) {
        visibleCategories.add(item.closest(".category-section"))
      }
    })

    DOM.apiContent.querySelectorAll(".category-section").forEach((section) => {
      section.style.display = visibleCategories.has(section) ? "" : "none"
    })

    const noResultsMsg = DOM.apiContent.querySelector("#noResultsMessage") || createNoResultsMessage()
    const allHidden = Array.from(visibleCategories).length === 0 && searchTerm.length > 0

    if (allHidden) {
      noResultsMsg.querySelector("span").textContent = `"${searchTerm}"`
      noResultsMsg.style.display = "flex"
    } else {
      noResultsMsg.style.display = "none"
    }
  }

  const clearSearch = () => {
    if (!DOM.searchInput) return
    DOM.searchInput.value = ""
    DOM.searchInput.focus()
    handleSearch()
    DOM.searchInput.classList.add("shake-animation")
    setTimeout(() => DOM.searchInput.classList.remove("shake-animation"), 400)
  }

  const createNoResultsMessage = () => {
    let noResultsMsg = document.getElementById("noResultsMessage")
    if (!noResultsMsg) {
      noResultsMsg = document.createElement("div")
      noResultsMsg.id = "noResultsMessage"
      noResultsMsg.className =
        "no-results-message flex-column align-items-center justify-content-center p-5 text-center"
      noResultsMsg.style.display = "none"
      noResultsMsg.innerHTML = `
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="h5">No results for <span></span></p>
                <button id="clearSearchFromMsg" class="btn btn-primary mt-3">
                    <i class="fas fa-times me-2"></i> Clear Search
                </button>
            `
      DOM.apiContent.appendChild(noResultsMsg)
      document.getElementById("clearSearchFromMsg").addEventListener("click", clearSearch)
    }
    return noResultsMsg
  }

  // --- API Button Click Handling ---
  const handleApiGetButtonClick = (event) => {
    const getApiBtn = event.target.closest(".get-api-btn")
    if (!getApiBtn || getApiBtn.disabled) return

    getApiBtn.classList.add("pulse-animation")
    setTimeout(() => getApiBtn.classList.remove("pulse-animation"), 300)

    currentApiData = {
      path: getApiBtn.dataset.apiPath,
      name: getApiBtn.dataset.apiName,
      desc: getApiBtn.dataset.apiDesc,
      params: getApiBtn.dataset.apiParams ? JSON.parse(getApiBtn.dataset.apiParams) : null,
      innerDesc: getApiBtn.dataset.apiInnerDesc,
    }

    setupModalForApi(currentApiData)
    DOM.modal.instance.show()
  }

  const setupModalForApi = (apiData) => {
    DOM.modal.label.textContent = apiData.name
    DOM.modal.desc.textContent = apiData.desc
    DOM.modal.content.innerHTML = ""
    DOM.modal.endpoint.textContent = `${window.location.origin}${apiData.path.split("?")[0]}`

    DOM.modal.spinner.classList.add("d-none")
    DOM.modal.content.classList.add("d-none")
    DOM.modal.container.classList.add("d-none")
    DOM.modal.endpoint.classList.remove("d-none")

    DOM.modal.queryInputContainer.innerHTML = ""
    DOM.modal.submitBtn.classList.add("d-none")
    DOM.modal.submitBtn.disabled = true
    DOM.modal.submitBtn.innerHTML = '<span>Send</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>'

    // Hide all footer buttons initially
    const editParamsBtn = DOM.modal.element.querySelector(".edit-params-btn")
    const downloadImageBtn = DOM.modal.element.querySelector(".download-image-btn")
    const shareApiBtn = DOM.modal.element.querySelector(".share-api-btn")
    if (editParamsBtn) editParamsBtn.style.display = "none"
    if (downloadImageBtn) downloadImageBtn.style.display = "none"
    if (shareApiBtn) shareApiBtn.style.display = "none"

    // Create share button if it doesn't exist
    if (!shareApiBtn) {
      const newShareBtn = document.createElement("button")
      newShareBtn.className = "btn btn-info me-2 share-api-btn"
      newShareBtn.innerHTML = '<i class="fas fa-share-alt me-2"></i> Share API'
      newShareBtn.onclick = handleShareApi

      // Insert the share button in the modal footer
      const modalFooter = DOM.modal.element.querySelector(".modal-footer")
      modalFooter.insertBefore(newShareBtn, DOM.modal.submitBtn)
    }

    // Always show share button when modal opens
    const shareBtn = DOM.modal.element.querySelector(".share-api-btn")
    if (shareBtn) shareBtn.style.display = "inline-block"

    const paramsFromPath = new URLSearchParams(apiData.path.split("?")[1])
    const paramKeys = Array.from(paramsFromPath.keys())

    if (paramKeys.length > 0) {
      const paramContainer = document.createElement("div")
      paramContainer.className = "param-container"

      const formTitle = document.createElement("h6")
      formTitle.className = "param-form-title"
      formTitle.innerHTML = '<i class="fas fa-sliders-h me-2" aria-hidden="true"></i> Parameters'
      paramContainer.appendChild(formTitle)

      paramKeys.forEach((paramKey) => {
        const paramGroup = document.createElement("div")
        paramGroup.className = "param-group mb-3"

        const labelContainer = document.createElement("div")
        labelContainer.className = "param-label-container"

        const label = document.createElement("label")
        label.className = "form-label"
        label.textContent = paramKey
        label.htmlFor = `param-${paramKey}`

        const requiredSpan = document.createElement("span")
        requiredSpan.className = "required-indicator ms-1"
        requiredSpan.textContent = "*"
        label.appendChild(requiredSpan)
        labelContainer.appendChild(label)

        if (apiData.params && apiData.params[paramKey]) {
          const tooltipIcon = document.createElement("i")
          tooltipIcon.className = "fas fa-info-circle param-info ms-1"
          tooltipIcon.setAttribute("data-bs-toggle", "tooltip")
          tooltipIcon.setAttribute("data-bs-placement", "top")
          tooltipIcon.title = apiData.params[paramKey]
          labelContainer.appendChild(tooltipIcon)
        }
        paramGroup.appendChild(labelContainer)

        const inputContainer = document.createElement("div")
        inputContainer.className = "input-container"
        const inputField = document.createElement("input")
        inputField.type = "text"
        inputField.className = "form-control custom-input"
        inputField.id = `param-${paramKey}`
        inputField.placeholder = `Enter ${paramKey}...`
        inputField.dataset.param = paramKey
        inputField.required = true
        inputField.autocomplete = "off"
        inputField.addEventListener("input", validateModalInputs)
        inputContainer.appendChild(inputField)
        paramGroup.appendChild(inputContainer)
        paramContainer.appendChild(paramGroup)
      })

      if (apiData.innerDesc) {
        const innerDescDiv = document.createElement("div")
        innerDescDiv.className = "inner-desc mt-3"
        innerDescDiv.innerHTML = `<i class="fas fa-info-circle me-2" aria-hidden="true"></i> ${apiData.innerDesc.replace(/\n/g, "<br>")}`
        paramContainer.appendChild(innerDescDiv)
      }

      DOM.modal.queryInputContainer.appendChild(paramContainer)
      DOM.modal.submitBtn.classList.remove("d-none")
      DOM.modal.submitBtn.disabled = true
      DOM.modal.submitBtn.innerHTML = '<span>Send</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>'

      initializeTooltips(DOM.modal.queryInputContainer)
    } else {
      handleApiRequest(`${window.location.origin}${apiData.path}`, apiData.name)
    }
  }

  const validateModalInputs = () => {
    const inputs = DOM.modal.queryInputContainer.querySelectorAll("input[required]")
    const allFilled = Array.from(inputs).every((input) => input.value.trim() !== "")
    DOM.modal.submitBtn.disabled = !allFilled
    DOM.modal.submitBtn.classList.toggle("btn-active", allFilled)

    inputs.forEach((input) => {
      if (input.value.trim()) input.classList.remove("is-invalid")
    })
    const errorMsg = DOM.modal.queryInputContainer.querySelector(".alert.alert-danger.fade-in")
    if (errorMsg && allFilled) {
      errorMsg.classList.replace("fade-in", "fade-out")
      setTimeout(() => errorMsg.remove(), 300)
    }
  }

  const handleSubmitQuery = async () => {
    if (!currentApiData) return

    const inputs = DOM.modal.queryInputContainer.querySelectorAll("input")
    const newParams = new URLSearchParams()
    let isValid = true

    inputs.forEach((input) => {
      if (input.required && !input.value.trim()) {
        isValid = false
        input.classList.add("is-invalid")
        input.parentElement.classList.add("shake-animation")
        setTimeout(() => input.parentElement.classList.remove("shake-animation"), 500)
      } else {
        input.classList.remove("is-invalid")
        if (input.value.trim()) newParams.append(input.dataset.param, input.value.trim())
      }
    })

    if (!isValid) {
      let errorMsg = DOM.modal.queryInputContainer.querySelector(".alert.alert-danger")
      if (!errorMsg) {
        errorMsg = document.createElement("div")
        errorMsg.className = "alert alert-danger mt-3"
        errorMsg.setAttribute("role", "alert")
        DOM.modal.queryInputContainer.appendChild(errorMsg)
      }
      errorMsg.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i> Please fill in all required fields.'
      errorMsg.classList.remove("fade-out")
      errorMsg.classList.add("fade-in")

      DOM.modal.submitBtn.classList.add("shake-animation")
      setTimeout(() => DOM.modal.submitBtn.classList.remove("shake-animation"), 500)
      return
    }

    DOM.modal.submitBtn.disabled = true
    DOM.modal.submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...'

    const apiUrlWithParams = `${window.location.origin}${currentApiData.path.split("?")[0]}?${newParams.toString()}`
    DOM.modal.endpoint.textContent = apiUrlWithParams

    await handleApiRequest(apiUrlWithParams, currentApiData.name)
  }

  const handleApiRequest = async (apiUrl, apiName) => {
    DOM.modal.spinner.classList.remove("d-none")
    DOM.modal.container.classList.add("d-none")
    DOM.modal.content.innerHTML = ""

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const response = await fetch(apiUrl, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`HTTP error! Status: ${response.status} - ${errorData.message || response.statusText}`)
      }

      const contentType = response.headers.get("Content-Type")
      if (contentType && contentType.includes("image/")) {
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)
        const img = document.createElement("img")
        img.src = imageUrl
        img.alt = apiName
        img.className = "response-image img-fluid rounded shadow-sm fade-in"

        // Only add image to content, download button will be in footer
        DOM.modal.content.appendChild(img)

        // Create download button in modal footer
        let downloadImageBtn = DOM.modal.element.querySelector(".download-image-btn")
        if (!downloadImageBtn) {
          downloadImageBtn = document.createElement("a")
          downloadImageBtn.className = "btn btn-success me-2 download-image-btn"
          downloadImageBtn.innerHTML = '<i class="fas fa-download me-2"></i> Download Image'
          downloadImageBtn.style.textDecoration = "none"

          // Insert the download button before the submit button in the modal footer
          const modalFooter = DOM.modal.element.querySelector(".modal-footer")
          modalFooter.insertBefore(downloadImageBtn, DOM.modal.submitBtn)
        }

        // Update download button properties
        downloadImageBtn.href = imageUrl
        downloadImageBtn.download = `${apiName.toLowerCase().replace(/\s+/g, "-")}.${blob.type.split("/")[1] || "png"}`
        downloadImageBtn.style.display = "inline-block"
      } else if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        const formattedJson = syntaxHighlightJson(JSON.stringify(data, null, 2))
        DOM.modal.content.innerHTML = formattedJson
        if (JSON.stringify(data, null, 2).split("\n").length > 20) {
          addCodeFolding(DOM.modal.content)
        }
      } else {
        const textData = await response.text()
        DOM.modal.content.textContent = textData || "Response has no content or unknown format."
      }

      DOM.modal.container.classList.remove("d-none")
      DOM.modal.content.classList.remove("d-none")
      DOM.modal.container.classList.add("slide-in-bottom")
      showToast(`Successfully retrieved data for ${apiName}`, "success")

      // Show Edit Parameters button in footer if there were parameters
      if (currentApiData && currentApiData.path.split("?")[1]) {
        // Check if edit button already exists, if not create it
        let editParamsBtn = DOM.modal.element.querySelector(".edit-params-btn")
        if (!editParamsBtn) {
          editParamsBtn = document.createElement("button")
          editParamsBtn.className = "btn btn-outline-secondary me-2 edit-params-btn"
          editParamsBtn.innerHTML = '<i class="fas fa-edit me-2"></i> Edit Parameters'
          editParamsBtn.onclick = () => {
            // Show the parameter form again
            if (DOM.modal.queryInputContainer.firstChild) {
              DOM.modal.queryInputContainer.firstChild.style.display = ""
              DOM.modal.queryInputContainer.firstChild.classList.remove("fade-out")
            }
            DOM.modal.submitBtn.classList.remove("d-none")
            DOM.modal.submitBtn.disabled = false
            DOM.modal.submitBtn.innerHTML =
              '<span>Send</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>'
            // Hide the response container
            DOM.modal.container.classList.add("d-none")
            // Hide the edit button and download button
            editParamsBtn.style.display = "none"
            const downloadBtn = DOM.modal.element.querySelector(".download-image-btn")
            if (downloadBtn) downloadBtn.style.display = "none"
            // Focus on first input
            const firstInput = DOM.modal.queryInputContainer.querySelector("input")
            if (firstInput) firstInput.focus()
          }

          // Insert the edit button before the submit button in the modal footer
          const modalFooter = DOM.modal.element.querySelector(".modal-footer")
          modalFooter.insertBefore(editParamsBtn, DOM.modal.submitBtn)
        }
        editParamsBtn.style.display = "inline-block"
      }

      // Reset submit button after successful response
      if (DOM.modal.submitBtn) {
        DOM.modal.submitBtn.disabled = false
        DOM.modal.submitBtn.innerHTML =
          '<span>Send Again</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>'
      }
    } catch (error) {
      console.error("API Request Error:", error)
      const errorHtml = `
                <div class="error-container text-center p-3">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                    <h6 class="text-danger">An Error Occurred</h6>
                    <p class="text-muted small">${error.message || "Could not retrieve data from server."}</p>
                    ${
                      currentApiData && currentApiData.path.split("?")[1]
                        ? `<button class="btn btn-sm btn-outline-primary mt-2 retry-query-btn">
                        <i class="fas fa-sync-alt me-1"></i> Try Again
                    </button>`
                        : ""
                    }
                </div>`
      DOM.modal.content.innerHTML = errorHtml
      DOM.modal.container.classList.remove("d-none")
      DOM.modal.content.classList.remove("d-none")
      showToast("Failed to retrieve data. Check details in modal.", "error")

      const retryBtn = DOM.modal.content.querySelector(".retry-query-btn")
      if (retryBtn) {
        retryBtn.onclick = () => {
          if (DOM.modal.queryInputContainer.firstChild) {
            DOM.modal.queryInputContainer.firstChild.style.display = ""
            DOM.modal.queryInputContainer.firstChild.classList.remove("fade-out")
          }
          DOM.modal.submitBtn.disabled = false
          DOM.modal.submitBtn.innerHTML = '<span>Send</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>'
          DOM.modal.container.classList.add("d-none")
        }
      }
    } finally {
      DOM.modal.spinner.classList.add("d-none")
      // Always reset the submit button state when request completes
      if (DOM.modal.submitBtn) {
        DOM.modal.submitBtn.disabled = false
        DOM.modal.submitBtn.innerHTML =
          '<span>Send Again</span><i class="fas fa-paper-plane ms-2" aria-hidden="true"></i>'

        // Only hide the submit button if there are no parameters required
        const hasParams = currentApiData && currentApiData.path && currentApiData.path.includes("?")
        if (!hasParams) {
          DOM.modal.submitBtn.classList.add("d-none")
        }
      }
    }
  }

  // --- Helper Functions for Code Display ---
  const syntaxHighlightJson = (json) => {
    json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "json-number"
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-string"
        } else if (/true|false/.test(match)) {
          cls = "json-boolean"
        } else if (/null/.test(match)) {
          cls = "json-null"
        }
        return `<span class="${cls}">${match}</span>`
      },
    )
  }

  const addCodeFolding = (container) => {
    const lines = container.innerHTML.split("\n")
    let currentLevel = 0
    let foldableHtml = ""
    let inFoldableBlock = false

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (trimmedLine.endsWith("{") || trimmedLine.endsWith("[")) {
        if (currentLevel === 0) {
          foldableHtml += `<div class="code-fold-trigger" data-folded="false" role="button" tabindex="0" aria-expanded="true">${line}<span class="fold-indicator ms-2 small text-muted">(<i class="fas fa-chevron-down"></i> Fold)</span></div><div class="code-fold-content">`
          inFoldableBlock = true
        } else {
          foldableHtml += line + "\n"
        }
        currentLevel++
      } else if (trimmedLine.startsWith("}") || trimmedLine.startsWith("]")) {
        currentLevel--
        foldableHtml += line + "\n"
        if (currentLevel === 0 && inFoldableBlock) {
          foldableHtml += "</div>"
          inFoldableBlock = false
        }
      } else {
        foldableHtml += line + (index === lines.length - 1 ? "" : "\n")
      }
    })
    container.innerHTML = foldableHtml

    container.querySelectorAll(".code-fold-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => toggleFold(trigger))
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          toggleFold(trigger)
        }
      })
    })
  }

  const toggleFold = (trigger) => {
    const content = trigger.nextElementSibling
    const isFolded = trigger.dataset.folded === "true"
    const indicator = trigger.querySelector(".fold-indicator")

    if (isFolded) {
      content.style.maxHeight = content.scrollHeight + "px"
      trigger.dataset.folded = "false"
      trigger.setAttribute("aria-expanded", "true")
      indicator.innerHTML = '(<i class="fas fa-chevron-up"></i> Close)'
    } else {
      content.style.maxHeight = "0px"
      trigger.dataset.folded = "true"
      trigger.setAttribute("aria-expanded", "false")
      indicator.innerHTML = '(<i class="fas fa-chevron-down"></i> Open)'
    }
  }

  // --- Observe API Items for Animation ---
  const observeApiItems = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view", "slideInUp")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 },
    )

    document.querySelectorAll(".api-item:not(.in-view)").forEach((item) => {
      observer.observe(item)
    })
  }

  // --- Tooltip Initialization ---
  const initializeTooltips = (parentElement = document) => {
    const tooltipTriggerList = [].slice.call(parentElement.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map((tooltipTriggerEl) => {
      const existingTooltip = window.bootstrap.Tooltip.getInstance(tooltipTriggerEl)
      if (existingTooltip) {
        existingTooltip.dispose()
      }
      return new window.bootstrap.Tooltip(tooltipTriggerEl)
    })
  }

  // Run main initialization
  init()
})
