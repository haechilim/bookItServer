const mysql = require('mysql');

class DatabaseManager {
    constructor() {
        setInterval(() => this.test(), 10800000);
    }

    connect() {
        this.connection = mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'gocl213@',
            database: 'bookIt'
        });
        this.connection.connect();
    }

    disconnect() {
        this.connection.end();
    }

    getNeeds(userId, callback) {
        this.query('select * from needs where userId = ' + userId + ';', callback);
    }

    signup(name, id, password, callback) {
        this.query('INSERT INTO user(profileImage, name, loginId, password) VALUES("/image/image1.jpg", "' + name + '", "' + id + '", "' + password + '");', callback);
    }

    selectNeeds(loginId, categoryId, callback) {
        this.query('INSERT INTO needs(userId, categoryId) VALUES((select user.id from user where user.loginId = "' + loginId + '"), ' + categoryId + ');', callback);
    }

    login(id, password, callback) {
        this.query('SELECT * FROM user WHERE loginId = "' + id + '" AND password = "' + password + '";', callback);
    }

    getUser(id, callback) {
        this.query('SELECT id, profileImage, name FROM user WHERE id = ' + id + ';', callback);
    }

    test(callback) {
        this.query('SELECT * FROM user;', callback);
    }

    getDebates(userId, callback) {
        this.query('SELECT debate.id, u.id AS uId, u.profileImage AS uProfileImage, u.name AS uName,' +
        ' debate.categoryId, debate.title, debate.contents,' +
        ' c.id AS cId, cu.id AS cuId, cu.profileImage AS cuProfileImage, cu.name AS cuName, c.contents AS cContents, c.date AS cDate,' +
        ' v.isAgree AS vIsAgree, debate.date' + 
        ' FROM debate LEFT JOIN user AS u ON debate.userId = u.id' +
        ' LEFT JOIN comment AS c ON (select comment.id from comment where debate.id = comment.debateId ORDER BY comment.id DESC LIMIT 1) = c.id' +
        ' LEFT JOIN user AS cu ON c.userId = cu.id' +
        ' LEFT JOIN vote AS v ON v.userId = ' + userId + ' AND v.debateId = debate.id' +
        ' ORDER BY date DESC;', callback);
    }

    getReadingDiary(userId, callback) {
        this.query('SELECT * FROM readingDiary WHERE userId = ' + userId + ' ORDER BY id DESC;', callback);
    }

    getMarket(callback) {
        this.query('SELECT market.id, u.id AS uId, u.profileImage AS uProfileImage, u.name AS uName, market.title, market.imageUrl, market.categoryId, market.status, market.price, market.contents, market.date FROM market LEFT JOIN user AS u ON market.userId = u.id ORDER BY date DESC;', callback);
    }

    getComments(id, callback) {
        this.query('SELECT comment.id, u.id AS uId, u.profileImage AS uProfileImage, u.name AS uName, comment.contents, comment.date FROM comment LEFT JOIN user AS u ON comment.userId = u.id WHERE debateId = ' + id + ';', callback);
    }

    writeDebate(userId, title, category, contents, callback) {
        this.query('INSERT INTO debate(userId, categoryId, title, contents, date) VALUES(' + userId + ', ' + category + ', "' + title + '", "' + contents + '", now());', callback);
    }

    writeReadingDiary(userId, title, date, contents, callback) {
        this.query('INSERT INTO readingDiary(userId, title, date, contents) VALUES(' + userId + ', "' + title + '", "' + date + '", "' + contents + '");', callback);
    }

    writeMarket(userId, imageUrl, title, category, status, price, contents, callback) {
        this.query('INSERT INTO market(userId, imageUrl, title, categoryId, status, price, contents, date) VALUES(' + userId + ', "' + imageUrl + '", "' + title + '", ' + category + ', ' + status + ', ' + price + ', "' + contents + '", now());', callback);
    }

    writeComment(userId, debateId, contents, callback) {
        this.query('INSERT INTO comment(userId, debateId, contents, date) VALUES(' + userId + ', ' + debateId + ', "' + contents + '", now());', callback);
    }

    editReadingDiary(id, title, date, contents, callback) {
        this.query('UPDATE readingDiary SET title = "' + title + '", date = "' + date + '", contents = "' + contents + '" WHERE id = ' + id + ';', callback);
    }

    editProfile(userId, imageUrl, name, callback) {
        this.query('UPDATE user SET profileImage = "' + imageUrl + '", name = "' + name + '" WHERE id = ' + userId + ';', callback);
    }

    deleteReadingDiary(id, callback) {
        this.query('DELETE FROM readingDiary WHERE id = ' + id + ';', callback);
    }

    vote(userId, debateId, isAgree, callback) {
        this.query('SELECT * FROM vote WHERE userId = ' + userId + ' AND debateId = ' + debateId + ';', (error, result) => {
            if(result.length == 0) this.query('INSERT INTO vote(userId, debateId, isAgree) VALUES(' + userId + ', ' + debateId + ', ' + isAgree + ');', callback)
            else this.query('UPDATE vote SET isAgree = ' + isAgree + ' WHERE userId = ' + userId + ' AND debateId = ' + debateId + ';', callback)
        });
    }

    query(query, callback) {
        this.connection.query(query, callback);
    }
}

module.exports = DatabaseManager;