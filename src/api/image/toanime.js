const axios = require("axios");
const WebSocket = require("ws");

class PixnovaAI {
  constructor() {
    this.ws = null;
    this.sessionHash = this.generateHash();
    this.result = null;
    this.baseURL = "https://oss-global.pixnova.ai/";
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket("wss://pixnova.ai/demo-photo2anime/queue/join", {
        headers: {
          Origin: "https://pixnova.ai",
          "User-Agent": "Mozilla/5.0",
        },
      });

      this.ws.on("open", () => {
        this.ws.send(JSON.stringify({ session_hash: this.sessionHash }));
        resolve();
      });

      this.ws.on("message", (data) => this.handleMessage(data));
      this.ws.on("error", (err) => reject(err));
    });
  }

  async imageToBase64(imageUrl) {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    return `data:image/jpeg;base64,${Buffer.from(response.data).toString("base64")}`;
  }

  async sendPayload(imageUrl, customPayload = {}) {
    const base64Image = await this.imageToBase64(imageUrl);
    const defaultPayload = {
      strength: 0.6,
      prompt: "(masterpiece), best quality",
      negative_prompt: "(worst quality, low quality:1.4), cropped, lowres , blurry, watermark",
      request_from: 2,
    };

    const finalPayload = {
      data: {
        source_image: base64Image,
        ...defaultPayload,
        ...customPayload,
      },
    };

    this.ws.send(JSON.stringify(finalPayload));
  }

  handleMessage(data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.msg === "process_completed" && parsed.success) {
        this.result = this.baseURL + parsed.output.result[0];
      }
    } catch (err) {}
  }

  async waitForCompletion() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.result) {
          clearInterval(interval);
          this.ws.close();
          resolve(this.result);
        }
      }, 1000);
    });
  }

  async processImage(imageUrl, payload = {}) {
    await this.connect();
    await this.sendPayload(imageUrl, payload);
    return await this.waitForCompletion();
  }

  generateHash() {
    return Math.random().toString(36).substring(2, 15);
  }
}

module.exports = function (app) {
  app.get("/img/toanime", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });

      const pixnova = new PixnovaAI();
      const result = await pixnova.processImage(url);
      res.json({ status: true, result });
    } catch (e) {
      console.error(`Error In To Anime: ${e}`);
      res.json({ status: false, error: e.message });
    }
  });
};
