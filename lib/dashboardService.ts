import { api } from './axios';

export interface DashboardStats {
  userCount: number;
  adminCount: number;
  activeEmergencies: number;
}

// Get user count
export const getUserCount = async (): Promise<number> => {
  try {
    const response = await api.get<{users: any[]}>('/users');
    return response.data.users.length;
  } catch (error) {
    console.error('Error fetching user count:', error);
    return 0;
  }
};

// Get admin count
export const getAdminCount = async (): Promise<number> => {
  try {
    const response = await api.get<{admins: any[]}>('/admins');
    return response.data.admins.length;
  } catch (error) {
    console.error('Error fetching admin count:', error);
    return 0;
  }
};

// Get active emergencies count (users with emergencyAlarm set to true)
export const getActiveEmergenciesCount = async (): Promise<number> => {
  try {
    const response = await api.get<{users: any[]}>('/users');
    return response.data.users.filter(user => user.emergencyAlarm === true).length;
  } catch (error) {
    console.error('Error fetching emergency count:', error);
    return 0;
  }
};

// Get assigned location status
export const getAssignedLocationStatus = async (): Promise<{
  atLocation: number;
  notAtLocation: number;
  notAssigned: number;
}> => {
  try {
    const response = await api.get<{users: any[]}>('/users');
    const users = response.data.users;
    
    const atLocation = users.filter(user => 
      user.assignedLocation !== "Not Assigned" && user.atAssignedLocation === true
    ).length;
    
    const notAtLocation = users.filter(user => 
      user.assignedLocation !== "Not Assigned" && user.atAssignedLocation === false
    ).length;
    
    const notAssigned = users.filter(user => 
      user.assignedLocation === "Not Assigned"
    ).length;
    
    return { atLocation, notAtLocation, notAssigned };
  } catch (error) {
    console.error('Error fetching location status:', error);
    return { atLocation: 0, notAtLocation: 0, notAssigned: 0 };
  }
};

// Get full dashboard stats in a single call
export const getDashboardStats = async (): Promise<DashboardStats & {
  locationStatus: {
    atLocation: number;
    notAtLocation: number;
    notAssigned: number;
  };
}> => {
  try {
    const [userCount, adminCount, activeEmergencies, locationStatus] = await Promise.all([
      getUserCount(),
      getAdminCount(),
      getActiveEmergenciesCount(),
      getAssignedLocationStatus()
    ]);
    
    return {
      userCount,
      adminCount,
      activeEmergencies,
      locationStatus
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      userCount: 0,
      adminCount: 0,
      activeEmergencies: 0,
      locationStatus: { atLocation: 0, notAtLocation: 0, notAssigned: 0 }
    };
  }
}; 