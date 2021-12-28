const http = require('http');
const url = require('url');
const fs = require('fs');
const mime = require('mime');
const DatabaseManager = require('./databaseManager');
const ApiManager = require('./apiManager');

class Server {
    constructor() {
        this.databaseManager = new DatabaseManager();
        this.apiManager = new ApiManager();
        
        this.databaseManager.connect();
    }

    createServer() {
        http.createServer((request, response) => {
            console.log(request.url);

            let pathname = this.getPathname(request.url);
            let parameters = this.getParameters(request.url);
            
            if(request.method == "POST") {
                let post = "";

                request.on("data", (data) => post += data);
                request.on("end", () => {
                    if(pathname == "/upload/image") {
                        let random = "";

                        while(true) {
                            random = Math.random().toString(36).substr(2,11);

                            if (!fs.existsSync(random)) break;
                        }

                        let buf = Buffer.from(decodeURIComponent(post),'base64');
                        fs.writeFileSync("image/" + random + ".jpg", buf);

                        this.jsonResponse(response, {
                            path: "/image/" + random + ".jpg"
                        });
                    }

                    this.processUrl(pathname, this.getParameters("?" + post), response);
                });
            }
            else this.processUrl(pathname, parameters, response);

        }).listen(9000);

        console.log("server start!");
    }

    processUrl(pathname, data, response) {
        switch(pathname) {
            case "/api/bestSeller":
                this.apiManager.requestBestSeller(data.count, (error, items) => this.response(response, error, items));
                break;

            case "/api/recommendedBooks":
                this.databaseManager.getNeeds(data.userId, (error, result) => {
                    if(error) return;

                    const index = Math.floor(Math.random() * (result.length));

                    this.apiManager.requestRecommendedBooks(result[index].categoryId, data.count, (error, items) => this.response(response, error, items));
                });
                break;

            case "/api/signup":
                this.databaseManager.signup(decodeURIComponent(data.name), data.id, data.password, (error) => this.response(response, error));
                break;

            case "/api/selectNeeds":
                this.databaseManager.selectNeeds(data.loginId, data.categoryId, (error) => this.response(response, error));

            case "/api/login":
                this.databaseManager.login(data.id, data.password, (error, result) => this.response(response, error, result));
                break;

            case "/api/user":
                this.databaseManager.getUser(data.userId, (error, result) => this.response(response, error, result))
                break;

            case "/api/category":
                this.databaseManager.getCategories((error, result) => this.response(response, error, result));
                break;

            case "/api/debate":
                this.databaseManager.getDebates(data.userId, (error, results) => {
                    if(results != undefined) {
                        for(let i = 0; i < results.length; i++) {
                            let result = results[i];
                            
                            if(result.cDate != null) result.cDate = new Date(result.cDate).getTime();
                            result.date = new Date(result.date).getTime();
                        }
                    }

                    this.response(response, error, results)
                });
                break;

            case "/api/readingDiary":
                this.databaseManager.getReadingDiary(data.userId, (error, result) => this.response(response, error, result));
                break;

            case "/api/market":
                this.databaseManager.getMarket((error, results) => this.response(response, error, this.setDate(results)));
                break;

            case "/api/comments":
                this.databaseManager.getComments(data.id, (error, results) => this.response(response, error, this.setDate(results)));
                break;

            case "/api/vote":
                this.databaseManager.vote(data.userId, data.debateId, data.isAgree, (error) => this.response(response, error));
                break;
                
            case "/api/write/debate":
                this.databaseManager.writeDebate(decodeURIComponent(data.userId), decodeURIComponent(data.title), decodeURIComponent(data.category), decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/write/readingDiary":
                this.databaseManager.writeReadingDiary(decodeURIComponent(data.userId), decodeURIComponent(data.title), decodeURIComponent(data.date), decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/write/market":
                this.databaseManager.writeMarket(data.userId, data.imageUrl, decodeURIComponent(data.title), data.category, data.status, data.price, decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/write/comment":
                this.databaseManager.writeComment(data.userId, data.debateId, decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/edit/readingDiary":
                this.databaseManager.editReadingDiary(data.id, decodeURIComponent(data.title), decodeURIComponent(data.date), decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/edit/profile":
                this.databaseManager.editProfile(data.userId, data.imageUrl, decodeURIComponent(data.name), (error) => this.response(response, error));
                break;

            case "/api/delete/readingDiary":
                this.databaseManager.deleteReadingDiary(data.id, (error) => this.response(response, error));
                break;

            default:
                this.fileResponse(response, pathname);
                break;

            /* case "/api/edit":
                {
                    let title = decodeURIComponent(data.title);
                    let contents = decodeURIComponent(data.contents);
                    
                    if(pathname == "/api/writeComment") this.databaseManager.addComment(data.id, 0, contents, error => this.response(response, error));
                    else if(pathname == "/api/writeCommentInComment") this.databaseManager.addComment(data.id, data.parentId, contents, error => this.response(response, error));
                    else if(pathname == "/api/write") this.databaseManager.writePost(title, contents, data.category, error => this.response(response, error));
                    else if(pathname == "/api/edit") this.databaseManager.editPost(data.id, title, contents, data.category, error => this.response(response, error));
                }
                break; */
        }
    }

    setDate(results) {
        if(results != undefined) {
            for(let i = 0; i < results.length; i++) {
                let result = results[i];
                
                result.date = new Date(result.date).getTime();
            }
        }

        return results;
    }

    response(response, error, result) {
        if(result == undefined) result = {success: (error ? false : true)};
        this.jsonResponse(response, error ? [] : result);
    }

    jsonResponse(response, data) {
        console.log(data);
        if(data != undefined) {
            response.writeHead(200, {"content-type": "application/json; charset=utf-8"});
            response.end(JSON.stringify(data));
        }
    }

    fileResponse(response, pathname) {
        response.writeHead(200, {'Content-Type': mime.getType(pathname)});

        fs.readFile("./" + pathname, (err, data) => {
            if (err) {
                console.log(err);

                response.writeHead(404);
                response.end(data);
            }
            else if(mime.getType(pathname).split('/')[0] == "text") response.end(data, 'utf-8');
            else response.end(data);
        });
    }

    getPathname(requestUrl) {
        return url.parse(requestUrl).pathname;
    }

    getParameters(requestUrl) {
        let result = {};
        let part = parameterPart();
        let parameters = part.split("&");
        
        for(let i = 0; i < parameters.length; i++) {
            let tokens = parameters[i].split("=");
            
            if(tokens.length < 2) continue;
            
            result[tokens[0]] = tokens[1];
        }
        
        return result;
        
        function parameterPart() {
            let tokens = requestUrl.split("?");
            
            return tokens.length > 1 ? tokens[1] : "";
        }
    }
}

module.exports = Server;