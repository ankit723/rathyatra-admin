import { api } from './axios';

export interface Admin {
  _id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminsResponse {
  admins: Admin[];
}

export interface AdminResponse {
  admin: Admin;
}

// Get all admins
export const getAllAdmins = async (): Promise<Admin[]> => {
  try {
    const response = await api.get<AdminsResponse>('/admins');
    return response.data.admins;
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
};

// Get admin by ID
export const getAdminById = async (id: string): Promise<Admin> => {
  try {
    const response = await api.get<AdminResponse>(`/admins/${id}`);
    return response.data.admin;
  } catch (error) {
    console.error(`Error fetching admin with ID ${id}:`, error);
    throw error;
  }
};

// Update admin
export const updateAdmin = async (id: string, email: string): Promise<Admin> => {
  try {
    const response = await api.put<{ message: string; admin: Admin }>(`/admins/${id}`, { email });
    return response.data.admin;
  } catch (error) {
    console.error(`Error updating admin with ID ${id}:`, error);
    throw error;
  }
};

// Delete admin
export const deleteAdmin = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admins/${id}`);
  } catch (error) {
    console.error(`Error deleting admin with ID ${id}:`, error);
    throw error;
  }
}; 