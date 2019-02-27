const crypto = require('crypto');

module.exports = class Token {

    constructor(settings) {

        this.model = settings.model;
        this.alg = settings.alg || 'HS512';
        this.typ = settings.typ || 'JWT';
        this.iss = settings.iss || '';
        this.accessExp = settings.accessExp || '10min';
        this.refreshExp = settings.refreshExp || '10day';
        this.salt = settings.salt || 'J*$#d73';
        this.iterations = settings.iterations || 100;
        this.hashLength = settings.hashLength || 64;

    }

    async isValid({access, refresh, rolesRules, usersRules}) {

        let res = await this._generateRes(false, 'invalid');
        res.isValid = false;
        res.access = false;

        if (!access || !refresh) {
            return res;
        }

        /// decode
        let accessDecode = await this._decodeToken(access);
        let refreshDecode = await this._decodeToken(refresh);
        let devId = accessDecode.payload.devId;
        let userId = accessDecode.payload.userId;
        let rolesId = accessDecode.payload.rolesId;
        if (!accessDecode || !refreshDecode) {
            return res;
        }

        ///signature is valid
        let signatureIsValid = await this._signatureIsValid(accessDecode);
        if (!signatureIsValid) {
            res.description = 'access signature invalid';
            return res;
        }
        signatureIsValid = await this._signatureIsValid(refreshDecode);
        if (!signatureIsValid) {
            res.description = 'refresh signature invalid';
            return res;
        }

        /// find user
        let user = await this._getUser(userId);
        if (!user) {
            res.description = 'not found user';
            return res;
        }

        /// find token, compare old token
        let foundIn = await this._findToken({user, devId, access, refresh});
        if (!foundIn.tokens && !foundIn.tokensOld) {
            res.description = 'tokens not found';
            await this.model.delTokens(userId, devId);
            return res;
        }

        /// del old token, get new token
        if (foundIn.tokensOld) {
            let token = user.tokens.find(el => el.devId === devId);
            await this.model.delTokens(userId, devId, true);
            accessDecode = await this._decodeToken(token.access);
            refreshDecode = await this._decodeToken(token.refresh);
        }

        /// live tokens
        let refreshIsLive = await this._isLive(refreshDecode);
        let accessIsLive = await this._isLive(accessDecode);

        if (!refreshIsLive) {
            res.description = 'refresh token not live';
            await this.model.delTokens(userId, devId);
            return res;
        }

        res.isValid = true;
        res.access = true;

        /// update access
        if (!accessIsLive) {

            let resUpdate = await this.updateTokens({userId, devId, rolesId});
            if (!resUpdate.okay || !resUpdate.output.length) {
                res.isValid = false;
                res.access = false;
                res.description = 'server error, repeat pleas';
                return res;
            }

            res.tokensNew = {
                access: resUpdate.output[0].access,
                refresh: resUpdate.output[0].refresh
            }

        }

        /// compare users
        if (usersRules) {
            let isAccess = await this._userIsAccess(userId, usersRules, usersRules.defaultAccess);
            if (!isAccess) {
                res.access = false;
                res.description = 'no rights';
                return res;
            }
        }

        /// compare roles
        if (rolesRules) {
            let isAccess = await this._roleIsAccess(rolesId, rolesRules, rolesRules.defaultAccess);
            if (!isAccess) {
                res.access = false;
                res.description = 'no rights';
                return res;
            }
        }

        res.description = '';
        res.okay = true;
        return res;

    }

    async updateTokens({userId, rolesId, devId}) {

        let res = await this._generateRes(false, 'not update');
        if (!userId || !devId) {
            return res;
        }

        if (!rolesId) {
            rolesId = await this._getRoles(userId);
        }

        let access = await this._createToken({userId, rolesId, devId, type: 'access'});
        let refresh = await this._createToken({userId, rolesId, devId, type: 'refresh'});

        res = await this.model.updateTokens({userId, devId, access, refresh});
        if (res.okay) {
            res.output.push({devId, access, refresh});
        }

        return res;

    }

    async createTokens({userId, rolesId}) {

        let devId = await this._generateId();
        let access = await this._createToken({userId, rolesId, devId, type: 'access'});
        let refresh = await this._createToken({userId, rolesId, devId, type: 'refresh'});

        let res = await this.model.createTokens({userId, devId, access, refresh, rolesId});

        if (res.okay) {
            res.output.push({devId, access, refresh});
        }

        return res;

    }

    async _createToken({userId, rolesId, devId, type}) {

        if (!rolesId) {
            rolesId = await this._getRoles(userId);
        }

        if (!devId) {
            devId = await this._generateId();
        }

        let head = {
            alg: this.alg,
            typ: this.typ
        };

        let now = new Date();
        let exp = await this._timeAdd(now.getTime(), this[`${type}Exp`]);

        let payload = {
            userId,
            rolesId,
            devId,
            iss: this.iss,
            exp
        };

        let unsignedToken = await this._createUnsignedToken(head, payload);
        let signatureToken = await this._createSignature(unsignedToken);
        let token = `${unsignedToken}.${signatureToken}`;

        return token;

    }

    async _createSignature(unsignedToken) {

        let cryptoHmac = await crypto.createHmac('sha512', this.salt);
        let signature = await cryptoHmac.update(unsignedToken).digest('base64');
        signature = await this._base64urlReplace(signature);

        return signature;

    }

    async _createUnsignedToken(head, payload) {

        let strHead = JSON.stringify(head);
        let strPayload = JSON.stringify(payload);
        let str64 = `${await this._base64urlEncode(strHead)}.${await this._base64urlEncode(strPayload)}`;

        return str64;

    }

    async _getRoles(userId) {

        let roles = [];

        let res = await this.model.get(userId);
        if (res.output.length) {
            roles = res.output[0].rolesId;
        }

        return roles;

    }

    async _getUser(userId) {

        let res = await this.model.get(userId);
        if (res.output.length) {
            return res.output[0];
        }

    }

    async _isLive(tokenDecode) {

        if (!tokenDecode) {
            return false;
        }

        let now = new Date();
        let diff = tokenDecode.payload.exp - now;
        if (diff < 0) {
            return false;
        }

        return true;

    }

    async _findToken({user, devId, access, refresh}) {

        let res = {
            tokens: false,
            tokensOld: false
        };

        for (let token of user.tokens) {

            if (token.devId === devId
                && token.access === access
                && token.refresh === refresh) {
                res.tokens = true;
                return res;
            }

        }

        for (let token of user.tokensOld) {

            if (token.devId === devId
                && token.access === access
                && token.refresh === refresh) {
                res.tokensOld = true;
                return res;
            }

        }

        return res;

    }

    async _userIsAccess(userId, usersRules, defaultAccess = false) {

        if (usersRules.include.includes(userId)) {
            return true;
        }

        if (usersRules.exclude.includes(userId)) {
            return false;
        }

        return defaultAccess;

    }

    async _roleIsAccess(rolesId, rolesRules, defaultAccess = false) {

        for (let roleId of rolesId) {

            if (rolesRules.include.includes(roleId)) {
                return true;
            }

            if (rolesRules.exclude.includes(roleId)) {
                return false;
            }

        }

        return defaultAccess;

    }

    async _decodeToken(token) {

        if (!token) {
            return false;
        }

        let tokenDecode = await this._decodePartToken(token);
        tokenDecode.head = JSON.parse(tokenDecode.head);
        tokenDecode.payload = JSON.parse(tokenDecode.payload);
        tokenDecode.payload.exp = new Date(tokenDecode.payload.exp);
        tokenDecode.source = token;

        return tokenDecode;

    }

    async _decodePartToken(token) {

        let arrToken = token.split('.');
        if (!arrToken.length || arrToken.length !== 3) {
            return false;
        }

        let decodeToken = {
            head: await this._base64urlDecode(arrToken[0]),
            payload: await this._base64urlDecode(arrToken[1]),
            signature: arrToken[2],
            head64: arrToken[0],
            payload64: arrToken[1]
        };

        return decodeToken;

    }

    async _signatureIsValid(tokenDecode) {
        let signature = await this._createSignature(`${tokenDecode.head64}.${tokenDecode.payload64}`);
        return signature === tokenDecode.signature;
    }

    async _base64urlEncode(str) {

        let encodedSource = Buffer.from(str).toString('base64');
        let decode = await this._base64urlReplace(encodedSource);

        return decode;

    }

    async _base64urlDecode(str) {

        let decode = Buffer.from(str, 'base64').toString('utf-8');
        return decode;

    }

    async _base64urlReplace(str) {

        // Remove padding equal characters
        let encodedSource = str.replace(/=+$/, '');
        // Replace characters according to base64url specifications
        encodedSource = encodedSource.replace(/\+/g, '-');
        encodedSource = encodedSource.replace(/\//g, '_');

        return encodedSource;

    }

    async _timeAdd(time, addTime) {

        time = time || new Date().getTime();
        let ms = await this._convertToMS(addTime);

        return time + ms;

    }

    async _convertToMS(time) {

        if (typeof time === 'number') {
            return time;
        }

        if (typeof time !== 'string') {
            return 0;
        }

        let num = await this._getNumber(time, 'ms');
        if (num) {
            return num;
        }

        num = await this._getNumber(time, 'sec');
        if (num) {
            return num * 1000;
        }

        num = await this._getNumber(time, 'min');
        if (num) {
            return num * 1000 * 60;
        }

        num = await this._getNumber(time, 'hour');
        if (num) {
            return num * 1000 * 60 * 60;
        }

        num = await this._getNumber(time, 'day');
        if (num) {
            return num * 1000 * 60 * 60 * 24;
        }

        return 0;

    }

    async _getNumber(strTime, replace) {

        if (!strTime.includes(replace)) {
            return 0;
        }

        let num = strTime.replace(replace, '');
        return Number(num);

    }

    async _generateId(len = 10, smallChar = true, bigChar = true, num = true) {

        let strId = '';
        let patern = '';

        if (smallChar) {
            patern += 'abcdefghijklmnopqrstuvwxyz';
        }
        if (bigChar) {
            patern += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if (num) {
            patern += '0123456789';
        }

        for (let i = 0; i < len; i++) {
            strId += patern.charAt(Math.floor(Math.random() * patern.length));
        }

        return strId;
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