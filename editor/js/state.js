// State Management
export const state = {
    editedData: null,
    pendingData: null,
    currentRawFormat: 'json'
};

export function setEditedData(data) {
    state.editedData = data;
}

export function setPendingData(data, fileName, title) {
    state.pendingData = { data, fileName, title };
}

export function setRawFormat(format) {
    state.currentRawFormat = format;
}