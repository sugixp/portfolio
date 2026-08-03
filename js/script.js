// Fade in suave ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    document.body.style.opacity = 0;
    document.body.style.transition = "opacity 0.6s ease";
    setTimeout(() => {
        document.body.style.opacity = 1;
    }, 50);
});