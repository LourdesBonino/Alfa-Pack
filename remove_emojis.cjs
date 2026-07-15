const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/gu;

function removeEmojisFromFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove emojis
    let newContent = content.replace(emojiRegex, '');
    
    // Clean up any weird spacing left by removing emojis (e.g. " Imprimir" -> "Imprimir")
    newContent = newContent.replace(/>\s+/g, '>');
    newContent = newContent.replace(/\s+</g, '<');
    
    // Fix specific cases where I might have messed up tags
    newContent = newContent.replace(/>\s*Imprimir/g, '>Imprimir');
    newContent = newContent.replace(/>\s*Abonado/g, '>Abonado');
    newContent = newContent.replace(/>\s*Cobrar/g, '>Cobrar');
    newContent = newContent.replace(/>\s*Recorridos/g, '>Recorridos');
    
    // Some buttons lost the gap space due to \s*< replacement if applied incorrectly, wait, I used \s+<
    newContent = newContent.replace(/<span className="text-base opacity-90"><\/span>/g, '');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Removed emojis from: ${path.basename(filePath)}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            removeEmojisFromFile(fullPath);
        }
    }
}

scanDir(componentsDir);
console.log("Done.");
