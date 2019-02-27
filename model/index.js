const MongodDBModel = require('./mogoDB');
const PostgreSQLModel = require('./postgreSQL');

async function initModel(options) {

    let res = generateRes(false, 'not init _model');

    let model;
    if (!options) {
        model = new MongodDBModel();
    } else if (options.type === 'mongoDB') {
        model = new MongodDBModel(options);
    } else if (options.type === 'postgreSQL') {
        model = new PostgreSQLModel(options);
    } else {
        model = new MongodDBModel(options);
    }

    res = await model.init();
    if (res.description && res.okay === false) {
        return null;
    }

    return model;

}

async function generateRes(okay = false, description = '') {
    return {
        okay,
        description,
        output: [],
        error: {}
    }
}

module.exports = {
    initModel
};