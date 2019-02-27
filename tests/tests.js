const {assert} = require('chai');
const {expect} = require('chai');
const MongoDBModel = require('../model/mogoDB');
const PostgreSQLModel = require('../model/postgreSQL');
const {mongoDBConf} = require('./testConf');
const {postgreSQLConf} = require('./testConf');
const {testUserSnow} = require('./testConf');
const {testUserRick} = require('./testConf');
const {testUserMorty} = require('./testConf');
const Tokens = require('../tokens');


describe('model', () => {
    describe('MongoDB', () => {
        it('It instanceof class MongodDBModel', () => {
            let mongoDB = new MongoDBModel();
            assert.isTrue(mongoDB instanceof MongoDBModel);
        });
        it('Default param server is valid', () => {
            let mongoDB = new MongoDBModel();
            assert.equal(mongoDB.server, 'localhost');
        });
        it('Default param port is valid', () => {
            let mongoDB = new MongoDBModel();
            assert.equal(mongoDB.port, 27100);
        });
        it('Default param db is valid', () => {
            let mongoDB = new MongoDBModel();
            assert.equal(mongoDB.db, 'jrfjwt');
        });
        it('Default param collection is valid', () => {
            let mongoDB = new MongoDBModel();
            assert.equal(mongoDB.collection, 'jwt');
        });
        it('Default param user is valid', () => {
            let mongoDB = new MongoDBModel();
            assert.equal(mongoDB.user, '');
        });
        it('Default param password is valid', () => {
            let mongoDB = new MongoDBModel();
            assert.equal(mongoDB.password, '');
        });
        it('Set param is valid', () => {
            let param = {
                server: '127.0.0.1',
                port: 26000,
                db: 'jrfjwt_test',
                collection: 'jrfjwt_test',
                user: 'jrfjwt',
                password: '123456'
            };
            let mongoDB = new MongoDBModel(param);
            assert.equal(mongoDB.server, param.server, 'server invalid');
            assert.equal(mongoDB.port, param.port, 'port invalid');
            assert.equal(mongoDB.db, param.db, 'db invalid');
            assert.equal(mongoDB.collection, param.collection, 'collection invalid');
            assert.equal(mongoDB.user, param.user, 'user invalid');
            assert.equal(mongoDB.password, param.password, 'password invalid');
        });
        it('getConnectStr is valid', async () => {
            const param = {
                server: '127.0.0.1',
                port: 26000,
                db: 'jrfjwt_test',
                collection: 'jwt',
                user: 'jrfjwt',
                password: '123456'
            };
            const mongoDB = new MongoDBModel(param);
            const strCon = await mongoDB.getConnectStr();
            const validStr = 'mongodb://jrfjwt:123456@127.0.0.1:26000/jrfjwt_test';
            assert.equal(strCon, validStr);
        });
        it('test connect', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.connect();
            assert.isTrue(res.okay);
            await mongoDB.disconnect();
        });
        it('add user Snow', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.del();
            assert.include(res.description, 'deleted', 'invalid del');
            res = await mongoDB.add(testUserSnow);
            assert.isTrue(res.okay, 'invalid add');
            assert.equal(res.output.length, 1, 'invalid add');
            await mongoDB.disconnect();
        });
        it('add user Snow repeat', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.add(testUserSnow);
            assert.isFalse(res.okay, 'invalid add');
            await mongoDB.disconnect();
        });
        it('add user Rick', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.add(testUserRick);
            assert.isTrue(res.okay, 'invalid add');
            assert.equal(res.output.length, 1, 'invalid add');
            await mongoDB.disconnect();
        });
        it('get all users', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.get();
            assert.isTrue(res.okay, 'invalid get');
            assert.equal(res.output.length, 2, 'invalid get');
            await mongoDB.disconnect();
        });
        it('get Rick user', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.get(testUserRick.userId);
            assert.isTrue(res.okay, 'invalid get');
            assert.equal(res.output.length, 1, 'invalid get');
            assert.equal(res.output[0].userId, testUserRick.userId, 'invalid get');
            await mongoDB.disconnect();
        });
        it('get Snow user', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.get(testUserSnow.userId);
            assert.isTrue(res.okay, 'invalid get');
            assert.equal(res.output.length, 1, 'invalid get');
            assert.equal(res.output[0].userId, testUserSnow.userId, 'invalid get');
            await mongoDB.disconnect();
        });
        it('edit Rick user', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.get(testUserRick.userId);
            let user = res.output[0];
            user.rolesId.push('megaspace');
            res = await mongoDB.edit(user.userId, user);
            assert.isTrue(res.okay, 'invalid edit');
            res = await mongoDB.get(user.userId);
            assert.equal(res.output[0].rolesId[2], 'megaspace', 'invalid edit');
            await mongoDB.disconnect();
        });
        it('create token for new user Morty', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.createTokens({
                userId: testUserMorty.userId,
                rolesId: testUserMorty.rolesId,
                access: 'accessToken1',
                refresh: 'refreshToken1',
                devId: 'blaster'
            });
            assert.isTrue(res.okay, 'invalid createTokens');
            res = await mongoDB.get('morty');
            let tokens = res.output[0].tokens[0];
            assert.equal(res.output[0].tokens.length, 1, 'invalid createTokens');
            assert.equal(res.output[0].tokensOld.length, 0, 'invalid createTokens');
            assert.equal(tokens.access, 'accessToken1', 'invalid createTokens');
            assert.equal(tokens.refresh, 'refreshToken1', 'invalid createTokens');
            assert.equal(tokens.devId, 'blaster', 'invalid createTokens');
            await mongoDB.disconnect();
        });
        it('create token for user Morty', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.createTokens({
                userId: testUserMorty.userId,
                rolesId: testUserMorty.rolesId,
                access: 'accessTokenLaser',
                refresh: 'refreshTokenLaser',
                devId: 'laser'
            });
            assert.isTrue(res.okay, 'invalid createTokens');
            res = await mongoDB.get('morty');
            let tokens = res.output[0].tokens[1];
            assert.equal(res.output[0].tokens.length, 2, 'invalid createTokens');
            assert.equal(res.output[0].tokensOld.length, 0, 'invalid createTokens');
            assert.equal(tokens.access, 'accessTokenLaser', 'invalid createTokens');
            assert.equal(tokens.refresh, 'refreshTokenLaser', 'invalid createTokens');
            assert.equal(tokens.devId, 'laser', 'invalid createTokens');
            await mongoDB.disconnect();
        });
        it('first update token for user Morty', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.updateTokens({
                userId: testUserMorty.userId,
                access: 'accessToken2',
                refresh: 'refreshToken2',
                devId: 'blaster'
            });
            assert.isTrue(res.okay, 'invalid createTokens');
            res = await mongoDB.get('morty');
            let tokens = res.output[0].tokens[1];
            let tokensOld = res.output[0].tokensOld[0];
            assert.equal(res.output[0].tokens.length, 2, 'invalid createTokens');
            assert.equal(res.output[0].tokensOld.length, 1, 'invalid createTokens');
            assert.equal(tokens.access, 'accessToken2', 'invalid createTokens');
            assert.equal(tokens.refresh, 'refreshToken2', 'invalid createTokens');
            assert.equal(tokens.devId, 'blaster', 'invalid createTokens');
            assert.equal(tokensOld.access, 'accessToken1', 'invalid createTokens');
            assert.equal(tokensOld.refresh, 'refreshToken1', 'invalid createTokens');
            assert.equal(tokensOld.devId, 'blaster', 'invalid createTokens');
            await mongoDB.disconnect();
        });
        it('second update token for user Morty', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.updateTokens({
                userId: testUserMorty.userId,
                access: 'accessToken3',
                refresh: 'refreshToken3',
                devId: 'blaster'
            });
            assert.isTrue(res.okay, 'invalid createTokens');
            res = await mongoDB.get('morty');
            let tokens = res.output[0].tokens[1];
            let tokensOld = res.output[0].tokensOld[0];
            assert.equal(res.output[0].tokens.length, 2, 'invalid createTokens');
            assert.equal(res.output[0].tokensOld.length, 1, 'invalid createTokens');
            assert.equal(tokens.access, 'accessToken3', 'invalid createTokens');
            assert.equal(tokens.refresh, 'refreshToken3', 'invalid createTokens');
            assert.equal(tokens.devId, 'blaster', 'invalid createTokens');
            assert.equal(tokensOld.access, 'accessToken2', 'invalid createTokens');
            assert.equal(tokensOld.refresh, 'refreshToken2', 'invalid createTokens');
            assert.equal(tokensOld.devId, 'blaster', 'invalid createTokens');
            await mongoDB.disconnect();
        });
        it('update roles for user Morty', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.updateRoles('morty', [
                'yong',
                'foreveryong',
                'megayong'
            ]);
            assert.isTrue(res.okay, 'invalid update roles');
            res = await mongoDB.get('morty');
            let morty = res.output[0];
            assert.isArray(morty.rolesId, 'invalid update roles');
            assert.equal(morty.rolesId.length, 3, 'invalid update roles');
            assert.equal(morty.rolesId[2], 'megayong', 'invalid update roles');
            await mongoDB.disconnect();
        });
        it('del tokens only old', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.delTokens('morty', 'blaster', true);
            assert.isTrue(res.okay, 'invalid del tokens');
            res = await mongoDB.get('morty');
            let morty = res.output[0];
            assert.equal(morty.tokensOld.length, 0, 'invalid del tokens');
            morty.tokensOld.push({devId: 'blaster'});
            await mongoDB.edit('morty', morty);
            await mongoDB.disconnect();
        });
        it('del tokens', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.delTokens('morty', 'blaster');
            assert.isTrue(res.okay, 'invalid del tokens');
            res = await mongoDB.get('morty');
            let morty = res.output[0];
            assert.equal(morty.tokensOld.length, 0, 'invalid del tokens');
            assert.equal(morty.tokens.length, 1, 'invalid del tokens');
            assert.notEqual(morty.tokens[0].devId, 'blaster', 'invalid del tokens');
            morty.tokensOld.push({devId: 'blaster'});
            morty.tokensOld.push({devId: 'blaster'});
            morty.tokensOld.push({devId: 'blaster'});
            morty.tokens.push({devId: 'blaster'});
            morty.tokens.push({devId: 'blaster'});
            await mongoDB.edit('morty', morty);
            await mongoDB.disconnect();
        });
        it('del all tokens', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.delAllTokens('morty');
            assert.isTrue(res.okay, 'invalid del tokens');
            res = await mongoDB.get('morty');
            let morty = res.output[0];
            assert.equal(morty.tokensOld.length, 0, 'invalid del tokens');
            assert.equal(morty.tokens.length, 0, 'invalid del tokens');
            await mongoDB.disconnect();
        });
        it('del user', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.get();
            let users = res.output;
            assert.equal(users.length, 3, 'invalid del user');
            res = await mongoDB.del('morty');
            assert.isTrue(res.okay, 'invalid del user');
            res = await mongoDB.get();
            users = res.output;
            assert.equal(users.length, 2, 'invalid del user');
            await mongoDB.disconnect();
        });
        it('del users', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await mongoDB.get();
            let users = res.output;
            assert.equal(users.length, 2, 'invalid del users');
            res = await mongoDB.del();
            assert.isTrue(res.okay, 'invalid del users');
            res = await mongoDB.get();
            users = res.output;
            assert.equal(users.length, 0, 'invalid del users');
            await mongoDB.disconnect();
        });
        it('_generateFind without userId', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB._generateFind();
            expect(res).to.eql({}, 'invalid _generateFind without userId');
        });
        it('_generateFind with userId', async () => {
            const mongoDB = new MongoDBModel(mongoDBConf);
            let res = await mongoDB._generateFind('cherry');
            expect(res).to.eql({userId: 'cherry'}, 'invalid _generateFind with userId');
        });
    });
    describe('PostgreSQL', () => {
        it('It instanceof class MongodDBModel', () => {
            let postgreSQL = new PostgreSQLModel();
            assert.isTrue(postgreSQL instanceof PostgreSQLModel);
        });
        it('Default param server is valid', () => {
            let postgreSQL = new PostgreSQLModel();
            assert.equal(postgreSQL.server, 'localhost');
        });
        it('Default param port is valid', () => {
            let postgreSQL = new PostgreSQLModel();
            assert.equal(postgreSQL.port, 5432);
        });
        it('Default param db is valid', () => {
            let postgreSQL = new PostgreSQLModel();
            assert.equal(postgreSQL.db, 'jrfjwt');
        });
        it('Default param user is valid', () => {
            let postgreSQL = new PostgreSQLModel();
            assert.equal(postgreSQL.user, '');
        });
        it('Default param password is valid', () => {
            let postgreSQL = new PostgreSQLModel();
            assert.equal(postgreSQL.password, '');
        });
        it('Set param is valid', () => {
            let param = {
                server: '127.0.0.1',
                port: 5432,
                db: 'jrfjwt_test',
                user: 'jrfjwt',
                password: '123456'
            };
            let postgreSQL = new PostgreSQLModel(param);
            assert.equal(postgreSQL.server, param.server, 'server invalid');
            assert.equal(postgreSQL.port, param.port, 'port invalid');
            assert.equal(postgreSQL.db, param.db, 'db invalid');
            assert.equal(postgreSQL.user, param.user, 'user invalid');
            assert.equal(postgreSQL.password, param.password, 'password invalid');
        });
        it('add user Snow', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.del();
            assert.include(res.description, 'deleted', 'invalid del');
            res = await postgreSQL.add(testUserSnow);
            assert.isTrue(res.okay, 'invalid add');
            assert.equal(res.output.length, 1, 'invalid add');
            await postgreSQL.disconnect();
        });
        it('add user Snow repeat', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.add(testUserSnow);
            assert.isFalse(res.okay, 'invalid add');
            await postgreSQL.disconnect();
        });
        it('add user Rick', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.add(testUserRick);
            assert.isTrue(res.okay, 'invalid add');
            assert.equal(res.output.length, 1, 'invalid add');
            await postgreSQL.disconnect();
        });
        it('get all users', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.get();
            assert.isTrue(res.okay, 'invalid get');
            assert.equal(res.output.length, 2, 'invalid get');
            await postgreSQL.disconnect();
        });
        it('get Rick user', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.get(testUserRick.userId);
            assert.isTrue(res.okay, 'invalid get');
            assert.equal(res.output.length, 1, 'invalid get');
            assert.equal(res.output[0].userId, testUserRick.userId, 'invalid get');
            await postgreSQL.disconnect();
        });
        it('get Snow user', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.get(testUserSnow.userId);
            assert.isTrue(res.okay, 'invalid get');
            assert.equal(res.output.length, 1, 'invalid get');
            assert.equal(res.output[0].userId, testUserSnow.userId, 'invalid get');
            await postgreSQL.disconnect();
        });
        it('edit Rick user', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.get(testUserRick.userId);
            let user = res.output[0];
            user.rolesId.push('megaspace');
            res = await postgreSQL.edit(user.userId, user);
            assert.isTrue(res.okay, 'invalid edit');
            res = await postgreSQL.get(user.userId);
            assert.equal(res.output[0].rolesId[2], 'megaspace', 'invalid edit');
            await postgreSQL.disconnect();
        });
        it('create token for new user Morty', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.createTokens({
                userId: testUserMorty.userId,
                rolesId: testUserMorty.rolesId,
                access: 'accessToken1',
                refresh: 'refreshToken1',
                devId: 'blaster'
            });
            assert.isTrue(res.okay, 'invalid createTokens');
            res = await postgreSQL.get('morty');
            let tokens = res.output[0].tokens[0];
            assert.equal(res.output[0].tokens.length, 1, 'invalid createTokens');
            assert.equal(res.output[0].tokensOld.length, 0, 'invalid createTokens');
            assert.equal(tokens.access, 'accessToken1', 'invalid createTokens');
            assert.equal(tokens.refresh, 'refreshToken1', 'invalid createTokens');
            assert.equal(tokens.devId, 'blaster', 'invalid createTokens');
            await postgreSQL.disconnect();
        });
        it('create token for user Morty', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.createTokens({
                userId: testUserMorty.userId,
                rolesId: testUserMorty.rolesId,
                access: 'accessTokenLaser',
                refresh: 'refreshTokenLaser',
                devId: 'laser'
            });
            assert.isTrue(res.okay, 'invalid createTokens');
            res = await postgreSQL.get('morty');
            let tokens = res.output[0].tokens[1];
            assert.equal(res.output[0].tokens.length, 2, 'invalid createTokens');
            assert.equal(res.output[0].tokensOld.length, 0, 'invalid createTokens');
            assert.equal(tokens.access, 'accessTokenLaser', 'invalid createTokens');
            assert.equal(tokens.refresh, 'refreshTokenLaser', 'invalid createTokens');
            assert.equal(tokens.devId, 'laser', 'invalid createTokens');
            await postgreSQL.disconnect();
        });
        it('first update token for user Morty', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.updateTokens({
                userId: testUserMorty.userId,
                access: 'accessToken2',
                refresh: 'refreshToken2',
                devId: 'blaster'
            });
            assert.isTrue(res.okay, 'invalid createTokens');
            res = await postgreSQL.get('morty');
            let tokens = res.output[0].tokens[1];
            let tokensOld = res.output[0].tokensOld[0];
            assert.equal(res.output[0].tokens.length, 2, 'invalid createTokens');
            assert.equal(res.output[0].tokensOld.length, 1, 'invalid createTokens');
            assert.equal(tokens.access, 'accessToken2', 'invalid createTokens');
            assert.equal(tokens.refresh, 'refreshToken2', 'invalid createTokens');
            assert.equal(tokens.devId, 'blaster', 'invalid createTokens');
            assert.equal(tokensOld.access, 'accessToken1', 'invalid createTokens');
            assert.equal(tokensOld.refresh, 'refreshToken1', 'invalid createTokens');
            assert.equal(tokensOld.devId, 'blaster', 'invalid createTokens');
            await postgreSQL.disconnect();
        });
        it('second update token for user Morty', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.updateTokens({
                userId: testUserMorty.userId,
                access: 'accessToken3',
                refresh: 'refreshToken3',
                devId: 'blaster'
            });
            assert.isTrue(res.okay, 'invalid createTokens');
            res = await postgreSQL.get('morty');
            let tokens = res.output[0].tokens[1];
            let tokensOld = res.output[0].tokensOld[0];
            assert.equal(res.output[0].tokens.length, 2, 'invalid createTokens');
            assert.equal(res.output[0].tokensOld.length, 1, 'invalid createTokens');
            assert.equal(tokens.access, 'accessToken3', 'invalid createTokens');
            assert.equal(tokens.refresh, 'refreshToken3', 'invalid createTokens');
            assert.equal(tokens.devId, 'blaster', 'invalid createTokens');
            assert.equal(tokensOld.access, 'accessToken2', 'invalid createTokens');
            assert.equal(tokensOld.refresh, 'refreshToken2', 'invalid createTokens');
            assert.equal(tokensOld.devId, 'blaster', 'invalid createTokens');
            await postgreSQL.disconnect();
        });
        it('update roles for user Morty', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.updateRoles('morty', [
                'yong',
                'foreveryong',
                'megayong'
            ]);
            assert.isTrue(res.okay, 'invalid update roles');
            res = await postgreSQL.get('morty');
            let morty = res.output[0];
            assert.isArray(morty.rolesId, 'invalid update roles');
            assert.equal(morty.rolesId.length, 3, 'invalid update roles');
            assert.equal(morty.rolesId[2], 'megayong', 'invalid update roles');
            await postgreSQL.disconnect();
        });
        it('del tokens only old', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.delTokens('morty', 'blaster', true);
            assert.isTrue(res.okay, 'invalid del tokens');
            res = await postgreSQL.get('morty');
            let morty = res.output[0];
            assert.equal(morty.tokensOld.length, 0, 'invalid del tokens');
            morty.tokensOld.push({devId: 'blaster'});
            await postgreSQL.edit('morty', morty);
            await postgreSQL.disconnect();
        });
        it('del tokens', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.delTokens('morty', 'blaster');
            assert.isTrue(res.okay, 'invalid del tokens');
            res = await postgreSQL.get('morty');
            let morty = res.output[0];
            assert.equal(morty.tokensOld.length, 0, 'invalid del tokens');
            assert.equal(morty.tokens.length, 1, 'invalid del tokens');
            assert.notEqual(morty.tokens[0].devId, 'blaster', 'invalid del tokens');
            morty.tokensOld.push({devId: 'blaster'});
            morty.tokensOld.push({devId: 'blaster'});
            morty.tokensOld.push({devId: 'blaster'});
            morty.tokens.push({devId: 'blaster'});
            morty.tokens.push({devId: 'blaster'});
            await postgreSQL.edit('morty', morty);
            await postgreSQL.disconnect();
        });
        it('del all tokens', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.delAllTokens('morty');
            assert.isTrue(res.okay, 'invalid del tokens');
            res = await postgreSQL.get('morty');
            let morty = res.output[0];
            assert.equal(morty.tokensOld.length, 0, 'invalid del tokens');
            assert.equal(morty.tokens.length, 0, 'invalid del tokens');
            await postgreSQL.disconnect();
        });
        it('del user', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.get();
            let users = res.output;
            assert.equal(users.length, 3, 'invalid del user');
            res = await postgreSQL.del('morty');
            assert.isTrue(res.okay, 'invalid del user');
            res = await postgreSQL.get();
            users = res.output;
            assert.equal(users.length, 2, 'invalid del user');
            await postgreSQL.disconnect();
        });
        it('del users', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL.init();
            assert.isTrue(res.okay, 'invalid init');
            res = await postgreSQL.get();
            let users = res.output;
            assert.equal(users.length, 2, 'invalid del users');
            res = await postgreSQL.del();
            assert.isTrue(res.okay, 'invalid del users');
            res = await postgreSQL.get();
            users = res.output;
            assert.equal(users.length, 0, 'invalid del users');
            await postgreSQL.disconnect();
        });
        it('_generateFind without userId', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL._generateFind();
            assert.equal(res, '', 'not valid find');
        });
        it('_generateFind with userId', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let res = await postgreSQL._generateFind('Rick');
            assert.equal(res, `WHERE u.userId = 'Rick'`, 'not valid find');
        });
        it('_getUserFromSQL user exists', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let users = {
                Rick: {
                    userId: 'Rick',
                    rolesId: ['admin', 'superadmin'],
                    tokens: ['token'],
                    tokensOld: ['tokenOld']
                },
                Morty: {
                    userId: 'Morty'
                }
            };
            let row = {
                userid: 'Morty',
                rolesid: ['user', 'space'],
                tokens: [],
                tokensOld: []
            };
            let res = await postgreSQL._getUserFromSQL(row, users);
            expect(res).to.eql(users.Morty, 'invalid Morty');
        });
        it('_getUserFromSQL user not exists', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let users = {
                Rick: {
                    userId: 'Rick',
                    rolesId: ['admin', 'superadmin'],
                    tokens: ['token'],
                    tokensOld: ['tokenOld']
                }
            };
            let row = {
                userid: 'Morty',
                rolesid: ['user', 'space'],
                tokens: [],
                tokensOld: []
            };
            let valid = {
                userId: 'Morty',
                rolesId: ['user', 'space'],
                tokens: [],
                tokensOld: []
            };
            let res = await postgreSQL._getUserFromSQL(row, users);
            expect(res).to.eql(valid, 'invalid Morty');
        });
        it('_getTokensFromSQL all tokens', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let row = {
                devid: 'devid',
                accesstoken: 'accesstoken',
                refreshtoken: 'refreshtoken',
                accesstokenold: 'accesstokenold',
                refreshtokenold: 'refreshtokenold',
            };
            let valid = {
                token: {
                    devId: 'devid',
                    access: 'accesstoken',
                    refresh: 'refreshtoken'
                },
                tokenOld: {
                    devId: 'devid',
                    access: 'accesstokenold',
                    refresh: 'refreshtokenold'
                }
            };
            let res = await postgreSQL._getTokensFromSQL(row);
            expect(res).to.eql(valid, 'invalid');
        });
        it('_getTokensFromSQL with token', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let row = {
                devid: 'devid',
                accesstoken: 'accesstoken',
                refreshtoken: 'refreshtoken',
                accesstokenold: 'accesstokenold',
                refreshtokenold: null,
            };
            let valid = {
                token: {
                    devId: 'devid',
                    access: 'accesstoken',
                    refresh: 'refreshtoken'
                }
            };
            let res = await postgreSQL._getTokensFromSQL(row);
            expect(res).to.eql(valid, 'invalid');
        });
        it('_getTokensFromSQL with tokenOld', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let row = {
                devid: 'devid',
                accesstoken: null,
                refreshtoken: 'refreshtoken',
                accesstokenold: 'accesstokenold',
                refreshtokenold: 'refreshtokenold',
            };
            let valid = {
                tokenOld: {
                    devId: 'devid',
                    access: 'accesstokenold',
                    refresh: 'refreshtokenold'
                }
            };
            let res = await postgreSQL._getTokensFromSQL(row);
            expect(res).to.eql(valid, 'invalid');
        });
        it('_objUsersToArray', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let users = {
                Rick: {
                    userId: 'Rick',
                    rolesId: ['admin', 'superadmin'],
                    tokens: ['token'],
                    tokensOld: ['tokenOld']
                },
                Morty: {
                    userId: 'Morty'
                }
            };
            let res = await await postgreSQL._objUsersToArray(users);
            expect(res[0]).to.eql(users.Rick, 'invalid Rick');
            expect(res[1]).to.eql(users.Morty, 'invalid Morty');
        });
        it('_convertUsersFromSQL', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let result = [
                {
                    userid: 'Rick',
                    rolesid: ['space', 'superspace'],
                    devid: 'devid',
                    accesstoken: 'accesstoken',
                    refreshtoken: 'refreshtoken',
                    accesstokenold: 'accesstokenold',
                    refreshtokenold: 'refreshtokenold',
                },
                {
                    userid: 'Rick',
                    rolesid: ['space', 'superspace'],
                    devid: 'devid',
                    accesstoken: 'accesstoken1',
                    refreshtoken: 'refreshtoken1'
                },
                {
                    userid: 'Morty',
                    rolesid: ['user'],
                    devid: 'devid',
                    accesstoken: 'accesstoken',
                    refreshtoken: 'refreshtoken'
                }
            ];
            let valid = [
                {
                    userId: "Rick",
                    rolesId: [
                        "space",
                        "superspace"
                    ],
                    tokens: [
                        {
                            "devId": "devid",
                            "access": "accesstoken",
                            "refresh": "refreshtoken"
                        },
                        {
                            "devId": "devid",
                            "access": "accesstoken1",
                            "refresh": "refreshtoken1"
                        }
                    ],
                    tokensOld: [
                        {
                            "devId": "devid",
                            "access": "accesstokenold",
                            "refresh": "refreshtokenold"
                        }
                    ]
                },
                {
                    userId: "Morty",
                    rolesId: [
                        "user"
                    ],
                    tokens: [
                        {
                            "devId": "devid",
                            "access": "accesstoken",
                            "refresh": "refreshtoken"
                        }
                    ],
                    tokensOld: []
                }
            ];
            let res = await postgreSQL._convertUsersFromSQL(result);
            expect(res).to.eql(valid, 'invalid Rick');
        });
        it('_joinTokensFlatWithTokensOld', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let tokensOld = [
                {
                    access: 'access',
                    refresh: 'refresh'
                },
                {
                    access: 'access1',
                    refresh: 'refresh1'
                }
            ];
            let valid = [
                {
                    accessOld: 'access',
                    refreshOld: 'refresh',
                    access: null,
                    refresh: null,
                },
                {
                    accessOld: 'access1',
                    refreshOld: 'refresh1',
                    access: null,
                    refresh: null,
                }
            ];
            let tokensFlat = [];
            await postgreSQL._joinTokensFlatWithTokensOld({tokensFlat, tokensOld});
            expect(tokensFlat).to.eql(valid, 'invalid');
        });
        it('_createElementTokensFlat', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let token = {
                devId: 'blaster',
                access: 'accessToken1',
                refresh: 'refreshToken1'
            };
            let tokensOld = [
                {
                    devId: 'blaster',
                    access: 'accessToken1Old',
                    refresh: 'refreshToken1Old'
                },
                {
                    devId: 'laser',
                    access: 'accessTokenLaserOld',
                    refresh: 'refreshTokenLaserOld'
                },
                {
                    devId: 'Cheat',
                    access: 'accessTokenCheaatOld',
                    refresh: 'refreshTokenCheatOld'
                }
            ];
            let tokenValid = {
                devId: 'blaster',
                access: 'accessToken1',
                refresh: 'refreshToken1',
                accessOld: 'accessToken1Old',
                refreshOld: 'refreshToken1Old'
            };
            let tokensOldValid = [
                {
                    devId: 'laser',
                    access: 'accessTokenLaserOld',
                    refresh: 'refreshTokenLaserOld'
                },
                {
                    devId: 'Cheat',
                    access: 'accessTokenCheaatOld',
                    refresh: 'refreshTokenCheatOld'
                }
            ];
            let res = await postgreSQL._createElementTokensFlat({token, tokensOld});
            expect(token).to.eql(tokenValid, 'invalid token');
            expect(tokensOld).to.eql(tokensOldValid, 'invalid tokensOld');
        });
        it('_tokensToFlat', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let tokens = [
                {
                    devId: 'blaster',
                    access: 'accessToken1',
                    refresh: 'refreshToken1'
                },
                {
                    devId: 'laser',
                    access: 'accessTokenLaser',
                    refresh: 'refreshTokenLaser'
                },
                {
                    devId: 'loser',
                    access: 'accessTokenLoser',
                    refresh: 'refreshTokenLoser'
                }
            ];
            let tokensOld = [
                {
                    devId: 'blaster',
                    access: 'accessToken1Old',
                    refresh: 'refreshToken1Old'
                },
                {
                    devId: 'laser',
                    access: 'accessTokenLaserOld',
                    refresh: 'refreshTokenLaserOld'
                },
                {
                    devId: 'Cheat',
                    access: 'accessTokenCheaatOld',
                    refresh: 'refreshTokenCheatOld'
                }
            ];
            let tokensFlat = [
                {
                    devId: 'blaster',
                    access: 'accessToken1',
                    refresh: 'refreshToken1',
                    accessOld: 'accessToken1Old',
                    refreshOld: 'refreshToken1Old'
                },
                {
                    devId: 'laser',
                    access: 'accessTokenLaser',
                    refresh: 'refreshTokenLaser',
                    accessOld: 'accessTokenLaserOld',
                    refreshOld: 'refreshTokenLaserOld'
                },
                {
                    devId: 'loser',
                    access: 'accessTokenLoser',
                    refresh: 'refreshTokenLoser',
                    accessOld: null,
                    refreshOld: null
                },
                {
                    devId: 'Cheat',
                    access: null,
                    refresh: null,
                    accessOld: 'accessTokenCheaatOld',
                    refreshOld: 'refreshTokenCheatOld'
                }
            ];
            let res = await postgreSQL._tokensToFlat({tokens, tokensOld});
            expect(res).to.eql(tokensFlat, 'invalid tokensFlat');
        });
        it('_getInsertTokenQuery without userId', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let userId = null;
            let token = {
                devId: 'devId',
                access: 'access',
                accessOld: 'accessOld',
                refresh: 'refresh',
                refreshOld: 'refreshOld'
            };
            let query = {
                text: '',
                values: []
            };
            let res = await postgreSQL._getInsertTokenQuery(token, userId);
            expect(res).to.eql(query, 'invalid');
        });
        it('_getInsertTokenQuery with userId', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let userId = 'Rick';
            let token = {
                devId: 'devId',
                access: 'access',
                accessOld: 'accessOld',
                refresh: 'refresh',
                refreshOld: 'refreshOld'
            };
            let query = {
                text: `INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);`,
                values: []
            };
            query.values.push(userId);
            query.values.push(token.devId);
            query.values.push(token.access);
            query.values.push(token.accessOld);
            query.values.push(token.refresh);
            query.values.push(token.refreshOld);
            let res = await postgreSQL._getInsertTokenQuery(token, userId);
            expect(res).to.eql(query, 'invalid');
        });
        it('_getTokensQuery', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let user = {
                userId: 'morty',
                tokens:
                    [{
                        devId: 'blaster',
                        access: 'accessToken1',
                        refresh: 'refreshToken1'
                    },
                        {
                            devId: 'laser',
                            access: 'accessTokenLaser',
                            refresh: 'refreshTokenLaser'
                        },
                        {
                            devId: 'loser',
                            access: 'accessTokenLoser',
                            refresh: 'refreshTokenLoser'
                        }],
                tokensOld:
                    [{
                        devId: 'blaster',
                        access: 'accessToken1Old',
                        refresh: 'refreshToken1Old'
                    },
                        {
                            devId: 'laser',
                            access: 'accessTokenLaserOld',
                            refresh: 'refreshTokenLaserOld'
                        },
                        {
                            devId: 'Cheat',
                            access: 'accessTokenCheaatOld',
                            refresh: 'refreshTokenCheatOld'
                        }],
                rolesId: ['yong', 'foreveryong']
            };
            let queries = [{
                text: 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);',
                values:
                    ['morty',
                        'blaster',
                        'accessToken1',
                        'accessToken1Old',
                        'refreshToken1',
                        'refreshToken1Old']
            },
                {
                    text: 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);',
                    values:
                        ['morty',
                            'laser',
                            'accessTokenLaser',
                            'accessTokenLaserOld',
                            'refreshTokenLaser',
                            'refreshTokenLaserOld']
                },
                {
                    text: 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);',
                    values:
                        ['morty',
                            'loser',
                            'accessTokenLoser',
                            null,
                            'refreshTokenLoser',
                            null]
                },
                {
                    text: 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);',
                    values:
                        ['morty',
                            'Cheat',
                            null,
                            'accessTokenCheaatOld',
                            null,
                            'refreshTokenCheatOld']
                }];
            let res = await postgreSQL._getTokensQuery(user);
            expect(res).to.eql(queries, 'invalid');
        });
        it('_getUserDelQuery without userId', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let userId = null;
            let query = {
                text: 'DELETE FROM users RETURNING *;',
                values: []
            };
            let res = await postgreSQL._getUserDelQuery(userId);
            expect(res).to.eql(query, 'invalid');
        });
        it('_getUserDelQuery with userId', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let userId = 'Rick';
            let query = {
                text: 'DELETE FROM users WHERE userId = $1 RETURNING *;',
                values: []
            };
            query.values.push(userId);
            let res = await postgreSQL._getUserDelQuery(userId);
            expect(res).to.eql(query, 'invalid');
        });
        it('_getUserQuery with roles', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let user = {
                userId: 'Rick',
                rolesId: ['space', 'superspace', 'megaspace']
            };
            let query = {
                text: 'INSERT INTO users VALUES ($1, $2) RETURNING *;',
                values: []
            };
            query.values.push(user.userId);
            query.values.push(user.rolesId);
            let res = await postgreSQL._getUserQuery(user);
            expect(res).to.eql(query, 'invalid');
        });
        it('_getUserQuery without roles', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let user = {
                userId: 'Rick'
            };
            let query = {
                text: 'INSERT INTO users VALUES ($1) RETURNING *;',
                values: []
            };
            query.values.push(user.userId);
            let res = await postgreSQL._getUserQuery(user);
            expect(res).to.eql(query, 'invalid');
        });
        it('_convertUserToQuery', async () => {
            const postgreSQL = new PostgreSQLModel(postgreSQLConf);
            let user = {
                userId: 'morty',
                tokens:
                    [{
                        devId: 'blaster',
                        access: 'accessToken1',
                        refresh: 'refreshToken1'
                    },
                        {
                            devId: 'laser',
                            access: 'accessTokenLaser',
                            refresh: 'refreshTokenLaser'
                        },
                        {
                            devId: 'loser',
                            access: 'accessTokenLoser',
                            refresh: 'refreshTokenLoser'
                        }],
                tokensOld:
                    [{
                        devId: 'blaster',
                        access: 'accessToken1Old',
                        refresh: 'refreshToken1Old'
                    },
                        {
                            devId: 'laser',
                            access: 'accessTokenLaserOld',
                            refresh: 'refreshTokenLaserOld'
                        },
                        {
                            devId: 'Cheat',
                            access: 'accessTokenCheaatOld',
                            refresh: 'refreshTokenCheatOld'
                        }],
                rolesId: ['yong', 'foreveryong']
            };
            let userSQL = {
                text: 'INSERT INTO users VALUES ($1, $2) RETURNING *;',
                values: []
            };
            let tokenSQL = [{
                text: 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);',
                values:
                    ['morty',
                        'blaster',
                        'accessToken1',
                        'accessToken1Old',
                        'refreshToken1',
                        'refreshToken1Old']
            },
                {
                    text: 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);',
                    values:
                        ['morty',
                            'laser',
                            'accessTokenLaser',
                            'accessTokenLaserOld',
                            'refreshTokenLaser',
                            'refreshTokenLaserOld']
                },
                {
                    text: 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);',
                    values:
                        ['morty',
                            'loser',
                            'accessTokenLoser',
                            null,
                            'refreshTokenLoser',
                            null]
                },
                {
                    text: 'INSERT INTO tokens VALUES ($1, $2, $3, $4, $5, $6);',
                    values:
                        ['morty',
                            'Cheat',
                            null,
                            'accessTokenCheaatOld',
                            null,
                            'refreshTokenCheatOld']
                }];
            userSQL.values.push(user.userId);
            userSQL.values.push(user.rolesId);
            let valid = {userSQL, tokenSQL};
            let res = await postgreSQL._convertUserToQuery(user);
            expect(res).to.eql(valid, 'invalid');
        });
    });
});

describe('tokens', () => {
    describe('MongoDB', () => testTokens('mongoDB'));
    describe('PostgreSQL', () => testTokens('postgreSQL'));
});

function testTokens(typeModel) {

    let model;
    if (typeModel === 'mongoDB') {
        model = new MongoDBModel(mongoDBConf);
    }
    if (typeModel === 'postgreSQL') {
        model = new PostgreSQLModel(postgreSQLConf);
    }
    const token = new Tokens({model});
    const wait = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));
    before(async () => {
        console.time(`Test tokens ${typeModel}`);
        await model.init();
    });
    after(async () => {
        await model.del();
        await model.disconnect();
        console.timeEnd(`Test tokens ${typeModel}`);
    });

    it('It instanceof class Token', () => {
        let testToken = new Tokens({model: ''});
        expect(testToken).to.be.an.instanceof(Tokens);
    });
    it('Default param is valid', () => {
        assert.equal(token.alg, 'HS512', 'invalid alg');
        assert.equal(token.typ, 'JWT', 'invalid jwt');
        assert.equal(token.iss, '', 'invalid iss');
        assert.equal(token.accessExp, '10min', 'accessExp');
        assert.equal(token.refreshExp, '10day', 'refreshExp');
        assert.equal(token.salt, 'J*$#d73', 'invalid salt');
        assert.equal(token.iterations, 100, 'invalid iterations');
        assert.equal(token.hashLength, 64, 'invalid hashLength');
    });
    it('Set param is valid', () => {
        let testToken = new Tokens({
            model: '',
            alg: 'ZZZ',
            typ: 'DDD',
            iss: 'iss',
            accessExp: '1hour',
            refreshExp: '3day',
            salt: '123',
            iterations: 10,
            hashLength: 20
        });
        assert.equal(testToken.alg, 'ZZZ', 'invalid alg');
        assert.equal(testToken.typ, 'DDD', 'invalid jwt');
        assert.equal(testToken.iss, 'iss', 'invalid iss');
        assert.equal(testToken.accessExp, '1hour', 'accessExp');
        assert.equal(testToken.refreshExp, '3day', 'refreshExp');
        assert.equal(testToken.salt, '123', 'invalid salt');
        assert.equal(testToken.iterations, 10, 'invalid iterations');
        assert.equal(testToken.hashLength, 20, 'invalid hashLength');
    });
    it('_generateId default', async () => {
        let res = await token._generateId();
        assert.equal(res.length, 10, 'invalid length');
    });
    it('_generateId 6 length', async () => {
        let res = await token._generateId(6);
        assert.equal(res.length, 6, 'invalid length');
    });
    it('_getNumber not found replace', async () => {
        let res = await token._getNumber('10day', 'min');
        assert.equal(res, 0, 'invalid value');
    });
    it('_getNumber found replace', async () => {
        let res = await token._getNumber('10day', 'day');
        assert.equal(res, 10, 'invalid value');
    });
    it('_convertToMS as number', async () => {
        let res = await token._convertToMS(10);
        assert.equal(res, 10, 'invalid value');
    });
    it('_convertToMS as invalid value', async () => {
        let res = await token._convertToMS({});
        assert.equal(res, 0, 'invalid value');
    });
    it('_convertToMS as ms', async () => {
        let res = await token._convertToMS('20ms');
        assert.equal(res, 20, 'invalid value');
    });
    it('_convertToMS as sec', async () => {
        let res = await token._convertToMS('2sec');
        assert.equal(res, 2000, 'invalid value');
    });
    it('_convertToMS as min', async () => {
        let res = await token._convertToMS('2min');
        assert.equal(res, 1000 * 60 * 2, 'invalid value');
    });
    it('_convertToMS as hour', async () => {
        let res = await token._convertToMS('2hour');
        assert.equal(res, 1000 * 60 * 60 * 2, 'invalid value');
    });
    it('_convertToMS as day', async () => {
        let res = await token._convertToMS('2day');
        assert.equal(res, 1000 * 60 * 60 * 24 * 2, 'invalid value');
    });
    it('_convertToMS as invalid string', async () => {
        let res = await token._convertToMS('ssday');
        assert.equal(res, 0, 'invalid value');
    });
    it('_timeAdd is work', async () => {
        let now = new Date().getTime();
        let time = now + 1000 * 10;
        let res = await token._timeAdd(now, '10sec');
        assert.equal(res, time, 'not work');
    });
    it('_base64urlReplace is work', async () => {
        let str = 'js;u723=sU//&U\\SD_jds-=';
        let res = await token._base64urlReplace(str);
        assert.equal(res, 'js;u723=sU__&U\\SD_jds-', 'not work');
    });
    it('_base64urlEncode is work', async () => {
        let str = 'Rick and Morty. Summer 69';
        let res = await token._base64urlEncode(str);
        assert.equal(res, 'UmljayBhbmQgTW9ydHkuIFN1bW1lciA2OQ', 'not work');
    });
    it('_base64urlDecode is work', async () => {
        let str = 'UmljayBhbmQgTW9ydHkuIFN1bW1lciA2OQ';
        let res = await token._base64urlDecode(str);
        assert.equal(res, 'Rick and Morty. Summer 69', 'not work');
    });
    it('_roleIsAccess default false not access is work', async () => {
        let res = await token._roleIsAccess(
            ['superspace'],
            {
                include: ['admin', 'superadmin'],
                exclude: ['user', 'guest']
            }
        );
        assert.isFalse(res, 'not work');
    });
    it('_roleIsAccess default true access is work', async () => {
        let res = await token._roleIsAccess(
            ['superspace'],
            {
                include: ['admin', 'superadmin'],
                exclude: ['user', 'guest']
            },
            true
        );
        assert.isTrue(res, 'not work');
    });
    it('_roleIsAccess exclude is work', async () => {
        let res = await token._roleIsAccess(
            ['superspace'],
            {
                include: ['admin', 'superadmin'],
                exclude: ['user', 'guest', 'superspace']
            },
            true
        );
        assert.isFalse(res, 'not work');
    });
    it('_roleIsAccess include is work', async () => {
        let res = await token._roleIsAccess(
            ['superspace'],
            {
                include: ['admin', 'superadmin', 'superspace'],
                exclude: ['user', 'guest']
            },
            false
        );
        assert.isTrue(res, 'not work');
    });
    it('_userIsAccess default false not access is work', async () => {
        let res = await token._userIsAccess(
            'superspace',
            {
                include: ['admin', 'superadmin'],
                exclude: ['user', 'guest']
            }
        );
        assert.isFalse(res, 'not work');
    });
    it('_userIsAccess default true access is work', async () => {
        let res = await token._userIsAccess(
            'superspace',
            {
                include: ['admin', 'superadmin'],
                exclude: ['user', 'guest']
            },
            true
        );
        assert.isTrue(res, 'not work');
    });
    it('_userIsAccess exclude is work', async () => {
        let res = await token._userIsAccess(
            'superspace',
            {
                include: ['admin', 'superadmin'],
                exclude: ['user', 'guest', 'superspace']
            },
            true
        );
        assert.isFalse(res, 'not work');
    });
    it('_userIsAccess include is work', async () => {
        let res = await token._userIsAccess(
            'superspace',
            {
                include: ['admin', 'superadmin', 'superspace'],
                exclude: ['user', 'guest']
            },
            false
        );
        assert.isTrue(res, 'not work');
    });
    it('_getRoles is empty, user not found', async () => {
        let res = await token._getRoles('userNotFound');
        assert.isArray(res, 'not array');
        assert.equal(res.length, 0, 'invalid length');
    });
    it('_getRoles is fill user Rick', async () => {
        await model.add({
            userId: 'Rick',
            rolesId: ['space', 'superspace']
        });
        let res = await token._getRoles('Rick');
        assert.isArray(res, 'not array');
        assert.equal(res.length, 2, 'invalid length');
        assert.equal(res[0], 'space', 'invalid length');
    });
    it('_getUser user not found', async () => {
        let res = await token._getUser('userNotFound');
        assert.isUndefined(res, 'not work');
    });
    it('_getUser user Rick', async () => {
        let res = await token._getUser('Rick');
        assert.isObject(res, 'not object');
        assert.equal(res.userId, 'Rick', 'invalid userId');
    });
    it('_createUnsignedToken is work', async () => {
        let head = {
            alg: token.alg,
            typ: token.typ
        };
        let payload = {
            userId: 'Rick',
            rolesId: ['space', 'superspace'],
            devId: 'blaster',
            iss: token.iss,
            exp: 1548869708817
        };
        let res = await token._createUnsignedToken(head, payload);
        let valid = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSaWNrIiwicm9sZXNJZCI6WyJzcGFjZSIsInN1cGVyc3BhY2UiXSwiZGV2SWQiOiJibGFzdGVyIiwiaXNzIjoiIiwiZXhwIjoxNTQ4ODY5NzA4ODE3fQ';
        assert.equal(res, valid, 'not work');
    });
    it('_createSignature is work', async () => {
        let head = {
            alg: token.alg,
            typ: token.typ
        };
        let payload = {
            userId: 'Rick',
            rolesId: ['space', 'superspace'],
            devId: 'blaster',
            iss: token.iss,
            exp: 1548869708817
        };
        let res = await token._createUnsignedToken(head, payload);
        res = await token._createSignature(res);
        let valid = '-1_bUSZ9NB_DkBvg6eeYZ_7c1uv_Y0OIlN-l6OZ6OImr8btkOloeSlWoUT94Y8gXTmil0BuDvsctg72iORQt4Q';
        assert.equal(res, valid, 'not work');
    });
    it('createTokens is work', async () => {
        let res = await token.createTokens({
            userId: 'Rick',
            rolesId: ['space', 'superspace', 'megaspace']
        });
        assert.isTrue(res.okay, 'not work');
        let tokens = res.output[0];
        assert.isNotEmpty(tokens.devId, 'not devId');
        assert.isNotEmpty(tokens.access, 'not access');
        assert.isNotEmpty(tokens.refresh, 'not refresh');
        res = await model.get('Rick');
        let user = res.output[0];
        assert.equal(user.rolesId[2], 'megaspace', 'invalid rolesId');
        expect(user.tokens[0]).to.eql(tokens, 'invalid user tokens');
        assert.equal(user.tokensOld, 0, 'invalid length tokensOld');
    });
    it('_decodePartToken is work', async () => {
        let testToken = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSaWNrIiwicm9sZXNJZCI6WyJzcGFjZSIsInN1cGVyc3BhY2UiXSwiZGV2SWQiOiJibGFzdGVyIiwiaXNzIjoiIiwiZXhwIjoxNTQ4ODY5NzA4ODE3fQ.-1_bUSZ9NB_DkBvg6eeYZ_7c1uv_Y0OIlN-l6OZ6OImr8btkOloeSlWoUT94Y8gXTmil0BuDvsctg72iORQt4Q';
        let res = await token._decodePartToken(testToken);
        let head = {
            alg: token.alg,
            typ: token.typ
        };
        let payload = {
            userId: 'Rick',
            rolesId: ['space', 'superspace'],
            devId: 'blaster',
            iss: token.iss,
            exp: 1548869708817
        };
        expect(JSON.parse(res.head)).to.eql(head, 'invalid head');
        expect(JSON.parse(res.payload)).to.eql(payload, 'invalid payload');
    });
    it('_decodeToken is work', async () => {
        let testToken = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSaWNrIiwicm9sZXNJZCI6WyJzcGFjZSIsInN1cGVyc3BhY2UiXSwiZGV2SWQiOiJibGFzdGVyIiwiaXNzIjoiIiwiZXhwIjoxNTQ4ODY5NzA4ODE3fQ.-1_bUSZ9NB_DkBvg6eeYZ_7c1uv_Y0OIlN-l6OZ6OImr8btkOloeSlWoUT94Y8gXTmil0BuDvsctg72iORQt4Q';
        let res = await token._decodeToken(testToken);
        let head = {
            alg: token.alg,
            typ: token.typ
        };
        let payload = {
            userId: 'Rick',
            rolesId: ['space', 'superspace'],
            devId: 'blaster',
            iss: token.iss,
            exp: new Date(1548869708817)
        };
        expect(res.head).to.eql(head, 'invalid head');
        expect(res.payload).to.eql(payload, 'invalid payload');
        assert.equal(testToken.split('.')[0], res.head64, 'invalid head64');
        assert.equal(testToken.split('.')[1], res.payload64, 'invalid payload64');
        assert.equal(testToken.split('.')[2], res.signature, 'invalid signature');
        assert.equal(testToken, res.source, 'invalid source');
    });
    it('_signatureIsValid valid token is work', async () => {
        let testToken = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSaWNrIiwicm9sZXNJZCI6WyJzcGFjZSIsInN1cGVyc3BhY2UiXSwiZGV2SWQiOiJibGFzdGVyIiwiaXNzIjoiIiwiZXhwIjoxNTQ4ODY5NzA4ODE3fQ.-1_bUSZ9NB_DkBvg6eeYZ_7c1uv_Y0OIlN-l6OZ6OImr8btkOloeSlWoUT94Y8gXTmil0BuDvsctg72iORQt4Q';
        let res = await token._decodeToken(testToken);
        res = await token._signatureIsValid(res);
        assert.isTrue(res, 'not work');
    });
    it('_signatureIsValid invalid token is work', async () => {
        let testToken = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSaWNrIiwicm9sZXNJZCI6WyJzcGFjZSIsInN1cGVyc3BhY2UiXSwiZGV2SWQiOiJibGFzdGVyIiwiaXNzIjoiIiwiZXhwIjoxNTQ4ODY5NzA4ODE3fQ.-1_bUSZ9NB_DkBvg6eeYZ_7c1uv_Y0OIlN-l6OZ6OImr8btkOloeSlWoUT94Y8gXTmil0BuDvsctg72iORQt4Q1';
        let res = await token._decodeToken(testToken);
        res = await token._signatureIsValid(res);
        assert.isFalse(res, 'not work');
    });
    it('_findToken tokens=true tokensOld=false', async () => {
        let param = {
            user: {
                tokens: [
                    {
                        devId: '1',
                        access: '333333',
                        refresh: '444444'
                    },
                    {
                        devId: '2',
                        access: '777777',
                        refresh: '8888888'
                    }
                ],
                tokensOld: [
                    {
                        devId: '3',
                        access: '333333',
                        refresh: '444444'
                    },
                    {
                        devId: '4',
                        access: '777777',
                        refresh: '8888888'
                    }
                ]
            },
            devId: '1',
            access: '333333',
            refresh: '444444'
        };
        let res = await token._findToken(param);
        let valid = {tokens: true, tokensOld: false};
        expect(res).to.eql(valid, 'invalid');
    });
    it('_findToken tokens=false tokensOld=true', async () => {
        let param = {
            user: {
                tokens: [
                    {
                        devId: '1',
                        access: '333333',
                        refresh: '444444'
                    },
                    {
                        devId: '2',
                        access: '777777',
                        refresh: '8888888'
                    }
                ],
                tokensOld: [
                    {
                        devId: '3',
                        access: '333333',
                        refresh: '444444'
                    },
                    {
                        devId: '4',
                        access: '777777',
                        refresh: '8888888'
                    }
                ]
            },
            devId: '3',
            access: '333333',
            refresh: '444444'
        };
        let res = await token._findToken(param);
        let valid = {tokens: false, tokensOld: true};
        expect(res).to.eql(valid, 'invalid');
    });
    it('_findToken tokens=false tokensOld=false', async () => {
        let param = {
            user: {
                tokens: [
                    {
                        devId: '1',
                        access: '333333',
                        refresh: '444444'
                    },
                    {
                        devId: '2',
                        access: '777777',
                        refresh: '8888888'
                    }
                ],
                tokensOld: [
                    {
                        devId: '3',
                        access: '333333',
                        refresh: '444444'
                    },
                    {
                        devId: '4',
                        access: '777777',
                        refresh: '8888888'
                    }
                ]
            },
            devId: '10',
            access: '333333',
            refresh: '444444'
        };
        let res = await token._findToken(param);
        let valid = {tokens: false, tokensOld: false};
        expect(res).to.eql(valid, 'invalid');
    });
    it('_isLive is live', async () => {
        let res = await token.createTokens({
            userId: 'Rick',
            rolesId: ['space', 'superspace', 'megaspace']
        });
        let access = res.output[0].access;
        res = await token._decodeToken(access);
        res = await token._isLive(res);
        assert.isTrue(res, 'not work');
    });
    it('_isLive is not live', async () => {
        token.accessExp = '1ms';
        let res = await token.createTokens({
            userId: 'Rick',
            rolesId: ['space', 'superspace', 'megaspace']
        });
        let access = res.output[0].access;
        res = await token._decodeToken(access);
        await wait(2);
        res = await token._isLive(res);
        assert.isFalse(res, 'not work');
        token.accessExp = '10min';
    });
    it('isValid token = true, access = true', async () => {
        await model.add({
            userId: 'Morty',
            rolesId: ['user', 'superuser']
        });
        let res = await token.createTokens({userId: 'Morty'});
        const access = res.output[0].access;
        const refresh = res.output[0].refresh;
        res = await token.isValid({access, refresh});
        assert.isTrue(res.isValid, 'dont work isValid');
        assert.isTrue(res.access, 'dont work access');
    });
    it('isValid rolesRules exclude token = true, access = false', async () => {
        let res = await token.createTokens({userId: 'Morty'});
        const access = res.output[0].access;
        const refresh = res.output[0].refresh;
        const rolesRules = {
            exclude: ['superuser'],
            include: [],
            defaultAccess: false
        };
        res = await token.isValid({access, refresh, rolesRules});
        assert.isTrue(res.isValid, 'dont work isValid');
        assert.isFalse(res.access, 'dont work access');
    });
    it('isValid usersRules exclude token = true, access = false', async () => {
        let res = await token.createTokens({userId: 'Morty'});
        const access = res.output[0].access;
        const refresh = res.output[0].refresh;
        const rolesRules = {
            exclude: [],
            include: ['user'],
            defaultAccess: false
        };
        const usersRules = {
            exclude: ['Morty'],
            include: [],
            defaultAccess: false
        };
        res = await token.isValid({access, refresh, rolesRules, usersRules});
        assert.isTrue(res.isValid, 'dont work isValid');
        assert.isFalse(res.access, 'dont work access');
    });
    it('isValid usersRules include rolesRules include token = true, access = false', async () => {
        let res = await token.createTokens({userId: 'Morty'});
        const access = res.output[0].access;
        const refresh = res.output[0].refresh;
        const rolesRules = {
            exclude: [],
            include: ['superuser'],
            defaultAccess: false
        };
        const usersRules = {
            exclude: [],
            include: ['Morty'],
            defaultAccess: false
        };
        res = await token.isValid({access, refresh, usersRules, rolesRules});
        assert.isTrue(res.isValid, 'dont work isValid');
        assert.isTrue(res.access, 'dont work access');
    });
    it('isValid access signature invalid token = false, access = false', async () => {
        let res = await token.createTokens({userId: 'Morty'});
        let access = res.output[0].access;
        let refresh = res.output[0].refresh;
        const rolesRules = {
            exclude: [],
            include: ['superuser'],
            defaultAccess: false
        };
        const usersRules = {
            exclude: [],
            include: ['Morty'],
            defaultAccess: false
        };
        access = access.split('.');
        access[2] = access[2] + '1';
        access = access.join('.');
        res = await token.isValid({access, refresh, usersRules, rolesRules});
        assert.equal(res.description, 'access signature invalid', 'dont work description');
        assert.isFalse(res.isValid, 'dont work isValid');
        assert.isFalse(res.access, 'dont work access');
    });
    it('isValid refresh signature invalid token = false, access = false', async () => {
        let res = await token.createTokens({userId: 'Morty'});
        let access = res.output[0].access;
        let refresh = res.output[0].refresh;
        const rolesRules = {
            exclude: [],
            include: ['superuser'],
            defaultAccess: false
        };
        const usersRules = {
            exclude: [],
            include: ['Morty'],
            defaultAccess: false
        };
        refresh = refresh.split('.');
        refresh[2] = refresh[2] + '1';
        refresh = refresh.join('.');
        res = await token.isValid({access, refresh, usersRules, rolesRules});
        assert.equal(res.description, 'refresh signature invalid', 'dont work description');
        assert.isFalse(res.isValid, 'dont work isValid');
        assert.isFalse(res.access, 'dont work access');
    });
    it('isValid token is valid non-existing user token = false, access = false', async () => {
        let head = {
            alg: token.alg,
            typ: token.typ
        };
        let payload = {
            userId: 'Brainz',
            rolesId: ['space', 'superspace'],
            devId: 'brainz',
            iss: token.iss,
            exp: token.refreshExp
        };
        let res = await token._createUnsignedToken(head, payload);
        res += `.${await token._createSignature(res)}`;
        res = await token.isValid({access: res, refresh: res});
        assert.equal(res.description, 'not found user', 'dont work description');
        assert.isFalse(res.isValid, 'dont work isValid');
        assert.isFalse(res.access, 'dont work access');
    });
    it('isValid update token is work', async () => {
        token.accessExp = '1ms';
        let res = await token.createTokens({userId: 'Morty'});
        token.accessExp = '10min';
        let access = res.output[0].access;
        let refresh = res.output[0].refresh;
        let devId = res.output[0].devId;
        await wait(2);
        res = await token.isValid({access, refresh});
        assert.isTrue(res.isValid, 'dont work isValid tokensNew');
        assert.isTrue(res.access, 'dont work access tokensNew');
        assert.property(res, 'tokensNew', 'non exists tokensNew');
        let accessNew = res.tokensNew.access;
        let refreshNew = res.tokensNew.refresh;
        res = await token.isValid({access: accessNew, refresh: refreshNew});
        assert.isTrue(res.isValid, 'dont work isValid updated tokens');
        assert.isTrue(res.access, 'dont work access updated tokens');
        res = await token.isValid({access, refresh});
        assert.isTrue(res.isValid, 'dont work isValid old tokens before del');
        assert.isTrue(res.access, 'dont work access old tokens before del');
        res = await token.isValid({access: accessNew, refresh: refreshNew});
        assert.isTrue(res.isValid, 'dont work isValid updated tokens after del old tokens');
        assert.isTrue(res.access, 'dont work access updated tokens after del old tokens');
        res = await token.isValid({access, refresh});
        assert.equal(res.description, 'tokens not found', 'dont work description');
        assert.isFalse(res.isValid, 'dont work isValid old tokens before del');
        assert.isFalse(res.access, 'dont work access old tokens before del');
        res = await token.isValid({access: accessNew, refresh: refreshNew});
        assert.equal(res.description, 'tokens not found', 'dont work description');
        assert.isFalse(res.isValid, 'dont work isValid updated tokens before del old tokens');
        assert.isFalse(res.access, 'dont work access updated tokens before del old tokens');
        res = await token.model.get('Morty');
        let tokens = res.output[0].tokens.filter(token => token.devId === devId);
        let tokensOld = res.output[0].tokensOld.filter(token => token.devId === devId);
        assert.equal(tokens.length, 0, 'dont work del devId in tokens');
        assert.equal(tokensOld.length, 0, 'dont work del devId in tokensOld');
    });
    it('isValid refresh token not live', async () => {
        token.refreshExp = '1ms';
        let res = await token.createTokens({userId: 'Morty'});
        token.refreshExp = '10day';
        let access = res.output[0].access;
        let refresh = res.output[0].refresh;
        let devId = res.output[0].devId;
        await wait(2);
        res = await token.isValid({access, refresh});
        assert.equal(res.description, 'refresh token not live', 'dont work description');
        assert.isFalse(res.isValid, 'dont work isValid');
        assert.isFalse(res.access, 'dont work access');
        res = await token.model.get('Morty');
        let tokens = res.output[0].tokens.filter(token => token.devId === devId);
        let tokensOld = res.output[0].tokensOld.filter(token => token.devId === devId);
        assert.equal(tokens.length, 0, 'dont work del devId in tokens');
        assert.equal(tokensOld.length, 0, 'dont work del devId in tokensOld')
    });
}