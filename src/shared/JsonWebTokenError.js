const { DomainError } = require('./DomainError')
const { error } = require('./errors')
class JsonWebTokenError extends DomainError {
    constructor(type) {
        super(error[type]);
        this.type = type
    }
}

module.exports = { JsonWebTokenError }
