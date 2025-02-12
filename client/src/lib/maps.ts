let isLoaded = false;

export async function initMap(): Promise<void> {
  if (isLoaded) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      isLoaded = true;
      resolve();
    });
    script.addEventListener("error", (e) => reject(e.error));
    document.head.appendChild(script);
  });
}
