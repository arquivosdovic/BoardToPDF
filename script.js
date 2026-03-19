const { jsPDF } = window.jspdf;
let blocks = [];

function addTextBlock() {
    const id = Date.now();
    const html = `
        <div class="block" id="block-${id}">
            <button class="remove-btn" onclick="removeBlock(${id})">×</button>
            <textarea placeholder="Digite o título ou anotação..." oninput="updateText(${id}, this.value)"></textarea>
        </div>
    `;
    document.getElementById('editor-area').insertAdjacentHTML('beforeend', html);
    blocks.push({ id, type: 'text', content: '' });
}

function handleImages(input) {
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const id = Date.now() + Math.random();
            const html = `
                <div class="block" id="block-${id}">
                    <button class="remove-btn" onclick="removeBlock(${id})">×</button>
                    <img src="${e.target.result}">
                </div>
            `;
            document.getElementById('editor-area').insertAdjacentHTML('beforeend', html);
            blocks.push({ id, type: 'image', content: e.target.result });
        };
        reader.readAsDataURL(file);
    });
}

function updateText(id, value) {
    const block = blocks.find(b => b.id === id);
    if (block) block.content = value;
}

function removeBlock(id) {
    blocks = blocks.filter(b => b.id !== id);
    document.getElementById(`block-${id}`).remove();
}

async function generatePDF() {
    const doc = new jsPDF();
    let firstPage = true;

    for (const block of blocks) {
        if (!firstPage) doc.addPage();
        
        const pdfWidth = doc.internal.pageSize.getWidth();

        if (block.type === 'text') {
            // Configurações do texto
            const fontSize = 18;
            doc.setFontSize(fontSize);
            const margin = 15;
            const textWidth = pdfWidth - (margin * 2);
            
            // Quebra o texto para saber quantas linhas ele terá
            const splitText = doc.splitTextToSize(block.content, textWidth);
            const lineCount = splitText.length;
            
            // Calcula a altura mínima necessária (tamanho da fonte + margens)
            // Multiplicamos por 0.5 (aprox) para converter de pontos para mm
            const textHeightInMm = (lineCount * (fontSize * 0.5)) + (margin * 2);
            
            // Ajusta a página para o tamanho do texto
            doc.setPage(doc.internal.getNumberOfPages());
            doc.internal.pageSize.height = textHeightInMm;
            
            // Adiciona o texto na página "encolhida"
            doc.text(splitText, margin, margin + (fontSize * 0.4));
            
        } else {
            // Página de imagem: Ajusta a página ao tamanho da imagem
            const img = await getImageProps(block.content);
            const ratio = pdfWidth / img.width;
            const pdfHeight = img.height * ratio;

            doc.setPage(doc.internal.getNumberOfPages());
            doc.internal.pageSize.height = pdfHeight;
            doc.addImage(block.content, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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