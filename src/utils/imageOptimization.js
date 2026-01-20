const optimizeImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            
            if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(optimizedDataUrl);
        };
        
        img.onerror = reject;
        img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export default optimizeImage;