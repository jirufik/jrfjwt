const {Pool} = require('pg');

module.exports = class PostgreSQLModel {

    constructor({
                    server = 'localhost',
                    port = 5432,
                    db = 'jrfjwt',
                    user = '',
                    password = ''
                } = {}) {

        this.server = server;
        this.port = port;
        this.db = db;
        this.user = user;
        this.password = password;
        this._pool = null;

    }

    async init() {

        let client;
        let res = await this._generateRes(false, 'not connect');
        try {

            this._pool = new Pool({
                host: this.server,
                port: this.port,
                database: this.db,
                user: this.user,
                password: this.password
            });
            client = await this._pool.connect();
            let createRes = await this.createTables();
            if (!createRes.okay) return res;

        } catch (e) {
            return res;
        } finally {
            if (client) client.release();
        }

        res.okay = true;
        res.description = '';
        return res;

    }

    async disconnect() {
        if (this._pool) await this._pool.end();
    }

    async createTables() {

        let resCreate = await this.createUsersTable();
        if (!resCreate.okay) return resCreate;

        resCreate = await this.createTokensTable();
        if (!resCreate.okay) return resCreate;

        return resCreate;
    }

    async createUsersTable() {
        return await this.createTable({
            command: `CREATE TABLE IF NOT EXISTS users (
        userId text PRIMARY KEY,
        rolesId text[]
        );`,
            description: 'not create users table'
        });
    }

    async createTokensTable() {
        return await this.createTable({
            command: `CREATE TABLE IF NOT EXISTS tokens (
        userId text,
        devId text,
        accessToken text,
        accessTokenOld text,
        refreshToken text,
        refreshTokenOld text,
        FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE,
        PRIMARY KEY (userId, devId)
        );`,
            description: 'not create tokens table'
        });
    }

    async createTable({command, description = 'not create table'} = {}) {

        let res = await this._generateRes(false, description);
        let client;
        try {
            client = await this._pool.connect();
            await client.query(command);
        } catch (e) {
            return res;
        } finally {
            if (client) client.release();
        }

        res.okay = true;
        res.description = "";
        return res;

    }

    async add(user, withTransaction = true) {

        let res = await this._generateRes(false, 'not add');

        let resGet = await this.get(user.userId);
        if (resGet.output.length) {
            return res;
        }

        let resQuery = await this._convertUserToQuery(user);
        if (!resQuery.userSQL) return res;

        let client;
        let resAdd;
        try {
            client = await this._pool.connect();
            if (withTransaction) await client.query('BEGIN');
            resAdd = await client.query(resQuery.userSQL);
            for (let query of resQuery.tokenSQL) {
                await client.query(query);
            }
            if (withTransaction) await client.query('COMMIT');
        } catch (e) {
            if (withTransaction) await client.query('ROLLBACK');
            return res;
        } finally {
            if (client) client.release();
        }

        res.okay = true;
        res.description = '';
        res.output.push(resAdd.rows[0].userid);
        return res;

    }

    async get(userId, convertResult = true) {

        let res = await this._generateRes(true);

        let find = await this._generateFind(userId);

        let resGet;
        try {
            resGet = await this._pool.query(`SELECT 
            u.userId,
            u.rolesId,
            t.devId,
            t.accessToken,
            t.accessTokenOld,
            t.refreshToken,
            t.refreshTokenOld
            FROM users AS u
            LEFT JOIN tokens AS t ON u.userId = t.userId
            ${find} 
            ;`);
        } catch (e) {
            return res;
        }

        res.output = resGet.rows;
        if (convertResult) res.output = await this._convertUsersFromSQL(res.output);

        return res;

    }

    async edit(userId, user) {

        let res = await this._generateRes(false, 'not update');
        if (!userId || !user) {
            return res;
        }

        let client;
        let resAdd;
        try {
            client = await this._pool.connect();
            await client.query('BEGIN');
            let resDel = await this.del(userId, false);
            if (!resDel.okay) throw Error('not del');
            resAdd = await this.add(user, false);
            if (!resAdd.okay) throw Error('not add');
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            return res;
        } finally {
            if (client) client.release();
        }

        res.okay = true;
        res.description = '';
        res.output = resAdd.output;
        return res;

    }

    async del(userId, withTransaction = true) {

        let res = await this._generateRes(false, 'not del');

        let find = await this._generateFind(userId);

        let client;
        let resDel;
        try {
            client = await this._pool.connect();
            if (withTransaction) await client.query('BEGIN');
            let query = await this._getUserDelQuery(userId);
            resDel = await client.query(query);
            if (withTransaction) await client.query('COMMIT');
        } catch (e) {
            if (withTransaction) await client.query('ROLLBACK');
            return res;
        } finally {
            if (client) client.release();
        }

        res.okay = true;
        res.description = `deleted: ${resDel.rows.length}`;
        res.output = resDel.rows;
        return res;
    }

    async createTokens({userId, devId, rolesId, access, refresh}) {

        let res = await this._generateRes(false, 'not create');
        if (!userId || !access || !refresh || !devId) {
            return res;
        }

        let resGet = await this.get(userId);
        if (!resGet.okay) {
            return res;
        }

        if (!resGet.output.length) {

            let newUser = {
                userId,
                tokens: [{devId, access, refresh}],
                tokensOld: []
            };
            if (rolesId) {
                newUser.rolesId = rolesId;
            }

            let resAdd = await this.add(newUser);

            if (resAdd.okay) {
                res.okay = true;
                res.description = '';
            }

        } else {

            let user = resGet.output[0];
            if (rolesId) {
                user.rolesId = rolesId;
            }
            if (!user.tokens) {
                user.tokens = [];
            }
            if (!user.tokensOld) {
                user.tokensOld = [];
            }
            user.tokens.push({devId, access, refresh});
            let resEdit = await this.edit(userId, user);

            if (resEdit.okay) {
                res.okay = true;
                res.description = '';
            }

        }

        return res;

    }

    async updateTokens({userId, devId, access, refresh}) {

        let res = await this._generateRes(false, 'not update');
        if (!userId || !access || !refresh || !devId) {
            return res;
        }

        let resGet = await this.get(userId);
        if (!resGet.okay || !resGet.output.length) {
            return res;
        }

        let user = resGet.output[0];
        let tokensOld = [];

        if (user.tokensOld && user.tokensOld.length) {
            tokensOld = user.tokensOld.filter(token => token.devId !== devId);
        }
        user.tokensOld = tokensOld;

        if (user.tokens && user.tokens.length) {

            let index = -1;
            for (let i = 0; i < user.tokens.length; i++) {

                let token = user.tokens[i];
                if (token.devId !== devId) {
                    continue;
                }

                index = i;
                user.tokensOld.push(token);
                break;

            }

            if (index > -1) {
                user.tokens.splice(index, 1);
            }

        } else {
            user.tokens = [];
        }
        user.tokens.push({devId, access, refresh});

        let resEdit = await this.edit(userId, user);
        if (!resEdit.okay) {
            return res;
        }

        res.okay = true;
        res.description = '';
        return res;

    }

    async updateRoles(userId, rolesId) {

        let res = await this._generateRes(false, 'not update');
        if (!userId) {
            return res;
        }

        let resGet = await this.get(userId);
        if (!resGet.okay || !resGet.output.length) {
            return res;
        }

        let user = resGet.output[0];
        if (rolesId) {
            user.rolesId = rolesId;
        } else {
            user.rolesId = [];
        }

        let resEdit = await this.edit(userId, user);
        if (!resEdit.okay) {
            return res;
        }

        res.okay = true;
        res.description = '';
        return res;

    }

    async delTokens(userId, devId, onlyOld = false) {

        let res = await this._generateRes(false, 'not del');
        if (!userId || !devId) {
            return res;
        }

        let resGet = await this.get(userId);
        if (!resGet.okay) {
            return res;
        }
        let user = resGet.output[0];

        user.tokensOld = user.tokensOld.filter(token => token.devId !== devId);
        if (!onlyOld) {
            user.tokens = user.tokens.filter(token => token.devId !== devId);
        }

        let resEdit = await this.edit(userId, user);
        if (!resEdit.okay) {
            return res;
        }

        res.okay = true;
        res.description = '';
        return res;

    }

    async delAllTokens(userId) {

        let res = await this._generateRes(false, 'not del');
        if (!userId) {
            return res;
        }

        let resGet = await this.get(userId);
        if (!resGet.okay) {
            return res;
        }
        let user = resGet.output[0];

        user.tokens = [];
        user.tokensOld = [];

        let resEdit = await this.edit(userId, user);
        if (!resEdit.okay) {
            return res;
        }

        res.okay = true;
        res.description = '';
        return res;

    }

    async _convertUserToQuery(user) {

        let res = {
            userSQL: null,
            tokenSQL: null
        };
        res.userSQL = await this._getUserQuery(user);
        res.tokenSQL = await this._getTokensQuery(user);

        return res;
    }

    async _getUserQuery(user) {
        let query = {
            text: '',
            values: []
        };
        if (!user.userId) {
            return query;
        }
        query.text = 'INSERT INTO users VALUES ($1';
        query.values.push(user.userId);
        if (user.rolesId) {
            query.text += ', $2) RETURNING *;';
            query.values.push(user.rolesId);
        } else {
            query.text += ') RETURNING *;'
        }
        return query;
    }

    async _getUserDelQuery(userId) {
        let query = {
            text: '',
            values: []
        };
        query.text = 'DELETE FROM users';
        if (userId) {
            query.text += ' WHERE userId = $1 RETURNING *;';
            query.values.push(userId);
        } else {
            query.text += ' RETURNING *;'
        }
        return query;
    }

    async _getTokensQuery(user) {

        let queries = [];

        if (!user.userId) {
            return queries;
        }

        let tokesFlat = await this._tokensToFlat({
            tokens: user.tokens,
            tokensOld: user.tokensOld
        });

        for (let token of tokesFlat) {
            let query = await this._getInsertTokenQuery(token, user.userId);
            queries.push(query);
        }

        return queries;
    }

    async _getInsertTokenQuery(token, userId) {
        let query = {
            text: '',
            values: []
        };
        if (!userId) {
            return query;
        }
        query.text = 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);';
        query.values.push(userId);
        query.values.push(token.devId);
        query.values.push(token.access);
        query.values.push(token.accessOld);
        query.values.push(token.refresh);
        query.values.push(token.refreshOld);
        return query;
    }

    async _tokensToFlat({tokens = [], tokensOld = []}) {

        let tokensFlat = [...tokens];
        let tokensOldCopy = [...tokensOld];

        for (let token of tokensFlat) {
            await this._createElementTokensFlat({token, tokensOld: tokensOldCopy});
        }
        await this._joinTokensFlatWithTokensOld({tokensFlat, tokensOld: tokensOldCopy});

        return tokensFlat;

    }

    async _createElementTokensFlat({token, tokensOld}) {

        if (!token.accessOld) token.accessOld = null;
        if (!token.refreshOld) token.refreshOld = null;

        for (let i = 0; i < tokensOld.length; i++) {

            let tokenOld = tokensOld[i];
            if (token.devId !== tokenOld.devId) {
                continue;
            }

            token.accessOld = tokenOld.access;
            token.refreshOld = tokenOld.refresh;

            tokensOld.splice(i, 1);
            i--;

        }

    }

    async _joinTokensFlatWithTokensOld({tokensFlat = [], tokensOld = []}) {
        for (let tokenOld of tokensOld) {
            tokenOld.accessOld = tokenOld.access;
            tokenOld.refreshOld = tokenOld.refresh;
            tokenOld.access = null;
            tokenOld.refresh = null;
            tokensFlat.push(tokenOld);
        }
    }

    async _convertUsersFromSQL(result) {

        let users = {};

        for (let row of result) {

            let user = await this._getUserFromSQL(row, users);
            let tokens = await this._getTokensFromSQL(row);

            if (tokens.token) user.tokens.push(tokens.token);
            if (tokens.tokenOld) user.tokensOld.push(tokens.tokenOld);

        }

        users = await this._objUsersToArray(users);

        return users;
    }

    async _objUsersToArray(users) {

        let arrUsers = [];

        for (let user in users) {
            arrUsers.push(users[user]);
        }

        return arrUsers;

    }

    async _getTokensFromSQL(row) {

        let tokens = {};

        if (row.accesstoken && row.refreshtoken) {
            tokens.token = {
                devId: row.devid,
                access: row.accesstoken,
                refresh: row.refreshtoken
            };
        }

        if (row.accesstokenold && row.refreshtokenold) {
            tokens.tokenOld = {
                devId: row.devid,
                access: row.accesstokenold,
                refresh: row.refreshtokenold
            };
        }

        return tokens;

    }

    async _getUserFromSQL(row, users) {

        let user = users[row.userid];
        if (!user) {
            users[row.userid] = {};
            user = users[row.userid];
            user.userId = row.userid;
            user.rolesId = row.rolesid;
            user.tokens = [];
            user.tokensOld = [];
        }

        return user;

    }

    async _generateFind(userId) {

        let find = '';
        if (userId) {
            find = `WHERE u.userId = '${userId}'`;
        }

        return find;

    }

    async _generateRes(okay = false, description = '') {
        return {
            okay,
            description,
            output: [],
            error: {}
        }
    }

};