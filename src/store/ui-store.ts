import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  notificationDrawerOpen: boolean;
  quickReportModalOpen: boolean;
  activeModal: string | null;
  kanbanView: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setNotificationDrawerOpen: (open: boolean) => void;
  setQuickReportModalOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  setKanbanView: (kanban: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  notificationDrawerOpen: false,
  quickReportModalOpen: false,
  activeModal: null,
  kanbanView: true,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setNotificationDrawerOpen: (open) => set({ notificationDrawerOpen: open }),
  setQuickReportModalOpen: (open) => set({ quickReportModalOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  setKanbanView: (kanban) => set({ kanbanView: kanban }),
}));
