const axios = require('axios');

export const JFApi = {
    methods: {
        jfApiGet(url, api) {
            var config = {
                headers: {
                    'X-MediaBrowser-Token': api,
                    'Accept': 'application/json',
                }
            };
            var res = axios.get(url, config);
            return res;
        },
        jfApiPost(url,api,data) {
            var config = {
                headers: {
                    'X-MediaBrowser-Token': api,
                    'Accept': 'application/json',
                }
            };
            var res = axios.post(url, data, config);
            return res;
        },
        tmdbApiGet(url) {
            var config = {
                headers: {
                    'Accept': 'application/json',
                }
            };
            var res = axios.get(url, config);
            return res;
        },
    }
}