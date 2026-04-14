import type { UserProfile, ChangePasswordRequest } from '../../types/admin/user';

export const profileService = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await fetch('/api/admin/profile');
    if (!res.ok) throw new Error('Không thể tải thông tin cá nhân');
    return res.json();
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    const res = await fetch('/api/admin/profile/change-password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      let errorMsg = "Lỗi đổi mật khẩu";
      try {
        const text = await res.text();
        const json = JSON.parse(text);
        errorMsg = json.message || text;
      } catch {}
      throw new Error(errorMsg);
    }
  }
};