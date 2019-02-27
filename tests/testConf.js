module.exports = {
    mongoDBConf: {
        server: '127.0.0.1',
        port: 26000,
        db: 'jrfjwt_test',
        collection: 'jwt',
        user: 'jrfjwt',
        password: '258456'
    },
    postgreSQLConf: {
        server: 'localhost',
        port: 5432,
        db: 'jrfjwt_test',
        user: 'jrfjwttest',
        password: '258456'
    },
    testUserSnow: {
        userId: 'snow',
        rolesId: ['admin', 'superadmim'],
        tokens: [],
        tokensOld: []
    },
    testUserRick: {
        userId: 'rick',
        rolesId: ['space', 'superspace'],
        tokens: [],
        tokensOld: []
    },
    testUserMorty: {
        userId: 'morty',
        rolesId: ['yong', 'foreveryong'],
        tokens: [],
        tokensOld: []
    }
};