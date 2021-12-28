const request = require('request');

class ApiManager {
    constructor() {
        this.host = "https://book.interpark.com/api/search.api";
        this.bestSeller = "https://book.interpark.com/api/bestSeller.api";
        this.key = "15DC1B773C493758A89404C1E44C0D6C6A994FA13D0E47AE0C0E17B058707490"
    }

    requestBestSeller(count, callback) {
        request(this.bestSeller + "?key=" + this.key + "&categoryId=100&maxResults=" + count + "&output=json", (error, response, body) => {
            let items = [];
            
            for(let i = 0; i < count; i++) {
                items.push(JSON.parse(body).item[i]);
            }

            callback(error, items);
        });
    }

    requestRecommendedBooks(categoryId, count, callback) {
        request(this.bestSeller + "?key=" + this.key + "&categoryId=" + categoryId + "&maxResults=" + count + "&output=json", (error, response, body) => {
            let items = [];
            
            for(let i = 0; i < count; i++) {
                items.push(JSON.parse(body).item[i]);
            }

            callback(error, items);
        });
    }
}

module.exports = ApiManager;