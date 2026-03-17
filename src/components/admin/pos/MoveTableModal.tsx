import React, { useEffect, useState } from "react";
import { X, Check, Users, Loader2 } from "lucide-react";
import Modal from "../../Modal";
import { posService } from "../../../services/admin/pos.service";
import { toast } from "react-toastify";
import type {
  AreaSnapshot,
  TableSnapshot,
} from "../../../types/admin/restaurant-pos";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  currentTableId: number;
  onSuccess: () => void;
}

const MoveTableModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bookingId,
  currentTableId,
  onSuccess,
}) => {
  const [areas, setAreas] = useState<AreaSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      posService
        .getOverview()
        .then((res) => setAreas(res.areas))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));

      setSelectedTableId(null); 
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedTableId) return;

    setIsSubmitting(true);
    try {
      await posService.moveTable(bookingId, selectedTableId);
      toast.success("Chuyển bàn thành công!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi chuyển bàn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTableCard = (table: TableSnapshot) => {
    const isCurrent = table.tableId === currentTableId;
    const isSelected = table.tableId === selectedTableId;

    const isOccupied =
      table.currentStatus === "SERVING" || table.currentStatus === "RESERVED";

    let borderClass = "border-gray-200 hover:border-blue-300 cursor-pointer";
    let bgClass = "bg-white";

    if (isCurrent) {
      borderClass = "border-gray-300 cursor-not-allowed opacity-60";
      bgClass = "bg-gray-100";
    } else if (isSelected) {
      borderClass = "border-blue-600 ring-1 ring-blue-600 cursor-pointer";
      bgClass = "bg-blue-50";
    } else if (table.currentStatus === "SERVING") {
      bgClass = "bg-red-50";
      borderClass = "border-red-200 cursor-pointer";
    } else if (table.currentStatus === "RESERVED") {
      bgClass = "bg-yellow-50";
      borderClass = "border-yellow-200 cursor-pointer";
    } else if (table.currentStatus === "UNAVAILABLE") {
      bgClass = "bg-gray-200";
      borderClass = "border-gray-300 cursor-not-allowed";
    }

    return (
      <div
        key={table.tableId}
        onClick={() => {
          if (isCurrent || table.currentStatus === "UNAVAILABLE") return;
          setSelectedTableId(table.tableId);
        }}
        className={`flex flex-col items-center justify-center rounded-lg border p-3 transition-all ${borderClass} ${bgClass}`}
      >
        <span className="text-lg font-bold text-gray-700">
          {table.tableNumber}
        </span>
        <div className="mt-1 flex items-center text-xs text-gray-500">
          <Users size={12} className="mr-1" /> {table.capacity}
        </div>
        {isCurrent && (
          <span className="mt-1 text-[10px] font-bold text-gray-500">
            (Hiện tại)
          </span>
        )}
        {isSelected && (
          <div className="absolute right-2 top-2 text-blue-600">
            <Check size={16} />
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chuyển bàn" size="lg">
      <div className="flex h-[60vh] flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
            {areas.map((area) => (
              <div key={area.areaId} className="mb-6">
                <h3 className="mb-3 font-bold text-gray-700">
                  {area.areaName}
                </h3>
                <div className="grid grid-cols-4 gap-3 md:grid-cols-5 lg:grid-cols-6">
                  {area.tables.map(renderTableCard)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100 p-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTableId || isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Xác nhận chuyển
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MoveTableModal;
