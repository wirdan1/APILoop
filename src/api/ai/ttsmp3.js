const axios = require("axios");
const FormData = require("form-data");

const aiChar = {
  "nova": "nova",
  "alloy": "alloy",
  "ash": "ash",
  "coral": "coral",
  "echo": "echo",
  "fable": "fable",
  "onyx": "onyx",
  "sage": "sage",
  "shimmer": "shimmer"
};

module.exports = (app) => {
  app.get("/ai/ttsmp3", async (req, res) => {
    const { text, char } = req.query;

    if (!text || !char) {
      return res.status(400).json({
        status: false,
        message: "Masukkan parameter `text` dan `char`"
      });
    }

    if (!Object.keys(aiChar).includes(char)) {
      return res.status(403).json({
        status: false,
        message: "Char tidak valid!",
        validChar: Object.keys(aiChar)
      });
    }

    try {
      let validLang = aiChar[char];
      let form = new FormData();
      form.append("msg", text);
      form.append("lang", validLang);
      form.append("speed", "1.00");
      form.append("source", "ttsmp3");

      const response = await axios.post(
        "https://ttsmp3.com/makemp3_ai.php",
        form,
        { headers: form.getHeaders() }
      );

      const result = response.data;

      if (!result.URL) {
        return res.status(500).json({
          status: false,
          message: "Gagal mengambil URL audio."
        });
      }

      res.json({
        status: true,
        audio_url: result.URL
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan saat request.",
        error: error.message
      });
    }
  });
};
