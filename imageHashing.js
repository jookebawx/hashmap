export async function generateImageHashes(file, previewTargetId = 'filePreview') {
    if (!file || !file.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
    }

    try {
        // ✅ Use the file directly for pHash via phash-js
        const hashObj = await window.pHash.hash(file);
        const phashHex = hashObj.toHex();

        // ✅ Load image for aHash and HSV hash
        const image = new Image();
        const reader = new FileReader();

        reader.onload = function (e) {
            image.src = e.target.result;
        };

        image.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            const ahashBin = computeAverageHash(ctx);
            const ahash = binaryToHex(ahashBin);
            const hsvhash = computeHSVHash(ctx.getImageData(0, 0, canvas.width, canvas.height));

            const output = document.createElement('div');
            output.classList.add(
                'mt-4', 'text-left', 'bg-gray-900', 'rounded-lg',
                'p-4', 'text-white', 'shadow-lg',
                'break-all', 'overflow-x-auto'
            );

            // Use <pre> for wrapped/copyable block text
            const pre = document.createElement('pre');
            pre.textContent =
                `🔍 Image Hashes\n\n` +
                `aHash  : ${ahash}\n` +
                `pHash  : ${phashHex}\n` +
                `HSVHash: ${hsvhash}`;

            output.appendChild(pre);
            const preview = document.getElementById(previewTargetId);
            preview.appendChild(output);
        };

        reader.readAsDataURL(file);
    } catch (err) {
        console.error("pHash error:", err);
        alert("Failed to compute pHash");
    }
}


// --- Utility functions ---
function computeAverageHash(ctx) {
    const size = 8;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(ctx.canvas, 0, 0, size, size);
    const data = tempCtx.getImageData(0, 0, size, size).data;

    let gray = [];
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        gray.push(avg);
    }

    const mean = gray.reduce((a, b) => a + b) / gray.length;
    return gray.map(v => v > mean ? '1' : '0').join('');
}

function computeHSVHash(imageData) {
    const hist = new Array(36).fill(0);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const [h] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
        const bin = Math.floor(h * 36);
        hist[bin]++;
    }

    return hist.map(v => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;

    if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
    }

    return [h, 0, 0];
}

function binaryToHex(binStr) {
    return binStr.match(/.{1,4}/g) // Split into 4-bit chunks
        .map(b => parseInt(b, 2).toString(16)) // Convert each to hex
        .join('');
}
