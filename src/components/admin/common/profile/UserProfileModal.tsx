import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../../../Modal";
import { profileService } from "../../../../services/admin/profile.service";
import type { UserProfile } from "../../../../types/admin/user";
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      profileService
        .getProfile()
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "N/A";

  const renderStatus = (s: string) => {
    const ok = s === "ACTIVE";
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${ok ? "border-green-100 bg-green-50 text-green-700" : "border-red-100 bg-red-50 text-red-700"}`}
      >
        {ok ? "Hoạt động" : "Ngưng hoạt động"}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hồ sơ cá nhân" size="lg">
      {loading ? (
        <div className="flex items-center justify-center gap-3 p-12 text-gray-500">
          <Loader2 size={24} className="animate-spin text-blue-600" /> Đang
          tải...
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="-mx-6 -mt-6 flex flex-col items-center justify-center border-b border-gray-100 bg-gradient-to-b from-blue-50/50 to-white pb-6 pt-8">
            <h3 className="text-xl font-bold text-gray-900">{data.fullName}</h3>
            <div className="mt-2 flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {data.jobTitle}
              </span>
              {renderStatus(data.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Tên đăng nhập
              </label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-medium">
                {data.username}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Số điện thoại
              </label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-medium">
                {data.phone}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Ngày tham gia
              </label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-medium">
                {formatDate(data.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Mã nhân viên
              </label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-medium">
                {data.empId}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="mb-3 flex gap-2 text-xs font-bold uppercase text-gray-400">
              Quyền hạn
            </label>
            <div className="flex flex-wrap gap-2">
              {data.permissions?.length ? (
                data.permissions.map((p, i) => (
                  <span
                    key={i}
                    className="rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    {typeof p === "object" ? p.description : p}
                  </span>
                ))
              ) : (
                <span className="text-sm italic text-gray-400">
                  Chưa được cấp quyền.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-red-500">Không có dữ liệu</div>
      )}
    </Modal>
  );
};

export default UserProfileModal;
