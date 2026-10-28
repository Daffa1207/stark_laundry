(() => {
  const activeScans = new WeakMap();

  window.startQrCamera = async (video, status, onScan) => {
    window.stopQrCamera(video);
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = 'Browser ini tidak menyediakan akses kamera. Masukkan kode secara manual.';
      return;
    }

    let stream;
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      stream?.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      video.classList.add('hidden');
      activeScans.delete(video);
    };
    activeScans.set(video, stop);
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      });
      if (stopped) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      video.srcObject = stream;
      video.classList.remove('hidden');
      await video.play();
      const detector = 'BarcodeDetector' in window
        ? new BarcodeDetector({ formats: ['qr_code'] })
        : null;
      status.textContent = detector
        ? 'Kamera aktif. Arahkan QR ke dalam bingkai.'
        : 'Kamera aktif, tetapi browser belum mendukung pembacaan QR otomatis. Masukkan kode secara manual.';

      if (detector) {
        const scanFrame = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(video);
            if (codes[0]?.rawValue) {
              stop();
              onScan(codes[0].rawValue);
              return;
            }
          } catch (_) {
            status.textContent = 'QR belum terbaca. Posisikan kode dengan jelas di depan kamera.';
          }
          if (!stopped) requestAnimationFrame(scanFrame);
        };
        requestAnimationFrame(scanFrame);
      }
    } catch (error) {
      stop();
      status.textContent = error.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Izinkan akses kamera dari pengaturan browser atau masukkan kode secara manual.'
        : 'Kamera tidak dapat dibuka di perangkat ini. Masukkan kode secara manual.';
    }
  };

  window.stopQrCamera = video => {
    const stop = activeScans.get(video);
    if (stop) stop();
  };
})();
