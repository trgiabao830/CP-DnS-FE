import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GripVertical,
  Filter,
} from "lucide-react";

import { useCategories } from "../../hooks/admin/useCategories";
import type { Category } from "../../types/admin/categories";

import CategoryFormModal from "../../components/admin/categories/CategoryFormModal";
import { SortableCategoryItem } from "../../components/admin/categories/SortableCategoryItem";
import {
  SuccessModal,
  ErrorModal,
  DeleteConfirmModal,
  StatusConfirmModal,
} from "../../components/admin/categories/CategoryActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

import FoodManager from "../../components/admin/foods/FoodManager";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const API_BASE_URL = "/api/admin/restaurant";

const Categories: React.FC = () => {
  const {
    categories,
    isLoading,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateStatus,
    reorderCategories,
    setCategories,
    error: hookError,
  } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isReordering, setIsReordering] = useState(false);

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusCategory, setStatusCategory] = useState<Category | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleError = (err: any) => {
    console.error("Lỗi hệ thống:", err);
    if (err?.status === 403 || err?.message === "FORBIDDEN") {
      setIsPermissionDenied(true);
    } else {
      setErrorMsg(err?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (hookError) {
      handleError(hookError);
    }
  }, [hookError]);


  const fetchCategoriesRef = useRef(fetchCategories);

  useEffect(() => {
    fetchCategoriesRef.current = fetchCategories;
  }, [fetchCategories]);

  useEffect(() => {
    if (isReordering) return;

    let isActive = true;

    console.log("Connecting to SSE (Categories)...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => {
      console.log("SSE Connected (Categories)!");
    };

    eventSource.addEventListener("FOOD_CATEGORY_UPDATE", (event) => {
      if (isActive) {
        console.log("Received SSE Event: FOOD_CATEGORY_UPDATE", event.data);
        if (fetchCategoriesRef.current) {
          fetchCategoriesRef.current(false);
        }
      }
    });

    eventSource.onerror = (err) => {
      if (isActive) {
        eventSource.close();
      }
    };

    return () => {
      console.log("Closing SSE connection (Categories)...");
      isActive = false;
      eventSource.close();
    };
  }, [isReordering]);


  const handleToggleReorder = () => {
    const newMode = !isReordering;
    setIsReordering(newMode);
    fetchCategories(newMode);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingCategory) {
      await updateCategory(editingCategory.categoryId, data);
      setSuccessMsg("Cập nhật danh mục thành công!");
    } else {
      await createCategory(data);
      setSuccessMsg("Tạo danh mục mới thành công!");
    }
    setModalFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      setSuccessMsg("Xóa danh mục thành công!");
    } catch (err: any) {
      handleError(err);
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusConfirm = async () => {
    if (!statusCategory) return;
    const newStatus =
      statusCategory.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    try {
      await updateStatus(statusCategory.categoryId, newStatus);
      setSuccessMsg("Cập nhật trạng thái thành công!");
    } catch (err: any) {
      handleError(err);
    } finally {
      setStatusCategory(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((i) => i.categoryId === active.id);
        const newIndex = items.findIndex((i) => i.categoryId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      const items = categories.map((cat, index) => ({
        id: cat.categoryId,
        order: index + 1,
      }));
      await reorderCategories(items);
      setIsReordering(false);
      setSuccessMsg("Cập nhật vị trí thành công!");
    } catch (err: any) {
      handleError(err);
    }
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

  const renderStatus = (status: string) => {
    const isAvail = status === "AVAILABLE";
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isAvail ? "border-green-100 bg-green-50 text-green-700" : "border-red-100 bg-red-50 text-red-700"}`}
      >
        {isAvail ? "Hiển thị" : "Ẩn"}
      </span>
    );
  };

  if (selectedCategory) {
    return (
      <FoodManager
        category={selectedCategory}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-fit">
          <h1 className="whitespace-nowrap text-2xl font-bold text-gray-800">
            Quản lý Danh mục
          </h1>
          <p className="text-sm text-gray-500">
            Phân loại món ăn và sắp xếp thứ tự hiển thị
          </p>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3 sm:flex-grow-0">
          {!isReordering && (
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
                <option value="AVAILABLE">Đang hiển thị</option>
                <option value="UNAVAILABLE">Đang ẩn</option>
              </select>
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          )}

          {/* Search Input - Giữ nguyên */}
          {!isReordering && (
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
          )}

          {/* Buttons Group - Giữ nguyên logic Reorder/Add */}
          {isReordering ? (
            <>
              <button
                onClick={handleToggleReorder}
                className="h-10 whitespace-nowrap rounded-lg bg-gray-100 px-4 font-medium text-gray-700 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveOrder}
                className="flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-green-600 px-4 font-medium text-white hover:bg-green-700"
              >
                Lưu vị trí
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleReorder}
                className="flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowUpDown size={18} /> Sắp xếp
              </button>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setModalFormOpen(true);
                }}
                className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
              >
                <Plus size={18} /> Thêm mới
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : isReordering ? (
          <div className="min-h-[400px] overflow-auto bg-gray-50 p-6">
            <div className="mx-auto max-w-2xl">
              <p className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 py-2 text-sm text-blue-700">
                Kéo thả để thay đổi thứ tự hiển thị.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.categoryId)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((cat) => (
                    <SortableCategoryItem
                      key={cat.categoryId}
                      id={cat.categoryId}
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="text-gray-400" size={20} />
                        <span className="font-medium text-gray-700">
                          {cat.name}
                        </span>
                      </div>
                    </SortableCategoryItem>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="w-20 px-6 py-4 text-center">STT</th>
                    <th className="px-6 py-4">Tên danh mục</th>
                    <th className="w-32 px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-12 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat, index) => (
                      <tr
                        key={cat.categoryId}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                          {meta.page * meta.size + index + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {cat.name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatus(cat.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setSelectedCategory(cat)}
                              className="rounded-lg p-2 text-purple-600 hover:bg-purple-50"
                              title="Quản lý món ăn"
                            >
                              <UtensilsCrossed size={18} />
                            </button>
                            <button
                              onClick={() => setStatusCategory(cat)}
                              className={`rounded-lg p-2 ${cat.status === "AVAILABLE" ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                              title={cat.status === "AVAILABLE" ? "Ẩn" : "Hiện"}
                            >
                              {cat.status === "AVAILABLE" ? (
                                <Eye size={18} />
                              ) : (
                                <EyeOff size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setModalFormOpen(true);
                              }}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              title="Sửa"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteId(cat.categoryId)}
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
                danh mục
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={meta.page === 0}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPaginationButtons()}
                <button
                  disabled={meta.page >= meta.totalPages - 1}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- Modals --- */}
      <CategoryFormModal
        isOpen={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingCategory}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa danh mục?"
        message="Hành động này sẽ xóa danh mục khỏi hệ thống. Lưu ý: Nếu danh mục đang có món ăn, bạn cần xóa món trước."
      />

      <StatusConfirmModal
        isOpen={!!statusCategory}
        category={statusCategory}
        onClose={() => setStatusCategory(null)}
        onConfirm={handleStatusConfirm}
      />

      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />
      {/* 👇 Modal Permission Denied */}
      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />
    </div>
  );
};

export default Categories;
