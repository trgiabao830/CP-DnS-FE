import React from "react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import type { CartItem } from "../../../types/client/booking";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (tempId: string, delta: number) => void;
  onRemoveItem: (tempId: string) => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              Giỏ hàng ({cartItems.length})
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-5 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <ShoppingBag size={64} className="mb-4 text-gray-200" />
                <p>Chưa có món ăn nào được chọn</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.tempId} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-grow flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                            <button 
                                onClick={() => onRemoveItem(item.tempId)}
                                className="text-gray-400 hover:text-red-500 p-1 -mr-2"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {item.optionNames.join(", ") || "Không có tùy chọn"}
                        </p>
                        
                        {item.note && (
                            <p className="text-sm text-orange-500 italic mt-1 line-clamp-1">
                                "Ghi chú: {item.note}"
                            </p>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-cyan-600">
                          {formatPrice(item.price)}
                        </span>

                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
                          <button
                            onClick={() => onUpdateQuantity(item.tempId, -1)}
                            className="text-gray-500 hover:text-cyan-600 disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-[1.5rem] text-center text-sm font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.tempId, 1)}
                            className="text-gray-500 hover:text-cyan-600"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 p-6">
            <div className="mb-4 flex justify-between text-sm">
              <span className="text-gray-500">Tạm tính</span>
              <span className="font-bold text-gray-800">{formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={onClose}
              disabled={cartItems.length === 0}
              className="w-full rounded-xl bg-cyan-400 py-3.5 font-bold text-white shadow-lg shadow-cyan-100 transition-all hover:bg-cyan-500 hover:shadow-cyan-200 disabled:opacity-50"
            >
              Xác nhận ({formatPrice(totalPrice)})
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;