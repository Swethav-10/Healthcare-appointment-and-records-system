package com.health.controller;

import com.health.model.Doctor;
import com.health.repository.DoctorRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {
    private final DoctorRepository repo;

    public DoctorController(DoctorRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Doctor> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> one(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Doctor create(@Valid @RequestBody Doctor d) { d.setId(null); return repo.save(d); }

    @PutMapping("/{id}")
    public ResponseEntity<Doctor> update(@PathVariable Long id, @Valid @RequestBody Doctor d) {
        return repo.findById(id).map(x -> {
            x.setName(d.getName());
            x.setSpecialization(d.getSpecialization());
            x.setEmail(d.getEmail());
            return ResponseEntity.ok(repo.save(x));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}