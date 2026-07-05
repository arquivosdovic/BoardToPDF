const { jsPDF } = window.jspdf;

// Inicializa o Drag and Drop na área do editor
const el = document.getElementById('editor-area');
const sortable = Sortable.create(el, {
    animation: 150,
    ghostClass: 'sortable-ghost'
});

// Guarda o id do bloco após o qual a próxima imagem selecionada deve ser inserida.
// Fica null quando a inserção deve ir para o final (comportamento padrão).
let pendingInsertAfterId = null;

// HTML dos botõezinhos "+ Texto" / "+ Imagem" que ficam dentro de cada bloco,
// permitindo inserir conteúdo novo logo depois daquele bloco específico.
function insertControlsHTML(blockId) {
    return `
        <div class="insert-controls">
            <button class="insert-btn" onclick="insertTextAfter('${blockId}')" title="Inserir texto logo abaixo deste bloco">+ Texto abaixo</button>
            <button class="insert-btn" onclick="insertImageAfter('${blockId}')" title="Inserir imagem logo abaixo deste bloco">+ Imagem abaixo</button>
        </div>
    `;
}

function insertTextAfter(blockId) {
    const anchor = document.getElementById(blockId);
    addTextBlock(anchor);
}

function insertImageAfter(blockId) {
    pendingInsertAfterId = blockId;
    document.getElementById('file-input').click();
}

function addTextBlock(afterElement = null) {
    const id = Date.now();
    const html = `
        <div class="block" data-type="text" id="block-${id}">
            <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
            <textarea placeholder="Digite o título ou anotação..."></textarea>
            ${insertControlsHTML(`block-${id}`)}
        </div>
    `;
    if (afterElement) {
        afterElement.insertAdjacentHTML('afterend', html);
    } else {
        document.getElementById('editor-area').insertAdjacentHTML('beforeend', html);
    }
}

function handleImages(input) {
    // Pega os arquivos na ordem em que foram selecionados
    const files = Array.from(input.files);

    // Lê cada arquivo como uma Promise, para poder aguardar todos
    // e depois inserir no DOM respeitando a ordem original de seleção
    const readFileAsDataURL = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ name: file.name, dataUrl: e.target.result });
            reader.readAsDataURL(file);
        });
    };

    Promise.all(files.map(readFileAsDataURL)).then((results) => {
        const editorArea = document.getElementById('editor-area');
        // Se veio de um botão "+ Imagem abaixo", ancora a inserção naquele bloco;
        // senão, cai no comportamento padrão de adicionar no final.
        let anchor = pendingInsertAfterId ? document.getElementById(pendingInsertAfterId) : null;

        results.forEach((result, index) => {
            const id = Date.now() + index;
            const html = `
                <div class="block" data-type="image" id="block-${id}">
                    <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
                    <img src="${result.dataUrl}">
                    <div class="file-name">${escapeHtml(result.name)}</div>
                    ${insertControlsHTML(`block-${id}`)}
                </div>
            `;
            if (anchor) {
                anchor.insertAdjacentHTML('afterend', html);
                anchor = document.getElementById(`block-${id}`); // avança a âncora para manter a ordem
            } else {
                editorArea.insertAdjacentHTML('beforeend', html);
            }
        });

        pendingInsertAfterId = null;
        // Limpa o input para permitir selecionar os mesmos arquivos novamente se precisar
        input.value = '';
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Botões flutuantes de rolagem (ir para o início / ir para o fim) ---

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function updateScrollNavVisibility() {
    const topBtn = document.getElementById('scroll-top-btn');
    const bottomBtn = document.getElementById('scroll-bottom-btn');
    if (!topBtn || !bottomBtn) return;

    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const threshold = 40; // margem em px para considerar "já no topo/fim"

    // Só mostra os botões se houver de fato conteúdo suficiente para rolar
    const canScroll = maxScroll > threshold;

    topBtn.classList.toggle('visible', canScroll && scrollY > threshold);
    bottomBtn.classList.toggle('visible', canScroll && scrollY < maxScroll - threshold);
}

window.addEventListener('scroll', updateScrollNavVisibility);
window.addEventListener('resize', updateScrollNavVisibility);
document.addEventListener('DOMContentLoaded', updateScrollNavVisibility);
// Reavalia a visibilidade sempre que blocos são adicionados/removidos, já que isso muda a altura da página
const scrollNavObserver = new MutationObserver(updateScrollNavVisibility);
scrollNavObserver.observe(document.body, { childList: true, subtree: true });

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
            // Normaliza a imagem (corrige rotação EXIF) antes de calcular dimensões e inserir no PDF
            const normalized = await normalizeImage(imgSrc);
            const ratio = pdfWidth / normalized.width;
            const pdfHeight = normalized.height * ratio;

            // Legenda opcional com o nome do arquivo, controlada pelo checkbox
            const includeCaption = document.getElementById('caption-toggle').checked;
            const fileNameEl = blockEl.querySelector('.file-name');
            const fileName = fileNameEl ? fileNameEl.textContent : '';

            const captionFontSize = 9;
            const captionMarginTop = 4; // espaço entre a imagem e a legenda (mm)
            const captionMarginBottom = 4; // respiro depois da legenda (mm)
            const captionSideMargin = 15; // mm de margem nas laterais do texto

            let captionLines = [];
            if (includeCaption && fileName) {
                doc.setFontSize(captionFontSize);
                captionLines = doc.splitTextToSize(fileName, pdfWidth - (captionSideMargin * 2));
            }

            const captionHeight = captionLines.length
                ? captionMarginTop + (captionLines.length * captionFontSize * 0.5) + captionMarginBottom
                : 0;

            const totalHeight = pdfHeight + captionHeight;

            doc.setPage(doc.internal.getNumberOfPages());
            doc.internal.pageSize.height = totalHeight;
            doc.addImage(normalized.dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            if (captionLines.length) {
                doc.setFontSize(captionFontSize);
                doc.setTextColor(120);
                doc.text(captionLines, pdfWidth / 2, pdfHeight + captionMarginTop + (captionFontSize * 0.4), { align: 'center' });
                doc.setTextColor(0);
            }
        }
        firstPage = false;
    }

    doc.save(`Aula_Organizada_${new Date().toLocaleDateString()}.pdf`);
}

// Fotos de celular costumam vir com uma tag EXIF de orientação (ex: "girar 90°"),
// que o navegador respeita ao exibir a <img>, mas que o jsPDF ignora ao montar o PDF.
// Por isso, desenhamos a imagem num <canvas> (que já aplica a rotação correta) e
// exportamos um novo dataURL "gravado" na orientação certa, sem depender de EXIF.
function normalizeImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({
                dataUrl: canvas.toDataURL('image/jpeg', 0.92),
                width: img.width,
                height: img.height
            });
        };
        img.src = src;
    });
}