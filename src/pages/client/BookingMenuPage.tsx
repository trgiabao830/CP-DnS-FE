import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, ShoppingBag, Ban, ArrowLeft } from "lucide-react";
import { bookingService } from "../../services/client/booking.service";
import type {
  BookingFlowState,
  FoodResponse,
  CartItem,
} from "../../types/client/booking";
import FoodDetailModal from "../../components/client/restaurant/FoodDetailModal";
import CartDrawer from "../../components/client/restaurant/CartDrawer";

const BookingMenuPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [bookingState, setBookingState] = useState<BookingFlowState | null>(
    () => {
      if (location.state) {
        const s = location.state as BookingFlowState;
        return {
          ...s,
          guests: s.guests || s.searchParams?.numberOfGuests || 1,
          bookingDate: s.bookingDate || s.searchParams?.date,
          bookingTime: s.bookingTime || s.searchParams?.time,
        };
      }

      const tableId = searchParams.get("tableId");
      const date = searchParams.get("date");
      const time = searchParams.get("time");
      const guests = searchParams.get("guests");

      if (tableId && date && time) {
        return {
          selectedTable: {
            id: Number(tableId),
            suggestedTableId: Number(tableId),
            name: `Bàn số ${tableId}`,
            type: "Standard",
            capacity: Number(guests || 4),
            price: 0,
            status: "AVAILABLE",
            image: "",
            areaName: "Khu vực chung",
          },

          bookingDate: date,
          bookingTime: time,
          guests: Number(guests || 1),

          searchParams: {
            date,
            time,
            numberOfGuests: Number(guests || 1),
          },

          customerInfo: {
            customerName: searchParams.get("name") || "",
            customerPhone: searchParams.get("phone") || "",
            customerEmail: searchParams.get("email") || "",
            isPreOrderFood: true,
          },
          cartItems: [],
        };
      }
      return null;
    },
  );

  const [foods, setFoods] = useState<FoodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(bookingState?.cartItems || []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  const [selectedFood, setSelectedFood] = useState<FoodResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!bookingState || !bookingState.bookingDate) {
      navigate("/restaurant/booking");
    }
  }, [bookingState, navigate]);

  const isBookingToday = useMemo(() => {
    if (!bookingState?.bookingDate) return false;
    const today = new Date();
    const bookingDate = new Date(bookingState.bookingDate);
    return (
      today.getDate() === bookingDate.getDate() &&
      today.getMonth() === bookingDate.getMonth() &&
      today.getFullYear() === bookingDate.getFullYear()
    );
  }, [bookingState]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!bookingState?.bookingDate) return;
      setLoading(true);
      try {
        const data = await bookingService.getMenuForBooking(
          bookingState.bookingDate,
          keyword,
        );
        setFoods(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(() => {
      fetchMenu();
    }, 500);
    return () => clearTimeout(timer);
  }, [bookingState?.bookingDate, keyword]);

  const categorizedFoods = useMemo(() => {
    return foods.reduce(
      (acc, food) => {
        const catName = food.categoryName || "Khác";
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(food);
        return acc;
      },
      {} as Record<string, FoodResponse[]>,
    );
  }, [foods]);

  const categories = Object.keys(categorizedFoods);

  const areOptionsEqual = (opts1: any[], opts2: any[]) => {
    if (!opts1 && !opts2) return true;
    if (!opts1 || !opts2) return false;
    if (opts1.length !== opts2.length) return false;
    const sorted1 = [...opts1].sort((a, b) => a.id - b.id);
    const sorted2 = [...opts2].sort((a, b) => a.id - b.id);
    return sorted1.every((o1, index) => o1.id === sorted2[index].id);
  };

  const handleAddToCart = (newItem: CartItem) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => {
        const isSameFood = item.foodId === newItem.foodId;
        const isSameNote =
          (item.note || "").trim() === (newItem.note || "").trim();
        const isSameOptions = areOptionsEqual(
          item.selectedOptions,
          newItem.selectedOptions,
        );
        return isSameFood && isSameNote && isSameOptions;
      });

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];
        const newQuantity = existingItem.quantity + newItem.quantity;
        const unitPrice = newItem.price / newItem.quantity;

        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          price: unitPrice * newQuantity,
        };
        return updatedCart;
      }
      return [...prevCart, newItem];
    });
  };

  const handleProceed = () => {
    if (!bookingState) return;

    const nextState: BookingFlowState = {
      ...bookingState,
      cartItems: cart,
      guests: bookingState.guests,
      bookingDate: bookingState.bookingDate,
      bookingTime: bookingState.bookingTime,
    };
    navigate("/restaurant/booking/checkout", { state: nextState });
  };

  const handleBack = () => {
    if (!bookingState) return;
    const stateForInfo: BookingFlowState = {
      ...bookingState,
      cartItems: [],
      guests: bookingState.guests,
      bookingDate: bookingState.bookingDate,
      bookingTime: bookingState.bookingTime,
    };
    navigate("/restaurant/booking/info", { state: stateForInfo });
  };

  const handleUpdateQuantity = (tempId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.tempId === tempId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity < 1) return item;
          const unitPrice = item.price / item.quantity;
          return {
            ...item,
            quantity: newQuantity,
            price: unitPrice * newQuantity,
          };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (tempId: string) => {
    setCart((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split("-").reverse().join("-");
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    const element = document.getElementById(`cat-${cat}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 180;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (!bookingState) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="sticky top-[64px] z-30 -mx-4 bg-gray-50 px-4 pb-2 pt-2 md:static md:mx-0 md:bg-transparent md:p-0">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="hidden items-center gap-4 md:flex">
              <button
                onClick={handleBack}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-cyan-500 hover:text-cyan-600"
                title="Quay lại"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Thực đơn</h1>
                <p className="text-gray-500">
                  {isBookingToday
                    ? "Thực đơn phục vụ cho ngày hôm nay."
                    : `Thực đơn đặt trước cho ngày ${formatDateDisplay(bookingState.bookingDate || "")}.`}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-3 md:w-80">
              <button
                onClick={handleBack}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all active:scale-95 md:hidden"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-5 py-2.5 pl-12 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </div>
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all ${activeCategory === cat ? "bg-cyan-500 text-white shadow-md" : "border border-gray-200 bg-white text-gray-600"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="mt-4 grid items-start gap-8 lg:mt-0 lg:grid-cols-4">
          <div className="sticky top-24 hidden lg:col-span-1 lg:block">
            <h3 className="mb-4 text-lg font-bold uppercase text-cyan-500">
              Danh mục
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className={`block w-full rounded-lg px-4 py-3 text-left transition-all hover:bg-white hover:text-cyan-600 hover:shadow-sm ${activeCategory === cat ? "bg-white font-bold text-cyan-600 shadow-sm" : "text-gray-600"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8 lg:col-span-3">
            {loading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat} id={`cat-${cat}`} className="scroll-mt-40">
                  <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-gray-800 md:text-2xl">
                    {cat}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
                    {categorizedFoods[cat].map((food) => {
                      const isOutOfStock = food.status === "OUT_OF_STOCK";
                      const isDisabled = isOutOfStock && isBookingToday;
                      return (
                        <div
                          key={food.foodId}
                          className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all ${isDisabled ? "cursor-not-allowed opacity-70 grayscale-[0.5]" : "cursor-pointer hover:shadow-md"}`}
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedFood(food);
                              setIsModalOpen(true);
                            }
                          }}
                        >
                          <div className="relative aspect-square w-full overflow-hidden">
                            <img
                              src={food.imageUrl}
                              alt={food.name}
                              className={`h-full w-full object-cover transition-transform duration-500 ${!isDisabled && "group-hover:scale-110"}`}
                            />
                            {isDisabled && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white backdrop-blur-[1px]">
                                <Ban size={32} className="mb-1" />
                                <span className="px-2 text-center text-sm font-bold">
                                  Tạm hết hôm nay
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-grow flex-col p-3">
                            <div className="flex-grow">
                              <h3 className="line-clamp-2 text-sm font-bold text-gray-800 md:text-base">
                                {food.name}
                              </h3>
                              <p className="mt-1 line-clamp-2 hidden text-xs text-gray-500 md:block">
                                {food.description}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-bold text-gray-800 md:text-lg">
                                  {formatPrice(
                                    food.discountPrice || food.basePrice,
                                  )}
                                </span>
                                {food.discountPrice && (
                                  <span className="text-xs font-medium text-gray-400 line-through">
                                    {formatPrice(food.basePrice)}
                                  </span>
                                )}
                              </div>
                              <button
                                disabled={isDisabled}
                                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors md:h-8 md:w-8 ${isDisabled ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-cyan-100 text-cyan-600 hover:bg-cyan-500 hover:text-white"}`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Cart */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="container mx-auto flex items-center justify-between px-4 md:px-8">
            <div
              className="flex cursor-pointer flex-col"
              onClick={() => setIsCartOpen(true)}
            >
              <span className="hidden text-xs font-bold uppercase text-gray-500 md:inline">
                Đơn đặt trước của bạn
              </span>
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-cyan-500 md:hidden" />
                <span className="text-sm text-gray-600">{cart.length} món</span>
                <span className="h-4 w-[1px] bg-gray-300"></span>
                <span className="text-lg font-bold text-gray-800">
                  {formatPrice(totalCartPrice)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="rounded-full bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-600 transition-colors hover:bg-cyan-100 md:px-6 md:text-base"
              >
                <span className="hidden md:inline">Chỉnh sửa</span>
                <span className="md:hidden">Sửa</span>
              </button>
              <button
                onClick={handleProceed}
                disabled={cart.length === 0}
                className={`rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors md:px-6 md:text-base ${cart.length === 0 ? "cursor-not-allowed bg-gray-400 shadow-none" : "bg-cyan-400 shadow-cyan-100 hover:bg-cyan-500"}`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>

        {/* Modal & Drawer */}
        <FoodDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          food={selectedFood}
          onAddToCart={handleAddToCart}
        />
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
      </div>
    </div>
  );
};

export default BookingMenuPage;
