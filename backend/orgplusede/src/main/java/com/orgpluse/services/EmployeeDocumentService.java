package com.orgpluse.services;

import com.orgpluse.common.PageResponse;
import com.orgpluse.common.PageableUtils;
import com.orgpluse.entities.Employee;
import com.orgpluse.entities.EmployeeDocument;
import com.orgpluse.exception.AccessDeniedException;
import com.orgpluse.exception.BadRequestException;
import com.orgpluse.exception.FileStorageException;
import com.orgpluse.exception.ResourceNotFoundException;
import com.orgpluse.repositories.EmployeeDocumentRepository;
import com.orgpluse.repositories.EmployeeRepository;
import com.orgpluse.response_wrapper.ResponseWrapper;
import com.orgpluse.response_wrapper.UniversalResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class EmployeeDocumentService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Autowired private EmployeeDocumentRepository documentRepository;
    @Autowired private EmployeeRepository          employeeRepository;
    @Autowired private UniversalResponse           response;

    // ── UPLOAD ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> uploadDocument(Long employeeId,
                                                           MultipartFile file,
                                                           String documentLabel) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        if (file == null || file.isEmpty())
            throw new BadRequestException("File must not be empty");

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) originalName = "document";
        originalName = Paths.get(originalName).getFileName().toString();

        String storedName  = UUID.randomUUID().toString().replace("-", "") + "_" + originalName;
        String relativePath = "documents/" + employeeId + "/" + storedName;

        try {
            Path targetDir = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve("documents").resolve(String.valueOf(employeeId));
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetDir.resolve(storedName),
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + e.getMessage(), e);
        }

        EmployeeDocument doc = new EmployeeDocument();
        doc.setEmployee(employee);
        doc.setOriginalName(originalName);
        doc.setStoredName(storedName);
        doc.setFileType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setFilePath(relativePath);
        doc.setDocumentLabel(documentLabel != null && !documentLabel.isBlank()
                ? documentLabel : originalName);

        EmployeeDocument saved = documentRepository.save(doc);
        return response.send("Document uploaded successfully", saved, HttpStatus.CREATED);
    }

    // ── LIST (paginated) ──────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> listDocuments(Long employeeId,
                                                          Integer page,
                                                          Integer size) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        Pageable pageable = PageableUtils.of(page, size, "uploadedAt", "desc");
        Page<EmployeeDocument> result = documentRepository.findByEmployeeId(employeeId, pageable);
        return response.send("Documents fetched successfully",
                new PageResponse<>(result), HttpStatus.OK);
    }

    // ── DOWNLOAD ──────────────────────────────────────────────────────────────

    public ResponseEntity<?> downloadDocument(Long employeeId, Long documentId) {
        EmployeeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));

        if (!doc.getEmployee().getId().equals(employeeId))
            throw new AccessDeniedException("You are not authorised to access this document");

        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve(doc.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable())
                return ResponseEntity.notFound().build();

            String contentType = doc.getFileType() != null
                    ? doc.getFileType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + doc.getOriginalName() + "\"")
                    .body(resource);
        } catch (java.net.MalformedURLException e) {
            throw new FileStorageException("Invalid file path for document: " + documentId, e);
        }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    public ResponseEntity<ResponseWrapper> deleteDocument(Long employeeId, Long documentId) {
        EmployeeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));

        if (!doc.getEmployee().getId().equals(employeeId))
            throw new AccessDeniedException("You are not authorised to delete this document");

        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve(doc.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}

        documentRepository.deleteById(documentId);
        return response.send("Document deleted successfully", null, HttpStatus.OK);
    }

}
