import imageCompression from 'browser-image-compression';

export async function optimizeImage(file: File): Promise<{ optimized: File; thumbnail: File }> {
  // Main compression options
  const mainOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  // Thumbnail options
  const thumbOptions = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 400,
    useWebWorker: true,
  };

  try {
    const optimizedBlob = await imageCompression(file, mainOptions);
    const thumbnailBlob = await imageCompression(file, thumbOptions);

    const optimized = new File([optimizedBlob], file.name, { type: file.type });
    const thumbnail = new File([thumbnailBlob], `thumb_${file.name}`, { type: file.type });

    return { optimized, thumbnail };
  } catch (error) {
    console.error('Image optimization failed:', error);
    return { optimized: file, thumbnail: file };
  }
}

export async function generateVideoThumbnail(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      // Seek to 1 second for a better thumbnail
      video.currentTime = 1;
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const thumb = new File([blob], `thumb_${file.name.replace(/\.[^/.]+$/, "")}.jpg`, { type: 'image/jpeg' });
          resolve(thumb);
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.7);
    };

    video.onerror = () => resolve(null);
  });
}
