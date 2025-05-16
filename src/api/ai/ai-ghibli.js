const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ghibliGenerator = require('./ghibliGenerator'); // diasumsikan logic utamanya dipisah

module.exports = function (app) {
    app.get('/ai/ghibli', async (req, res) => {
        const { input, size } = req.query;

        if (!input) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "input" diperlukan.'
            });
        }

        try {
            const result = await ghibliGenerator.generate(input, { size });

            if (!result.status) {
                return res.status(result.code || 500).json({
                    status: false,
                    ...result.result
                });
            }

            res.json({
                status: true,
                result: result.result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: 'Gagal memproses permintaan ke Ghibli Generator.'
            });
        }
    });
};
