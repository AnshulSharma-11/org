package com.orgpluse.exception;

/**
 * Thrown when an entity looked up by ID does not exist in the database.
 *
 * Services replace every pattern like:
 *   if (repository.findById(id).isEmpty()) {
 *       return response.send("Not found", null, HttpStatus.NOT_FOUND);
 *   }
 * with:
 *   Employee emp = repository.findById(id)
 *       .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
 *
 * The GlobalExceptionHandler maps this to HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final Object resourceId;

    public ResourceNotFoundException(String resourceName, Object resourceId) {
        super(resourceName + " not found with id: " + resourceId);
        this.resourceName = resourceName;
        this.resourceId   = resourceId;
    }

    public ResourceNotFoundException(String message) {
        super(message);
        this.resourceName = null;
        this.resourceId   = null;
    }

    public String getResourceName() { return resourceName; }
    public Object getResourceId()   { return resourceId; }

}
