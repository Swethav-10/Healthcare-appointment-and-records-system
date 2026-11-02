package com.health.model;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public record AppointmentRequest(
    @NotNull Long doctorId,
    @NotNull Long patientId,
    @NotNull @Future LocalDateTime appointmentTime,
    String reason
) {}