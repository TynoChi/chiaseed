// Utilities
export function showAlert(msg, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    alertContainer.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => alertContainer.innerHTML = '', 3000);
}

export function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showAlert('Copied!', 'success'))
        .catch(() => showAlert('Copy failed', 'error'));
}

export function downloadFile(data, ext, generatorFn) {
    if (!data) return;
    let name = prompt("Filename:", "questions");
    if (!name) return;
    if (!name.endsWith('.' + ext)) name += '.' + ext;

    const content = generatorFn(data);
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}