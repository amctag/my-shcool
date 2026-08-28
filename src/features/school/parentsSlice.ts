import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ParentsSortBy, ParentsSortOrder, PersonStatusFilter } from "@/features/school/types";

export type ParentsUiState = {
  searchInput: string;
  appliedSearch: string;
  page: number;
  limit: number;
  sortBy: ParentsSortBy;
  sortOrder: ParentsSortOrder;
  statusFilter: PersonStatusFilter;
  selectedParentId: number | null;
};

const initialState: ParentsUiState = {
  searchInput: "",
  appliedSearch: "",
  page: 1,
  limit: 10,
  sortBy: "id",
  sortOrder: "asc",
  statusFilter: "all",
  selectedParentId: null,
};

const parentsSlice = createSlice({
  name: "parents",
  initialState,
  reducers: {
    setParentsSearchInput(state, action: PayloadAction<string>) {
      state.searchInput = action.payload;
    },
    applyParentsSearch(state) {
      const next = state.searchInput.trim();
      if (next === state.appliedSearch) {
        return;
      }
      state.appliedSearch = next;
      state.page = 1;
    },
    setParentsPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload);
    },
    setParentsLimit(state, action: PayloadAction<number>) {
      state.limit = action.payload;
      state.page = 1;
    },
    setParentsSort(state, action: PayloadAction<ParentsSortBy>) {
      if (state.sortBy === action.payload) {
        state.sortOrder = state.sortOrder === "asc" ? "desc" : "asc";
      } else {
        state.sortBy = action.payload;
        state.sortOrder = "asc";
      }
      state.page = 1;
    },
    setParentsStatusFilter(state, action: PayloadAction<PersonStatusFilter>) {
      if (state.statusFilter === action.payload) {
        return;
      }
      state.statusFilter = action.payload;
      state.page = 1;
    },
    selectParent(state, action: PayloadAction<number>) {
      state.selectedParentId = action.payload;
    },
    clearSelectedParent(state) {
      state.selectedParentId = null;
    },
  },
});

export const {
  setParentsSearchInput,
  applyParentsSearch,
  setParentsPage,
  setParentsLimit,
  setParentsSort,
  setParentsStatusFilter,
  selectParent,
  clearSelectedParent,
} = parentsSlice.actions;

export const selectParentsSearchInput = (state: { parents: ParentsUiState }) =>
  state.parents.searchInput;
export const selectParentsAppliedSearch = (state: {
  parents: ParentsUiState;
}) => state.parents.appliedSearch;
export const selectParentsPage = (state: { parents: ParentsUiState }) =>
  state.parents.page;
export const selectParentsLimit = (state: { parents: ParentsUiState }) =>
  state.parents.limit;
export const selectParentsSortBy = (state: { parents: ParentsUiState }) =>
  state.parents.sortBy;
export const selectParentsSortOrder = (state: { parents: ParentsUiState }) =>
  state.parents.sortOrder;
export const selectParentsStatusFilter = (state: {
  parents: ParentsUiState;
}) => state.parents.statusFilter;
export const selectSelectedParentId = (state: { parents: ParentsUiState }) =>
  state.parents.selectedParentId;

export default parentsSlice.reducer;
