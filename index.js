import express from "express"
import chalk from "chalk"
import fs from "fs"
import cors from "cors"
import path from "path"
import { fileURLToPath, pathToFileURL } from "url"
import { createRequire } from "module"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const app = express()
const PORT = process.env.PORT || 4000

app.enable("trust proxy")
app.set("json spaces", 2)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  next()
})

const requestCounts = new Map()
const RATE_LIMIT_WINDOW = 1 * 60 * 1000
const RATE_LIMIT_MAX = 15

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress
  const now = Date.now()

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
  } else {
    const data = requestCounts.get(ip)
    if (now > data.resetTime) {
      data.count = 1
      data.resetTime = now + RATE_LIMIT_WINDOW
    } else {
      data.count++
      if (data.count > RATE_LIMIT_MAX) {
        return res.status(429).sendFile(path.join(__dirname, "api-page", "429.html"))
      }
    }
  }
  next()
})

setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip)
    }
  }
}, RATE_LIMIT_WINDOW)

app.use((req, res, next) => {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))

    const skipPaths = ["/api/settings", "/assets/", "/src/", "/api/preview-image"]
    const shouldSkip = skipPaths.some((path) => req.path.startsWith(path))

    if (settings.maintenance && settings.maintenance.enabled && !shouldSkip) {
      if (req.path.startsWith("/api/") || req.path.startsWith("/ai/")) {
        return res.status(503).json({
          status: false,
          error: "Service temporarily unavailable",
          message: "The API is currently under maintenance. Please try again later.",
          maintenance: true,
          creator: settings.apiSettings?.creator || "VGX Team",
        })
      }

      return res.status(503).sendFile(path.join(__dirname, "api-page", "maintenance.html"))
    }

    next()
  } catch (error) {
    console.error("Error checking maintenance mode:", error)
    next()
  }
})

app.get("/assets/styles.css", (req, res) => {
  res.setHeader("Content-Type", "text/css")
  res.sendFile(path.join(__dirname, "api-page", "styles.css"))
})

app.get("/assets/script.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript")
  res.sendFile(path.join(__dirname, "api-page", "script.js"))
})

app.get("/api/preview-image", (req, res) => {
  try {
    const previewImagePath = path.join(__dirname, "src", "preview.png")

    if (fs.existsSync(previewImagePath)) {
      res.setHeader("Content-Type", "image/png")
      res.setHeader("Cache-Control", "public, max-age=86400")
      res.sendFile(previewImagePath)
    } else {
      const bannerPath = path.join(__dirname, "src", "banner.jpg")
      if (fs.existsSync(bannerPath)) {
        res.setHeader("Content-Type", "image/jpeg")
        res.setHeader("Cache-Control", "public, max-age=86400")
        res.sendFile(bannerPath)
      } else {
        const iconPath = path.join(__dirname, "src", "icon.png")
        res.setHeader("Content-Type", "image/png")
        res.setHeader("Cache-Control", "public, max-age=86400")
        res.sendFile(iconPath)
      }
    }
  } catch (error) {
    console.error("Error serving preview image:", error)
    res.status(404).json({ error: "Preview image not found" })
  }
})

app.get("/api/settings", (req, res) => {
  try {
    const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "src", "settings.json"), "utf-8"))
    res.json(settings)
  } catch (error) {
    res.status(500).sendFile(path.join(__dirname, "api-page", "500.html"))
  }
})

app.get("/api/notifications", (req, res) => {
  try {
    const notifications = JSON.parse(fs.readFileSync(path.join(__dirname, "api-page", "notifications.json"), "utf-8"))
    res.json(notifications)
  } catch (error) {
    res.status(500).sendFile(path.join(__dirname, "api-page", "500.html"))
  }
})

app.use((req, res, next) => {
  const blockedPaths = [
    "/api-page/",
    "/src/settings.json",
    "/api-page/notifications.json",
    "/api-page/styles.css",
    "/api-page/script.js",
  ]

  const isBlocked = blockedPaths.some((blocked) => {
    if (blocked.endsWith("/")) {
      return req.path.startsWith(blocked)
    }
    return req.path === blocked
  })

  if (isBlocked) {
    return res.status(403).sendFile(path.join(__dirname, "api-page", "403.html"))
  }
  next()
})

app.use("/src", (req, res, next) => {
  if (req.path.match(/\.(jpg|jpeg|png|gif|svg|ico)$/i)) {
    express.static(path.join(__dirname, "src"))(req, res, next)
  } else {
    res.status(403).sendFile(path.join(__dirname, "api-page", "403.html"))
  }
})

const settingsPath = path.join(__dirname, "./src/settings.json")
const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"))

app.use((req, res, next) => {
  const originalJson = res.json
  res.json = function (data) {
    if (data && typeof data === "object") {
      const responseData = {
        status: data.status ?? true,
        creator: settings.apiSettings.creator || "VGX Team",
        ...data,
      }
      return originalJson.call(this, responseData)
    }
    return originalJson.call(this, data)
  }
  next()
})

let totalRoutes = 0
const apiFolder = path.join(__dirname, "./src/api")

const loadApiRoutes = async () => {
  const subfolders = fs.readdirSync(apiFolder)

  for (const subfolder of subfolders) {
    const subfolderPath = path.join(apiFolder, subfolder)
    if (fs.statSync(subfolderPath).isDirectory()) {
      const files = fs.readdirSync(subfolderPath)

      for (const file of files) {
        const filePath = path.join(subfolderPath, file)
        if (path.extname(file) === ".js") {
          try {
            const module = await import(pathToFileURL(filePath).href)
            const routeHandler = module.default
            if (typeof routeHandler === "function") {
              routeHandler(app)
              totalRoutes++
              console.log(
                chalk
                  .bgHex("#FFFF99")
                  .hex("#333")
                  .bold(` Loaded Route: ${path.basename(file)} `),
              )
            }
          } catch (error) {
            console.error(`Error loading route ${file}:`, error)
          }
        }
      }
    }
  }
}

await loadApiRoutes()

console.log(chalk.bgHex("#90EE90").hex("#333").bold(" Load Complete! ✓ "))
console.log(chalk.bgHex("#90EE90").hex("#333").bold(` Total Routes Loaded: ${totalRoutes} `))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "api-page", "index.html"))
})

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "api-page", "404.html"))
})

app.use((err, req, res, next) => {
  console.error(err.stack)

  if (err.status === 400) {
    res.status(400).sendFile(path.join(__dirname, "api-page", "400.html"))
  } else if (err.status === 401) {
    res.status(401).sendFile(path.join(__dirname, "api-page", "401.html"))
  } else if (err.status === 403) {
    res.status(403).sendFile(path.join(__dirname, "api-page", "403.html"))
  } else if (err.status === 405) {
    res.status(405).sendFile(path.join(__dirname, "api-page", "405.html"))
  } else if (err.status === 408) {
    res.status(408).sendFile(path.join(__dirname, "api-page", "408.html"))
  } else if (err.status === 429) {
    res.status(429).sendFile(path.join(__dirname, "api-page", "429.html"))
  } else if (err.status === 502) {
    res.status(502).sendFile(path.join(__dirname, "api-page", "502.html"))
  } else if (err.status === 503) {
    res.status(503).sendFile(path.join(__dirname, "api-page", "503.html"))
  } else {
    res.status(500).sendFile(path.join(__dirname, "api-page", "500.html"))
  }
})

app.listen(PORT, () => {
  console.log(chalk.bgHex("#90EE90").hex("#333").bold(` Server is running on port ${PORT} `))
})

export default app
