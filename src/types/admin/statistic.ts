export interface MetricDetail {
  revenue: number;
  completedOrders: number;
}

export interface RestaurantStatisticResponse {
  today: MetricDetail;
  thisWeek: MetricDetail;
  thisMonth: MetricDetail;
  total: MetricDetail;
}

export interface HomestayStatisticResponse {
  today: MetricDetail;
  thisWeek: MetricDetail;
  thisMonth: MetricDetail;
  total: MetricDetail;
}

export interface ChartDataResponse {
  label: string; 
  value: number;
}
