import { defineStore, acceptHMRUpdate } from 'pinia';

export const useInterface = defineStore('interface', {
  actions: {
    openRightSidebar(): void {
      this.sidebar.right = true;
    },
    setRightSidebar(value: boolean) {
      this.sidebar.right = value;
    },
    toggleRightSidebar(): void {
      this.sidebar.right = !this.sidebar.right;
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
