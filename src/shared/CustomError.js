const { DomainError } = require('./DomainError')
const { error } = require('./errors')
class CustomError extends DomainError {
    constructor(type) {
        super(error[type]);
        this.type = type;
        this.details = error[type];
    }
}

module.exports =  CustomError 
