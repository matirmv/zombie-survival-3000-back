const { DomainError } = require('./DomainError')

class ResourceNotFoundError extends DomainError {
    constructor(resourceName,attributeName) {
        super(`La ressource ${resourceName} n'existe pas pour l'attribut ${attributeName}`);
    }
}

module.exports =  ResourceNotFoundError 
