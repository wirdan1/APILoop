const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {
    const aiChar = {
        nova: "nova",
        alloy: "alloy",
        ash: "ash",
        coral: "coral",
        echo: "echo",
        fable: "fable",
        onyx: "onyx",
        sage: "sage",
        shimmer: "shimmer"
    };

    async function generateTTS(text, char) {
        if (!Object.keys(aiChar).includes(char)) {
            return {
                errorCode: 403,
                message: "Karakter tidak valid.",
                validChar: Object.keys(aiChar).join(", ")
            };
        }

        try {
            const form = new FormData();
            form.append("msg", text);
            form.append("lang", aiChar[char]);
            form.append("speed", "1.00");
            form.append("source", "ttsmp3");

            const { data } = await axios.post("https://ttsmp3.com/makemp3_ai.php", form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            return data;
        } catch (e) {
            return {
                errorCode: e.status || 500,
                message: e.message || "Terjadi kesalahan saat mengakses API."
            };
        }
    }

    app.get('voice/ttsmp3', async (req, res) => {
        const { char, text } = req.query;

        if (!char || !text) {
            return res.status(400).json({
                status: false,
                message: "Masukkan parameter 'char' dan 'text'."
            });
        }

        const result = await generateTTS(text, char.toLowerCase());

        if (result?.Error || !result?.URL) {
            return res.status(500).json({
                status: false,
                message: result?.message || "Gagal mendapatkan suara."
            });
        }

        if (result?.errorCode === 403) {
            return res.status(403).json({
                status: false,
                message: result.message,
                validChar: result.validChar
            });
        }

        res.json({
            status: true,
            audio_url: result.URL
        });
    });
};
