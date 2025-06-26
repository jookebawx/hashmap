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

            const preview = document.getElementById(previewTargetId);
            const existing = document.getElementById('imageHashOutput');
            if (existing) existing.remove();

            const output = document.createElement('div');
            output.id = 'imageHashOutput';
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
            preview.appendChild(output);
            // Add "Insert to Metadata" Button
            const insertButton = document.createElement('button');
            insertButton.textContent = '➕ Insert Hashes into Metadata';
            insertButton.classList.add(
                'mt-4', 'px-4', 'py-2', 'bg-green-600',
                'hover:bg-green-700', 'text-white', 'font-bold', 'rounded-lg'
            );

            // Attach click handler
            insertButton.onclick = () => {
                const metadataContainer = document.getElementById('customFields');
                const addFieldButton = document.getElementById('addFieldBtn');

                // Remove existing fields with the same keys if present
                const keys = ["aHash", "pHash", "HSVHash"];
                const values = [ahash, phashHex, hsvhash];

                insertHashFieldsSequentially(keys, values, metadataContainer, addFieldButton);

                // Disable the insert button after inserting
                insertButton.disabled = true;
                insertButton.textContent = "✅ Hashes Inserted";
                insertButton.classList.add('opacity-50', 'cursor-not-allowed');
            };


        output.appendChild(insertButton);

        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error("pHash error:", err);
        alert("Failed to compute pHash");
    }
}


// --- Utility functions ---

async function insertHashFieldsSequentially(keys, values, container, addFieldButton) {
    for (let i = 0; i < keys.length; i++) {
        // Remove existing field with the same key (optional)
        const existingFields = container.querySelectorAll('input[type="text"]');
        for (let j = 0; j < existingFields.length; j += 2) {
            const existingKey = existingFields[j];
            const existingValue = existingFields[j + 1];
            if (existingKey && existingKey.value === keys[i]) {
                existingKey.closest('.flex').remove();
            }
        }

        addFieldButton.click();

        await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms

        const fieldPairs = container.querySelectorAll('.flex');
        const latestField = fieldPairs[fieldPairs.length - 1];
        const inputs = latestField.querySelectorAll('input[type="text"]');
        if (inputs.length >= 2) {
            inputs[0].value = keys[i];
            inputs[1].value = values[i];
        }
    }
}

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
