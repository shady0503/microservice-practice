package com.soa.busservice.event;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RouteCreatedEvent {
    private Long routeId;
    private String routeName;
    private String direction;
    private String geometry;
}