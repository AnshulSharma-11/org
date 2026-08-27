package com.orgpluse.repositories;

import com.orgpluse.entities.EmployeeDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {

    /**
     * Legacy: kept for any existing callers that need the full list
     * (e.g. a download-all-documents feature).
     */
    List<EmployeeDocument> findByEmployeeIdOrderByUploadedAtDesc(Long employeeId);

    /**
     * Paginated version used by the updated EmployeeDocumentService.listDocuments.
     *
     * Performance benefit: without Pageable, listing documents for an employee
     * with 500 scanned PDFs transfers all 500 rows to Java.  With Pageable
     * the DB returns LIMIT 20 OFFSET 0 — 480 rows never touch the JVM.
     */
    Page<EmployeeDocument> findByEmployeeId(Long employeeId, Pageable pageable);

}
