/*
 * Endpoint: /tools/text-to-speech
 * Description: Convert text to speech using multiple anime/celebrity voices.
 * Author: @insxdr
 */

const axios = require("axios")

// Voice Models
const models = {
  miku: { voice_id: "67aee909-5d4b-11ee-a861-00163e2ac61b", voice_name: "Hatsune Miku" },
  nahida: { voice_id: "67ae0979-5d4b-11ee-a861-00163e2ac61b", voice_name: "Nahida (Exclusive)" },
  nami: { voice_id: "67ad95a0-5d4b-11ee-a861-00163e2ac61b", voice_name: "Nami" },
  ana: { voice_id: "f2ec72cc-110c-11ef-811c-00163e0255ec", voice_name: "Ana (Female)" },
  optimus_prime: { voice_id: "67ae0f40-5d4b-11ee-a861-00163e2ac61b", voice_name: "Optimus Prime" },
  goku: { voice_id: "67aed50c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Goku" },
  taylor_swift: { voice_id: "67ae4751-5d4b-11ee-a861-00163e2ac61b", voice_name: "Taylor Swift" },
  elon_musk: { voice_id: "67ada61f-5d4b-11ee-a861-00163e2ac61b", voice_name: "Elon Musk" },
  mickey_mouse: { voice_id: "67ae7d37-5d4b-11ee-a861-00163e2ac61b", voice_name: "Mickey Mouse" },
  kendrick_lamar: { voice_id: "67add638-5d4b-11ee-a861-00163e2ac61b", voice_name: "Kendrick Lamar" },
  angela_adkinsh: { voice_id: "d23f2adb-5d1b-11ee-a861-00163e2ac61b", voice_name: "Angela Adkinsh" },
  eminem: { voice_id: "c82964b9-d093-11ee-bfb7-e86f38d7ec1a", voice_name: "Eminem" },
}

// Helper: Generate random IP
function getRandomIP() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".")
}

// User Agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Mozilla/5.0 (Linux; Android 11; Pixel 5)",
]

// Main TTS Generator
async function generateTTS(text) {
  const tasks = Object.entries(models).map(async ([modelName, { voice_id, voice_name }]) => {
    const payload = {
      raw_text: text,
      url: "https://filme.imyfone.com/text-to-speech/anime-text-to-speech/",
      product_id: "200054",
      convert_data: [
        {
          voice_id,
          speed: "1",
          volume: "50",
          text,
          pos: 0,
        },
      ],
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-Forwarded-For": getRandomIP(),
      "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
    }

    try {
      const { data } = await axios.post("https://voxbox-tts-api.imyfone.com/pc/v1/voice/tts", payload, { headers })
      const { oss_url, channel_id } = data.data.convert_result[0]

      return {
        model: modelName,
        voice_name,
        voice_id,
        channel_id,
        audio_url: oss_url,
      }
    } catch (err) {
      return {
        model: modelName,
        voice_name,
        error: "Gagal memproses suara untuk model ini.",
      }
    }
  })

  return await Promise.all(tasks)
}

// Express Router
module.exports = (app) => {
  app.get("/ai/tts", async (req, res) => {
    const { apikey, text } = req.query

    // Validasi API Key
    if (!global.apikeyf.includes(apikey)) {
      return res.status(403).json({ status: false, message: "Apikey invalid!" })
    }

    if (!text) {
      return res.status(400).json({ status: false, message: "Parameter 'text' tidak boleh kosong." })
    }

    try {
      const result = await generateTTS(text)
      res.json({ status: true, result })
    } catch (err) {
      res.status(500).json({ status: false, message: err.message })
    }
  })
}
