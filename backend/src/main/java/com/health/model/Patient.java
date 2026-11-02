package com.health.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
public class Patient {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank private String name;
    @Email @NotBlank private String email;
    private String phone;
    private int age;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
}