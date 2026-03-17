import React, { useEffect, useState, useCallback, useRef } from "react";
import { restaurantService } from "../../services/admin/restaurant.service";
import { homestayService } from "../../services/admin/homestay.service";
import type {
  RestaurantStatisticResponse,
  HomestayStatisticResponse,
  ChartDataResponse,
  MetricDetail,
} from "../../types/admin/statistic";
import RevenueChart from "../../components/admin/staticstic/RevenueChart";

const RESTAURANT_API_BASE = "/api/admin/restaurant";
const HOMESTAY_API_BASE = "/api/admin/homestay";

const MetricCard = ({
  title,
  data,
}: {
  title: string;
  data: MetricDetail | undefined;
}) => {
  const formatPrice = (val: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">
            {data ? formatPrice(data.revenue) : "..."}
          </h3>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="font-medium text-gray-700">
          {data ? data.completedOrders : 0}
        </span>
        <span className="text-gray-500">đơn hoàn thành</span>
      </div>
    </div>
  );
};

const RevenueStatisticPage = () => {
  const [activeTab, setActiveTab] = useState<"RESTAURANT" | "HOMESTAY">("RESTAURANT");

  const [resStats, setResStats] = useState<RestaurantStatisticResponse | null>(null);
  const [resChartData, setResChartData] = useState<ChartDataResponse[]>([]);
  const [resChartType, setResChartType] = useState<"this_week" | "this_month" | "monthly">("this_week");
  
  const [homeStats, setHomeStats] = useState<HomestayStatisticResponse | null>(null);
  const [homeChartData, setHomeChartData] = useState<ChartDataResponse[]>([]);
  const [homeChartType, setHomeChartType] = useState<"this_week" | "this_month" | "monthly">("this_week");

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);

  const resChartTypeRef = useRef(resChartType);
  const homeChartTypeRef = useRef(homeChartType);

  useEffect(() => { resChartTypeRef.current = resChartType; }, [resChartType]);
  useEffect(() => { homeChartTypeRef.current = homeChartType; }, [homeChartType]);

  const fetchRestaurantData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingStats(true);
    try {
      const data = await restaurantService.getRevenueStatistics();
      setResStats(data);
    } catch (error) { console.error("Lỗi tải thống kê NH:", error); } 
    finally { if (!isBackground) setLoadingStats(false); }
  }, []);

  const fetchRestaurantChart = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingChart(true);
    try {
      const currentType = resChartTypeRef.current;
      const data = await restaurantService.getRevenueChart(currentType);
      setResChartData(data);
    } catch (error) { console.error("Lỗi tải biểu đồ NH:", error); } 
    finally { if (!isBackground) setLoadingChart(false); }
  }, []);

  const fetchHomestayData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingStats(true);
    try {
      const data = await homestayService.getRevenueStatistics();
      setHomeStats(data);
    } catch (error) { console.error("Lỗi tải thống kê Homestay:", error); } 
    finally { if (!isBackground) setLoadingStats(false); }
  }, []);

  const fetchHomestayChart = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingChart(true);
    try {
      const currentType = homeChartTypeRef.current;
      const data = await homestayService.getRevenueChart(currentType);
      setHomeChartData(data);
    } catch (error) { console.error("Lỗi tải biểu đồ Homestay:", error); } 
    finally { if (!isBackground) setLoadingChart(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "RESTAURANT") {
      fetchRestaurantData();
      fetchRestaurantChart();
    }
  }, [activeTab, resChartType, fetchRestaurantData, fetchRestaurantChart]);

  useEffect(() => {
    if (activeTab === "HOMESTAY") {
      fetchHomestayData();
      fetchHomestayChart();
    }
  }, [activeTab, homeChartType, fetchHomestayData, fetchHomestayChart]);

  useEffect(() => {
    if (activeTab !== "RESTAURANT") return;
    let eventSource: EventSource | null = null;
    const connectSSE = () => {
      eventSource = new EventSource(`${RESTAURANT_API_BASE}/sse/subscribe`);
      eventSource.addEventListener("BOOKING_UPDATE", () => {
        console.log("Nhà hàng có biến động!");
        fetchRestaurantData(true);
        fetchRestaurantChart(true);
      });
      eventSource.onerror = () => eventSource?.close();
    };
    connectSSE();
    return () => eventSource?.close();
  }, [activeTab, fetchRestaurantData, fetchRestaurantChart]);

  useEffect(() => {
    if (activeTab !== "HOMESTAY") return;
    let eventSource: EventSource | null = null;
    const connectSSE = () => {
      eventSource = new EventSource(`${HOMESTAY_API_BASE}/sse/subscribe`);
      eventSource.addEventListener("HOMESTAY_BOOKING_UPDATE", () => { 
        console.log("Homestay có biến động!");
        fetchHomestayData(true);
        fetchHomestayChart(true);
      });
      eventSource.onerror = () => eventSource?.close();
    };
    connectSSE();
    return () => eventSource?.close();
  }, [activeTab, fetchHomestayData, fetchHomestayChart]);


  const renderContent = (
    stats: RestaurantStatisticResponse | HomestayStatisticResponse | null,
    chartData: ChartDataResponse[],
    chartType: string,
    setChartType: (type: "this_week" | "this_month" | "monthly") => void
  ) => (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Hôm nay" data={stats?.today} />
        <MetricCard title="Tuần này" data={stats?.thisWeek} />
        <MetricCard title="Tháng này" data={stats?.thisMonth} />
        <MetricCard title="Tổng doanh thu" data={stats?.total} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Biểu đồ doanh thu</h3>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setChartType("this_week")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                chartType === "this_week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setChartType("this_month")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                chartType === "this_month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setChartType("monthly")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                chartType === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Cả năm
            </button>
          </div>
        </div>
        <RevenueChart data={chartData} loading={loadingChart} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thống kê doanh thu</h1>
        </div>
        <div className="flex w-full rounded-lg bg-white p-1 shadow-sm md:w-auto">
          <button
            onClick={() => setActiveTab("RESTAURANT")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all md:flex-none ${
              activeTab === "RESTAURANT" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Nhà hàng
          </button>
          <button
            onClick={() => setActiveTab("HOMESTAY")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all md:flex-none ${
              activeTab === "HOMESTAY" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Homestay
          </button>
        </div>
      </div>

      {activeTab === "RESTAURANT" 
        ? renderContent(resStats, resChartData, resChartType, setResChartType)
        : renderContent(homeStats, homeChartData, homeChartType, setHomeChartType)
      }
    </div>
  );
};

export default RevenueStatisticPage;
