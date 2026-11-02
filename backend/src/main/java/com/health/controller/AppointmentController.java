package com.health.controller;

import com.health.model.*;
import com.health.repository.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:5173")
public class AppointmentController {
    private final AppointmentRepository appointments;
    private final DoctorRepository doctors;
    private final PatientRepository patients;

    public AppointmentController(AppointmentRepository a, DoctorRepository d, PatientRepository p) {
        this.appointments = a;
        this.doctors = d;
        this.patients = p;
    }

    @GetMapping
    public List<Appointment> all() { return appointments.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> one(@PathVariable Long id) {
        return appointments.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> byDoctor(@PathVariable Long doctorId) { return appointments.findByDoctorId(doctorId); }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> byPatient(@PathVariable Long patientId) { return appointments.findByPatientId(patientId); }

    @PostMapping
    public Appointment book(@Valid @RequestBody AppointmentRequest r) {
        Doctor d = doctors.findById(r.doctorId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
        Patient p = patients.findById(r.patientId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
        Appointment a = new Appointment();
        a.setDoctor(d);
        a.setPatient(p);
        a.setAppointmentTime(r.appointmentTime());
        a.setReason(r.reason());
        a.setStatus("BOOKED");
        return appointments.save(a);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancel(@PathVariable Long id) {
        return appointments.findById(id).map(a -> {
            a.setStatus("CANCELLED");
            return ResponseEntity.ok(appointments.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointments.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}