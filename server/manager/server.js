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
                    /* let buf = Buffer.from(decodeURIComponent(post),'base64');
  	                fs.writeFileSync("test.jpg", buf); */

                    this.processUrl(pathname, this.getParameters("?" + post), response)
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

            case "/api/signup":
                this.databaseManager.signup(data.name, data.id, data.password, (error) => this.response(response, error));
                break;

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
                    for(let i = 0; i < results.length; i++) {
                        let result = results[i];
                        
                        if(result.cDate != null) result.cDate = new Date(result.cDate).getTime();
                        result.date = new Date(result.date).getTime();
                    }

                    this.response(response, error, results)
                });
                break;

            case "/api/readingDiary":
                this.databaseManager.getReadingDiary(data.userId, (error, result) => this.response(response, error, result));
                break;

            case "/api/market":
                this.databaseManager.getMarket((error, results) => {
                    for(let i = 0; i < results.length; i++) {
                        let result = results[i];
                        
                        result.date = new Date(result.date).getTime();
                    }

                    this.response(response, error, results);
                });
                break;

            case "/api/vote":
                this.databaseManager.vote(data.userId, data.debateId, data.isAgree, (error) => this.response(response, error))
                break;
                
            case "/api/write/debate":
                this.databaseManager.writeDebate(decodeURIComponent(data.userId), decodeURIComponent(data.title), decodeURIComponent(data.category), decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/write/readingDiary":
                this.databaseManager.writeReadingDiary(decodeURIComponent(data.userId), decodeURIComponent(data.title), decodeURIComponent(data.date), decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/write/market":
                this.databaseManager.writeMarket(data.userId, decodeURIComponent(data.title), data.category, data.status, data.price, decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/edit/readingDiary":
                this.databaseManager.editReadingDiary(data.id, decodeURIComponent(data.title), decodeURIComponent(data.date), decodeURIComponent(data.contents), (error) => this.response(response, error));
                break;

            case "/api/delete/readingDiary":
                this.databaseManager.deleteReadingDiary(data.id, (error) => this.response(response, error));
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

            default:
                this.fileResponse(response, this.mapUrl(pathname));
                break;
        }
    }

    mapUrl(pathname) {
        switch(pathname) {
            case "/":
                return "list.html";

            case "/write":
                return "write.html";

            case "/contents":
                return "contents.html";

            case "/login":
                return "login.html";
            
            default:
                return pathname;
        }
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