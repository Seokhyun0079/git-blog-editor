function addClassToImages(processedContent, className) {
  try {
    const tempContentContainer = document.createElement("div");
    tempContentContainer.innerHTML = processedContent;
    const contentImages = tempContentContainer.querySelectorAll("img");
    contentImages.forEach((img) => img.classList.add(className));
    processedContent = tempContentContainer.innerHTML;
  } catch (e) {
    // No-op: if parsing fails, fallback to original content
  } finally {
    return processedContent;
  }
}
