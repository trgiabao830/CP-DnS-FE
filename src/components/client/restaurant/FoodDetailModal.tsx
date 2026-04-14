import React, { useEffect, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import type {
  FoodResponse,
  CartItem,
  CartOption,
  FoodVariant,
  FoodOption,
} from "../../../types/client/booking";

interface FoodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: FoodResponse | null;
  onAddToCart: (item: CartItem) => void;
}

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  isOpen,
  onClose,
  food,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, number>
  >({});

  const getDefaultSelections = (
    variants: FoodVariant[],
  ): Record<number, number> => {
    let selections: Record<number, number> = {};

    variants.forEach((variant) => {
      if (variant.options && variant.options.length > 0) {
        if (variant.isRequired) {
          const defaultOption = variant.options.find(
            (o) => o.status !== "UNAVAILABLE" && o.status !== "OUT_OF_STOCK",
          );

          if (defaultOption) {
            selections[variant.variantId] = defaultOption.optionId;

            if (
              defaultOption.linkedVariants &&
              defaultOption.linkedVariants.length > 0
            ) {
              const childSelections = getDefaultSelections(
                defaultOption.linkedVariants,
              );
              selections = { ...selections, ...childSelections };
            }
          }
        }
      }
    });
    return selections;
  };

  useEffect(() => {
    if (isOpen && food) {
      setQuantity(1);
      setNote("");
      const defaults = getDefaultSelections(food.variants);
      setSelectedOptions(defaults);
    }
  }, [isOpen, food]);

  if (!isOpen || !food) return null;

  const handleOptionChange = (variantId: number, option: FoodOption) => {
    let newSelections = { ...selectedOptions, [variantId]: option.optionId };

    if (option.linkedVariants && option.linkedVariants.length > 0) {
      const childDefaults = getDefaultSelections(option.linkedVariants);
      newSelections = { ...newSelections, ...childDefaults };
    }

    setSelectedOptions(newSelections);
  };

  const calculateRecursiveTotal = (variants: FoodVariant[]): number => {
    let totalAdjustment = 0;

    variants.forEach((variant) => {
      const selectedOptionId = selectedOptions[variant.variantId];
      const selectedOption = variant.options.find(
        (o) => o.optionId === selectedOptionId,
      );

      if (selectedOption) {
        totalAdjustment += selectedOption.priceAdjustment;

        if (
          selectedOption.linkedVariants &&
          selectedOption.linkedVariants.length > 0
        ) {
          totalAdjustment += calculateRecursiveTotal(
            selectedOption.linkedVariants,
          );
        }
      }
    });

    return totalAdjustment;
  };

  const calculateTotal = () => {
    const base = food.discountPrice || food.basePrice;
    const optionsTotal = calculateRecursiveTotal(food.variants);
    return (base + optionsTotal) * quantity;
  };

  const collectSelectedOptions = (variants: FoodVariant[]): CartOption[] => {
    let collected: CartOption[] = [];

    variants.forEach((variant) => {
      const selectedOptionId = selectedOptions[variant.variantId];
      const selectedOption = variant.options.find(
        (o) => o.optionId === selectedOptionId,
      );

      if (selectedOption) {
        collected.push({
          id: selectedOption.optionId,
          name: selectedOption.name,
          price: selectedOption.priceAdjustment,
        });

        if (
          selectedOption.linkedVariants &&
          selectedOption.linkedVariants.length > 0
        ) {
          const children = collectSelectedOptions(
            selectedOption.linkedVariants,
          );
          collected = [...collected, ...children];
        }
      }
    });

    return collected;
  };

  const generateRecursiveOptionNames = (variants: any[]): string[] => {
    let results: string[] = [];

    variants.forEach((variant) => {
      const selectedId = selectedOptions[variant.variantId];
      const option = variant.options.find(
        (o: any) => o.optionId === selectedId,
      );

      if (option) {
        let displayString = `${variant.name}: ${option.name}`;

        if (option.linkedVariants && option.linkedVariants.length > 0) {
          const childStrings = generateRecursiveOptionNames(
            option.linkedVariants,
          );

          if (childStrings.length > 0) {
            displayString += ` (${childStrings.join(", ")})`;
          }
        }

        results.push(displayString);
      }
    });

    return results;
  };

  const isCartValid = (): boolean => {
    if (!food) return false;

    const checkVariants = (variants: FoodVariant[]): boolean => {
      for (const variant of variants) {
        const selectedOptionId = selectedOptions[variant.variantId];

        if (variant.isRequired && !selectedOptionId) {
          return false;
        }

        if (selectedOptionId) {
          const selectedOpt = variant.options.find(
            (o) => o.optionId === selectedOptionId,
          );
          if (
            selectedOpt &&
            selectedOpt.linkedVariants &&
            selectedOpt.linkedVariants.length > 0
          ) {
            const isChildValid = checkVariants(selectedOpt.linkedVariants);
            if (!isChildValid) return false;
          }
        }
      }
      return true;
    };

    return checkVariants(food.variants);
  };

  const handleConfirm = () => {
    if (!isCartValid()) return;
    const finalCartOptions = collectSelectedOptions(food.variants);

    const displayOptionNames = generateRecursiveOptionNames(food.variants);

    const cartItem: CartItem = {
      tempId: `${food.foodId}_${Date.now()}`,
      foodId: food.foodId,
      name: food.name,
      image: food.imageUrl,
      quantity: quantity,
      price: calculateTotal(),
      note: note,

      selectedOptions: finalCartOptions,
      optionIds: finalCartOptions.map((o) => Number(o.id)),

      optionNames: displayOptionNames,
    };

    onAddToCart(cartItem);
    onClose();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const renderVariantsRecursive = (variants: FoodVariant[]) => {
    return variants.map((variant) => {
      const selectedOptionId = selectedOptions[variant.variantId];
      const selectedOptionObject = variant.options.find(
        (o) => o.optionId === selectedOptionId,
      );

      return (
        <div
          key={variant.variantId}
          className="mb-6 border-l-2 border-gray-100 pl-2"
        >
          <h3 className="mb-3 text-sm font-bold text-gray-800">
            {variant.name}{" "}
            {variant.isRequired && <span className="text-red-500">*</span>}
          </h3>

          <div className="space-y-3">
            {variant.options.map((opt) => {
              if (opt.status === "UNAVAILABLE") return null;
              const isOutOfStock = opt.status === "OUT_OF_STOCK";
              const isSelected =
                selectedOptions[variant.variantId] === opt.optionId;

              return (
                <div key={opt.optionId}>
                  <label
                    onClick={(e) => {
                      e.preventDefault();
                      if (isOutOfStock) return;
                      if (!variant.isRequired && isSelected) {
                        const newSelections = { ...selectedOptions };
                        delete newSelections[variant.variantId];
                        setSelectedOptions(newSelections);
                      } else if (!isSelected) {
                        handleOptionChange(variant.variantId, opt);
                      }
                    }}
                    className="group -mx-2 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected ? "border-cyan-500" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                        )}
                      </div>

                      <input
                        type="radio"
                        name={`variant-${variant.variantId}`}
                        className="hidden"
                        checked={isSelected}
                        onChange={() => {}}
                      />
                      <span
                        className={`text-sm ${
                          isSelected
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {opt.name}
                      </span>
                      {isOutOfStock && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                          Hết món
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      {opt.priceAdjustment > 0
                        ? `+${formatPrice(opt.priceAdjustment)}`
                        : "+0 ₫"}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>

          {selectedOptionObject &&
            selectedOptionObject.linkedVariants &&
            selectedOptionObject.linkedVariants.length > 0 && (
              <div className="ml-4 mt-4">
                {renderVariantsRecursive(selectedOptionObject.linkedVariants)}
              </div>
            )}
        </div>
      );
    });
  };

  const isValid = isCartValid();

  return (
    <div className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in zoom-in-95 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative p-6 pb-2">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
          <h2 className="pr-8 text-2xl font-bold text-gray-800">{food.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {food.description}
          </p>

          <div className="mt-2 text-lg font-bold text-cyan-600">
            {formatPrice(food.discountPrice || food.basePrice)}
            {food.discountPrice && (
              <span className="ml-2 text-sm font-normal text-gray-400 line-through">
                {formatPrice(food.basePrice)}
              </span>
            )}
          </div>
        </div>

        <div className="custom-scrollbar flex-grow overflow-y-auto px-6 py-2">
          {renderVariantsRecursive(food.variants)}

          <div className="mb-6 mt-4">
            <div className="mb-2 flex justify-between">
              <h3 className="font-bold text-gray-800">Ghi chú (tùy chọn)</h3>
              <span className="text-xs text-gray-400">{note.length}/72</span>
            </div>
            <input
              type="text"
              maxLength={72}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít đá, nhiều sữa..."
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <Minus size={18} />
              </button>
              <span className="w-4 text-center font-bold text-gray-800">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <Plus size={18} />
              </button>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!isValid}
              className={`flex-grow rounded-lg py-3 font-bold text-white transition-all ${
                isValid
                  ? "bg-cyan-400 shadow-lg shadow-cyan-100 hover:bg-cyan-500"
                  : "cursor-not-allowed bg-gray-300"
              }`}
            >
              {isValid
                ? `Thêm vào đơn | ${formatPrice(calculateTotal())}`
                : "Vui lòng chọn món bắt buộc"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailModal;
