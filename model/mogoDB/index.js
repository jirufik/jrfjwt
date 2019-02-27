const MongoClient = require('mongodb').MongoClient;

module.exports = class MongodDBModel {

    constructor({
                    server = 'localhost',
                    port = 27100,
                    db = 'jrfjwt',
                    collection = 'jwt',
                    user = '',
                    password = ''
                } = {}) {

        this.server = server;
        this.port = port;
        this.db = db;
        this.collection = collection;
        this.user = user;
        this.password = password;
        this.jwt = null;
        this._db = null;

    }

    async init() {

        let res = await this.connect();
        return res;

    }

    async connect() {

        let res = await this._generateRes(false, 'not connect');

        let connectStr = await this.getConnectStr();
        const db = await MongoClient.connect(connectStr, {useNewUrlParser: true});
        this._db = db;
        const collection = db.db(this.db).collection(this.collection);
        this.jwt = collection;

        res.okay = true;
        res.description = '';
        return res;

    }

    async disconnect() {
        if (this._db) {
            await this._db.close();
        }
    }

    async getConnectStr() {

        let url = 'mongodb://';

        if (this.user || this.password) {
            url += `${this.user}:${this.password}@`;
        }

        if (this.server) {
            url += this.server;
        }

        if (this.port) {
            url += `:${this.port}`;
        }

        if (this.db) {
            url += `/${this.db}`;
        }

        return url;

    }

    async add(user) {

        let res = await this._generateRes(false, 'not add');

        let resGet = await this.get(user.userId);
        if (resGet.output.length) {
            return res;
        }

        let resInsert = (await this.jwt.insertOne(user));
        if (!resInsert.insertedId) {
            return res;
        }

        res.okay = true;
        res.description = '';
        res.output.push(resInsert.insertedId);
        return res;

    }

    async get(userId) {

        let res = await this._generateRes(true);

        let find = await this._generateFind(userId);

        let resGet = (await this.jwt.find(find).toArray());

        res.output = resGet;
        return res;

    }

    async edit(userId, user) {

        let res = await this._generateRes(false, 'not update');
        if (!userId || !user) {
            return res;
        }

        let find = await this._generateFind(userId);
        let resEdit = (await this.jwt.updateOne(find, {$set: user}));

        if (resEdit.modifiedCount) {
            res.okay = true;
            res.description = '';
        }

        return res;

    }

    async del(userId) {

        let res = await this._generateRes(true);

        let find = await this._generateFind(userId);
        let resDel = (await this.jwt.deleteMany(find));

        res.description = `deleted: ${resDel.deletedCount}`;
        res.output.push(resDel.deletedCount);
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
            if(!user.tokens) {
                user.tokens = [];
            }
            if(!user.tokensOld) {
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

    async _generateFind(userId) {

        let find = {};
        if (userId) {
            find = {
                userId
            };
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