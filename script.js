const { jsPDF } = window.jspdf;

// Inicializa o Drag and Drop na área do editor
const el = document.getElementById('editor-area');
const sortable = Sortable.create(el, {
    animation: 150,
    ghostClass: 'sortable-ghost'
});

function addTextBlock() {
    const id = Date.now();
    const html = `
        <div class="block" data-type="text" id="block-${id}">
            <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
            <textarea placeholder="Digite o título ou anotação..."></textarea>
        </div>
    `;
    document.getElementById('editor-area').insertAdjacentHTML('beforeend', html);
}

function handleImages(input) {
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const id = Date.now() + Math.random();
            const html = `
                <div class="block" data-type="image" id="block-${id}">
                    <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
                    <img src="${e.target.result}">
                </div>
            `;
            document.getElementById('editor-area').insertAdjacentHTML('beforeend', html);
        };
        reader.readAsDataURL(file);
    });
}

async function generatePDF() {
    const doc = new jsPDF();
    // Captura os elementos na ordem exata em que estão na tela agora
    const htmlBlocks = document.querySelectorAll('.block');
    
    let firstPage = true;

    for (const blockEl of htmlBlocks) {
        if (!firstPage) doc.addPage();
        
        const type = blockEl.getAttribute('data-type');
        const pdfWidth = doc.internal.pageSize.getWidth();

        if (type === 'text') {
            const content = blockEl.querySelector('textarea').value;
            const fontSize = 18;
            doc.setFontSize(fontSize);
            const margin = 15;
            const textWidth = pdfWidth - (margin * 2);
            
            const splitText = doc.splitTextToSize(content, textWidth);
            const lineCount = splitText.length;
            const textHeightInMm = (lineCount * (fontSize * 0.5)) + (margin * 2);
            
            doc.setPage(doc.internal.getNumberOfPages());
            doc.internal.pageSize.height = textHeightInMm;
            doc.text(splitText, margin, margin + (fontSize * 0.4));
            
        } else {
            const imgSrc = blockEl.querySelector('img').src;
            const img = await getImageProps(imgSrc);
            const ratio = pdfWidth / img.width;
            const pdfHeight = img.height * ratio;

            doc.setPage(doc.internal.getNumberOfPages());
            doc.internal.pageSize.height = pdfHeight;
            doc.addImage(imgSrc, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
        firstPage = false;
    }

    doc.save(`Aula_Organizada_${new Date().toLocaleDateString()}.pdf`);
}

function getImageProps(src) {
    return new Promise(resolve => {
        const i = new Image();
        i.onload = () => resolve({ width: i.width, height: i.height });
        i.src = src;
    });
}