package com.orgpluse.controllers;

import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.services.EmployeeDocumentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Document endpoints for the Employee self-service portal.
 * Route prefix: /api/v1/employee/{employeeId}/documents
 *
 * POST   /                        — upload a new document
 * GET    /                        — list all documents for this employee
 * GET    /{documentId}/download   — download (stream) a specific document
 * DELETE /{documentId}            — delete a document (employee-owned only)
 */
@RestController
@RequestMapping("/api/v1/employee/{employeeId}/documents")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeDocumentController {

    @Autowired
    private EmployeeDocumentService documentService;

    // POST /api/v1/employee/{employeeId}/documents
    // multipart/form-data: file (required), label (optional)
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ResponseWrapper> uploadDocument(
            @PathVariable Long employeeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "label", required = false) String label) {
        return documentService.uploadDocument(employeeId, file, label);
    }

    // GET /api/v1/employee/{employeeId}/documents
    @GetMapping
    public ResponseEntity<ResponseWrapper> listDocuments(@PathVariable Long employeeId) {
        return documentService.listDocuments(employeeId, null, null);
    }

    // GET /api/v1/employee/{employeeId}/documents/{documentId}/download
    @GetMapping("/{documentId}/download")
    public ResponseEntity<?> downloadDocument(
            @PathVariable Long employeeId,
            @PathVariable Long documentId) {
        return documentService.downloadDocument(employeeId, documentId);
    }

    // DELETE /api/v1/employee/{employeeId}/documents/{documentId}
    @DeleteMapping("/{documentId}")
    public ResponseEntity<ResponseWrapper> deleteDocument(
            @PathVariable Long employeeId,
            @PathVariable Long documentId) {
        return documentService.deleteDocument(employeeId, documentId);
    }

}
