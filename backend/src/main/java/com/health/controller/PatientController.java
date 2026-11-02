package com.health.controller;

import com.health.model.Patient;
import com.health.repository.PatientRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:5173")
public class PatientController {
    private final PatientRepository repo;

    public PatientController(PatientRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Patient> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> one(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Patient create(@Valid @RequestBody Patient p) { p.setId(null); return repo.save(p); }

    @PutMapping("/{id}")
    public ResponseEntity<Patient> update(@PathVariable Long id, @Valid @RequestBody Patient p) {
        return repo.findById(id).map(x -> {
            x.setName(p.getName());
            x.setEmail(p.getEmail());
            x.setPhone(p.getPhone());
            x.setAge(p.getAge());
            return ResponseEntity.ok(repo.save(x));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}