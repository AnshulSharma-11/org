package com.orgpluse.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Data
@Table(name = "employee_documents")
@EntityListeners(AuditingEntityListener.class)
public class EmployeeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Original filename as uploaded by the employee (e.g. "Offer_Letter.pdf")
    @NotBlank(message = "Original file name is required")
    @Column(name = "original_name", nullable = false)
    private String originalName;

    // Stored filename on disk (UUID-prefixed to avoid collisions)
    @NotBlank(message = "Stored file name is required")
    @Column(name = "stored_name", nullable = false)
    private String storedName;

    // MIME type e.g. application/pdf, image/png
    @Column(name = "file_type")
    private String fileType;

    // File size in bytes
    @Column(name = "file_size")
    private Long fileSize;

    // Relative path under upload-dir  e.g. "documents/42/abc123_Offer_Letter.pdf"
    @NotBlank(message = "File path is required")
    @Column(name = "file_path", nullable = false)
    private String filePath;

    // Human-readable label the employee gives the document
    // e.g. "Offer Letter", "PAN Card", "Degree Certificate"
    @Column(name = "document_label")
    private String documentLabel;

    @CreatedDate
    @Column(name = "uploaded_at", updatable = false)
    private Instant uploadedAt;

    // ── Employee who owns this document
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"department", "designation", "branch",
            "manager", "createdAt", "updatedAt", "passwordHash"})
    private Employee employee;

}
