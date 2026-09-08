export class Modal {
    static open(contentHtml, title = '') {
        let modalEl = document.getElementById('app-modal');
        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.id = 'app-modal';
            modalEl.className = 'modal-backdrop';
            document.body.appendChild(modalEl);
        }
        modalEl.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="document.getElementById('app-modal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    ${contentHtml}
                </div>
            </div>
        `;
        modalEl.style.display = 'flex';
    }

    static close() {
        const modalEl = document.getElementById('app-modal');
        if (modalEl) modalEl.style.display = 'none';
    }
}

export default Modal;
