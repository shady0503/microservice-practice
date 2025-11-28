package com.soa.busservice.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RouteCreatedEvent {
    private Long routeId;
    private String routeName;
    private String direction;
    private String geometry;
    private List<StopInfo> stops;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StopInfo {
        private String name;
        private Double latitude;
        private Double longitude;
        private Integer order;
    }
}