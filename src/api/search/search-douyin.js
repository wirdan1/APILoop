const axios = require('axios');
const cheerio = require('cheerio');
const vm = require('vm');

class DouyinSearchPage {
    constructor() {
        this.baseURL = 'https://so.douyin.com/';
        this.defaultParams = {
            search_entrance: 'aweme',
            enter_method: 'normal_search',
            innerWidth: '431',
            innerHeight: '814',
            reloadNavStart: String(Date.now()),
            is_no_width_reload: '1',
            keyword: '',
        };
        this.cookies = {};
        this.api = axios.create({
            baseURL: this.baseURL,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'accept-language': 'id-ID,id;q=0.9',
                'referer': 'https://so.douyin.com/',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
            }
        });

        this.api.interceptors.response.use(res => {
            const setCookies = res.headers['set-cookie'];
            if (setCookies) {
                setCookies.forEach(c => {
                    const [name, value] = c.split(';')[0].split('=');
                    if (name && value) this.cookies[name] = value;
                });
            }
            return res;
        });

        this.api.interceptors.request.use(config => {
            if (Object.keys(this.cookies).length) {
                config.headers['Cookie'] = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
            }
            return config;
        });
    }

    async initialize() {
        try {
            await this.api.get('/');
            return true;
        } catch {
            return false;
        }
    }

    async search({ query }) {
        await this.initialize();
        const params = { ...this.defaultParams, keyword: query, reloadNavStart: String(Date.now()) };
        const res = await this.api.get('s', { params });
        const html = res.data;
        const $ = cheerio.load(html);

        let scriptWithData = '';
        $('script').each((_, el) => {
            const text = $(el).html();
            if (text.includes('let data =') && text.includes('"business_data":')) {
                scriptWithData = text;
            }
        });

        if (!scriptWithData) throw new Error('Script with data not found');

        const match = scriptWithData.match(/let\s+data\s*=\s*(\{[\s\S]+?\});/);
        if (!match) throw new Error('Unable to extract data object');

        const sandbox = {};
        vm.createContext(sandbox);
        vm.runInContext(`data = ${match[1]}`, sandbox);

        const fullData = sandbox.data;
        const data = fullData?.business_data;

        if (!data) throw new Error('No business_data found');

        return data.map(entry => entry?.data?.aweme_info).filter(Boolean);
    }
}

module.exports = function(app) {
    app.get('/search/douyin', async (req, res) => {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: 'Query parameter is required. Example: /douyin/search?query=cat'
            });
        }

        try {
            const douyin = new DouyinSearchPage();
            const results = await douyin.search({ query });

            res.json({
                status: true,
                result_count: results.length,
                results,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error('Douyin Search Error:', e.message);
            res.status(500).json({
                status: false,
                error: 'Failed to fetch search results'
            });
        }
    });
};
