document.addEventListener("DOMContentLoaded", () => {
      const navLinks = document.querySelectorAll("header nav a");
      navLinks.forEach((link) => {
        if (link.getAttribute("data-path") === "riwayat") {
          link.className = "px-space-md py-space-sm font-label-lg text-label-lg rounded-lg bg-primary-container text-on-primary-container font-semibold transition-colors";
        } else {
          link.className = "px-space-md py-space-sm font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors";
        }
      });
    });
