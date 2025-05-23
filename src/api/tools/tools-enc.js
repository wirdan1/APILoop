const JavaScriptObfuscator = require('javascript-obfuscator');

module.exports = function(app) {
    async function ObfuscateCode(code) {
        try {
            if (!code || typeof code !== 'string') {
                throw new Error('Valid JavaScript code is required');
            }

            const result = JavaScriptObfuscator.obfuscate(code);
            return {
                original_length: code.length,
                obfuscated_length: result.getObfuscatedCode().length,
                obfuscated_code: result.getObfuscatedCode()
            };
        } catch (error) {
            console.error('Error during obfuscation:', error.message);
            return null;
        }
    }

    app.get('/tools/enc', async (req, res) => {
        try {
            const { code } = req.query;
            if (!code) {
                return res.status(400).json({ 
                    status: false, 
                    error: 'Code parameter is required',
                    example: '/tools/obfuscate?code=function test(){return "hello"};'
                });
            }

            const result = await ObfuscateCode(code);
            if (!result) {
                return res.status(500).json({ 
                    status: false, 
                    error: 'Failed to obfuscate code' 
                });
            }

            res.json({ 
                status: true, 
                result,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
