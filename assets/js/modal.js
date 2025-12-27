export function showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}
