import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react";

import { useFoods } from "../../hooks/admin/useFoods";
import { useCategories } from "../../hooks/admin/useCategories";
import type { Food, FoodStatus } from "../../types/admin/food";

import FoodFormModal from "../../components/admin/foods/FoodFormModal";
import Modal from "../../components/Modal";
import {
  SuccessModal,
  ErrorModal,
  DeleteConfirmModal,
} from "../../components/admin/common/ActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

const API_BASE_URL = "/api/admin/restaurant";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val,
  );

const Foods: React.FC = () => {
  const {
    foods,
    isLoading,
    error: hookError,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    createFood,
    updateFood,
    deleteFood,
    updateStatus,
    fetchFoods,
  } = useFoods();

  const { categories: allCategories } = useCategories(true);

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusData, setStatusData] = useState<Food | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchText, setCategorySearchText] = useState("");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categoryFilter) {
      const selectedCat = allCategories.find(
        (c) => c.categoryId === categoryFilter,
      );
      if (selectedCat) setCategorySearchText(selectedCat.name);
    } else {
      setCategorySearchText("");
    }
  }, [categoryFilter, allCategories]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
        if (categoryFilter) {
          const selected = allCategories.find(
            (c) => c.categoryId === categoryFilter,
          );
          setCategorySearchText(selected ? selected.name : "");
        } else {
          setCategorySearchText("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryFilter, allCategories]);

  const filteredCategories = allCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchText.toLowerCase()),
  );

  const handleError = (err: any) => {
    console.error("Error:", err);
    if (err?.status === 403 || err?.message === "FORBIDDEN") {
      setIsPermissionDenied(true);
    } else {
      setErrorMsg(err?.message || "Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    if (hookError) handleError(hookError);
  }, [hookError]);

  const fetchFoodsRef = useRef(fetchFoods);

  useEffect(() => {
    fetchFoodsRef.current = fetchFoods;
  }, [fetchFoods]);

  useEffect(() => {
    let isActive = true;

    console.log("Connecting to SSE (Foods)...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => {
      console.log("SSE Connected (Foods)!");
    };

    eventSource.addEventListener("FOOD_UPDATE", (event) => {
      if (isActive) {
        console.log("Received SSE Event: FOOD_UPDATE", event.data);
        if (fetchFoodsRef.current) {
          fetchFoodsRef.current();
        }
      }
    });

    eventSource.onerror = (err) => {
      if (isActive) {
        eventSource.close();
      }
    };

    return () => {
      console.log("Closing SSE connection (Foods)...");
      isActive = false;
      eventSource.close();
    };
  }, []);


  const handleFormSubmit = async (data: any, file?: File) => {
    try {
      if (editingFood) {
        await updateFood(editingFood.foodId, data, file);
        setSuccessMsg("Cập nhật món ăn thành công!");
      } else {
        await createFood(data, file);
        setSuccessMsg("Thêm món mới thành công!");
      }
      setModalFormOpen(false);
    } catch (err: any) {
      handleError(err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteFood(deleteId);
      setSuccessMsg("Đã xóa món ăn!");
    } catch (err: any) {
      handleError(err);
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusUpdate = async (newStatus: FoodStatus) => {
    if (!statusData) return;
    if (statusData.status === newStatus) {
      setStatusData(null);
      return;
    }
    try {
      await updateStatus(statusData.foodId, newStatus);
      setSuccessMsg("Cập nhật trạng thái thành công!");
    } catch (err: any) {
      handleError(err);
    } finally {
      setStatusData(null);
    }
  };

  const renderStatus = (status: FoodStatus) => {
    let colorClass = "";
    let label = "";
    switch (status) {
      case "AVAILABLE":
        colorClass = "border-green-100 bg-green-50 text-green-700";
        label = "Đang bán";
        break;
      case "OUT_OF_STOCK":
        colorClass = "border-orange-100 bg-orange-50 text-orange-700";
        label = "Hết hàng";
        break;
      default:
        colorClass = "border-red-100 bg-red-50 text-red-700";
        label = "Ngưng bán";
        break;
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${colorClass}`}
      >
        {label}
      </span>
    );
  };

  const renderPaginationButtons = () => {
    const { totalPages, page: currentPage } = meta;
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 3) pages.push("...");
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);
      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 4) start = totalPages - 5;
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 4) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages.map((page, index) => {
      if (page === "...")
        return (
          <span
            key={`ellipsis-${index}`}
            className="mb-1 self-end px-2 text-gray-400"
          >
            ...
          </span>
        );
      const pageNum = page as number;
      return (
        <button
          key={pageNum}
          onClick={() => setMeta((prev) => ({ ...prev, page: pageNum }))}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? "border border-blue-600 bg-blue-600 text-white shadow-sm" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          {pageNum + 1}
        </button>
      );
    });
  };

  const startRecord = meta.totalElements === 0 ? 0 : meta.page * meta.size + 1;
  const endRecord = Math.min((meta.page + 1) * meta.size, meta.totalElements);
  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-fit">
          <h1 className="whitespace-nowrap text-2xl font-bold text-gray-800">
            Quản lý Món ăn
          </h1>
          <p className="text-sm text-gray-500">
            Quản lý toàn bộ thực đơn nhà hàng
          </p>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3 sm:flex-grow-0">
          <div className="relative" ref={categoryDropdownRef}>
            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Tất cả danh mục"
                value={categorySearchText}
                onChange={(e) => {
                  setCategorySearchText(e.target.value);
                  setIsCategoryDropdownOpen(true);
                }}
                onFocus={() => setIsCategoryDropdownOpen(true)}
                className="h-10 w-48 rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              {categoryFilter || categorySearchText ? (
                <button
                  onClick={() => {
                    setCategoryFilter(null);
                    setCategorySearchText("");
                    setMeta((prev) => ({ ...prev, page: 0 }));
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              ) : (
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                />
              )}
            </div>

            {isCategoryDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full min-w-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredCategories.length > 0 ? (
                  <ul>
                    <li
                      onClick={() => {
                        setCategoryFilter(null);
                        setCategorySearchText("");
                        setMeta((prev) => ({ ...prev, page: 0 }));
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="cursor-pointer border-b border-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Tất cả danh mục
                    </li>
                    {filteredCategories.map((cat) => (
                      <li
                        key={cat.categoryId}
                        onClick={() => {
                          setCategoryFilter(cat.categoryId);
                          setCategorySearchText(cat.name);
                          setMeta((prev) => ({ ...prev, page: 0 }));
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 ${categoryFilter === cat.categoryId ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700"}`}
                      >
                        {cat.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    Không tìm thấy
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STATUS FILTER */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 0 }));
              }}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="AVAILABLE">Đang bán</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
              <option value="UNAVAILABLE">Ngưng bán</option>
            </select>
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* SEARCH INPUT */}
          <div className="relative flex-grow sm:w-64 sm:flex-grow-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setEditingFood(null);
              setModalFormOpen(true);
            }}
            className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} /> Thêm mới
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="mb-3 animate-spin text-blue-500" size={40} />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600 shadow-sm">
                  <tr>
                    <th className="w-20 px-6 py-4 text-center">STT</th>
                    <th className="px-6 py-4">Tên món ăn</th>
                    <th className="px-6 py-4 text-center">Danh mục</th>
                    <th className="px-6 py-4 text-right">Giá bán</th>
                    <th className="w-36 px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {foods.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-12 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    foods.map((food, index) => (
                      <tr
                        key={food.foodId}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                          {meta.page * meta.size + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                              {food.imageUrl ? (
                                <img
                                  src={food.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {food.name}
                              </p>
                              {food.description && (
                                <p className="max-w-[200px] truncate text-xs text-gray-400">
                                  {food.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* 👇 Category Column */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {
                              allCategories.find(
                                (c) => c.categoryId === food.categoryId,
                              )?.name
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {food.discountPrice ? (
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-red-600">
                                {formatCurrency(food.discountPrice)}
                              </span>
                              <span className="text-xs text-gray-400 line-through decoration-gray-400">
                                {formatCurrency(food.basePrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium text-gray-700">
                              {formatCurrency(food.basePrice)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatus(food.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setStatusData(food)}
                              className={`rounded-lg p-2 transition-colors ${
                                food.status === "AVAILABLE"
                                  ? "text-green-600 hover:bg-green-50"
                                  : food.status === "OUT_OF_STOCK"
                                    ? "text-orange-500 hover:bg-orange-50"
                                    : "text-gray-400 hover:bg-gray-100"
                              }`}
                              title="Cập nhật trạng thái"
                            >
                              {food.status === "AVAILABLE" ? (
                                <Eye size={18} />
                              ) : food.status === "OUT_OF_STOCK" ? (
                                <AlertTriangle size={18} />
                              ) : (
                                <EyeOff size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingFood(food);
                                setModalFormOpen(true);
                              }}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              title="Sửa"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteId(food.foodId)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}

            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row">
              <span className="text-sm text-gray-500">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {startRecord} - {endRecord}
                </span>{" "}
                dữ liệu trên tổng{" "}
                <span className="font-bold text-gray-900">
                  {meta.totalElements}
                </span>{" "}
                món
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={meta.page === 0}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPaginationButtons()}
                <button
                  disabled={meta.page >= meta.totalPages - 1}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- Modals --- */}
      <FoodFormModal
        isOpen={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingFood}
        categoryId={editingFood?.categoryId || categoryFilter || 0}
        allCategories={allCategories}
        existingFoods={foods}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa món ăn?"
        message="Hành động này không thể hoàn tác. Món ăn này sẽ bị xóa vĩnh viễn khỏi hệ thống."
      />

      {statusData && (
        <Modal
          isOpen={!!statusData}
          onClose={() => setStatusData(null)}
          title="Cập nhật trạng thái"
          size="md"
        >
          {/* Same status modal content as FoodManager */}
          <div className="p-4">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleStatusUpdate("AVAILABLE")}
                className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all ${statusData.status === "AVAILABLE" ? "border-green-500 bg-green-50 text-green-800" : "border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${statusData.status === "AVAILABLE" ? "bg-green-200" : "bg-gray-100"}`}
                  >
                    <Eye
                      size={20}
                      className={
                        statusData.status === "AVAILABLE"
                          ? "text-green-700"
                          : "text-gray-500"
                      }
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Đang bán</p>
                    <p className="text-xs opacity-80">
                      Hiển thị bình thường trên menu
                    </p>
                  </div>
                </div>
                {statusData.status === "AVAILABLE" && (
                  <Check size={20} className="text-green-600" />
                )}
              </button>
              <button
                onClick={() => handleStatusUpdate("OUT_OF_STOCK")}
                className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all ${statusData.status === "OUT_OF_STOCK" ? "border-orange-500 bg-orange-50 text-orange-800" : "border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${statusData.status === "OUT_OF_STOCK" ? "bg-orange-200" : "bg-gray-100"}`}
                  >
                    <AlertTriangle
                      size={20}
                      className={
                        statusData.status === "OUT_OF_STOCK"
                          ? "text-orange-700"
                          : "text-gray-500"
                      }
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Hết hàng</p>
                    <p className="text-xs opacity-80">
                      Vẫn hiện nhưng không cho đặt
                    </p>
                  </div>
                </div>
                {statusData.status === "OUT_OF_STOCK" && (
                  <Check size={20} className="text-orange-600" />
                )}
              </button>
              <button
                onClick={() => handleStatusUpdate("UNAVAILABLE")}
                className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all ${statusData.status === "UNAVAILABLE" ? "border-red-500 bg-red-50 text-red-800" : "border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${statusData.status === "UNAVAILABLE" ? "bg-red-200" : "bg-gray-100"}`}
                  >
                    <EyeOff
                      size={20}
                      className={
                        statusData.status === "UNAVAILABLE"
                          ? "text-red-700"
                          : "text-gray-500"
                      }
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Ngưng bán</p>
                    <p className="text-xs opacity-80">Ẩn hoàn toàn khỏi menu</p>
                  </div>
                </div>
                {statusData.status === "UNAVAILABLE" && (
                  <Check size={20} className="text-red-600" />
                )}
              </button>
            </div>
            <button
              onClick={() => setStatusData(null)}
              className="mt-6 w-full rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              Hủy bỏ
            </button>
          </div>
        </Modal>
      )}

      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />
      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />
    </div>
  );
};

export default Foods;
