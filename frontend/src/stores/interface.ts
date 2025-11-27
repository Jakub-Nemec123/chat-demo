import { defineStore, acceptHMRUpdate } from 'pinia';

export const useInterface = defineStore('interface', {
  actions: {
    setSidebar(side: 'left' | 'right', value: boolean) {
      this.sidebar[side] = value;
    },
    toggleSidebar(side: 'left' | 'right'): void {
      this.sidebar[side] = !this.sidebar[side];
    },
    openRightSidebar(): void {
      this.sidebar.right = true;
    },
    closeRightSidebar(): void {
      this.sidebar.right = false;
    },
    openLeftSidebar(): void {
      this.sidebar.left = true;
    },
    closeLeftSidebar(): void {
      this.sidebar.left = false;
    }
  },
  state: () => ({
    sidebar: {
      left: false,
      right: false,
    },
  }),
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useInterface, import.meta.hot),
  );
}
