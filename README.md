# 📚 BoardToPDF

Um gerador de PDFs minimalista e funcional, criado para estudantes que precisam transformar fotos de lousas e anotações rápidas em documentos organizados, limpos e fáceis de pesquisar.

## ✨ Por que usar?

Diferente de editores de texto tradicionais (como o Word), o **BoardToPDF** foi desenhado para eliminar o trabalho manual de ajuste de margens e tamanhos de página.

- **Páginas Dinâmicas:** O PDF adapta-se ao tamanho real da sua foto ou à quantidade de texto, sem bordas brancas desnecessárias.
- **Foco em Pesquisa:** Títulos inseridos como blocos de texto tornam o PDF pesquisável (Ctrl+F), facilitando encontrar temas específicos como "Escalonamento" ou "Matrizes".
- **Organização Flexível:** Arraste e solte os blocos para reordenar o material, ou insira um novo texto/imagem exatamente abaixo de um bloco específico, sem precisar reorganizar tudo depois.
- **Fotos sempre na orientação certa:** Imagens tiradas com o celular são automaticamente corrigidas (rotação EXIF) antes de entrarem no PDF.
- **Legendas opcionais:** Ative a opção de incluir o nome do arquivo como legenda abaixo de cada imagem, útil para saber de qual foto/aula aquele trecho veio.
- **Privacidade & Rapidez:** O processamento é feito inteiramente no seu navegador. Nenhuma imagem é enviada para servidores externos.
- **Mobile Friendly:** Feito para ser usado diretamente do telemóvel na sala de aula.

## 🚀 Como usar

1. Aceda à aplicação via [https://boardtopdf.netlify.app/].
2. Clique em **+ Texto** para adicionar títulos ou observações, ou em **+ Imagem** para carregar uma ou várias fotos da lousa de uma vez.
3. Arraste os blocos para reordenar o material conforme a sequência da aula.
4. Dentro de cada bloco, use **+ Texto abaixo** ou **+ Imagem abaixo** para inserir um novo conteúdo logo depois daquele bloco específico, sem perder a ordem.
5. Remova blocos indesejados clicando no **×** no canto de cada um.
6. Se quiser, marque a opção **"Incluir nome do arquivo como legenda nas imagens"** para que o nome de cada foto apareça pequeno, abaixo dela, no PDF final.
7. Clique em **Gerar PDF Final** e salve o seu material de estudo.

## 🛠️ Tecnologias

Este projeto utiliza tecnologias web puras para garantir leveza e compatibilidade:

- **HTML5 & CSS3:** Interface responsiva e minimalista.
- **JavaScript (Vanilla):** Lógica de manipulação de DOM e fluxo de ficheiros.
- **jsPDF:** Biblioteca principal para a geração e dimensionamento dinâmico das páginas do PDF.
- **SortableJS:** Reordenação dos blocos por arrastar e soltar (drag and drop).
