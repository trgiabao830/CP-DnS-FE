import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Upload,
  X,
  Plus,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";
import Modal from "../../Modal";
import type {
  Food,
  FoodRequest,
  VariantRequest,
  VariantOptionRequest,
} from "../../../types/admin/food";
import type { Category } from "../../../types/admin/categories";
import { foodService } from "../../../services/admin/food.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FoodRequest, file?: File) => Promise<void>;
  initialData?: Food | null;
  categoryId: number;
  allCategories: Category[];
  existingFoods?: Food[];
}

interface FoodFormState extends Omit<
  FoodRequest,
  "basePrice" | "discountPrice"
> {
  basePrice: number | "";
  discountPrice: number | "";
  imageUrl?: string;
}

type FoodCache = Record<number, Food[]>;

type VariantSearchState = {
  isOpen: boolean;
  searchTerm: string;
};

const FoodFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categoryId,
  allCategories,
}) => {
  const [activeTab, setActiveTab] = useState<"SINGLE" | "COMBO">("SINGLE");
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [formData, setFormData] = useState<FoodFormState>({
    name: "",
    description: "",
    basePrice: "",
    discountPrice: "",
    status: "AVAILABLE",
    categoryId: categoryId || 0,
    imageUrl: "",
    variants: [],
  });

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryWrapperRef = useRef<HTMLDivElement>(null);

  const [variantSearchStates, setVariantSearchStates] = useState<
    Record<number, VariantSearchState>
  >({});

  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoryFoodsCache, setCategoryFoodsCache] = useState<FoodCache>({});
  const [variantSelectedCategory, setVariantSelectedCategory] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    if (formData.categoryId && formData.categoryId !== 0) {
      const cat = allCategories.find(
        (c) => c.categoryId === formData.categoryId,
      );
      if (cat) setCategorySearch(cat.name);
    } else {
      setCategorySearch("");
    }
  }, [formData.categoryId, allCategories, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryWrapperRef.current &&
        !categoryWrapperRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
        const cat = allCategories.find(
          (c) => c.categoryId === formData.categoryId,
        );
        setCategorySearch(cat ? cat.name : "");
      }

    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formData.categoryId, allCategories]);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      const resetForm = () => {
        setFormData({
          name: "",
          description: "",
          basePrice: "",
          discountPrice: "",
          status: "AVAILABLE",
          categoryId: categoryId || 0,
          imageUrl: "",
          variants: [],
        });
        setPreviewUrl("");
        setActiveTab("SINGLE");
        setVariantSelectedCategory({});
        setVariantSearchStates({});
        setCategoryFoodsCache({});
        setSelectedFile(undefined);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };

      if (initialData) {
        setIsLoadingData(true);
        const prepareData = async () => {
          try {
            const isCombo = initialData.variants?.some((v) =>
              v.options.some((o) => o.linkedFoodId !== null),
            );

            const mappedVariants: VariantRequest[] = (
              initialData.variants || []
            ).map((v) => ({
              variantId: v.variantId,
              name: v.name,
              isRequired: v.isRequired,
              options: v.options.map((o) => ({
                optionId: o.optionId,
                name: o.name,
                priceAdjustment: o.priceAdjustment,
                status: o.status || "AVAILABLE",
                linkedFoodId: o.linkedFoodId,
              })),
            }));

            const tempSelectedCats: Record<number, number> = {};
            const categoriesToFetch = new Set<number>();
            const tempSearchStates: Record<number, VariantSearchState> = {};

            if (isCombo) {
              mappedVariants.forEach((variant, index) => {
                const originalVariant = initialData.variants?.find(
                  (v) => v.variantId === variant.variantId,
                );

                const linkedOption = originalVariant?.options.find(
                  (o) => o.linkedFoodId && o.linkedFoodCategoryId,
                );

                if (linkedOption && linkedOption.linkedFoodCategoryId) {
                  const foundCatId = linkedOption.linkedFoodCategoryId;

                  tempSelectedCats[index] = foundCatId;
                  categoriesToFetch.add(foundCatId);

                  const cat = allCategories.find(
                    (c) => c.categoryId === foundCatId,
                  );
                  tempSearchStates[index] = {
                    isOpen: false,
                    searchTerm: cat ? cat.name : "",
                  };
                } else {
                  tempSearchStates[index] = { isOpen: false, searchTerm: "" };
                }
              });
            } else {
              mappedVariants.forEach((_, idx) => {
                tempSearchStates[idx] = { isOpen: false, searchTerm: "" };
              });
            }

            const tempFoodCache: FoodCache = {};
            if (categoriesToFetch.size > 0) {
              await Promise.all(
                Array.from(categoriesToFetch).map(async (catId) => {
                  try {
                    const res = await foodService.getByCategory(
                      catId,
                      0,
                      1000,
                      "",
                      "",
                      true,
                    );
                    tempFoodCache[catId] = res.content || [];
                  } catch (e) {
                    console.error(
                      `Error fetching foods for category ${catId}:`,
                      e,
                    );
                  }
                }),
              );
            }

            setActiveTab(isCombo ? "COMBO" : "SINGLE");
            setFormData({
              name: initialData.name,
              description: initialData.description || "",
              basePrice: initialData.basePrice,
              discountPrice: initialData.discountPrice ?? "",
              status: initialData.status,
              categoryId: initialData.categoryId,
              imageUrl: initialData.imageUrl || "",
              variants: mappedVariants,
            });
            setPreviewUrl(initialData.imageUrl || "");
            setVariantSelectedCategory(tempSelectedCats);
            setVariantSearchStates(tempSearchStates);
            setCategoryFoodsCache(tempFoodCache);
          } catch (err) {
            console.error("Lỗi khởi tạo dữ liệu:", err);
          } finally {
            setIsLoadingData(false);
          }
        };
        prepareData();
        setSelectedFile(undefined);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData, categoryId, allCategories]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:"))
        URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchFoodsForCategory = async (catId: number) => {
    if (categoryFoodsCache[catId]) return;
    try {
      const res = await foodService.getByCategory(catId, 0, 1000, "", "", true);
      setCategoryFoodsCache((prev) => ({
        ...prev,
        [catId]: res.content || [],
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const blockInvalidChar = (e: React.KeyboardEvent) => {
    if (
      [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        ".",
      ].includes(e.key)
    )
      return;
    if (["e", "E", "+", "-"].includes(e.key) || isNaN(Number(e.key)))
      e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(undefined);
    setPreviewUrl("");
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addVariant = () => {
    const newIdx = formData.variants.length;
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: "", isRequired: false, options: [] },
      ],
    }));
    setVariantSearchStates((prev) => ({
      ...prev,
      [newIdx]: { isOpen: false, searchTerm: "" },
    }));
  };

  const removeVariant = (index: number) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData((prev) => ({ ...prev, variants: newVariants }));

    const newSelectedCats = { ...variantSelectedCategory };
    delete newSelectedCats[index];
    setVariantSelectedCategory(newSelectedCats);

    setVariantSearchStates((prev) => {
      const nextState: Record<number, VariantSearchState> = {};
      let newKey = 0;
      Object.keys(prev).forEach((keyStr) => {
        const k = Number(keyStr);
        if (k !== index) {
          nextState[newKey] = prev[k];
          newKey++;
        }
      });
      return nextState;
    });
  };

  const updateVariant = (
    index: number,
    field: keyof VariantRequest,
    value: any,
  ) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleComboCategoryChange = async (
    variantIndex: number,
    catId: number,
  ) => {
    setVariantSelectedCategory((prev) => ({ ...prev, [variantIndex]: catId }));
    if (catId) await fetchFoodsForCategory(catId);
  };

  const toggleVariantDropdown = (idx: number, open: boolean) => {
    setVariantSearchStates((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], isOpen: open },
    }));
  };

  const setVariantSearchTerm = (idx: number, term: string) => {
    setVariantSearchStates((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], searchTerm: term },
    }));
  };

  const toggleComboFoodOption = (
    variantIndex: number,
    food: Food,
    isChecked: boolean,
  ) => {
    const currentVariant = formData.variants[variantIndex];
    let newOptions = [...currentVariant.options];
    if (isChecked) {
      newOptions.push({
        name: food.name,
        priceAdjustment: 0,
        status: "AVAILABLE",
        linkedFoodId: food.foodId,
      });
    } else {
      newOptions = newOptions.filter((opt) => opt.linkedFoodId !== food.foodId);
    }
    const newVariants = [...formData.variants];
    newVariants[variantIndex] = { ...currentVariant, options: newOptions };
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const addOptionManual = (variantIndex: number) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].options.push({
      name: "",
      priceAdjustment: 0,
      status: "AVAILABLE",
      linkedFoodId: undefined,
    });
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const removeOption = (variantIndex: number, optionIndex: number) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].options.splice(optionIndex, 1);
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const updateOption = (
    variantIndex: number,
    optionIndex: number,
    field: keyof VariantOptionRequest,
    value: any,
  ) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].options[optionIndex] = {
      ...newVariants[variantIndex].options[optionIndex],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!formData.categoryId || formData.categoryId === 0)
      newErrors.categoryId = "Vui lòng chọn danh mục cho món ăn";
    if (!formData.name.trim()) newErrors.name = "Tên món không được để trống";
    if (formData.basePrice === "")
      newErrors.basePrice = "Giá bán không được để trống";
    if (
      formData.discountPrice !== "" &&
      Number(formData.discountPrice) >= Number(formData.basePrice)
    ) {
      newErrors.discountPrice = "Giá giảm phải nhỏ hơn giá gốc";
    }

    formData.variants.forEach((v, vIdx) => {
      if (!v.name.trim())
        newErrors[`v_${vIdx}_name`] = "Tên nhóm không được để trống";
      if (v.options.length === 0)
        newErrors[`v_${vIdx}_options`] = "Phải có ít nhất 1 tùy chọn";
      v.options.forEach((o, oIdx) => {
        if (!o.name.trim())
          newErrors[`v_${vIdx}_o_${oIdx}_name`] =
            "Tên tùy chọn không được để trống";
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData: FoodRequest = {
        ...formData,
        basePrice: Number(formData.basePrice),
        discountPrice:
          formData.discountPrice === ""
            ? undefined
            : Number(formData.discountPrice),
      };
      await onSubmit(finalData, selectedFile);
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchTab = (tab: "SINGLE" | "COMBO") => {
    if (formData.variants.length > 0) {
      if (
        !window.confirm(
          "Chuyển chế độ sẽ xóa các tùy chọn hiện tại. Bạn có chắc không?",
        )
      )
        return;
      setFormData((prev) => ({ ...prev, variants: [] }));
      setVariantSelectedCategory({});
      setVariantSearchStates({});
    }
    setActiveTab(tab);
  };

  const filteredCategories = allCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Cập nhật" : "Thêm mới"}
      size="3xl"
    >
      {isLoadingData ? (
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <span className="text-sm text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => handleSwitchTab("SINGLE")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${activeTab === "SINGLE" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Món đơn (Thường)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab("COMBO")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${activeTab === "COMBO" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Combo (Gộp món)
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="col-span-2 md:col-span-1">
              <div
                className={`relative flex h-56 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${previewUrl ? "border-blue-300 bg-gray-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-contain p-2"
                    />
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-white/90 p-2 text-red-500 shadow-md transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={20} />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center p-6 text-center text-gray-400">
                    <Upload size={32} className="mb-2" />
                    <span className="text-xs font-medium">Tải ảnh lên</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="col-span-2 space-y-4 md:col-span-1">
              {/* MAIN SEARCHABLE DROPDOWN */}
              <div className="relative" ref={categoryWrapperRef}>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setIsCategoryOpen(true);
                    }}
                    onFocus={() => setIsCategoryOpen(true)}
                    placeholder="-- Tìm hoặc chọn danh mục --"
                    className={`w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 ${
                      errors.categoryId ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  {categorySearch ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategorySearch("");
                        setFormData({ ...formData, categoryId: 0 });
                        setIsCategoryOpen(true);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Xóa lựa chọn"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  )}
                </div>
                {isCategoryOpen && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredCategories.length > 0 ? (
                      <ul className="py-1">
                        {filteredCategories.map((cat) => (
                          <li
                            key={cat.categoryId}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                categoryId: cat.categoryId,
                              });
                              setCategorySearch(cat.name);
                              setIsCategoryOpen(false);
                            }}
                            className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm hover:bg-blue-50 ${formData.categoryId === cat.categoryId ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"}`}
                          >
                            <span>{cat.name}</span>
                            {formData.categoryId === cat.categoryId && (
                              <Check size={16} className="text-blue-600" />
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-center text-sm text-gray-500">
                        Không tìm thấy danh mục "{categorySearch}"
                      </div>
                    )}
                  </div>
                )}
                {errors.categoryId && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.categoryId}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Tên {activeTab === "COMBO" ? "Combo" : "Món"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${errors.name ? "border-red-500" : "border-gray-300"}`}
                  placeholder={
                    activeTab === "COMBO"
                      ? "VD: Combo Trưa Hè"
                      : "VD: Cơm gà..."
                  }
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                    Giá bán (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.basePrice}
                      onKeyDown={blockInvalidChar}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          basePrice:
                            e.target.value === "" ? "" : Number(e.target.value),
                        });
                        if (errors.basePrice)
                          setErrors({ ...errors, basePrice: "" });
                      }}
                      className={`no-spinner w-full rounded-lg border px-3 py-2 font-medium outline-none focus:ring-2 ${errors.basePrice ? "border-red-500" : "border-gray-300"}`}
                      placeholder="0"
                    />
                  </div>
                  {errors.basePrice && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.basePrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                    Giá giảm (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.discountPrice}
                      onKeyDown={blockInvalidChar}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPrice:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="no-spinner w-full rounded-lg border border-gray-300 px-3 py-2 font-medium text-red-600 outline-none focus:ring-2"
                      placeholder="Trống"
                    />
                  </div>
                  {errors.discountPrice && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.discountPrice}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2"
                  placeholder="Mô tả chi tiết..."
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* SECTION 2: VARIANTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {activeTab === "COMBO"
                  ? "Các món trong Combo"
                  : "Tùy chọn (Topping, Size...)"}
              </h3>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                <Plus size={16} /> Thêm nhóm
              </button>
            </div>

            {/* SINGLE MODE */}
            {activeTab === "SINGLE" && (
              <div className="space-y-6">
                {formData.variants.map((variant, vIdx) => (
                  <div
                    key={vIdx}
                    className="group relative rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    {/* Header Variant (Giữ nguyên) */}
                    <div className="mb-4 grid grid-cols-1 items-start gap-4 md:grid-cols-12">
                      <div className="md:col-span-7">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) =>
                            updateVariant(vIdx, "name", e.target.value)
                          }
                          className={`w-full rounded border bg-white px-3 py-2 text-sm font-medium outline-none ${errors[`v_${vIdx}_name`] ? "border-red-500" : "border-gray-300"}`}
                          placeholder="Tên nhóm (VD: Size, Độ ngọt...)"
                        />
                        {errors[`v_${vIdx}_name`] && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors[`v_${vIdx}_name`]}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1 md:col-span-5">
                        <label className="flex cursor-pointer select-none items-center gap-2">
                          <input
                            type="checkbox"
                            checked={variant.isRequired}
                            onChange={(e) =>
                              updateVariant(
                                vIdx,
                                "isRequired",
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded text-blue-600"
                          />
                          <span className="text-sm text-gray-700">
                            Bắt buộc
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeVariant(vIdx)}
                          className="rounded p-2 text-gray-400 hover:text-red-600"
                          title="Xóa nhóm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                      {variant.options.map((option, oIdx) => (
                        <div
                          key={oIdx}
                          className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3 sm:flex-nowrap sm:border-0 sm:pb-0"
                        >
                          <div className="w-full sm:w-7/12">
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) =>
                                updateOption(vIdx, oIdx, "name", e.target.value)
                              }
                              className={`w-full rounded border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${errors[`v_${vIdx}_o_${oIdx}_name`] ? "border-red-500" : "border-gray-300"}`}
                              placeholder="Tên tùy chọn (VD: Size L)"
                            />
                          </div>

                          <div className="flex w-full flex-1 items-center gap-3 sm:w-auto">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-2 text-sm text-gray-400">
                                ₫
                              </span>
                              <input
                                type="number"
                                value={option.priceAdjustment ?? ""}
                                onKeyDown={blockInvalidChar}
                                onChange={(e) =>
                                  updateOption(
                                    vIdx,
                                    oIdx,
                                    "priceAdjustment",
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                  )
                                }
                                className="no-spinner w-full rounded border border-gray-300 py-2 pl-7 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentStatus =
                                    option.status || "AVAILABLE";
                                  const newStatus =
                                    currentStatus === "AVAILABLE"
                                      ? "UNAVAILABLE"
                                      : "AVAILABLE";
                                  updateOption(vIdx, oIdx, "status", newStatus);
                                }}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  option.status === "AVAILABLE" ||
                                  !option.status
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                                title={
                                  option.status === "AVAILABLE" ||
                                  !option.status
                                    ? "Đang bán"
                                    : "Ngưng bán"
                                }
                              >
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    option.status === "AVAILABLE" ||
                                    !option.status
                                      ? "translate-x-5"
                                      : "translate-x-0"
                                  }`}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeOption(vIdx, oIdx)}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                title="Xóa tùy chọn này"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addOptionManual(vIdx)}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        <Plus size={14} /> Thêm tùy chọn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "COMBO" && (
              <div className="space-y-6">
                {formData.variants.map((variant, vIdx) => {
                  const currentSearchTerm =
                    variantSearchStates[vIdx]?.searchTerm || "";
                  const filteredVariantCategories = allCategories.filter(
                    (cat) =>
                      cat.name
                        .toLowerCase()
                        .includes(currentSearchTerm.toLowerCase()),
                  );
                  const isOpen = variantSearchStates[vIdx]?.isOpen || false;

                  return (
                    <div
                      key={vIdx}
                      className="relative rounded-xl border border-purple-200 bg-purple-50 p-4"
                    >
                      <div className="mb-4 grid grid-cols-1 items-start gap-4 md:grid-cols-12">
                        <div className="md:col-span-5">
                          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                            Tên nhóm
                          </label>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) =>
                              updateVariant(vIdx, "name", e.target.value)
                            }
                            className={`w-full rounded border bg-white px-3 py-2 text-sm font-medium outline-none ${errors[`v_${vIdx}_name`] ? "border-red-500" : "border-gray-300"}`}
                            placeholder="Nhập tên nhóm..."
                          />
                          {errors[`v_${vIdx}_name`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`v_${vIdx}_name`]}
                            </p>
                          )}
                        </div>

                        <div className="relative md:col-span-4">
                          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                            Lấy món từ danh mục
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={currentSearchTerm}
                              onChange={(e) => {
                                setVariantSearchTerm(vIdx, e.target.value);
                                toggleVariantDropdown(vIdx, true);
                              }}
                              onFocus={() => toggleVariantDropdown(vIdx, true)}
                              onBlur={() =>
                                setTimeout(() => {
                                  toggleVariantDropdown(vIdx, false);
                                  const selectedId =
                                    variantSelectedCategory[vIdx];
                                  if (selectedId) {
                                    const selectedCat = allCategories.find(
                                      (c) => c.categoryId === selectedId,
                                    );
                                    setVariantSearchTerm(
                                      vIdx,
                                      selectedCat ? selectedCat.name : "",
                                    );
                                  } else {
                                    setVariantSearchTerm(vIdx, "");
                                  }
                                }, 200)
                              }
                              placeholder="-- Tìm danh mục --"
                              className="w-full rounded border border-gray-300 bg-white px-3 py-2 pr-8 text-sm outline-none"
                            />

                            {currentSearchTerm ? (
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleComboCategoryChange(vIdx, 0);
                                  setVariantSearchTerm(vIdx, "");
                                  toggleVariantDropdown(vIdx, true);
                                }}
                                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              >
                                <X size={14} />
                              </button>
                            ) : (
                              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                                <ChevronDown size={16} />
                              </div>
                            )}
                          </div>

                          {isOpen && (
                            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg">
                              {filteredVariantCategories.length > 0 ? (
                                <ul className="py-1">
                                  {filteredVariantCategories.map((cat) => (
                                    <li
                                      key={cat.categoryId}
                                      onMouseDown={() => {
                                        handleComboCategoryChange(
                                          vIdx,
                                          cat.categoryId,
                                        );
                                        setVariantSearchTerm(vIdx, cat.name);
                                        toggleVariantDropdown(vIdx, false);
                                      }}
                                      className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-purple-50 ${variantSelectedCategory[vIdx] === cat.categoryId ? "bg-purple-50 font-medium text-purple-700" : "text-gray-700"}`}
                                    >
                                      <span>{cat.name}</span>
                                      {variantSelectedCategory[vIdx] ===
                                        cat.categoryId && <Check size={14} />}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="px-3 py-2 text-center text-sm text-gray-500">
                                  Không tìm thấy danh mục
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-6 md:col-span-2">
                          <label className="flex cursor-pointer select-none items-center gap-2">
                            <input
                              type="checkbox"
                              checked={variant.isRequired}
                              onChange={(e) =>
                                updateVariant(
                                  vIdx,
                                  "isRequired",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 rounded text-purple-600"
                            />
                            <span className="text-sm text-gray-700">
                              Bắt buộc
                            </span>
                          </label>
                        </div>
                        <div className="flex justify-end pt-5 md:col-span-1">
                          <button
                            type="button"
                            onClick={() => removeVariant(vIdx)}
                            className="rounded p-2 text-gray-400 hover:text-red-600"
                            title="Xóa nhóm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
                        {variantSelectedCategory[vIdx] ? (
                          categoryFoodsCache[variantSelectedCategory[vIdx]] ? (
                            categoryFoodsCache[variantSelectedCategory[vIdx]]
                              .length > 0 ? (
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {categoryFoodsCache[
                                  variantSelectedCategory[vIdx]
                                ].map((food) => {
                                  const isSelected = variant.options.some(
                                    (o) => o.linkedFoodId === food.foodId,
                                  );
                                  const currentOpt = variant.options.find(
                                    (o) => o.linkedFoodId === food.foodId,
                                  );
                                  return (
                                    <div
                                      key={food.foodId}
                                      className={`flex items-center justify-between rounded border p-2 transition-colors ${isSelected ? "border-purple-500 bg-purple-50" : "border-gray-100 hover:bg-gray-50"}`}
                                    >
                                      <label className="flex flex-1 cursor-pointer items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) =>
                                            toggleComboFoodOption(
                                              vIdx,
                                              food,
                                              e.target.checked,
                                            )
                                          }
                                          className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <div className="text-sm">
                                          <div className="font-medium text-gray-700">
                                            {food.name}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {food.basePrice.toLocaleString()}đ
                                          </div>
                                        </div>
                                      </label>
                                      {isSelected && (
                                        <div className="relative w-24">
                                          <span className="absolute left-2 top-1.5 text-xs text-gray-400">
                                            +
                                          </span>
                                          <input
                                            type="number"
                                            className="no-spinner w-full rounded border border-purple-300 py-1 pl-5 text-right text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                            placeholder="0"
                                            value={
                                              currentOpt?.priceAdjustment ?? ""
                                            }
                                            onKeyDown={blockInvalidChar}
                                            onChange={(e) => {
                                              const optIndex =
                                                variant.options.findIndex(
                                                  (o) =>
                                                    o.linkedFoodId ===
                                                    food.foodId,
                                                );
                                              if (optIndex !== -1) {
                                                updateOption(
                                                  vIdx,
                                                  optIndex,
                                                  "priceAdjustment",
                                                  e.target.value === ""
                                                    ? 0
                                                    : Number(e.target.value),
                                                );
                                              }
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="py-2 text-center text-sm text-gray-400">
                                Danh mục này chưa có món nào.
                              </p>
                            )
                          ) : (
                            <div className="py-2 text-center">
                              <Loader2
                                className="inline animate-spin text-purple-500"
                                size={20}
                              />
                            </div>
                          )
                        ) : (
                          <p className="py-2 text-center text-sm text-gray-400">
                            Vui lòng chọn danh mục để lấy món.
                          </p>
                        )}
                      </div>
                      {errors[`v_${vIdx}_options`] && (
                        <p className="mt-2 text-center text-xs text-red-500">
                          {errors[`v_${vIdx}_options`]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}{" "}
              Lưu {activeTab === "COMBO" ? "Combo" : "Món"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default FoodFormModal;
