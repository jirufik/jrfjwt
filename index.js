const model = require('./model');
const Tokens = require('./tokens');

module.exports = class JRFJWT {

    constructor() {

        this._model = null;
        this._tokens = null;
        this.dbType = {
            MongoDB: 'mongoDB',
            PostgreSQL: 'postgreSQL'
        };

    }

    async init(options) {

        let res = await this._generateRes(false, 'not init jrfjwt');

        if (options) {
            this._model = await model.initModel(options.db);
        } else {
            await model.initModel();
        }
        if (!this._model) {
            throw Error('not init jrfjwt');
        }

        if (!options.token) {
            options.token = {};
        }

        options.token.model = this._model;

        if (options) {
            this._tokens = new Tokens(options.token);
        } else {
            this._tokens = new Tokens();
        }

        res.okay = true;
        res.description = '';
        return res;
    }

    async addNewUsers(users) {

        let res = await this._generateRes(true);
        for (let user of users) {

            let resAdd = await this.addNewUser(user);

            if (resAdd.okay) {
                res.output.push({
                    user,
                    add: true,
                    description: resAdd.output[0]
                });
                continue;
            }

            res.output.push({
                user,
                add: false,
                description: resAdd.description
            });

        }

        return res;

    }

    /// users
    async addNewUser(user) {

        let res = await this._model.add(user);
        return res;

    }

    async getUsers(id) {

        return await this._model.get(id);

    }

    async updateRoles(userId, rolesId) {

        let res = await this._model.updateRoles(userId, rolesId);
        return res;

    }

    async delUsers(id) {
        let res = await this._model.del(id);
        return res;
    }

    /// tokens
    async createTokens(userId) {

        let res = await this._tokens.createTokens({userId});
        return res;

    }

    async updateTokens(userId, devId) {

        let res = await this._tokens.updateTokens({userId, devId});
        return res;

    }

    async isValid(access, refresh, rolesRules, usersRules) {

        let res = await this._tokens.isValid({access, refresh, rolesRules, usersRules});
        return res;

    }

    async delTokens(userId, devId) {

        let res = await this._model.delTokens(userId, devId);
        return res;

    }

    async delAllTokens(userId) {

        let res = await this._model.delAllTokens(userId);
        return res;

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

