import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ChildrenCountFilter,
  ParentsSortBy,
  ParentsSortOrder,
  PersonPaidFilter,
  PersonStatusFilter,
} from "@/features/school/types";

export type ParentsUiState = {
  firstNameInput: string;
  middleNameInput: string;
  lastNameInput: string;
  appliedFirstName: string;
  appliedMiddleName: string;
  appliedLastName: string;
  page: number;
  limit: number;
  sortBy: ParentsSortBy;
  sortOrder: ParentsSortOrder;
  statusFilterInput: PersonStatusFilter;
  statusFilter: PersonStatusFilter;
  paidFilterInput: PersonPaidFilter;
  paidFilter: PersonPaidFilter;
  childrenCountFilterInput: ChildrenCountFilter;
  childrenCountFilter: ChildrenCountFilter;
  selectedParentId: number | null;
};

const initialState: ParentsUiState = {
  firstNameInput: "",
  middleNameInput: "",
  lastNameInput: "",
  appliedFirstName: "",
  appliedMiddleName: "",
  appliedLastName: "",
  page: 1,
  limit: 10,
  sortBy: "id",
  sortOrder: "asc",
  statusFilterInput: "all",
  statusFilter: "all",
  paidFilterInput: "all",
  paidFilter: "all",
  childrenCountFilterInput: "all",
  childrenCountFilter: "all",
  selectedParentId: null,
};

const parentsSlice = createSlice({
  name: "parents",
  initialState,
  reducers: {
    setParentsFirstNameInput(state, action: PayloadAction<string>) {
      state.firstNameInput = action.payload;
    },
    setParentsMiddleNameInput(state, action: PayloadAction<string>) {
      state.middleNameInput = action.payload;
    },
    setParentsLastNameInput(state, action: PayloadAction<string>) {
      state.lastNameInput = action.payload;
    },
    applyParentsSearch(state) {
      const nextFirstName = state.firstNameInput.trim();
      const nextMiddleName = state.middleNameInput.trim();
      const nextLastName = state.lastNameInput.trim();
      const nextStatus = state.statusFilterInput;
      const nextPaid = state.paidFilterInput;
      const nextChildrenCount = state.childrenCountFilterInput;
      if (
        nextFirstName === state.appliedFirstName &&
        nextMiddleName === state.appliedMiddleName &&
        nextLastName === state.appliedLastName &&
        nextStatus === state.statusFilter &&
        nextPaid === state.paidFilter &&
        nextChildrenCount === state.childrenCountFilter
      ) {
        return;
      }
      state.appliedFirstName = nextFirstName;
      state.appliedMiddleName = nextMiddleName;
      state.appliedLastName = nextLastName;
      state.statusFilter = nextStatus;
      state.paidFilter = nextPaid;
      state.childrenCountFilter = nextChildrenCount;
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
    setParentsStatusFilterInput(
      state,
      action: PayloadAction<PersonStatusFilter>,
    ) {
      state.statusFilterInput = action.payload;
    },
    setParentsPaidFilterInput(state, action: PayloadAction<PersonPaidFilter>) {
      state.paidFilterInput = action.payload;
    },
    setParentsChildrenCountFilterInput(
      state,
      action: PayloadAction<ChildrenCountFilter>,
    ) {
      state.childrenCountFilterInput = action.payload;
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
  setParentsFirstNameInput,
  setParentsMiddleNameInput,
  setParentsLastNameInput,
  applyParentsSearch,
  setParentsPage,
  setParentsLimit,
  setParentsSort,
  setParentsStatusFilterInput,
  setParentsPaidFilterInput,
  setParentsChildrenCountFilterInput,
  selectParent,
  clearSelectedParent,
} = parentsSlice.actions;

export const selectParentsFirstNameInput = (state: {
  parents: ParentsUiState;
}) => state.parents.firstNameInput;
export const selectParentsMiddleNameInput = (state: {
  parents: ParentsUiState;
}) => state.parents.middleNameInput;
export const selectParentsLastNameInput = (state: {
  parents: ParentsUiState;
}) => state.parents.lastNameInput;
export const selectParentsAppliedFirstName = (state: {
  parents: ParentsUiState;
}) => state.parents.appliedFirstName;
export const selectParentsAppliedMiddleName = (state: {
  parents: ParentsUiState;
}) => state.parents.appliedMiddleName;
export const selectParentsAppliedLastName = (state: {
  parents: ParentsUiState;
}) => state.parents.appliedLastName;
export const selectParentsPage = (state: { parents: ParentsUiState }) =>
  state.parents.page;
export const selectParentsLimit = (state: { parents: ParentsUiState }) =>
  state.parents.limit;
export const selectParentsSortBy = (state: { parents: ParentsUiState }) =>
  state.parents.sortBy;
export const selectParentsSortOrder = (state: { parents: ParentsUiState }) =>
  state.parents.sortOrder;
export const selectParentsStatusFilterInput = (state: {
  parents: ParentsUiState;
}) => state.parents.statusFilterInput;
export const selectParentsStatusFilter = (state: {
  parents: ParentsUiState;
}) => state.parents.statusFilter;
export const selectParentsPaidFilterInput = (state: {
  parents: ParentsUiState;
}) => state.parents.paidFilterInput;
export const selectParentsPaidFilter = (state: { parents: ParentsUiState }) =>
  state.parents.paidFilter;
export const selectParentsChildrenCountFilterInput = (state: {
  parents: ParentsUiState;
}) => state.parents.childrenCountFilterInput ?? "all";
export const selectParentsChildrenCountFilter = (state: {
  parents: ParentsUiState;
}) => state.parents.childrenCountFilter ?? "all";
export const selectSelectedParentId = (state: { parents: ParentsUiState }) =>
  state.parents.selectedParentId;

export default parentsSlice.reducer;
