import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SchoolYearState = {
  selectedYearId: number | null;
};

const initialState: SchoolYearState = {
  selectedYearId: null,
};

const schoolYearSlice = createSlice({
  name: "schoolYear",
  initialState,
  reducers: {
    setSelectedYearId(state, action: PayloadAction<number | null>) {
      state.selectedYearId = action.payload;
    },
    clearSelectedYearId(state) {
      state.selectedYearId = null;
    },
  },
});

export const { setSelectedYearId, clearSelectedYearId } = schoolYearSlice.actions;

export const selectSelectedYearId = (state: { schoolYear: SchoolYearState }) =>
  state.schoolYear.selectedYearId;

export default schoolYearSlice.reducer;

export function schoolYearStorageKey(schoolId: number): string {
  return `dashboard.selectedYearId.${schoolId}`;
}
