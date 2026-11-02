package com.health.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
public class Doctor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank private String name;
    @NotBlank private String specialization;
    @Email @NotBlank private String email;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String s) { this.specialization = s; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}